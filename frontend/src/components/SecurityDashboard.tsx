// Ref: CLAUDE.md - Enterprise Security Dashboard Component
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SecurityService,
  SecurityEvent,
  SecurityMetrics,
  ComplianceReport,
  securityService,
} from '../services/securityService';

interface SecurityDashboardProps {
  className?: string;
}

interface SecurityAlert {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: number;
  actions?: Array<{
    label: string;
    action: () => void;
    variant: 'primary' | 'secondary' | 'danger';
  }>;
}

export const SecurityDashboard: React.FC<SecurityDashboardProps> = ({
  className = '',
}) => {
  // State management
  const [activeTab, setActiveTab] = useState<'overview' | 'events' | 'compliance' | 'threats'>('overview');
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [recentEvents, setRecentEvents] = useState<SecurityEvent[]>([]);
  const [complianceReport, setComplianceReport] = useState<ComplianceReport | null>(null);
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds

  // Data fetching
  const fetchSecurityData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [metricsData, eventsData] = await Promise.all([
        securityService.getSecurityMetrics({
          start: Date.now() - 7 * 24 * 60 * 60 * 1000, // Last 7 days
          end: Date.now(),
        }),
        // Mock recent events query - in production would use audit logger
        Promise.resolve([
          {
            id: 'evt_1',
            type: 'authentication',
            severity: 'low',
            userId: 'user-123',
            userEmail: 'user@example.com',
            ipAddress: '192.168.1.100',
            userAgent: 'Mozilla/5.0...',
            timestamp: Date.now() - 60000,
            description: 'Successful user login',
            metadata: { success: true, method: 'password' },
            resolved: true,
          },
          {
            id: 'evt_2',
            type: 'rate_limit',
            severity: 'medium',
            ipAddress: '10.0.0.50',
            userAgent: 'Bot/1.0',
            timestamp: Date.now() - 120000,
            description: 'Rate limit exceeded for API endpoint',
            metadata: { endpoint: '/api/roadmaps', limit: 100, count: 150 },
            resolved: false,
          },
          {
            id: 'evt_3',
            type: 'suspicious_activity',
            severity: 'high',
            userId: 'user-456',
            userEmail: 'suspicious@domain.com',
            ipAddress: '203.0.113.42',
            userAgent: 'Unknown',
            timestamp: Date.now() - 300000,
            description: 'Multiple failed login attempts from unusual location',
            metadata: { attempts: 8, location: 'Unknown Country' },
            resolved: false,
          },
        ] as SecurityEvent[]),
      ]);

      setMetrics(metricsData);
      setRecentEvents(eventsData);

      // Check for critical alerts
      const criticalEvents = eventsData.filter(
        e => e.severity === 'critical' || e.severity === 'high'
      );

      if (criticalEvents.length > 0) {
        const alerts: SecurityAlert[] = criticalEvents.map(event => ({
          id: `alert_${event.id}`,
          type: event.severity === 'critical' ? 'error' : 'warning',
          title: `${event.type.replace('_', ' ').toUpperCase()} Alert`,
          message: event.description,
          timestamp: event.timestamp,
          actions: [
            {
              label: 'Investigate',
              action: () => handleInvestigateAlert(event.id),
              variant: 'primary',
            },
            {
              label: 'Dismiss',
              action: () => handleDismissAlert(`alert_${event.id}`),
              variant: 'secondary',
            },
          ],
        }));

        setSecurityAlerts(prev => {
          const existingIds = prev.map(a => a.id);
          const newAlerts = alerts.filter(a => !existingIds.includes(a.id));
          return [...prev, ...newAlerts];
        });
      }

      console.log('🔒 Security Dashboard: Data refreshed successfully');
    } catch (err) {
      console.error('Security Dashboard Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load security data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchComplianceData = useCallback(async () => {
    try {
      const report = await securityService.generateComplianceReport(
        'iso27001',
        {
          start: Date.now() - 30 * 24 * 60 * 60 * 1000, // Last 30 days
          end: Date.now(),
        },
        'security_dashboard'
      );
      setComplianceReport(report);
    } catch (err) {
      console.error('Compliance Report Error:', err);
    }
  }, []);

  // Effects
  useEffect(() => {
    fetchSecurityData();
    fetchComplianceData();
  }, [fetchSecurityData, fetchComplianceData]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchSecurityData, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchSecurityData]);

  // Event handlers
  const handleInvestigateAlert = (eventId: string) => {
    console.log(`🔍 Investigating security event: ${eventId}`);
    // In production, would navigate to detailed investigation view
  };

  const handleDismissAlert = (alertId: string) => {
    setSecurityAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const handleExportReport = async (format: 'json' | 'csv' | 'pdf') => {
    try {
      // Mock export functionality
      console.log(`📊 Exporting security report as ${format.toUpperCase()}`);

      const data = {
        metrics,
        events: recentEvents,
        compliance: complianceReport,
        exportedAt: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `security-report-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSecurityAlerts(prev => [...prev, {
        id: `export_${Date.now()}`,
        type: 'success',
        title: 'Report Exported',
        message: `Security report exported successfully as ${format.toUpperCase()}`,
        timestamp: Date.now(),
      }]);
    } catch (err) {
      console.error('Export Error:', err);
      setSecurityAlerts(prev => [...prev, {
        id: `export_error_${Date.now()}`,
        type: 'error',
        title: 'Export Failed',
        message: 'Failed to export security report',
        timestamp: Date.now(),
      }]);
    }
  };

  // Render helpers
  const renderSecurityMetric = (
    label: string,
    value: number,
    trend?: 'up' | 'down' | 'stable',
    isPercentage = false
  ) => (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-gray-300 text-sm font-medium">{label}</h3>
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
        {isPercentage ? `${value}%` : value.toLocaleString()}
      </div>
    </div>
  );

  const renderEventBadge = (severity: string) => {
    const colors = {
      low: 'bg-blue-900 text-blue-300',
      medium: 'bg-yellow-900 text-yellow-300',
      high: 'bg-orange-900 text-orange-300',
      critical: 'bg-red-900 text-red-300',
    };

    return (
      <span className={`px-2 py-1 text-xs rounded ${colors[severity as keyof typeof colors]}`}>
        {severity.toUpperCase()}
      </span>
    );
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Security Alerts */}
      <AnimatePresence>
        {securityAlerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-3"
          >
            <h3 className="text-lg font-semibold text-white mb-3">Active Security Alerts</h3>
            {securityAlerts.slice(0, 5).map(alert => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`p-4 rounded-lg border-l-4 ${
                  alert.type === 'error' ? 'bg-red-900/20 border-red-500' :
                  alert.type === 'warning' ? 'bg-yellow-900/20 border-yellow-500' :
                  alert.type === 'success' ? 'bg-green-900/20 border-green-500' :
                  'bg-blue-900/20 border-blue-500'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-white">{alert.title}</h4>
                    <p className="text-gray-300 text-sm mt-1">{alert.message}</p>
                    <p className="text-gray-500 text-xs mt-2">
                      {new Date(alert.timestamp).toLocaleString()}
                    </p>
                  </div>
                  {alert.actions && (
                    <div className="flex space-x-2 ml-4">
                      {alert.actions.map((action, index) => (
                        <button
                          key={index}
                          onClick={action.action}
                          className={`px-3 py-1 text-xs rounded ${
                            action.variant === 'primary' ? 'bg-blue-600 text-white hover:bg-blue-700' :
                            action.variant === 'danger' ? 'bg-red-600 text-white hover:bg-red-700' :
                            'bg-gray-600 text-gray-300 hover:bg-gray-700'
                          }`}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Metrics Grid */}
      {metrics && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Security Metrics (Last 7 Days)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {renderSecurityMetric(
              'Authentication Success',
              metrics.authenticationSuccess,
              'stable'
            )}
            {renderSecurityMetric(
              'Authentication Failures',
              metrics.authenticationFailures,
              metrics.authenticationFailures > 10 ? 'up' : 'down'
            )}
            {renderSecurityMetric(
              'Rate Limit Violations',
              metrics.rateLimitViolations,
              'down'
            )}
            {renderSecurityMetric(
              'Suspicious Activities',
              metrics.suspiciousActivities,
              metrics.suspiciousActivities > 0 ? 'up' : 'stable'
            )}
            {renderSecurityMetric(
              'Compliance Score',
              metrics.complianceScore,
              'stable',
              true
            )}
            {renderSecurityMetric(
              'Data Breach Attempts',
              metrics.dataBreachAttempts,
              metrics.dataBreachAttempts > 0 ? 'up' : 'stable'
            )}
          </div>
        </div>
      )}

      {/* Recent Events Summary */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Recent Security Events</h3>
        <div className="bg-gray-800 rounded-lg p-4">
          {recentEvents.length > 0 ? (
            <div className="space-y-3">
              {recentEvents.slice(0, 5).map(event => (
                <div key={event.id} className="flex items-center justify-between py-2 border-b border-gray-700 last:border-b-0">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      {renderEventBadge(event.severity)}
                      <span className="text-white font-medium">{event.type.replace('_', ' ')}</span>
                    </div>
                    <p className="text-gray-300 text-sm mt-1">{event.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-500 text-xs">
                      {new Date(event.timestamp).toLocaleString()}
                    </p>
                    {event.userEmail && (
                      <p className="text-gray-400 text-xs">{event.userEmail}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-4">No recent security events</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderEventsTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Security Events</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => handleExportReport('csv')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            Export CSV
          </button>
          <button
            onClick={fetchSecurityData}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Severity
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  User
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  IP Address
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {recentEvents.map(event => (
                <tr key={event.id} className="hover:bg-gray-750">
                  <td className="px-4 py-3 text-sm text-white">
                    {event.type.replace('_', ' ')}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {renderEventBadge(event.severity)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">
                    {event.description}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">
                    {event.userEmail || event.userId || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300 font-mono">
                    {event.ipAddress}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">
                    {new Date(event.timestamp).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        event.resolved
                          ? 'bg-green-900 text-green-300'
                          : 'bg-red-900 text-red-300'
                      }`}
                    >
                      {event.resolved ? 'Resolved' : 'Open'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderComplianceTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Compliance Dashboard</h3>
        <button
          onClick={() => handleExportReport('pdf')}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
        >
          Export Report
        </button>
      </div>

      {complianceReport && (
        <div className="space-y-6">
          {/* Compliance Score */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-white mb-4">Overall Compliance Score</h4>
            <div className="flex items-center space-x-4">
              <div className="w-32 h-32 relative">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    fill="none"
                    stroke="rgb(55, 65, 81)"
                    strokeWidth="8"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    fill="none"
                    stroke={complianceReport.summary.complianceScore >= 80 ? 'rgb(34, 197, 94)' :
                            complianceReport.summary.complianceScore >= 60 ? 'rgb(251, 191, 36)' :
                            'rgb(239, 68, 68)'}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${(complianceReport.summary.complianceScore / 100) * 351.86} 351.86`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">
                    {complianceReport.summary.complianceScore}%
                  </span>
                </div>
              </div>
              <div className="flex-1">
                <h5 className="text-white font-medium mb-2">
                  {complianceReport.reportType.toUpperCase()} Compliance
                </h5>
                <p className="text-gray-300 text-sm mb-4">
                  Report generated on {new Date(complianceReport.generatedAt).toLocaleDateString()}
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-xs">Total Events</p>
                    <p className="text-white font-medium">{complianceReport.summary.totalEvents}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Security Incidents</p>
                    <p className="text-white font-medium">{complianceReport.summary.securityIncidents}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          {complianceReport.summary.recommendations.length > 0 && (
            <div className="bg-gray-800 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-white mb-4">Recommendations</h4>
              <div className="space-y-3">
                {complianceReport.summary.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0" />
                    <p className="text-gray-300">{recommendation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderThreatsTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-white">Threat Detection</h3>

      <div className="bg-gray-800 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-white mb-4">Real-Time Monitoring</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-600 rounded-full mx-auto mb-2 flex items-center justify-center">
              <span className="text-white text-2xl">✓</span>
            </div>
            <h5 className="text-white font-medium">System Status</h5>
            <p className="text-green-400 text-sm">Secure</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-yellow-600 rounded-full mx-auto mb-2 flex items-center justify-center">
              <span className="text-white text-2xl">⚠</span>
            </div>
            <h5 className="text-white font-medium">Active Threats</h5>
            <p className="text-yellow-400 text-sm">2 Detected</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-600 rounded-full mx-auto mb-2 flex items-center justify-center">
              <span className="text-white text-2xl">🛡</span>
            </div>
            <h5 className="text-white font-medium">Protection Level</h5>
            <p className="text-blue-400 text-sm">Maximum</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-white mb-4">Threat Intelligence</h4>
        <p className="text-gray-300 text-sm mb-4">
          Advanced threat detection powered by machine learning and behavioral analysis.
        </p>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-700 rounded">
            <span className="text-white">Anomaly Detection</span>
            <span className="text-green-400">Active</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-700 rounded">
            <span className="text-white">IP Reputation Checking</span>
            <span className="text-green-400">Active</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-700 rounded">
            <span className="text-white">Behavioral Analysis</span>
            <span className="text-green-400">Active</span>
          </div>
        </div>
      </div>
    </div>
  );

  // Loading and error states
  if (isLoading && !metrics) {
    return (
      <div className={`p-6 ${className}`} data-testid="security-dashboard-loading">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-6 ${className}`} data-testid="security-dashboard-error">
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-6">
          <h3 className="text-red-400 font-semibold mb-2">Security Dashboard Error</h3>
          <p className="text-red-300">{error}</p>
          <button
            onClick={fetchSecurityData}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 ${className}`} data-testid="security-dashboard">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Security Dashboard</h1>
          <p className="text-gray-400">Enterprise security monitoring and compliance</p>
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
          <button
            onClick={fetchSecurityData}
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
            { id: 'events', label: 'Security Events' },
            { id: 'compliance', label: 'Compliance' },
            { id: 'threats', label: 'Threat Detection' },
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
          {activeTab === 'events' && renderEventsTab()}
          {activeTab === 'compliance' && renderComplianceTab()}
          {activeTab === 'threats' && renderThreatsTab()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default SecurityDashboard;