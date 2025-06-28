"use client";

import React, { useState, useEffect } from 'react';
import {
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon,
  CpuChipIcon,
  CloudIcon
} from '@heroicons/react/24/outline';
import { realPerformanceService } from '~~/services/analytics/RealPerformanceService';

interface PerformanceDashboardProps {
  className?: string;
}

export const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({ className = '' }) => {
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [cacheStats, setCacheStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const updateData = () => {
      // Get real performance data
      const realPerfData = realPerformanceService.getRealPerformanceData();
      const detailedMetrics = realPerformanceService.getDetailedMetrics();

      setPerformanceData(realPerfData);

      // Calculate cache stats from real data
      const totalCacheRequests = detailedMetrics.cacheHits + detailedMetrics.cacheMisses;
      const cacheStats = {
        hits: detailedMetrics.cacheHits,
        misses: detailedMetrics.cacheMisses,
        size: detailedMetrics.totalMetrics,
        hitRate: totalCacheRequests > 0 ? (detailedMetrics.cacheHits / totalCacheRequests) * 100 : 0
      };

      setCacheStats(cacheStats);

      console.log('📊 Real performance data updated:', {
        avgResponseTime: realPerfData.avgResponseTime,
        errorRate: realPerfData.errorRate,
        cacheHitRate: realPerfData.cacheHitRate,
        totalInteractions: realPerfData.totalInteractions
      });
    };

    updateData();
    const interval = setInterval(updateData, 5000); // Update every 5 seconds

    setIsLoading(false);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const MetricCard = ({ 
    icon: Icon, 
    title, 
    value, 
    unit = '', 
    status = 'good',
    description 
  }: {
    icon: any;
    title: string;
    value: number | string;
    unit?: string;
    status?: 'good' | 'warning' | 'error';
    description?: string;
  }) => {
    const statusColors = {
      good: 'text-green-400 bg-green-400/20',
      warning: 'text-yellow-400 bg-yellow-400/20',
      error: 'text-red-400 bg-red-400/20'
    };

    return (
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-lg ${statusColors[status]}`}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-white">
              {value}{unit}
            </p>
            <p className="text-slate-400 text-sm">{title}</p>
          </div>
        </div>
        {description && (
          <p className="text-slate-400 text-sm">{description}</p>
        )}
      </div>
    );
  };

  const getResponseTimeStatus = (avgTime: number) => {
    if (avgTime < 1000) return 'good';
    if (avgTime < 3000) return 'warning';
    return 'error';
  };

  const getErrorRateStatus = (errorRate: number) => {
    if (errorRate < 1) return 'good';
    if (errorRate < 5) return 'warning';
    return 'error';
  };

  const getCacheHitRateStatus = (hitRate: number) => {
    if (hitRate > 80) return 'good';
    if (hitRate > 50) return 'warning';
    return 'error';
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Performance Dashboard</h2>
          <p className="text-slate-400">Real-time system performance metrics</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          Live monitoring
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          icon={ClockIcon}
          title="Avg Response Time"
          value={performanceData?.avgResponseTime || 0}
          unit="ms"
          status={getResponseTimeStatus(performanceData?.avgResponseTime || 0)}
          description="Average time for agent responses"
        />
        
        <MetricCard
          icon={ExclamationTriangleIcon}
          title="Error Rate"
          value={performanceData?.errorRate || 0}
          unit="%"
          status={getErrorRateStatus(performanceData?.errorRate || 0)}
          description="Percentage of failed requests"
        />
        
        <MetricCard
          icon={CloudIcon}
          title="Cache Hit Rate"
          value={Math.round(cacheStats?.hitRate || 0)}
          unit="%"
          status={getCacheHitRateStatus(cacheStats?.hitRate || 0)}
          description="Percentage of requests served from cache"
        />
        
        <MetricCard
          icon={ArrowTrendingUpIcon}
          title="Total Interactions"
          value={performanceData?.totalInteractions || 0}
          status="good"
          description="User interactions in current session"
        />
      </div>

      {/* Detailed Performance Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cache Performance */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <CloudIcon className="h-5 w-5 text-blue-400" />
            Cache Performance
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Cache Hits</span>
              <span className="text-green-400 font-semibold">{cacheStats?.hits || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Cache Misses</span>
              <span className="text-red-400 font-semibold">{cacheStats?.misses || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Cache Size</span>
              <span className="text-white font-semibold">{cacheStats?.size || 0} entries</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Hit Rate</span>
              <span className={`font-semibold ${
                getCacheHitRateStatus(cacheStats?.hitRate || 0) === 'good' ? 'text-green-400' :
                getCacheHitRateStatus(cacheStats?.hitRate || 0) === 'warning' ? 'text-yellow-400' :
                'text-red-400'
              }`}>
                {Math.round(cacheStats?.hitRate || 0)}%
              </span>
            </div>
          </div>
        </div>

        {/* Session Information */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <CpuChipIcon className="h-5 w-5 text-purple-400" />
            Session Information
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Session Duration</span>
              <span className="text-white font-semibold">
                {Math.round(performanceData?.sessionDuration || 0)}m
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Total Interactions</span>
              <span className="text-white font-semibold">{performanceData?.totalInteractions || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Avg Response Time</span>
              <span className={`font-semibold ${
                getResponseTimeStatus(performanceData?.avgResponseTime || 0) === 'good' ? 'text-green-400' :
                getResponseTimeStatus(performanceData?.avgResponseTime || 0) === 'warning' ? 'text-yellow-400' :
                'text-red-400'
              }`}>
                {performanceData?.avgResponseTime || 0}ms
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Error Rate</span>
              <span className={`font-semibold ${
                getErrorRateStatus(performanceData?.errorRate || 0) === 'good' ? 'text-green-400' :
                getErrorRateStatus(performanceData?.errorRate || 0) === 'warning' ? 'text-yellow-400' :
                'text-red-400'
              }`}>
                {performanceData?.errorRate || 0}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Status */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">System Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <CheckCircleIcon className={`h-5 w-5 ${
              getResponseTimeStatus(performanceData?.avgResponseTime || 0) === 'good' ? 'text-green-400' :
              getResponseTimeStatus(performanceData?.avgResponseTime || 0) === 'warning' ? 'text-yellow-400' :
              'text-red-400'
            }`} />
            <div>
              <p className="text-white font-medium">Response Time</p>
              <p className="text-slate-400 text-sm">
                {getResponseTimeStatus(performanceData?.avgResponseTime || 0) === 'good' ? 'Excellent' :
                 getResponseTimeStatus(performanceData?.avgResponseTime || 0) === 'warning' ? 'Acceptable' :
                 'Needs Attention'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <CheckCircleIcon className={`h-5 w-5 ${
              getErrorRateStatus(performanceData?.errorRate || 0) === 'good' ? 'text-green-400' :
              getErrorRateStatus(performanceData?.errorRate || 0) === 'warning' ? 'text-yellow-400' :
              'text-red-400'
            }`} />
            <div>
              <p className="text-white font-medium">Error Rate</p>
              <p className="text-slate-400 text-sm">
                {getErrorRateStatus(performanceData?.errorRate || 0) === 'good' ? 'Excellent' :
                 getErrorRateStatus(performanceData?.errorRate || 0) === 'warning' ? 'Acceptable' :
                 'Needs Attention'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <CheckCircleIcon className={`h-5 w-5 ${
              getCacheHitRateStatus(cacheStats?.hitRate || 0) === 'good' ? 'text-green-400' :
              getCacheHitRateStatus(cacheStats?.hitRate || 0) === 'warning' ? 'text-yellow-400' :
              'text-red-400'
            }`} />
            <div>
              <p className="text-white font-medium">Cache Performance</p>
              <p className="text-slate-400 text-sm">
                {getCacheHitRateStatus(cacheStats?.hitRate || 0) === 'good' ? 'Excellent' :
                 getCacheHitRateStatus(cacheStats?.hitRate || 0) === 'warning' ? 'Acceptable' :
                 'Needs Attention'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceDashboard;
