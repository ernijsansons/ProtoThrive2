// Ref: CLAUDE.md - Enterprise Monitoring Dashboard Component
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MonitoringService,
  Metric,
  Alert,
  HealthCheck,
  SystemMetrics,
  ApplicationMetrics,
  LogEntry,
  monitoringService,
  monitoring,
} from '../services/monitoringService';

interface MonitoringDashboardProps {
  className?: string;
}

interface ChartData {
  labels: string[];
  values: number[];
  unit: string;
}

export const MonitoringDashboard: React.FC<MonitoringDashboardProps> = ({
  className = '',
}) => {
  // State management
  const [activeTab, setActiveTab] = useState<'overview' | 'metrics' | 'logs' | 'alerts' | 'health'>('overview');
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [applicationMetrics, setApplicationMetrics] = useState<ApplicationMetrics | null>(null);
  const [recentMetrics, setRecentMetrics] = useState<Map<string, ChartData>>(new Map());
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([]);
  const [recentLogs, setRecentLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | '7d'>('1h');

  // Data fetching
  const fetchMonitoringData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [sysMetrics, appMetrics, healthStatus] = await Promise.all([
        monitoringService.collectSystemMetrics(),
        monitoringService.collectApplicationMetrics(),
        monitoringService.getHealthStatus(),
      ]);

      setSystemMetrics(sysMetrics);
      setApplicationMetrics(appMetrics);
      setHealthChecks(healthStatus.checks);

      // Fetch recent metrics for charts
      const timeRangeMs = {
        '1h': 60 * 60 * 1000,
        '6h': 6 * 60 * 60 * 1000,
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
      };

      const metricsTimeRange = {
        from: Date.now() - timeRangeMs[timeRange],
        to: Date.now(),
      };

      const [cpuMetrics, memoryMetrics, responseTimeMetrics, errorRateMetrics] = await Promise.all([
        monitoringService.getMetrics('system_cpu_usage', {}, metricsTimeRange),
        monitoringService.getMetrics('system_memory_usage', {}, metricsTimeRange),
        monitoringService.getMetrics('response_time_avg', {}, metricsTimeRange),
        monitoringService.getMetrics('error_rate', {}, metricsTimeRange),
      ]);

      // Convert metrics to chart data
      const chartData = new Map<string, ChartData>();

      chartData.set('cpu', {
        labels: cpuMetrics.map(m => new Date(m.timestamp).toLocaleTimeString()),
        values: cpuMetrics.map(m => m.value),
        unit: '%',
      });

      chartData.set('memory', {
        labels: memoryMetrics.map(m => new Date(m.timestamp).toLocaleTimeString()),
        values: memoryMetrics.map(m => m.value),
        unit: '%',
      });

      chartData.set('responseTime', {
        labels: responseTimeMetrics.map(m => new Date(m.timestamp).toLocaleTimeString()),
        values: responseTimeMetrics.map(m => m.value),
        unit: 'ms',
      });

      chartData.set('errorRate', {
        labels: errorRateMetrics.map(m => new Date(m.timestamp).toLocaleTimeString()),
        values: errorRateMetrics.map(m => m.value),
        unit: '%',
      });

      setRecentMetrics(chartData);

      // Mock alerts and logs for demonstration
      setAlerts([
        {
          id: 'alert_1',
          name: 'High Response Time',
          description: 'Response time is above normal threshold',
          severity: 'medium',
          status: 'firing',
          createdAt: Date.now() - 300000,
          updatedAt: Date.now(),
          rule: {
            name: 'HighResponseTime',
            expr: 'response_time_avg > 1000',
            duration: 300000,
            labels: { severity: 'medium' },
            annotations: { description: 'Response time threshold exceeded' },
            enabled: true,
          },
          labels: { service: 'frontend', environment: 'production' },
          annotations: { runbook: 'https://docs.protothrive.com/runbooks/high-response-time' },
        },
      ]);

      setRecentLogs([
        {
          id: 'log_1',
          timestamp: Date.now() - 60000,
          level: 'info',
          message: 'User authentication successful',
          service: 'auth-service',
          tags: { environment: 'production', version: '1.0.0' },
          fields: { userId: 'user-123', duration: 150 },
        },
        {
          id: 'log_2',
          timestamp: Date.now() - 120000,
          level: 'warn',
          message: 'Rate limit threshold approaching',
          service: 'api-gateway',
          tags: { environment: 'production', version: '1.0.0' },
          fields: { endpoint: '/api/roadmaps', currentRate: 85, limit: 100 },
        },
        {
          id: 'log_3',
          timestamp: Date.now() - 180000,
          level: 'error',
          message: 'Database connection timeout',
          service: 'backend',
          tags: { environment: 'production', version: '1.0.0' },
          fields: { error: 'CONNECTION_TIMEOUT', duration: 5000 },
        },
      ]);

      console.log('📊 Monitoring Dashboard: Data refreshed successfully');
    } catch (err) {
      console.error('Monitoring Dashboard Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load monitoring data');
    } finally {
      setIsLoading(false);
    }
  }, [timeRange]);

  // Effects
  useEffect(() => {
    fetchMonitoringData();
  }, [fetchMonitoringData]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchMonitoringData, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchMonitoringData]);

  // Event handlers
  const handleResolveAlert = (alertId: string) => {
    monitoringService.resolveAlert(alertId);
    setAlerts(prev => prev.map(alert =>
      alert.id === alertId
        ? { ...alert, status: 'resolved' as const, resolvedAt: Date.now() }
        : alert
    ));
  };

  const handleExportMetrics = async (format: 'json' | 'csv') => {
    try {
      const data = {
        systemMetrics,
        applicationMetrics,
        charts: Object.fromEntries(recentMetrics),
        alerts,
        healthChecks,
        exportedAt: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `monitoring-data-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      await monitoring.info('Monitoring data exported', { format });
    } catch (err) {
      console.error('Export Error:', err);
      await monitoring.error('Failed to export monitoring data', { error: err });
    }
  };

  // Render helpers
  const renderMetricCard = (
    title: string,
    value: number | string,
    unit: string,
    trend?: 'up' | 'down' | 'stable',
    status?: 'good' | 'warning' | 'critical'
  ) => (
    <div
      className={`bg-gray-800 rounded-lg p-4 ${
        status === 'critical' ? 'border-l-4 border-red-500' :
        status === 'warning' ? 'border-l-4 border-yellow-500' :
        'border-l-4 border-green-500'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-gray-300 text-sm font-medium">{title}</h3>
        {trend && (
          <span
            className={`text-xs px-2 py-1 rounded ${
              trend === 'up' ? 'bg-red-900 text-red-300' :
              trend === 'down' ? 'bg-green-900 text-green-300' :
              'bg-gray-700 text-gray-300'
            }`}
          >
            {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-white">
        {typeof value === 'number' ? value.toLocaleString() : value} {unit}
      </div>
    </div>
  );

  const renderSimpleChart = (data: ChartData, title: string) => (
    <div className="bg-gray-800 rounded-lg p-4">
      <h3 className="text-white font-medium mb-4">{title}</h3>
      <div className="h-32 flex items-end space-x-1">
        {data.values.slice(-20).map((value, index) => (
          <div
            key={index}
            className="bg-blue-500 min-w-[4px] rounded-t"
            style={{
              height: `${Math.max(5, (value / Math.max(...data.values)) * 100)}%`,
              flex: 1,
            }}
            title={`${value.toFixed(1)} ${data.unit}`}
          />
        ))}
      </div>
      <div className="mt-2 text-gray-400 text-xs">
        Last: {data.values[data.values.length - 1]?.toFixed(1)} {data.unit}
      </div>
    </div>
  );

  const renderHealthStatus = (check: HealthCheck) => (
    <div
      key={check.name}
      className={`p-3 rounded border-l-4 ${
        check.status === 'healthy' ? 'bg-green-900/20 border-green-500' :
        check.status === 'degraded' ? 'bg-yellow-900/20 border-yellow-500' :
        'bg-red-900/20 border-red-500'
      }`}
    >
      <div className="flex items-center justify-between">
        <h4 className="text-white font-medium">{check.name}</h4>
        <span
          className={`px-2 py-1 text-xs rounded ${
            check.status === 'healthy' ? 'bg-green-600 text-white' :
            check.status === 'degraded' ? 'bg-yellow-600 text-white' :
            'bg-red-600 text-white'
          }`}
        >
          {check.status}
        </span>
      </div>
      <p className="text-gray-300 text-sm mt-1">
        Response time: {check.responseTime.toFixed(0)}ms
      </p>
      {check.message && (
        <p className="text-gray-400 text-xs mt-1">{check.message}</p>
      )}
    </div>
  );

  const renderLogLevel = (level: LogEntry['level']) => {
    const colors = {
      debug: 'bg-gray-600 text-gray-300',
      info: 'bg-blue-600 text-blue-300',
      warn: 'bg-yellow-600 text-yellow-300',
      error: 'bg-red-600 text-red-300',
      critical: 'bg-purple-600 text-purple-300',
    };

    return (
      <span className={`px-2 py-1 text-xs rounded ${colors[level]}`}>
        {level.toUpperCase()}
      </span>
    );
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* System Overview */}
      {systemMetrics && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">System Metrics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {renderMetricCard(
              'CPU Usage',
              systemMetrics.cpu.usage.toFixed(1),
              '%',
              systemMetrics.cpu.usage > 80 ? 'up' : 'stable',
              systemMetrics.cpu.usage > 90 ? 'critical' : systemMetrics.cpu.usage > 80 ? 'warning' : 'good'
            )}
            {renderMetricCard(
              'Memory Usage',
              systemMetrics.memory.percentage.toFixed(1),
              '%',
              systemMetrics.memory.percentage > 80 ? 'up' : 'stable',
              systemMetrics.memory.percentage > 90 ? 'critical' : systemMetrics.memory.percentage > 80 ? 'warning' : 'good'
            )}
            {renderMetricCard(
              'Network I/O',
              (systemMetrics.network.bytesIn / (1024 * 1024)).toFixed(1),
              'MB/s',
              'stable',
              'good'
            )}
            {renderMetricCard(
              'Uptime',
              Math.floor(systemMetrics.uptime / (60 * 60 * 1000)),
              'hours',
              'stable',
              'good'
            )}
          </div>
        </div>
      )}

      {/* Application Overview */}
      {applicationMetrics && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Application Metrics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {renderMetricCard(
              'Success Rate',
              ((applicationMetrics.requests.success / applicationMetrics.requests.total) * 100).toFixed(1),
              '%',
              'stable',
              applicationMetrics.errors.errorRate > 5 ? 'critical' : applicationMetrics.errors.errorRate > 2 ? 'warning' : 'good'
            )}
            {renderMetricCard(
              'Avg Response Time',
              applicationMetrics.requests.averageResponseTime,
              'ms',
              applicationMetrics.requests.averageResponseTime > 1000 ? 'up' : 'stable',
              applicationMetrics.requests.averageResponseTime > 2000 ? 'critical' : applicationMetrics.requests.averageResponseTime > 1000 ? 'warning' : 'good'
            )}
            {renderMetricCard(
              'Active Users',
              applicationMetrics.users.active,
              'users',
              'stable',
              'good'
            )}
            {renderMetricCard(
              'Error Rate',
              applicationMetrics.errors.errorRate.toFixed(1),
              '%',
              applicationMetrics.errors.errorRate > 2 ? 'up' : 'down',
              applicationMetrics.errors.errorRate > 5 ? 'critical' : applicationMetrics.errors.errorRate > 2 ? 'warning' : 'good'
            )}
          </div>
        </div>
      )}

      {/* Charts */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Performance Trends</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recentMetrics.get('cpu') && renderSimpleChart(recentMetrics.get('cpu')!, 'CPU Usage')}
          {recentMetrics.get('memory') && renderSimpleChart(recentMetrics.get('memory')!, 'Memory Usage')}
          {recentMetrics.get('responseTime') && renderSimpleChart(recentMetrics.get('responseTime')!, 'Response Time')}
          {recentMetrics.get('errorRate') && renderSimpleChart(recentMetrics.get('errorRate')!, 'Error Rate')}
        </div>
      </div>
    </div>
  );

  const renderHealthTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Health Checks</h3>
        <button
          onClick={fetchMonitoringData}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      <div className="space-y-4">
        {healthChecks.map(renderHealthStatus)}
      </div>

      {healthChecks.length === 0 && (
        <div className="text-center text-gray-400 py-8">
          No health checks configured
        </div>
      )}
    </div>
  );

  const renderAlertsTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Active Alerts</h3>
        <button
          onClick={() => handleExportMetrics('json')}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
        >
          Export
        </button>
      </div>

      <div className="space-y-3">
        {alerts.map(alert => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`p-4 rounded border-l-4 ${
              alert.severity === 'critical' ? 'bg-red-900/20 border-red-500' :
              alert.severity === 'high' ? 'bg-orange-900/20 border-orange-500' :
              alert.severity === 'medium' ? 'bg-yellow-900/20 border-yellow-500' :
              'bg-blue-900/20 border-blue-500'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h4 className="text-white font-medium">{alert.name}</h4>
                  <span
                    className={`px-2 py-1 text-xs rounded ${
                      alert.severity === 'critical' ? 'bg-red-600 text-white' :
                      alert.severity === 'high' ? 'bg-orange-600 text-white' :
                      alert.severity === 'medium' ? 'bg-yellow-600 text-black' :
                      'bg-blue-600 text-white'
                    }`}
                  >
                    {alert.severity.toUpperCase()}
                  </span>
                  <span
                    className={`px-2 py-1 text-xs rounded ${
                      alert.status === 'firing' ? 'bg-red-900 text-red-300' :
                      alert.status === 'resolved' ? 'bg-green-900 text-green-300' :
                      'bg-gray-900 text-gray-300'
                    }`}
                  >
                    {alert.status.toUpperCase()}
                  </span>
                </div>
                <p className="text-gray-300 text-sm mb-2">{alert.description}</p>
                <p className="text-gray-500 text-xs">
                  Created: {new Date(alert.createdAt).toLocaleString()}
                </p>
                {alert.resolvedAt && (
                  <p className="text-gray-500 text-xs">
                    Resolved: {new Date(alert.resolvedAt).toLocaleString()}
                  </p>
                )}
              </div>
              {alert.status === 'firing' && (
                <button
                  onClick={() => handleResolveAlert(alert.id)}
                  className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                >
                  Resolve
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {alerts.length === 0 && (
        <div className="text-center text-gray-400 py-8">
          No active alerts
        </div>
      )}
    </div>
  );

  const renderLogsTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Recent Logs</h3>
        <div className="flex space-x-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-3 py-1 bg-gray-700 text-white rounded text-sm"
          >
            <option value="1h">Last Hour</option>
            <option value="6h">Last 6 Hours</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
          </select>
          <button
            onClick={fetchMonitoringData}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg overflow-hidden">
        <div className="max-h-96 overflow-y-auto">
          {recentLogs.map(log => (
            <div key={log.id} className="border-b border-gray-700 p-3 hover:bg-gray-800">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  {renderLogLevel(log.level)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="text-white font-medium">{log.service}</span>
                    <span className="text-gray-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-gray-300 text-sm mt-1">{log.message}</p>
                  {Object.keys(log.fields).length > 0 && (
                    <div className="mt-2 text-xs text-gray-400">
                      {Object.entries(log.fields).map(([key, value]) => (
                        <span key={key} className="mr-4">
                          {key}: {String(value)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {recentLogs.length === 0 && (
        <div className="text-center text-gray-400 py-8">
          No logs found for the selected time range
        </div>
      )}
    </div>
  );

  // Loading and error states
  if (isLoading && !systemMetrics) {
    return (
      <div className={`p-6 ${className}`} data-testid="monitoring-dashboard-loading">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-6 ${className}`} data-testid="monitoring-dashboard-error">
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-6">
          <h3 className="text-red-400 font-semibold mb-2">Monitoring Dashboard Error</h3>
          <p className="text-red-300">{error}</p>
          <button
            onClick={fetchMonitoringData}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 ${className}`} data-testid="monitoring-dashboard">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Monitoring Dashboard</h1>
          <p className="text-gray-400">Enterprise observability and performance monitoring</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-gray-300 text-sm">Auto-refresh</label>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`w-12 h-6 rounded-full ${
                autoRefresh ? 'bg-blue-600' : 'bg-gray-600'
              } relative transition-colors`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                  autoRefresh ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
          <select
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
            className="px-3 py-1 bg-gray-700 text-white rounded text-sm"
          >
            <option value={10000}>10s</option>
            <option value={30000}>30s</option>
            <option value={60000}>1m</option>
            <option value={300000}>5m</option>
          </select>
          <button
            onClick={fetchMonitoringData}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            disabled={isLoading}
          >
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-700 mb-6">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'metrics', label: 'Metrics' },
            { id: 'logs', label: 'Logs' },
            { id: 'alerts', label: 'Alerts' },
            { id: 'health', label: 'Health' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              {tab.label}
              {tab.id === 'alerts' && alerts.filter(a => a.status === 'firing').length > 0 && (
                <span className="ml-1 px-1 py-0.5 bg-red-600 text-white text-xs rounded">
                  {alerts.filter(a => a.status === 'firing').length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'health' && renderHealthTab()}
          {activeTab === 'alerts' && renderAlertsTab()}
          {activeTab === 'logs' && renderLogsTab()}
          {activeTab === 'metrics' && renderOverviewTab()} {/* Reuse overview for now */}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default MonitoringDashboard;