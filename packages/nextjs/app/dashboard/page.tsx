"use client";

import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  CpuChipIcon,
  CogIcon,
  SparklesIcon,
  ClockIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { AnalyticsDashboard } from '~~/components/analytics/AnalyticsDashboard';
import { PerformanceDashboard } from '~~/components/analytics/PerformanceDashboard';
import { UserPreferences } from '~~/components/ai/UserPreferences';
import { PersonalizedRecommendations } from '~~/components/ai/PersonalizedRecommendations';
import { useScaffoldReadContract } from '~~/hooks/scaffold-eth';
import { realProductTracker } from '~~/services/marketplace/RealProductTracker';
import { realPerformanceService } from '~~/services/analytics/RealPerformanceService';

type TabType = 'analytics' | 'performance' | 'preferences' | 'recommendations';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('analytics');
  const [realStats, setRealStats] = useState<any>(null);

  // Get real data from smart contracts
  const { data: marketplaceStats } = useScaffoldReadContract({
    contractName: "ProductRegistry",
    functionName: "getMarketplaceStats",
  });

  const { data: totalProducts } = useScaffoldReadContract({
    contractName: "ProductRegistry",
    functionName: "totalProducts",
  });

  // Update real stats when data changes
  useEffect(() => {
    const updateRealStats = () => {
      const productStats = realProductTracker.getSummaryStats();
      const performanceStats = realPerformanceService.getRealPerformanceData();

      setRealStats({
        totalUsers: productStats.uniqueUsers,
        totalProducts: Number(totalProducts || 0),
        conversionRate: productStats.avgConversionRate,
        avgResponseTime: performanceStats.avgResponseTime,
        totalRevenue: productStats.totalRevenue,
        totalOrders: productStats.totalPurchases,
        marketplaceStats: marketplaceStats ? {
          totalProducts: Number(marketplaceStats[0] || 0),
          totalSellers: Number(marketplaceStats[1] || 0),
          totalSales: Number(marketplaceStats[2] || 0)
        } : null
      });
    };

    updateRealStats();
    const interval = setInterval(updateRealStats, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [marketplaceStats, totalProducts]);

  const tabs = [
    {
      id: 'analytics' as TabType,
      name: 'Analytics',
      icon: ChartBarIcon,
      description: 'User behavior and business metrics'
    },
    {
      id: 'performance' as TabType,
      name: 'Performance',
      icon: ClockIcon,
      description: 'System performance and optimization'
    },
    {
      id: 'preferences' as TabType,
      name: 'User Preferences',
      icon: CogIcon,
      description: 'Customize shopping preferences'
    },
    {
      id: 'recommendations' as TabType,
      name: 'AI Recommendations',
      icon: SparklesIcon,
      description: 'Personalized product suggestions'
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'analytics':
        return <AnalyticsDashboard />;
      case 'performance':
        return <PerformanceDashboard />;
      case 'preferences':
        return <UserPreferences />;
      case 'recommendations':
        return <PersonalizedRecommendations />;
      default:
        return <AnalyticsDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8 pt-24">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg">
              <CpuChipIcon className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">AI Marketplace Dashboard</h1>
              <p className="text-slate-400">
                Advanced analytics and AI-powered insights for your autonomous shopping agent
              </p>
            </div>
          </div>

          {/* Quick Stats - REAL DATA */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-4 border border-slate-700">
              <div className="flex items-center gap-3">
                <UserGroupIcon className="h-8 w-8 text-blue-400" />
                <div>
                  <p className="text-slate-400 text-sm">Active Users</p>
                  <p className="text-2xl font-bold text-white">
                    {realStats?.totalUsers || 0}
                  </p>
                  <p className="text-xs text-green-400">Real-time data</p>
                </div>
              </div>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-4 border border-slate-700">
              <div className="flex items-center gap-3">
                <ChartBarIcon className="h-8 w-8 text-green-400" />
                <div>
                  <p className="text-slate-400 text-sm">Conversion Rate</p>
                  <p className="text-2xl font-bold text-white">
                    {realStats?.conversionRate?.toFixed(1) || '0.0'}%
                  </p>
                  <p className="text-xs text-green-400">From smart contracts</p>
                </div>
              </div>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-4 border border-slate-700">
              <div className="flex items-center gap-3">
                <ClockIcon className="h-8 w-8 text-yellow-400" />
                <div>
                  <p className="text-slate-400 text-sm">Avg Response</p>
                  <p className="text-2xl font-bold text-white">
                    {realStats?.avgResponseTime || 0}ms
                  </p>
                  <p className="text-xs text-green-400">Live monitoring</p>
                </div>
              </div>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-4 border border-slate-700">
              <div className="flex items-center gap-3">
                <SparklesIcon className="h-8 w-8 text-purple-400" />
                <div>
                  <p className="text-slate-400 text-sm">Total Products</p>
                  <p className="text-2xl font-bold text-white">
                    {realStats?.totalProducts || 0}
                  </p>
                  <p className="text-xs text-green-400">On-chain data</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2 bg-slate-800/50 backdrop-blur-sm rounded-lg p-2 border border-slate-700">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-purple-600 text-white shadow-lg'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <div className="text-left">
                    <div className="font-semibold">{tab.name}</div>
                    <div className="text-xs opacity-75">{tab.description}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-slate-800/30 backdrop-blur-sm rounded-lg border border-slate-700 p-6">
          {renderTabContent()}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-slate-400">
          <p className="text-sm">
            AI Marketplace Dashboard - Powered by AWS Bedrock & Advanced Analytics
          </p>
          <div className="flex items-center justify-center gap-4 mt-2 text-xs">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              System Operational
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              AI Agent Active
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
              Real-time Analytics
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
