import { NextRequest, NextResponse } from 'next/server';
import { kbAnalytics } from '../../../../services/analytics/KnowledgeBaseAnalytics';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'dashboard';
    const format = searchParams.get('format') as 'json' | 'csv' || 'json';
    const timeRange = searchParams.get('timeRange') || '24h';

    // Calculate time range
    const getTimeRange = (range: string) => {
      const now = new Date();
      const start = new Date();

      switch (range) {
        case '1h':
          start.setHours(now.getHours() - 1);
          break;
        case '24h':
          start.setDate(now.getDate() - 1);
          break;
        case '7d':
          start.setDate(now.getDate() - 7);
          break;
        case '30d':
          start.setDate(now.getDate() - 30);
          break;
        default:
          start.setDate(now.getDate() - 1); // Default to 24h
      }

      return { start, end: now };
    };

    const timeRangeObj = getTimeRange(timeRange);

    switch (type) {
      case 'dashboard':
        const dashboardData = kbAnalytics.getDashboardData();
        return NextResponse.json({
          success: true,
          type: 'dashboard',
          data: dashboardData,
          timestamp: new Date().toISOString(),
        });

      case 'performance':
        const performanceStats = kbAnalytics.getPerformanceStats(timeRangeObj);
        return NextResponse.json({
          success: true,
          type: 'performance',
          timeRange,
          data: performanceStats,
          timestamp: new Date().toISOString(),
        });

      case 'engagement':
        const engagementMetrics = kbAnalytics.getUserEngagementMetrics(timeRangeObj);
        return NextResponse.json({
          success: true,
          type: 'engagement',
          timeRange,
          data: engagementMetrics,
          timestamp: new Date().toISOString(),
        });

      case 'export':
        const exportData = kbAnalytics.exportMetrics(format);
        
        if (format === 'csv') {
          return new NextResponse(exportData, {
            headers: {
              'Content-Type': 'text/csv',
              'Content-Disposition': `attachment; filename="kb-analytics-${Date.now()}.csv"`,
            },
          });
        }

        return NextResponse.json({
          success: true,
          type: 'export',
          format,
          data: JSON.parse(exportData),
          timestamp: new Date().toISOString(),
        });

      default:
        return NextResponse.json(
          { error: `Unknown analytics type: ${type}` },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      {
        error: 'Analytics retrieval failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, data } = await request.json();

    switch (action) {
      case 'track_query':
        const {
          query,
          queryType,
          processingTime,
          confidence,
          sources,
          success,
          userId,
          sessionId,
          knowledgeBaseUsed,
          cacheHit,
          errorMessage,
        } = data;

        kbAnalytics.trackKBQuery({
          query,
          queryType,
          processingTime,
          confidence,
          sources,
          success,
          userId,
          sessionId,
          knowledgeBaseUsed,
          cacheHit,
          errorMessage,
        });

        return NextResponse.json({
          success: true,
          message: 'Query tracked successfully',
          timestamp: new Date().toISOString(),
        });

      case 'bulk_track':
        const { queries } = data;
        
        if (!Array.isArray(queries)) {
          return NextResponse.json(
            { error: 'Queries must be an array' },
            { status: 400 }
          );
        }

        queries.forEach((queryData: any) => {
          kbAnalytics.trackKBQuery(queryData);
        });

        return NextResponse.json({
          success: true,
          message: `${queries.length} queries tracked successfully`,
          timestamp: new Date().toISOString(),
        });

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Analytics tracking error:', error);
    return NextResponse.json(
      {
        error: 'Analytics tracking failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({
    message: 'Knowledge Base Analytics API',
    description: 'Track and analyze Knowledge Base query performance and user engagement',
    endpoints: {
      GET: 'Retrieve analytics data',
      POST: 'Track query metrics',
    },
    getParameters: {
      type: 'Analytics type (dashboard, performance, engagement, export)',
      format: 'Export format (json, csv) - only for export type',
      timeRange: 'Time range (1h, 24h, 7d, 30d)',
    },
    postActions: {
      track_query: 'Track a single query',
      bulk_track: 'Track multiple queries',
    },
    analyticsTypes: {
      dashboard: 'Real-time dashboard with overview metrics',
      performance: 'Detailed performance statistics',
      engagement: 'User engagement and behavior metrics',
      export: 'Export raw metrics data',
    },
    metrics: [
      'Query processing time',
      'Success/failure rates',
      'Knowledge Base usage',
      'Cache hit rates',
      'User engagement',
      'Query type distribution',
      'Source distribution',
      'Performance trends',
    ],
    examples: [
      {
        description: 'Get dashboard data',
        url: '/api/ai/analytics?type=dashboard',
      },
      {
        description: 'Get 7-day performance stats',
        url: '/api/ai/analytics?type=performance&timeRange=7d',
      },
      {
        description: 'Export metrics as CSV',
        url: '/api/ai/analytics?type=export&format=csv',
      },
      {
        description: 'Track a query',
        method: 'POST',
        body: {
          action: 'track_query',
          data: {
            query: 'How does escrow work?',
            queryType: 'platform_info',
            processingTime: 1500,
            confidence: 0.9,
            sources: ['knowledge_base'],
            success: true,
            userId: 'user123',
            knowledgeBaseUsed: true,
          },
        },
      },
    ],
    features: [
      'Real-time performance monitoring',
      'User engagement tracking',
      'Query success/failure analysis',
      'Knowledge Base effectiveness metrics',
      'Cache performance optimization',
      'Export capabilities for further analysis',
      'System health monitoring',
      'Performance trend analysis',
    ],
  });
}
