interface KBQueryMetrics {
  queryId: string;
  query: string;
  queryType: string;
  processingTime: number;
  confidence: number;
  sources: string[];
  success: boolean;
  userId?: string;
  sessionId?: string;
  timestamp: Date;
  knowledgeBaseUsed: boolean;
  cacheHit: boolean;
  errorMessage?: string;
}

interface KBPerformanceStats {
  totalQueries: number;
  successRate: number;
  averageProcessingTime: number;
  averageConfidence: number;
  knowledgeBaseUsageRate: number;
  cacheHitRate: number;
  queryTypeDistribution: Record<string, number>;
  sourceDistribution: Record<string, number>;
  errorRate: number;
  topQueries: Array<{ query: string; count: number }>;
  performanceTrends: Array<{ timestamp: Date; avgProcessingTime: number; successRate: number }>;
}

interface UserEngagementMetrics {
  totalUsers: number;
  activeUsers: number;
  averageSessionLength: number;
  queriesPerSession: number;
  userRetentionRate: number;
  mostEngagedUsers: Array<{ userId: string; queryCount: number; avgConfidence: number }>;
  sessionDistribution: Record<string, number>;
}

export class KnowledgeBaseAnalytics {
  private metrics: KBQueryMetrics[] = [];
  private readonly maxMetricsHistory = 10000; // Keep last 10k queries

  // Track a Knowledge Base query
  trackKBQuery(metrics: Omit<KBQueryMetrics, 'queryId' | 'timestamp'>): void {
    const queryMetrics: KBQueryMetrics = {
      ...metrics,
      queryId: `kb-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };

    this.metrics.push(queryMetrics);

    // Keep only recent metrics to prevent memory issues
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics = this.metrics.slice(-this.maxMetricsHistory);
    }

    // Log important metrics
    console.log(`📊 KB Query: ${metrics.query.substring(0, 50)}... | ${metrics.processingTime}ms | Success: ${metrics.success} | KB Used: ${metrics.knowledgeBaseUsed}`);
  }

  // Get comprehensive performance statistics
  getPerformanceStats(timeRange?: { start: Date; end: Date }): KBPerformanceStats {
    let filteredMetrics = this.metrics;

    if (timeRange) {
      filteredMetrics = this.metrics.filter(
        m => m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
      );
    }

    if (filteredMetrics.length === 0) {
      return this.getEmptyStats();
    }

    const totalQueries = filteredMetrics.length;
    const successfulQueries = filteredMetrics.filter(m => m.success);
    const kbQueries = filteredMetrics.filter(m => m.knowledgeBaseUsed);
    const cacheHits = filteredMetrics.filter(m => m.cacheHit);

    // Calculate query type distribution
    const queryTypeDistribution: Record<string, number> = {};
    filteredMetrics.forEach(m => {
      queryTypeDistribution[m.queryType] = (queryTypeDistribution[m.queryType] || 0) + 1;
    });

    // Calculate source distribution
    const sourceDistribution: Record<string, number> = {};
    filteredMetrics.forEach(m => {
      m.sources.forEach(source => {
        sourceDistribution[source] = (sourceDistribution[source] || 0) + 1;
      });
    });

    // Calculate top queries
    const queryCount: Record<string, number> = {};
    filteredMetrics.forEach(m => {
      const normalizedQuery = m.query.toLowerCase().trim();
      queryCount[normalizedQuery] = (queryCount[normalizedQuery] || 0) + 1;
    });

    const topQueries = Object.entries(queryCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([query, count]) => ({ query, count }));

    // Calculate performance trends (hourly buckets)
    const performanceTrends = this.calculatePerformanceTrends(filteredMetrics);

    return {
      totalQueries,
      successRate: (successfulQueries.length / totalQueries) * 100,
      averageProcessingTime: filteredMetrics.reduce((sum, m) => sum + m.processingTime, 0) / totalQueries,
      averageConfidence: successfulQueries.reduce((sum, m) => sum + m.confidence, 0) / successfulQueries.length || 0,
      knowledgeBaseUsageRate: (kbQueries.length / totalQueries) * 100,
      cacheHitRate: (cacheHits.length / totalQueries) * 100,
      queryTypeDistribution,
      sourceDistribution,
      errorRate: ((totalQueries - successfulQueries.length) / totalQueries) * 100,
      topQueries,
      performanceTrends,
    };
  }

  // Get user engagement metrics
  getUserEngagementMetrics(timeRange?: { start: Date; end: Date }): UserEngagementMetrics {
    let filteredMetrics = this.metrics;

    if (timeRange) {
      filteredMetrics = this.metrics.filter(
        m => m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
      );
    }

    const userSessions: Record<string, { queries: KBQueryMetrics[]; sessions: Set<string> }> = {};

    filteredMetrics.forEach(m => {
      if (m.userId) {
        if (!userSessions[m.userId]) {
          userSessions[m.userId] = { queries: [], sessions: new Set() };
        }
        userSessions[m.userId].queries.push(m);
        if (m.sessionId) {
          userSessions[m.userId].sessions.add(m.sessionId);
        }
      }
    });

    const users = Object.keys(userSessions);
    const totalUsers = users.length;
    const activeUsers = users.filter(userId => userSessions[userId].queries.length > 1).length;

    // Calculate session metrics
    const sessionLengths: number[] = [];
    const queriesPerSessionList: number[] = [];

    Object.values(userSessions).forEach(userData => {
      userData.sessions.forEach(sessionId => {
        const sessionQueries = userData.queries.filter(q => q.sessionId === sessionId);
        if (sessionQueries.length > 0) {
          const sessionStart = Math.min(...sessionQueries.map(q => q.timestamp.getTime()));
          const sessionEnd = Math.max(...sessionQueries.map(q => q.timestamp.getTime()));
          sessionLengths.push(sessionEnd - sessionStart);
          queriesPerSessionList.push(sessionQueries.length);
        }
      });
    });

    // Most engaged users
    const mostEngagedUsers = users
      .map(userId => {
        const userData = userSessions[userId];
        const avgConfidence = userData.queries.reduce((sum, q) => sum + q.confidence, 0) / userData.queries.length;
        return {
          userId,
          queryCount: userData.queries.length,
          avgConfidence,
        };
      })
      .sort((a, b) => b.queryCount - a.queryCount)
      .slice(0, 10);

    // Session distribution
    const sessionDistribution: Record<string, number> = {
      'single-query': 0,
      'short (2-5)': 0,
      'medium (6-15)': 0,
      'long (16+)': 0,
    };

    queriesPerSessionList.forEach(count => {
      if (count === 1) sessionDistribution['single-query']++;
      else if (count <= 5) sessionDistribution['short (2-5)']++;
      else if (count <= 15) sessionDistribution['medium (6-15)']++;
      else sessionDistribution['long (16+)']++;
    });

    return {
      totalUsers,
      activeUsers,
      averageSessionLength: sessionLengths.length > 0 ? sessionLengths.reduce((a, b) => a + b, 0) / sessionLengths.length : 0,
      queriesPerSession: queriesPerSessionList.length > 0 ? queriesPerSessionList.reduce((a, b) => a + b, 0) / queriesPerSessionList.length : 0,
      userRetentionRate: totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0,
      mostEngagedUsers,
      sessionDistribution,
    };
  }

  // Get real-time dashboard data
  getDashboardData(): {
    performance: KBPerformanceStats;
    engagement: UserEngagementMetrics;
    recentActivity: KBQueryMetrics[];
    systemHealth: {
      knowledgeBaseStatus: 'healthy' | 'degraded' | 'down';
      agentStatus: 'healthy' | 'degraded' | 'down';
      cacheStatus: 'healthy' | 'degraded' | 'down';
      overallHealth: 'healthy' | 'degraded' | 'down';
    };
  } {
    const last24Hours = {
      start: new Date(Date.now() - 24 * 60 * 60 * 1000),
      end: new Date(),
    };

    const performance = this.getPerformanceStats(last24Hours);
    const engagement = this.getUserEngagementMetrics(last24Hours);
    const recentActivity = this.metrics.slice(-20).reverse(); // Last 20 queries

    // Determine system health
    const systemHealth = this.calculateSystemHealth(performance);

    return {
      performance,
      engagement,
      recentActivity,
      systemHealth,
    };
  }

  // Export metrics for analysis
  exportMetrics(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      const headers = [
        'queryId', 'query', 'queryType', 'processingTime', 'confidence',
        'sources', 'success', 'userId', 'sessionId', 'timestamp',
        'knowledgeBaseUsed', 'cacheHit', 'errorMessage'
      ];

      const csvRows = [
        headers.join(','),
        ...this.metrics.map(m => [
          m.queryId,
          `"${m.query.replace(/"/g, '""')}"`,
          m.queryType,
          m.processingTime,
          m.confidence,
          `"${m.sources.join(';')}"`,
          m.success,
          m.userId || '',
          m.sessionId || '',
          m.timestamp.toISOString(),
          m.knowledgeBaseUsed,
          m.cacheHit,
          m.errorMessage ? `"${m.errorMessage.replace(/"/g, '""')}"` : ''
        ].join(','))
      ];

      return csvRows.join('\n');
    }

    return JSON.stringify(this.metrics, null, 2);
  }

  private calculatePerformanceTrends(metrics: KBQueryMetrics[]): Array<{ timestamp: Date; avgProcessingTime: number; successRate: number }> {
    // Group by hour
    const hourlyBuckets: Record<string, KBQueryMetrics[]> = {};

    metrics.forEach(m => {
      const hour = new Date(m.timestamp);
      hour.setMinutes(0, 0, 0);
      const key = hour.toISOString();

      if (!hourlyBuckets[key]) {
        hourlyBuckets[key] = [];
      }
      hourlyBuckets[key].push(m);
    });

    return Object.entries(hourlyBuckets)
      .map(([timestamp, hourMetrics]) => ({
        timestamp: new Date(timestamp),
        avgProcessingTime: hourMetrics.reduce((sum, m) => sum + m.processingTime, 0) / hourMetrics.length,
        successRate: (hourMetrics.filter(m => m.success).length / hourMetrics.length) * 100,
      }))
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  private calculateSystemHealth(performance: KBPerformanceStats): {
    knowledgeBaseStatus: 'healthy' | 'degraded' | 'down';
    agentStatus: 'healthy' | 'degraded' | 'down';
    cacheStatus: 'healthy' | 'degraded' | 'down';
    overallHealth: 'healthy' | 'degraded' | 'down';
  } {
    const kbStatus = performance.knowledgeBaseUsageRate > 50 && performance.successRate > 80 ? 'healthy' :
                     performance.successRate > 60 ? 'degraded' : 'down';

    const agentStatus = performance.successRate > 85 && performance.averageProcessingTime < 10000 ? 'healthy' :
                        performance.successRate > 70 ? 'degraded' : 'down';

    const cacheStatus = performance.cacheHitRate > 20 ? 'healthy' :
                        performance.cacheHitRate > 10 ? 'degraded' : 'down';

    const overallHealth = [kbStatus, agentStatus, cacheStatus].every(s => s === 'healthy') ? 'healthy' :
                          [kbStatus, agentStatus, cacheStatus].some(s => s === 'down') ? 'down' : 'degraded';

    return {
      knowledgeBaseStatus: kbStatus,
      agentStatus,
      cacheStatus,
      overallHealth,
    };
  }

  private getEmptyStats(): KBPerformanceStats {
    return {
      totalQueries: 0,
      successRate: 0,
      averageProcessingTime: 0,
      averageConfidence: 0,
      knowledgeBaseUsageRate: 0,
      cacheHitRate: 0,
      queryTypeDistribution: {},
      sourceDistribution: {},
      errorRate: 0,
      topQueries: [],
      performanceTrends: [],
    };
  }
}

// Global analytics instance
export const kbAnalytics = new KnowledgeBaseAnalytics();

// Helper function to track KB queries from API endpoints
export function trackKBQuery(
  query: string,
  queryType: string,
  processingTime: number,
  confidence: number,
  sources: string[],
  success: boolean,
  options: {
    userId?: string;
    sessionId?: string;
    knowledgeBaseUsed?: boolean;
    cacheHit?: boolean;
    errorMessage?: string;
  } = {}
): void {
  kbAnalytics.trackKBQuery({
    query,
    queryType,
    processingTime,
    confidence,
    sources,
    success,
    userId: options.userId,
    sessionId: options.sessionId,
    knowledgeBaseUsed: options.knowledgeBaseUsed || false,
    cacheHit: options.cacheHit || false,
    errorMessage: options.errorMessage,
  });
}
