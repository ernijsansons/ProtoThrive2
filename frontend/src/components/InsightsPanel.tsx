/**
 * @fileoverview ProtoThrive Insights Panel
 * Real-time analytics and project insights
 */

import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  UsersIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

interface Metric {
  id: string;
  label: string;
  value: string | number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  type: 'percentage' | 'number' | 'time' | 'score';
}

interface Alert {
  id: string;
  type: 'warning' | 'error' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  actionable?: boolean;
}

interface InsightsPanelProps {
  projectId?: string;
  className?: string;
  compact?: boolean;
}

const InsightsPanel: React.FC<InsightsPanelProps> = ({
  projectId,
  className = '',
  compact = false
}) => {
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [thriveScore, setThriveScore] = useState(87);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'metrics' | 'alerts' | 'insights'>('metrics');

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        const mockMetrics: Metric[] = [
          {
            id: 'completion',
            label: 'Completion Rate',
            value: 73,
            change: 12,
            trend: 'up',
            type: 'percentage'
          },
          {
            id: 'velocity',
            label: 'Development Velocity',
            value: 8.4,
            change: -2.1,
            trend: 'down',
            type: 'number'
          },
          {
            id: 'quality',
            label: 'Code Quality Score',
            value: 92,
            change: 5,
            trend: 'up',
            type: 'score'
          },
          {
            id: 'time-to-deploy',
            label: 'Avg Deploy Time',
            value: '4.2m',
            change: -18,
            trend: 'up',
            type: 'time'
          },
          {
            id: 'collaborators',
            label: 'Active Contributors',
            value: 5,
            change: 1,
            trend: 'up',
            type: 'number'
          },
          {
            id: 'test-coverage',
            label: 'Test Coverage',
            value: 94,
            change: 3,
            trend: 'up',
            type: 'percentage'
          }
        ];

        const mockAlerts: Alert[] = [
          {
            id: '1',
            type: 'warning',
            title: 'Security Audit Required',
            message: 'Dependencies need security review before deployment',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
            actionable: true
          },
          {
            id: '2',
            type: 'info',
            title: 'Performance Optimization Available',
            message: 'AI detected potential 15% performance improvement in API calls',
            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
            actionable: true
          },
          {
            id: '3',
            type: 'success',
            title: 'Deployment Successful',
            message: 'Latest changes deployed to staging environment',
            timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
            actionable: false
          },
          {
            id: '4',
            type: 'error',
            title: 'Test Failure Detected',
            message: '3 unit tests failing in authentication module',
            timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
            actionable: true
          }
        ];

        setMetrics(mockMetrics);
        setAlerts(mockAlerts);
      } catch (error) {
        console.error('Error fetching insights:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInsights();
  }, [projectId]);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />;
      case 'down':
        return <ArrowTrendingDownIcon className="h-4 w-4 text-red-500" />;
      default:
        return <div className="h-4 w-4" />;
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'info':
      default:
        return <InformationCircleIcon className="h-5 w-5 text-blue-500" />;
    }
  };

  const getChangeColor = (change: number, type: string) => {
    const isPositive = change > 0;
    const isGoodChange = type === 'time' ? !isPositive : isPositive; // For time metrics, decrease is good
    return isGoodChange ? 'text-green-600' : 'text-red-600';
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours === 1) return '1 hour ago';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    return `${Math.floor(diffInHours / 24)} days ago`;
  };

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow-lg border border-gray-200 p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <ChartBarIcon className="h-5 w-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Project Insights</h3>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Thrive Score:</span>
            <span className="text-xl font-bold text-green-600">{thriveScore}%</span>
          </div>
        </div>

        {/* Tabs */}
        {!compact && (
          <div className="mt-4">
            <nav className="flex space-x-8">
              {(['metrics', 'alerts', 'insights'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Metrics Tab */}
        {(activeTab === 'metrics' || compact) && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {metrics.map((metric) => (
                <div
                  key={metric.id}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-100"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600">{metric.label}</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {metric.value}
                        {metric.type === 'percentage' && '%'}
                        {metric.type === 'score' && '/100'}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getTrendIcon(metric.trend)}
                      <span className={`text-sm font-medium ${getChangeColor(metric.change, metric.type)}`}>
                        {metric.change > 0 ? '+' : ''}{metric.change}
                        {metric.type === 'percentage' && '%'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Alerts Tab */}
        {activeTab === 'alerts' && !compact && (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-100"
              >
                <div className="flex-shrink-0 mt-0.5">
                  {getAlertIcon(alert.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">{alert.title}</p>
                    <span className="text-xs text-gray-500">{formatTimeAgo(alert.timestamp)}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                  {alert.actionable && (
                    <button className="text-xs text-blue-600 hover:text-blue-800 font-medium mt-2">
                      Take Action →
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Insights Tab */}
        {activeTab === 'insights' && !compact && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-100">
              <div className="flex items-start">
                <SparklesIcon className="h-5 w-5 text-purple-600 mt-0.5 mr-3" />
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">AI Recommendations</h4>
                  <ul className="text-sm text-gray-700 mt-2 space-y-1">
                    <li>• Increase test coverage in authentication module to reduce deployment risks</li>
                    <li>• Consider implementing caching to improve API response times by ~30%</li>
                    <li>• Review security dependencies - 2 packages have known vulnerabilities</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                <h4 className="text-sm font-semibold text-green-900 mb-2">What's Working Well</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>✓ High code quality score (92/100)</li>
                  <li>✓ Fast deployment pipeline (4.2m avg)</li>
                  <li>✓ Strong test coverage (94%)</li>
                </ul>
              </div>

              <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-100">
                <h4 className="text-sm font-semibold text-yellow-900 mb-2">Areas for Improvement</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>⚠ Development velocity declining</li>
                  <li>⚠ Security review pending</li>
                  <li>⚠ Some tests failing</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Compact view summary */}
        {compact && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center text-gray-600">
                <ClockIcon className="h-4 w-4 mr-1" />
                Last updated: {new Date().toLocaleTimeString()}
              </div>
              <div className="flex items-center text-gray-600">
                <UsersIcon className="h-4 w-4 mr-1" />
                {metrics.find(m => m.id === 'collaborators')?.value} active
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InsightsPanel;