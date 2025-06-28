// Performance monitoring service for the autonomous shopping agent
// Tracks response times, error rates, and user interactions

interface PerformanceMetric {
  id: string;
  timestamp: number;
  type: 'response_time' | 'error' | 'user_interaction' | 'cache_hit' | 'cache_miss';
  value: number;
  metadata?: Record<string, any>;
}

interface UserInteraction {
  sessionId: string;
  userId?: string;
  action: string;
  timestamp: number;
  duration?: number;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetric[] = [];
  private interactions: UserInteraction[] = [];
  private sessionId: string;
  private isEnabled: boolean = true;

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.setupPerformanceObserver();
  }

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupPerformanceObserver(): void {
    if (typeof window === 'undefined') return;

    // Monitor navigation timing
    if ('performance' in window && 'getEntriesByType' in performance) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordPerformanceEntry(entry);
        }
      });

      try {
        observer.observe({ entryTypes: ['navigation', 'resource', 'measure'] });
      } catch (error) {
        console.warn('Performance observer not supported:', error);
      }
    }
  }

  private recordPerformanceEntry(entry: PerformanceEntry): void {
    if (!this.isEnabled) return;

    const metric: PerformanceMetric = {
      id: `perf_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: Date.now(),
      type: 'response_time',
      value: entry.duration,
      metadata: {
        name: entry.name,
        entryType: entry.entryType,
        startTime: entry.startTime
      }
    };

    this.metrics.push(metric);
    this.trimMetrics();
  }

  // Track autonomous agent response times
  public trackAgentResponse(startTime: number, endTime: number, metadata?: Record<string, any>): void {
    if (!this.isEnabled) return;

    const responseTime = endTime - startTime;
    
    const metric: PerformanceMetric = {
      id: `agent_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: Date.now(),
      type: 'response_time',
      value: responseTime,
      metadata: {
        component: 'autonomous_agent',
        ...metadata
      }
    };

    this.metrics.push(metric);
    this.trimMetrics();

    // Log slow responses
    if (responseTime > 5000) {
      console.warn('🐌 Slow agent response detected:', responseTime + 'ms', metadata);
    }
  }

  // Track user interactions with the chat widget
  public trackUserInteraction(action: string, metadata?: Record<string, any>): void {
    if (!this.isEnabled) return;

    const interaction: UserInteraction = {
      sessionId: this.sessionId,
      action,
      timestamp: Date.now(),
      metadata
    };

    this.interactions.push(interaction);
    this.trimInteractions();
  }

  // Track errors
  public trackError(error: Error, context?: string): void {
    if (!this.isEnabled) return;

    const metric: PerformanceMetric = {
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: Date.now(),
      type: 'error',
      value: 1,
      metadata: {
        message: error.message,
        stack: error.stack,
        context,
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server'
      }
    };

    this.metrics.push(metric);
    this.trimMetrics();

    console.error('🚨 Error tracked:', error, context);
  }

  // Track cache performance
  public trackCacheHit(cacheKey: string, responseTime: number): void {
    if (!this.isEnabled) return;

    const metric: PerformanceMetric = {
      id: `cache_hit_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: Date.now(),
      type: 'cache_hit',
      value: responseTime,
      metadata: {
        cacheKey,
        component: 'cache'
      }
    };

    this.metrics.push(metric);
    this.trimMetrics();
  }

  public trackCacheMiss(cacheKey: string, responseTime: number): void {
    if (!this.isEnabled) return;

    const metric: PerformanceMetric = {
      id: `cache_miss_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: Date.now(),
      type: 'cache_miss',
      value: responseTime,
      metadata: {
        cacheKey,
        component: 'cache'
      }
    };

    this.metrics.push(metric);
    this.trimMetrics();
  }

  // Get performance summary
  public getPerformanceSummary(): {
    avgResponseTime: number;
    errorRate: number;
    cacheHitRate: number;
    totalInteractions: number;
    sessionDuration: number;
  } {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    
    const recentMetrics = this.metrics.filter(m => m.timestamp > oneHourAgo);
    const recentInteractions = this.interactions.filter(i => i.timestamp > oneHourAgo);

    // Calculate average response time
    const responseTimes = recentMetrics
      .filter(m => m.type === 'response_time')
      .map(m => m.value);
    const avgResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0;

    // Calculate error rate
    const totalRequests = recentMetrics.filter(m => 
      m.type === 'response_time' || m.type === 'error'
    ).length;
    const errors = recentMetrics.filter(m => m.type === 'error').length;
    const errorRate = totalRequests > 0 ? (errors / totalRequests) * 100 : 0;

    // Calculate cache hit rate
    const cacheHits = recentMetrics.filter(m => m.type === 'cache_hit').length;
    const cacheMisses = recentMetrics.filter(m => m.type === 'cache_miss').length;
    const totalCacheRequests = cacheHits + cacheMisses;
    const cacheHitRate = totalCacheRequests > 0 ? (cacheHits / totalCacheRequests) * 100 : 0;

    // Calculate session duration
    const firstInteraction = recentInteractions[0];
    const sessionDuration = firstInteraction 
      ? (now - firstInteraction.timestamp) / 1000 / 60 // minutes
      : 0;

    return {
      avgResponseTime: Math.round(avgResponseTime),
      errorRate: Math.round(errorRate * 100) / 100,
      cacheHitRate: Math.round(cacheHitRate * 100) / 100,
      totalInteractions: recentInteractions.length,
      sessionDuration: Math.round(sessionDuration * 100) / 100
    };
  }

  // Send metrics to analytics endpoint
  public async sendMetrics(): Promise<void> {
    if (!this.isEnabled || this.metrics.length === 0) return;

    try {
      const payload = {
        sessionId: this.sessionId,
        metrics: this.metrics.slice(-100), // Send last 100 metrics
        interactions: this.interactions.slice(-50), // Send last 50 interactions
        timestamp: Date.now()
      };

      await fetch('/api/analytics/performance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      // Clear sent metrics
      this.metrics = this.metrics.slice(-20); // Keep last 20 for local analysis
      this.interactions = this.interactions.slice(-10); // Keep last 10

    } catch (error) {
      console.error('Failed to send performance metrics:', error);
    }
  }

  // Utility methods
  private trimMetrics(): void {
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-500);
    }
  }

  private trimInteractions(): void {
    if (this.interactions.length > 500) {
      this.interactions = this.interactions.slice(-250);
    }
  }

  public enable(): void {
    this.isEnabled = true;
  }

  public disable(): void {
    this.isEnabled = false;
  }

  public getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  public getInteractions(): UserInteraction[] {
    return [...this.interactions];
  }
}

// Create and export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();

// Auto-send metrics every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    performanceMonitor.sendMetrics();
  }, 5 * 60 * 1000);
}

export default PerformanceMonitor;
