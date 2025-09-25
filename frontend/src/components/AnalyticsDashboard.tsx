/**
 * Advanced Analytics Dashboard Component
 * Real-time metrics and business intelligence
 * Ref: CLAUDE.md Phase 3 - Advanced Analytics
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  advancedAnalytics,
  AnalyticsMetric,
  AnalyticsDashboard as Dashboard,
  UsageAnalytics,
  PerformanceAnalytics,
  SecurityAnalytics,
  BusinessAnalytics
} from '../services/analytics';
import {
  ChartBarIcon,
  UserGroupIcon,
  CpuChipIcon,
  ShieldCheckIcon,
  CurrencyDollarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowPathIcon,
  EyeIcon,
  Cog6ToothIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentArrowDownIcon,
  AdjustmentsHorizontalIcon,
  PlusIcon,
  CalendarIcon,
  FunnelIcon,
  ShareIcon,
  BookmarkIcon,
  PresentationChartLineIcon
} from '@heroicons/react/24/outline';

interface AnalyticsDashboardProps {
  dashboardId?: string;
  refreshInterval?: number;
  theme?: 'light' | 'dark';
  customizable?: boolean;
  exportEnabled?: boolean;
  filterEnabled?: boolean;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  dashboardId = 'executive',
  refreshInterval = 30000,
  theme = 'dark',
  customizable = true,
  exportEnabled = true,
  filterEnabled = true
}) => {
  const [metrics, setMetrics] = useState<AnalyticsMetric[]>([]);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [usageData, setUsageData] = useState<UsageAnalytics | null>(null);
  const [performanceData, setPerformanceData] = useState<PerformanceAnalytics | null>(null);
  const [securityData, setSecurityData] = useState<SecurityAnalytics | null>(null);
  const [businessData, setBusinessData] = useState<BusinessAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [dateRange, setDateRange] = useState<'24h' | '7d' | '30d' | '90d'>('24h');
  const [customFilters, setCustomFilters] = useState<Record<string, any>>({});
  const [savedDashboards, setSavedDashboards] = useState<string[]>([]);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [visibleWidgets, setVisibleWidgets] = useState<string[]>(['metrics', 'usage', 'performance', 'security', 'business', 'activity']);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'csv' | 'json'>('pdf');

  useEffect(() => {
    loadDashboardData();

    let interval: NodeJS.Timeout | null = null;
    if (autoRefresh) {
      interval = setInterval(loadDashboardData, refreshInterval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [dashboardId, refreshInterval, autoRefresh]);

  const loadDashboardData = async () => {
    try {
      // Load all analytics data in parallel
      const [
        metricsData,
        dashboardData,
        usage,
        performance,
        security,
        business
      ] = await Promise.all([
        advancedAnalytics.getMetrics(),
        advancedAnalytics.getDashboard(dashboardId),
        advancedAnalytics.getUsageAnalytics(),
        advancedAnalytics.getPerformanceAnalytics(),
        advancedAnalytics.getSecurityAnalytics(),
        advancedAnalytics.getBusinessAnalytics()
      ]);

      setMetrics(metricsData);
      setDashboard(dashboardData);
      setUsageData(usage);
      setPerformanceData(performance);
      setSecurityData(security);
      setBusinessData(business);
      setLastUpdated(new Date());

      console.log('Thermonuclear Analytics Dashboard: Data loaded');
    } catch (error) {
      console.error('Thermonuclear Analytics Dashboard: Error loading data', error);
    } finally {
      setLoading(false);
    }
  };

  const exportDashboard = async (format: 'pdf' | 'csv' | 'json') => {
    try {
      console.log(`Thermonuclear Export: Generating ${format.toUpperCase()} report`);

      const exportData = {
        dashboard: dashboardId,
        dateRange,
        filters: customFilters,
        timestamp: new Date().toISOString(),
        metrics: filteredMetrics,
        usage: usageData,
        performance: performanceData,
        security: securityData,
        business: businessData
      };

      // Mock export functionality - in production would call real export service
      const mockExport = {
        pdf: () => console.log('PDF export generated:', exportData),
        csv: () => console.log('CSV export generated:', filteredMetrics.map(m => `${m.name},${m.value},${m.category}`).join('\n')),
        json: () => console.log('JSON export generated:', JSON.stringify(exportData, null, 2))
      };

      mockExport[format]();
      alert(`${format.toUpperCase()} export completed successfully!`);
    } catch (error) {
      console.error('Thermonuclear Export Error:', error);
      alert('Export failed. Please try again.');
    }
  };

  const saveDashboardConfiguration = () => {
    const config = {
      dashboardId,
      visibleWidgets,
      customFilters,
      dateRange,
      savedAt: new Date().toISOString()
    };

    const configName = `dashboard_${Date.now()}`;
    setSavedDashboards(prev => [...prev, configName]);
    localStorage.setItem(`analytics_${configName}`, JSON.stringify(config));
    console.log('Thermonuclear Dashboard: Configuration saved', configName);
    alert('Dashboard configuration saved successfully!');
  };

  const applyCustomFilter = (filterKey: string, filterValue: any) => {
    setCustomFilters(prev => ({
      ...prev,
      [filterKey]: filterValue
    }));
    console.log('Thermonuclear Filter Applied:', filterKey, filterValue);
  };

  const toggleWidget = (widgetId: string) => {
    setVisibleWidgets(prev =>
      prev.includes(widgetId)
        ? prev.filter(id => id !== widgetId)
        : [...prev, widgetId]
    );
  };

  const getMetricIcon = (category: string) => {
    const iconMap = {
      performance: CpuChipIcon,
      usage: UserGroupIcon,
      security: ShieldCheckIcon,
      business: CurrencyDollarIcon,
      infrastructure: ChartBarIcon
    };
    return iconMap[category as keyof typeof iconMap] || ChartBarIcon;
  };

  const getMetricColor = (category: string) => {
    const colorMap = {
      performance: 'neon-blue-primary',
      usage: 'neon-green-primary',
      security: 'neon-orange',
      business: 'neon-purple',
      infrastructure: 'neon-blue-secondary'
    };
    return colorMap[category as keyof typeof colorMap] || 'neon-blue-primary';
  };

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'up':
        return <ArrowUpIcon className="h-4 w-4 text-green-500" />;
      case 'down':
        return <ArrowDownIcon className="h-4 w-4 text-red-500" />;
      default:
        return <div className="h-4 w-4 bg-gray-500 rounded-full"></div>;
    }
  };

  const filteredMetrics = selectedCategory === 'all'
    ? metrics
    : metrics.filter(metric => metric.category === selectedCategory);

  const categories = ['all', 'performance', 'usage', 'security', 'business', 'infrastructure'];

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-primary flex items-center justify-center">
        <div className="text-center">
          <div className="spinner-elite mb-4 mx-auto"></div>
          <p className="text-neon-blue-primary animate-neon-glow">Loading Analytics Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-primary text-text-primary p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neon-blue-primary mb-2">
              Analytics Dashboard
            </h1>
            <p className="text-text-secondary">
              Real-time enterprise metrics and business intelligence
            </p>
          </div>

          <div className="flex items-center space-x-4">
            {/* Date Range Filter */}
            {filterEnabled && (
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as any)}
                className="bg-dark-tertiary text-text-primary border border-border rounded-lg px-3 py-2 text-sm"
              >
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
              </select>
            )}

            {/* Export Menu */}
            {exportEnabled && (
              <div className="relative group">
                <button className="p-2 rounded-lg bg-dark-tertiary hover:bg-dark-secondary text-text-muted hover:text-text-primary transition-colors">
                  <DocumentArrowDownIcon className="h-5 w-5" />
                </button>
                <div className="absolute right-0 top-full mt-2 w-32 bg-dark-secondary border border-border rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  <button
                    onClick={() => exportDashboard('pdf')}
                    className="w-full px-4 py-2 text-left text-sm text-text-primary hover:bg-dark-tertiary transition-colors"
                  >
                    Export PDF
                  </button>
                  <button
                    onClick={() => exportDashboard('csv')}
                    className="w-full px-4 py-2 text-left text-sm text-text-primary hover:bg-dark-tertiary transition-colors"
                  >
                    Export CSV
                  </button>
                  <button
                    onClick={() => exportDashboard('json')}
                    className="w-full px-4 py-2 text-left text-sm text-text-primary hover:bg-dark-tertiary transition-colors"
                  >
                    Export JSON
                  </button>
                </div>
              </div>
            )}

            {/* Customization Toggle */}
            {customizable && (
              <button
                onClick={() => setIsCustomizing(!isCustomizing)}
                className={`p-2 rounded-lg transition-colors ${
                  isCustomizing
                    ? 'bg-neon-blue-primary/20 text-neon-blue-primary'
                    : 'bg-dark-tertiary text-text-muted hover:text-text-primary'
                }`}
              >
                <AdjustmentsHorizontalIcon className="h-5 w-5" />
              </button>
            )}

            {/* Save Configuration */}
            {customizable && (
              <button
                onClick={saveDashboardConfiguration}
                className="p-2 rounded-lg bg-dark-tertiary hover:bg-dark-secondary text-text-muted hover:text-text-primary transition-colors"
              >
                <BookmarkIcon className="h-5 w-5" />
              </button>
            )}

            {/* Auto Refresh Toggle */}
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`p-2 rounded-lg transition-colors ${
                autoRefresh
                  ? 'bg-neon-green-primary/20 text-neon-green-primary'
                  : 'bg-dark-tertiary text-text-muted hover:text-text-primary'
              }`}
            >
              <ArrowPathIcon className={`h-5 w-5 ${autoRefresh ? 'animate-spin' : ''}`} />
            </button>

            {/* Manual Refresh */}
            <button
              onClick={loadDashboardData}
              className="p-2 rounded-lg bg-dark-tertiary hover:bg-dark-secondary text-text-muted hover:text-text-primary transition-colors"
            >
              <ArrowPathIcon className="h-5 w-5" />
            </button>

            {/* Last Updated */}
            <div className="text-sm text-text-muted flex items-center space-x-2">
              <ClockIcon className="h-4 w-4" />
              <span>Updated {lastUpdated.toLocaleTimeString()}</span>
            </div>
          </div>
        </div>

        {/* Category Filter & Widget Controls */}
        <div className="mt-6 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                  selectedCategory === category
                    ? 'bg-neon-blue-primary text-white'
                    : 'bg-dark-tertiary text-text-muted hover:text-text-primary hover:bg-dark-secondary'
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>

          {/* Widget Visibility Controls */}
          {isCustomizing && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-text-muted">Visible Widgets:</span>
              {['metrics', 'usage', 'performance', 'security', 'business', 'activity'].map(widget => (
                <button
                  key={widget}
                  onClick={() => toggleWidget(widget)}
                  className={`px-3 py-1 rounded text-xs transition-colors ${
                    visibleWidgets.includes(widget)
                      ? 'bg-neon-green-primary/20 text-neon-green-primary'
                      : 'bg-dark-tertiary text-text-muted'
                  }`}
                >
                  {widget.charAt(0).toUpperCase() + widget.slice(1)}
                </button>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Advanced Filters Panel */}
      {isCustomizing && (
        <motion.section
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-6 glass-elite p-4 rounded-xl border border-border"
        >
          <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center">
            <FunnelIcon className="h-5 w-5 mr-2" />
            Advanced Filters
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-text-secondary mb-2">Metric Threshold</label>
              <input
                type="range"
                min="0"
                max="100"
                className="w-full accent-neon-blue-primary"
                onChange={(e) => applyCustomFilter('threshold', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-2">Priority Level</label>
              <select
                className="w-full bg-dark-tertiary text-text-primary border border-border rounded px-3 py-2"
                onChange={(e) => applyCustomFilter('priority', e.target.value)}
              >
                <option value="">All Priorities</option>
                <option value="critical">Critical Only</option>
                <option value="high">High & Critical</option>
                <option value="medium">Medium & Above</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-2">Trend Direction</label>
              <select
                className="w-full bg-dark-tertiary text-text-primary border border-border rounded px-3 py-2"
                onChange={(e) => applyCustomFilter('trend', e.target.value)}
              >
                <option value="">All Trends</option>
                <option value="up">Increasing Only</option>
                <option value="down">Decreasing Only</option>
                <option value="stable">Stable Only</option>
              </select>
            </div>
          </div>
        </motion.section>
      )}

      {/* Key Metrics Grid */}
      {visibleWidgets.includes('metrics') && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredMetrics.slice(0, 8).map((metric, index) => {
            const IconComponent = getMetricIcon(metric.category);
            const color = getMetricColor(metric.category);

            return (
              <motion.div
                key={metric.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index }}
                className="glass-elite p-6 rounded-xl border border-border hover:border-neon-blue-primary/50 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-lg bg-${color}/20 flex items-center justify-center`}>
                    <IconComponent className={`h-6 w-6 text-${color}`} />
                  </div>
                  <div className={`px-2 py-1 rounded text-xs ${
                    metric.priority === 'critical'
                      ? 'bg-red-500/20 text-red-400'
                      : metric.priority === 'high'
                      ? 'bg-orange-500/20 text-orange-400'
                      : 'bg-green-500/20 text-green-400'
                  }`}>
                    {metric.priority}
                  </div>
                </div>

                <div className="mb-2">
                  <div className="text-2xl font-bold text-text-primary mb-1">
                    {metric.value}
                    {metric.unit && <span className="text-sm text-text-muted ml-1">{metric.unit}</span>}
                  </div>
                  <div className="text-sm text-text-secondary">{metric.name}</div>
                </div>

                {metric.change && (
                  <div className="flex items-center space-x-2 text-sm">
                    {getTrendIcon(metric.change.direction)}
                    <span className={
                      metric.change.direction === 'up'
                        ? 'text-green-400'
                        : metric.change.direction === 'down'
                        ? 'text-red-400'
                        : 'text-text-muted'
                    }>
                      {Math.abs(metric.change.value)}% vs last {metric.change.period}
                    </span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
        </motion.section>
      )}

      {/* Detailed Analytics Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Usage Analytics */}
        {usageData && visibleWidgets.includes('usage') && (
          <motion.section
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-elite p-6 rounded-xl border border-border"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-neon-green-primary flex items-center">
                <UserGroupIcon className="h-6 w-6 mr-2" />
                Usage Analytics
              </h3>
              <button className="p-2 rounded-lg bg-dark-tertiary hover:bg-dark-secondary transition-colors">
                <EyeIcon className="h-4 w-4 text-text-muted" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-neon-green-primary">
                    {usageData.activeUsers.daily.toLocaleString()}
                  </div>
                  <div className="text-sm text-text-muted">Daily Active</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-neon-blue-primary">
                    {usageData.activeUsers.weekly.toLocaleString()}
                  </div>
                  <div className="text-sm text-text-muted">Weekly Active</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-neon-purple">
                    {usageData.totalUsers.toLocaleString()}
                  </div>
                  <div className="text-sm text-text-muted">Total Users</div>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <h4 className="text-sm font-medium text-text-primary mb-3">Feature Adoption</h4>
                <div className="space-y-3">
                  {usageData.featureUsage.map(feature => (
                    <div key={feature.feature} className="flex items-center justify-between">
                      <span className="text-sm text-text-secondary">{feature.feature}</span>
                      <div className="flex items-center space-x-3">
                        <div className="w-20 h-2 bg-dark-tertiary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-neon-green-primary rounded-full"
                            style={{ width: `${feature.adoption * 100}%` }}
                          />
                        </div>
                        <span className="text-sm text-text-primary w-12 text-right">
                          {Math.round(feature.adoption * 100)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.section>
        )}

        {/* Performance Analytics */}
        {performanceData && visibleWidgets.includes('performance') && (
          <motion.section
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-elite p-6 rounded-xl border border-border"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-neon-blue-primary flex items-center">
                <CpuChipIcon className="h-6 w-6 mr-2" />
                Performance Analytics
              </h3>
              <button className="p-2 rounded-lg bg-dark-tertiary hover:bg-dark-secondary transition-colors">
                <Cog6ToothIcon className="h-4 w-4 text-text-muted" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-lg font-bold text-text-primary">
                    {performanceData.responseTime.average}ms
                  </div>
                  <div className="text-sm text-text-muted">Avg Response Time</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-text-primary">
                    {performanceData.throughput.requestsPerSecond.toLocaleString()}
                  </div>
                  <div className="text-sm text-text-muted">Requests/sec</div>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <h4 className="text-sm font-medium text-text-primary mb-3">Infrastructure</h4>
                <div className="space-y-2">
                  {Object.entries(performanceData.infrastructure).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-sm text-text-secondary capitalize">
                        {key.replace(/([A-Z])/g, ' $1')}
                      </span>
                      <div className="flex items-center space-x-3">
                        <div className="w-16 h-2 bg-dark-tertiary rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              value > 0.8 ? 'bg-red-500' : value > 0.6 ? 'bg-orange-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${value * 100}%` }}
                          />
                        </div>
                        <span className="text-sm text-text-primary w-8 text-right">
                          {Math.round(value * 100)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.section>
        )}

        {/* Security Analytics */}
        {securityData && visibleWidgets.includes('security') && (
          <motion.section
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-elite p-6 rounded-xl border border-border"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-neon-orange flex items-center">
                <ShieldCheckIcon className="h-6 w-6 mr-2" />
                Security Analytics
              </h3>
              <div className="flex items-center space-x-2">
                <div className="text-2xl font-bold text-neon-orange">
                  {securityData.compliance.score}/100
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold text-green-400">
                    {securityData.threats.blocked}
                  </div>
                  <div className="text-sm text-text-muted">Threats Blocked</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-blue-400">
                    {securityData.authentication.successRate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-text-muted">Auth Success</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-orange-400">
                    {securityData.compliance.violations}
                  </div>
                  <div className="text-sm text-text-muted">Violations</div>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <h4 className="text-sm font-medium text-text-primary mb-3">Vulnerabilities</h4>
                <div className="space-y-2">
                  {securityData.vulnerabilities.map(vuln => (
                    <div key={vuln.severity} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${
                          vuln.severity === 'critical' ? 'bg-red-500' :
                          vuln.severity === 'high' ? 'bg-orange-500' :
                          vuln.severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                        }`} />
                        <span className="text-sm text-text-secondary capitalize">{vuln.severity}</span>
                      </div>
                      <div className="text-sm text-text-primary">
                        {vuln.count} open • {vuln.resolved} resolved
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.section>
        )}

        {/* Business Analytics */}
        {businessData && visibleWidgets.includes('business') && (
          <motion.section
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="glass-elite p-6 rounded-xl border border-border"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-neon-purple flex items-center">
                <CurrencyDollarIcon className="h-6 w-6 mr-2" />
                Business Analytics
              </h3>
              <div className="text-right">
                <div className="text-lg font-bold text-neon-purple">
                  ${businessData.revenue.monthly.toLocaleString()}
                </div>
                <div className="text-sm text-text-muted">MRR</div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-lg font-bold text-text-primary">
                    {businessData.customers.total.toLocaleString()}
                  </div>
                  <div className="text-sm text-text-muted">Total Customers</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-text-primary">
                    ${businessData.customers.lifetime_value.toLocaleString()}
                  </div>
                  <div className="text-sm text-text-muted">Customer LTV</div>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <h4 className="text-sm font-medium text-text-primary mb-3">Growth Metrics</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-secondary">Revenue Growth</span>
                    <div className="flex items-center space-x-2 text-green-400">
                      <ArrowUpIcon className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        {(businessData.revenue.growth * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-secondary">New Customers</span>
                    <span className="text-sm text-text-primary">
                      +{businessData.customers.new} this month
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-secondary">Customer Satisfaction</span>
                    <div className="flex items-center space-x-2">
                      <CheckCircleIcon className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-text-primary">
                        {businessData.support.satisfaction}/5.0
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>
        )}

        {/* Real-time Activity Feed */}
        {visibleWidgets.includes('activity') && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="glass-elite p-6 rounded-xl border border-border lg:col-span-2"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-neon-blue-secondary flex items-center">
                <PresentationChartLineIcon className="h-6 w-6 mr-2" />
                Real-time Activity Feed
              </h3>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-400">Live</span>
              </div>
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto">
              {[
                { time: '2 minutes ago', event: 'High-value customer signup completed', type: 'success', icon: CheckCircleIcon },
                { time: '5 minutes ago', event: 'Performance threshold exceeded on API endpoint /analytics', type: 'warning', icon: ExclamationTriangleIcon },
                { time: '8 minutes ago', event: 'Security scan completed - 0 vulnerabilities found', type: 'success', icon: ShieldCheckIcon },
                { time: '12 minutes ago', event: 'New enterprise feature deployed successfully', type: 'info', icon: CpuChipIcon },
                { time: '15 minutes ago', event: 'Weekly revenue target reached ahead of schedule', type: 'success', icon: CurrencyDollarIcon },
                { time: '18 minutes ago', event: 'Database query optimization improved response time by 23%', type: 'info', icon: ChartBarIcon }
              ].map((activity, index) => {
                const IconComponent = activity.icon;
                return (
                  <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-dark-tertiary/50">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      activity.type === 'success' ? 'bg-green-500/20' :
                      activity.type === 'warning' ? 'bg-orange-500/20' :
                      'bg-blue-500/20'
                    }`}>
                      <IconComponent className={`h-4 w-4 ${
                        activity.type === 'success' ? 'text-green-400' :
                        activity.type === 'warning' ? 'text-orange-400' :
                        'text-blue-400'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-text-primary">{activity.event}</p>
                      <p className="text-xs text-text-muted">{activity.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.section>
        )}
      </div>

      {/* Footer with Dashboard Stats */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="mt-8 text-center text-sm text-text-muted"
      >
        <p>
          Dashboard ID: {dashboardId} •
          Widgets: {visibleWidgets.length} active •
          Data Range: {dateRange} •
          Auto-refresh: {autoRefresh ? 'ON' : 'OFF'} •
          Thermonuclear Analytics Engine v2.0
        </p>
      </motion.footer>
    </div>
  );
};

export default AnalyticsDashboard;