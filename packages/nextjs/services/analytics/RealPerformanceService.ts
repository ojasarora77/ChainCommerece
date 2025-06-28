// Real performance monitoring service that tracks actual system metrics
// Replaces mock performance data with real measurements

interface PerformanceMetric {
  id: string;
  timestamp: number;
  type: 'response_time' | 'error' | 'cache_hit' | 'cache_miss' | 'user_interaction';
  value: number;
  metadata?: Record<string, any>;
}

interface RealPerformanceData {
  avgResponseTime: number;
  errorRate: number;
  cacheHitRate: number;
  totalInteractions: number;
  sessionDuration: number;
  systemHealth: {
    uptime: number;
    memoryUsage: number;
    errorCount: number;
    successRate: number;
  };
}

class RealPerformanceService {
  private static instance: RealPerformanceService;
  private metrics: PerformanceMetric[] = [];
  private startTime: number = Date.now();
  private errorCount: number = 0;
  private successCount: number = 0;
  private cacheHits: number = 0;
  private cacheMisses: number = 0;
  private userInteractions: number = 0;

  private constructor() {
    this.setupPerformanceObserver();
    this.startMemoryMonitoring();
  }

  public static getInstance(): RealPerformanceService {
    if (!RealPerformanceService.instance) {
      RealPerformanceService.instance = new RealPerformanceService();
    }
    return RealPerformanceService.instance;
  }

  // Track response times
  public trackResponseTime(operation: string, startTime: number, endTime: number, metadata?: Record<string, any>): void {
    const responseTime = endTime - startTime;
    
    const metric: PerformanceMetric = {
      id: `response_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: Date.now(),
      type: 'response_time',
      value: responseTime,
      metadata: {
        operation,
        ...metadata
      }
    };

    this.metrics.push(metric);
    this.successCount++;
    this.trimMetrics();

    // Log slow operations
    if (responseTime > 3000) {
      console.warn('🐌 Slow operation detected:', operation, responseTime + 'ms');
    }
  }

  // Track errors
  public trackError(error: string, context: string, metadata?: Record<string, any>): void {
    const metric: PerformanceMetric = {
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: Date.now(),
      type: 'error',
      value: 1,
      metadata: {
        error,
        context,
        ...metadata
      }
    };

    this.metrics.push(metric);
    this.errorCount++;
    this.trimMetrics();

    console.error('🚨 Error tracked:', error, context);
  }

  // Track cache performance
  public trackCacheHit(cacheKey: string, responseTime: number): void {
    const metric: PerformanceMetric = {
      id: `cache_hit_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: Date.now(),
      type: 'cache_hit',
      value: responseTime,
      metadata: { cacheKey }
    };

    this.metrics.push(metric);
    this.cacheHits++;
    this.trimMetrics();
  }

  public trackCacheMiss(cacheKey: string, responseTime: number): void {
    const metric: PerformanceMetric = {
      id: `cache_miss_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: Date.now(),
      type: 'cache_miss',
      value: responseTime,
      metadata: { cacheKey }
    };

    this.metrics.push(metric);
    this.cacheMisses++;
    this.trimMetrics();
  }

  // Track user interactions
  public trackUserInteraction(action: string, metadata?: Record<string, any>): void {
    const metric: PerformanceMetric = {
      id: `interaction_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: Date.now(),
      type: 'user_interaction',
      value: 1,
      metadata: { action, ...metadata }
    };

    this.metrics.push(metric);
    this.userInteractions++;
    this.trimMetrics();
  }

  // Get real performance data
  public getRealPerformanceData(): RealPerformanceData {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    
    // Filter recent metrics
    const recentMetrics = this.metrics.filter(m => m.timestamp > oneHourAgo);
    
    // Calculate average response time
    const responseTimes = recentMetrics
      .filter(m => m.type === 'response_time')
      .map(m => m.value);
    const avgResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0;

    // Calculate error rate
    const totalRequests = this.successCount + this.errorCount;
    const errorRate = totalRequests > 0 ? (this.errorCount / totalRequests) * 100 : 0;

    // Calculate cache hit rate
    const totalCacheRequests = this.cacheHits + this.cacheMisses;
    const cacheHitRate = totalCacheRequests > 0 ? (this.cacheHits / totalCacheRequests) * 100 : 0;

    // Calculate session duration
    const sessionDuration = (now - this.startTime) / 1000 / 60; // minutes

    // Calculate system health
    const uptime = (now - this.startTime) / 1000; // seconds
    const memoryUsage = this.getMemoryUsage();
    const successRate = totalRequests > 0 ? (this.successCount / totalRequests) * 100 : 100;

    return {
      avgResponseTime: Math.round(avgResponseTime),
      errorRate: Math.round(errorRate * 100) / 100,
      cacheHitRate: Math.round(cacheHitRate * 100) / 100,
      totalInteractions: this.userInteractions,
      sessionDuration: Math.round(sessionDuration * 100) / 100,
      systemHealth: {
        uptime: Math.round(uptime),
        memoryUsage: Math.round(memoryUsage * 100) / 100,
        errorCount: this.errorCount,
        successRate: Math.round(successRate * 100) / 100
      }
    };
  }

  // Setup performance observer for browser APIs
  private setupPerformanceObserver(): void {
    if (typeof window === 'undefined') return;

    // Monitor navigation timing
    if ('performance' in window && 'getEntriesByType' in performance) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordPerformanceEntry(entry);
          }
        });

        observer.observe({ entryTypes: ['navigation', 'resource', 'measure'] });
      } catch (error) {
        console.warn('Performance observer not supported:', error);
      }
    }

    // Monitor page load performance
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        this.trackResponseTime('page_load', 0, navigation.loadEventEnd);
      }
    });
  }

  private recordPerformanceEntry(entry: PerformanceEntry): void {
    if (entry.entryType === 'navigation') {
      this.trackResponseTime('navigation', 0, entry.duration, {
        name: entry.name,
        entryType: entry.entryType
      });
    } else if (entry.entryType === 'resource') {
      this.trackResponseTime('resource_load', 0, entry.duration, {
        name: entry.name,
        entryType: entry.entryType
      });
    }
  }

  // Monitor memory usage
  private startMemoryMonitoring(): void {
    if (typeof window === 'undefined') return;

    setInterval(() => {
      const memoryInfo = this.getMemoryUsage();
      if (memoryInfo > 0) {
        this.trackUserInteraction('memory_check', { memoryUsage: memoryInfo });
      }
    }, 30000); // Check every 30 seconds
  }

  private getMemoryUsage(): number {
    if (typeof window === 'undefined') return 0;
    
    // Use performance.memory if available (Chrome)
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100;
    }
    
    return 0;
  }

  // Utility methods
  private trimMetrics(): void {
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-500);
    }
  }

  // Reset counters (for testing)
  public resetCounters(): void {
    this.errorCount = 0;
    this.successCount = 0;
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.userInteractions = 0;
    this.startTime = Date.now();
  }

  // Get detailed metrics for debugging
  public getDetailedMetrics(): {
    totalMetrics: number;
    errorCount: number;
    successCount: number;
    cacheHits: number;
    cacheMisses: number;
    userInteractions: number;
    uptime: number;
  } {
    return {
      totalMetrics: this.metrics.length,
      errorCount: this.errorCount,
      successCount: this.successCount,
      cacheHits: this.cacheHits,
      cacheMisses: this.cacheMisses,
      userInteractions: this.userInteractions,
      uptime: Date.now() - this.startTime
    };
  }
}

// Export singleton instance
export const realPerformanceService = RealPerformanceService.getInstance();
export default RealPerformanceService;
