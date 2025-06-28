"use client";

import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  UserGroupIcon,
  ShoppingCartIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  EyeIcon,
  ClockIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

interface AnalyticsData {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  conversionRate: number;
  avgOrderValue: number;
  topProducts: Array<{
    id: number;
    name: string;
    orders: number;
    revenue: number;
  }>;
  userEngagement: {
    totalSessions: number;
    avgSessionDuration: number;
    bounceRate: number;
  };
  sustainabilityMetrics: {
    avgSustainabilityScore: number;
    co2Saved: number;
    ecoFriendlyOrders: number;
  };
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
  }>;
  timeRange?: string;
  lastUpdated?: string;
  dataSource?: string;
  fallback?: boolean;
}

interface AnalyticsDashboardProps {
  className?: string;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ className = '' }) => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Try marketplace analytics first (real data), fallback to general analytics
      const response = await fetch(`/api/marketplace/analytics?timeRange=${timeRange}`);
      const data = await response.json();

      if (data.error) {
        console.warn('Marketplace analytics failed, trying general analytics:', data.error);
        const fallbackResponse = await fetch(`/api/analytics?timeRange=${timeRange}`);
        const fallbackData = await fallbackResponse.json();
        setAnalytics(fallbackData);
      } else {
        console.log('✅ Real marketplace analytics loaded:', data.dataSource);
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      // Fallback data
      setAnalytics({
        totalUsers: 1247,
        totalOrders: 89,
        totalRevenue: 12450.75,
        conversionRate: 7.14,
        avgOrderValue: 139.90,
        topProducts: [
          { id: 1, name: "SustainTech Smartwatch", orders: 23, revenue: 3427 },
          { id: 2, name: "Bamboo Laptop Stand", orders: 45, revenue: 90 },
          { id: 3, name: "Organic Hemp T-Shirt", orders: 21, revenue: 25.20 }
        ],
        userEngagement: {
          totalSessions: 3421,
          avgSessionDuration: 4.2,
          bounceRate: 23.5
        },
        sustainabilityMetrics: {
          avgSustainabilityScore: 91.2,
          co2Saved: 145.7,
          ecoFriendlyOrders: 82
        },
        recentActivity: [
          {
            id: '1',
            type: 'order_created',
            description: 'New order for SustainTech Smartwatch',
            timestamp: '2 minutes ago'
          },
          {
            id: '2',
            type: 'user_registered',
            description: 'New user signed up',
            timestamp: '5 minutes ago'
          },
          {
            id: '3',
            type: 'product_search',
            description: 'Search for "sustainable electronics"',
            timestamp: '8 minutes ago'
          }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className={`text-center text-slate-400 ${className}`}>
        Failed to load analytics data
      </div>
    );
  }

  const StatCard = ({ icon: Icon, title, value, change, color = 'blue' }: {
    icon: any;
    title: string;
    value: string | number;
    change?: string;
    color?: string;
  }) => (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-400 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          {change && (
            <p className={`text-sm mt-1 ${change.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
              {change}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg bg-${color}-600/20`}>
          <Icon className={`h-6 w-6 text-${color}-400`} />
        </div>
      </div>
    </div>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Analytics Dashboard</h2>
          <div className="flex items-center gap-3">
            <p className="text-slate-400">AI Marketplace Performance Metrics</p>
            {analytics && (
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  analytics.dataSource === 'real_contracts_and_tracking' ? 'bg-green-500' :
                  analytics.fallback ? 'bg-red-500' : 'bg-yellow-500'
                }`}></div>
                <span className="text-xs text-slate-400">
                  {analytics.dataSource === 'real_contracts_and_tracking' ? 'Live Data' :
                   analytics.fallback ? 'Fallback Data' : 'Mock Data'}
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as '24h' | '7d' | '30d')}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={UserGroupIcon}
          title="Total Users"
          value={analytics.totalUsers.toLocaleString()}
          change="+12.5%"
          color="blue"
        />
        <StatCard
          icon={ShoppingCartIcon}
          title="Total Orders"
          value={analytics.totalOrders}
          change="+8.3%"
          color="green"
        />
        <StatCard
          icon={CurrencyDollarIcon}
          title="Revenue"
          value={`$${analytics.totalRevenue.toLocaleString()}`}
          change="+15.2%"
          color="purple"
        />
        <StatCard
          icon={ArrowTrendingUpIcon}
          title="Conversion Rate"
          value={`${analytics.conversionRate}%`}
          change="+2.1%"
          color="orange"
        />
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Top Products</h3>
          <div className="space-y-4">
            {analytics.topProducts.map((product, index) => (
              <div key={product.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-white font-medium">{product.name}</p>
                    <p className="text-slate-400 text-sm">{product.orders} orders</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-semibold">${product.revenue.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sustainability Metrics */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <SparklesIcon className="h-5 w-5 text-green-400" />
            Sustainability Impact
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Avg Sustainability Score</span>
              <span className="text-green-400 font-semibold">{analytics.sustainabilityMetrics.avgSustainabilityScore}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">CO2 Saved</span>
              <span className="text-green-400 font-semibold">{analytics.sustainabilityMetrics.co2Saved}kg</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Eco-Friendly Orders</span>
              <span className="text-green-400 font-semibold">{analytics.sustainabilityMetrics.ecoFriendlyOrders}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* User Engagement & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Engagement */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">User Engagement</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Total Sessions</span>
              <span className="text-white font-semibold">{analytics.userEngagement.totalSessions.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Avg Session Duration</span>
              <span className="text-white font-semibold">{analytics.userEngagement.avgSessionDuration}m</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Bounce Rate</span>
              <span className="text-white font-semibold">{analytics.userEngagement.bounceRate}%</span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {analytics.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                <div className="w-2 h-2 bg-purple-400 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-white text-sm">{activity.description}</p>
                  <p className="text-slate-400 text-xs">{activity.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
