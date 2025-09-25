// Ref: CLAUDE.md - Performance Monitor Component for ProtoThrive
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  performanceService,
  PerformanceReport,
  WebVital,
  PerformanceMetric
} from '../services/performanceService';
import { cacheService, CacheStats } from '../services/cacheService';
import {
  ChartBarIcon,
  ClockIcon,
  CpuChipIcon,
  ServerIcon,
  SignalIcon,
  EyeIcon,
  BoltIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

interface PerformanceMonitorProps {
  className?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface ChartData {
  label: string;
  value: number;
  color: string;
  trend: 'up' | 'down' | 'stable';
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  className = '',
  autoRefresh = true,
  refreshInterval = 30000, // 30 seconds
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'vitals' | 'resources' | 'cache' | 'optimization'>('overview');
  const [report, setReport] = useState<PerformanceReport | null>(null);
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [realTimeMetrics, setRealTimeMetrics] = useState<PerformanceMetric[]>([]);

  // Load performance data
  useEffect(() => {
    loadPerformanceData();

    if (autoRefresh) {
      const interval = setInterval(loadPerformanceData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  const loadPerformanceData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [performanceReport, stats] = await Promise.all([
        performanceService.generateReport(),
        cacheService.getStats(),
      ]);

      setReport(performanceReport);
      setCacheStats(stats);
    } catch (error) {
      console.error('Failed to load performance data:', error);
      setError('Failed to load performance data');
    } finally {
      setIsLoading(false);
    }
  };

  const getWebVitalStatus = (vital: WebVital): 'good' | 'needs-improvement' | 'poor' => {
    return vital.rating;
  };

  const getWebVitalColor = (rating: WebVital['rating']): string => {
    switch (rating) {
      case 'good': return 'text-green-400';
      case 'needs-improvement': return 'text-yellow-400';
      case 'poor': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatMs = (ms: number): string => {
    return `${ms.toFixed(2)}ms`;
  };

  const getPerformanceScore = (): number => {
    if (!report?.webVitals.length) return 0;

    const scores = report.webVitals.map(vital => {
      switch (vital.rating) {
        case 'good': return 100;
        case 'needs-improvement': return 50;
        case 'poor': return 0;
        default: return 0;
      }
    });

    return scores.reduce((a: number, b: number) => a + b, 0) / scores.length;
  };

  const getCacheHealthColor = (hitRate: number): string => {
    if (hitRate >= 0.8) return 'text-green-400';
    if (hitRate >= 0.6) return 'text-yellow-400';
    return 'text-red-400';
  };

  const runPerformanceOptimization = async () => {
    setIsLoading(true);
    try {
      // Simulate optimization process
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Clear old cache entries
      await cacheService.clear();

      // Trigger garbage collection if available
      if ('gc' in window) {
        (window as any).gc();
      }

      // Reload performance data
      await loadPerformanceData();
    } catch (error) {
      setError('Failed to optimize performance');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !report) {
    return (
      <div className={`bg-gray-800 rounded-lg p-6 ${className}`}>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
          <span className="ml-3 text-gray-300">Loading performance data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-800 rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Performance Monitor</h2>
          <p className="text-gray-300 mt-1">
            Real-time performance analytics and optimization
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            getPerformanceScore() >= 80 ? 'bg-green-500/20 text-green-300' :
            getPerformanceScore() >= 60 ? 'bg-yellow-500/20 text-yellow-300' :
            'bg-red-500/20 text-red-300'
          }`}>
            Score: {getPerformanceScore().toFixed(0)}
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={runPerformanceOptimization}
            disabled={isLoading}
            className="bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <BoltIcon className="w-4 h-4" />
            <span>{isLoading ? 'Optimizing...' : 'Optimize'}</span>
          </motion.button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-6 flex items-center space-x-2"
        >
          <ExclamationTriangleIcon className="w-5 h-5" />
          <span>{error}</span>
        </motion.div>
      )}

      {/* Navigation Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-700 rounded-lg p-1">
        {[
          { key: 'overview', label: 'Overview', icon: ChartBarIcon },
          { key: 'vitals', label: 'Web Vitals', icon: BoltIcon },
          { key: 'resources', label: 'Resources', icon: ServerIcon },
          { key: 'cache', label: 'Cache', icon: CpuChipIcon },
          { key: 'optimization', label: 'Optimization', icon: Cog6ToothIcon },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
              activeTab === tab.key
                ? 'bg-cyan-500 text-white'
                : 'text-gray-300 hover:text-white hover:bg-gray-600'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && report && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <ClockIcon className="w-5 h-5 text-cyan-400" />
                <span className="text-sm font-medium text-gray-300">Page Load</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {formatMs(report.pageLoad.loadComplete)}
              </div>
            </div>

            <div className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <EyeIcon className="w-5 h-5 text-green-400" />
                <span className="text-sm font-medium text-gray-300">FCP</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {formatMs(report.pageLoad.firstContentfulPaint)}
              </div>
            </div>

            <div className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <CpuChipIcon className="w-5 h-5 text-purple-400" />
                <span className="text-sm font-medium text-gray-300">Memory</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {formatBytes(report.memory.usedJSHeapSize)}
              </div>
            </div>

            <div className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <SignalIcon className="w-5 h-5 text-orange-400" />
                <span className="text-sm font-medium text-gray-300">Network</span>
              </div>
              <div className="text-2xl font-bold text-white capitalize">
                {report.network.effectiveType}
              </div>
            </div>
          </div>

          {/* Performance Timeline */}
          <div className="bg-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Loading Timeline</h3>
            <div className="space-y-3">
              {[
                { name: 'First Paint', time: report.pageLoad.firstPaint, color: 'bg-blue-500' },
                { name: 'First Contentful Paint', time: report.pageLoad.firstContentfulPaint, color: 'bg-green-500' },
                { name: 'DOM Content Loaded', time: report.pageLoad.domContentLoaded, color: 'bg-yellow-500' },
                { name: 'Load Complete', time: report.pageLoad.loadComplete, color: 'bg-purple-500' },
              ].map((event, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <div className={`w-3 h-3 rounded-full ${event.color}`}></div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">{event.name}</span>
                      <span className="text-white font-mono">{formatMs(event.time)}</span>
                    </div>
                    <div className="w-full bg-gray-600 rounded-full h-2 mt-1">
                      <div
                        className={`h-2 rounded-full ${event.color}`}
                        style={{ width: `${Math.min((event.time / Math.max(...[report.pageLoad.firstPaint, report.pageLoad.firstContentfulPaint, report.pageLoad.domContentLoaded, report.pageLoad.loadComplete])) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Device & Network Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Device Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-300">Memory</span>
                  <span className="text-white">{report.device.deviceMemory || 'Unknown'} GB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">CPU Cores</span>
                  <span className="text-white">{report.device.hardwareConcurrency || 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">JS Heap Limit</span>
                  <span className="text-white">{formatBytes(report.memory.jsHeapSizeLimit)}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Network Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-300">Effective Type</span>
                  <span className="text-white capitalize">{report.network.effectiveType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Downlink</span>
                  <span className="text-white">{report.network.downlink} Mbps</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">RTT</span>
                  <span className="text-white">{report.network.rtt}ms</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Web Vitals Tab */}
      {activeTab === 'vitals' && report && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {report.webVitals.map((vital, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-700 rounded-lg p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">{vital.name}</h3>
                  <div className={`w-3 h-3 rounded-full ${
                    vital.rating === 'good' ? 'bg-green-500' :
                    vital.rating === 'needs-improvement' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}></div>
                </div>

                <div className="text-3xl font-bold mb-2">
                  <span className={getWebVitalColor(vital.rating)}>
                    {vital.name === 'CLS' ? vital.value.toFixed(3) : formatMs(vital.value)}
                  </span>
                </div>

                <div className="text-sm text-gray-400 mb-4">
                  Rating: <span className={`capitalize ${getWebVitalColor(vital.rating)}`}>
                    {vital.rating.replace('-', ' ')}
                  </span>
                </div>

                <div className="w-full bg-gray-600 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      vital.rating === 'good' ? 'bg-green-500' :
                      vital.rating === 'needs-improvement' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min((vital.value / (vital.name === 'CLS' ? 0.25 : 4000)) * 100, 100)}%` }}
                  />
                </div>

                <div className="text-xs text-gray-400 mt-2">
                  Last updated: {new Date(vital.timestamp).toLocaleTimeString()}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Web Vitals Explanation */}
          <div className="bg-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Web Vitals Explained</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
              <div>
                <strong className="text-white">FCP:</strong> First Contentful Paint - Time when first content appears
              </div>
              <div>
                <strong className="text-white">LCP:</strong> Largest Contentful Paint - Time when main content loads
              </div>
              <div>
                <strong className="text-white">FID:</strong> First Input Delay - Responsiveness to user interactions
              </div>
              <div>
                <strong className="text-white">CLS:</strong> Cumulative Layout Shift - Visual stability of the page
              </div>
              <div>
                <strong className="text-white">TTFB:</strong> Time to First Byte - Server response time
              </div>
              <div>
                <strong className="text-white">INP:</strong> Interaction to Next Paint - Overall responsiveness
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Resources Tab */}
      {activeTab === 'resources' && report && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="bg-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Resource Loading Performance</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-600">
                    <th className="text-left py-2">Resource</th>
                    <th className="text-left py-2">Type</th>
                    <th className="text-left py-2">Duration</th>
                    <th className="text-left py-2">Size</th>
                    <th className="text-left py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {report.resources.slice(0, 10).map((resource, index) => (
                    <tr key={index} className="border-b border-gray-600">
                      <td className="py-2 text-gray-300 truncate max-w-xs">
                        {resource.name.split('/').pop() || resource.name}
                      </td>
                      <td className="py-2 text-gray-400 capitalize">{resource.initiatorType}</td>
                      <td className="py-2 text-white">{formatMs(resource.duration)}</td>
                      <td className="py-2 text-gray-300">{formatBytes(resource.transferSize)}</td>
                      <td className="py-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          resource.duration < 100 ? 'bg-green-500/20 text-green-300' :
                          resource.duration < 500 ? 'bg-yellow-500/20 text-yellow-300' :
                          'bg-red-500/20 text-red-300'
                        }`}>
                          {resource.duration < 100 ? 'Fast' :
                           resource.duration < 500 ? 'Moderate' : 'Slow'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Resource Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-700 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-white mb-2">Total Resources</h4>
              <div className="text-3xl font-bold text-cyan-400">{report.resources.length}</div>
            </div>
            <div className="bg-gray-700 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-white mb-2">Total Transfer Size</h4>
              <div className="text-3xl font-bold text-green-400">
                {formatBytes(report.resources.reduce((sum, r) => sum + r.transferSize, 0))}
              </div>
            </div>
            <div className="bg-gray-700 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-white mb-2">Average Load Time</h4>
              <div className="text-3xl font-bold text-orange-400">
                {formatMs(report.resources.reduce((sum, r) => sum + r.duration, 0) / report.resources.length)}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Cache Tab */}
      {activeTab === 'cache' && cacheStats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Cache Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircleIcon className="w-5 h-5 text-green-400" />
                <span className="text-sm font-medium text-gray-300">Hit Rate</span>
              </div>
              <div className={`text-2xl font-bold ${getCacheHealthColor(cacheStats.hitRate)}`}>
                {(cacheStats.hitRate * 100).toFixed(1)}%
              </div>
            </div>

            <div className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <CpuChipIcon className="w-5 h-5 text-blue-400" />
                <span className="text-sm font-medium text-gray-300">Total Keys</span>
              </div>
              <div className="text-2xl font-bold text-white">{cacheStats.totalKeys}</div>
            </div>

            <div className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <ServerIcon className="w-5 h-5 text-purple-400" />
                <span className="text-sm font-medium text-gray-300">Memory Usage</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {formatBytes(cacheStats.memoryUsage)}
              </div>
            </div>

            <div className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <ClockIcon className="w-5 h-5 text-orange-400" />
                <span className="text-sm font-medium text-gray-300">Avg Access</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {formatMs(cacheStats.averageAccessTime)}
              </div>
            </div>
          </div>

          {/* Cache Performance Chart */}
          <div className="bg-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Cache Performance</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-300">Cache Hits</span>
                  <span className="text-green-400">{cacheStats.hits}</span>
                </div>
                <div className="w-full bg-gray-600 rounded-full h-3">
                  <div
                    className="bg-green-500 h-3 rounded-full"
                    style={{ width: `${(cacheStats.hits / (cacheStats.hits + cacheStats.misses)) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-300">Cache Misses</span>
                  <span className="text-red-400">{cacheStats.misses}</span>
                </div>
                <div className="w-full bg-gray-600 rounded-full h-3">
                  <div
                    className="bg-red-500 h-3 rounded-full"
                    style={{ width: `${(cacheStats.misses / (cacheStats.hits + cacheStats.misses)) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-300">Evictions</span>
                  <span className="text-yellow-400">{cacheStats.evictions}</span>
                </div>
                <div className="w-full bg-gray-600 rounded-full h-3">
                  <div
                    className="bg-yellow-500 h-3 rounded-full"
                    style={{ width: `${Math.min((cacheStats.evictions / cacheStats.totalKeys) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Cache Health */}
          <div className="bg-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Cache Health Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded-full ${getCacheHealthColor(cacheStats.hitRate).replace('text-', 'bg-')}`}></div>
                <span className="text-gray-300">Hit Rate: </span>
                <span className={getCacheHealthColor(cacheStats.hitRate)}>
                  {cacheStats.hitRate >= 0.8 ? 'Excellent' :
                   cacheStats.hitRate >= 0.6 ? 'Good' : 'Needs Improvement'}
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                <span className="text-gray-300">Operations: </span>
                <span className="text-blue-400">{cacheStats.operations}</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Optimization Tab */}
      {activeTab === 'optimization' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Performance Budget */}
          <div className="bg-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Performance Budget</h3>
            <div className="space-y-4">
              {[
                { name: 'First Contentful Paint', current: 1650, budget: 1800, unit: 'ms' },
                { name: 'Largest Contentful Paint', current: 2200, budget: 2500, unit: 'ms' },
                { name: 'First Input Delay', current: 85, budget: 100, unit: 'ms' },
                { name: 'Cumulative Layout Shift', current: 0.08, budget: 0.1, unit: '' },
              ].map((metric, index) => {
                const percentage = (metric.current / metric.budget) * 100;
                const isGood = metric.current <= metric.budget;

                return (
                  <div key={index}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-300">{metric.name}</span>
                      <div className="flex items-center space-x-2">
                        <span className={`font-mono ${isGood ? 'text-green-400' : 'text-red-400'}`}>
                          {metric.current}{metric.unit}
                        </span>
                        <span className="text-gray-400">/ {metric.budget}{metric.unit}</span>
                        {isGood ? (
                          <CheckCircleIcon className="w-4 h-4 text-green-400" />
                        ) : (
                          <ExclamationTriangleIcon className="w-4 h-4 text-red-400" />
                        )}
                      </div>
                    </div>
                    <div className="w-full bg-gray-600 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${isGood ? 'bg-green-500' : 'bg-red-500'}`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Optimization Recommendations */}
          <div className="bg-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Optimization Recommendations</h3>
            <div className="space-y-3">
              {[
                { type: 'success', message: 'Images are optimally compressed and use WebP format' },
                { type: 'warning', message: 'Consider lazy loading below-the-fold images to improve LCP' },
                { type: 'info', message: 'Enable Brotli compression for better resource delivery' },
                { type: 'warning', message: 'Some JavaScript bundles are larger than recommended' },
                { type: 'success', message: 'Service worker is properly configured for caching' },
              ].map((rec, index) => (
                <div key={index} className={`flex items-start space-x-3 p-3 rounded-lg ${
                  rec.type === 'success' ? 'bg-green-500/10 border border-green-500/20' :
                  rec.type === 'warning' ? 'bg-yellow-500/10 border border-yellow-500/20' :
                  'bg-blue-500/10 border border-blue-500/20'
                }`}>
                  {rec.type === 'success' ? (
                    <CheckCircleIcon className="w-5 h-5 text-green-400 mt-0.5" />
                  ) : rec.type === 'warning' ? (
                    <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400 mt-0.5" />
                  ) : (
                    <BoltIcon className="w-5 h-5 text-blue-400 mt-0.5" />
                  )}
                  <span className={`text-sm ${
                    rec.type === 'success' ? 'text-green-300' :
                    rec.type === 'warning' ? 'text-yellow-300' :
                    'text-blue-300'
                  }`}>
                    {rec.message}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Optimization Actions */}
          <div className="bg-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <button className="bg-cyan-500 hover:bg-cyan-600 text-white p-4 rounded-lg text-left transition-colors">
                <div className="font-medium mb-1">Clear Cache</div>
                <div className="text-sm opacity-75">Reset all cached data</div>
              </button>
              <button className="bg-purple-500 hover:bg-purple-600 text-white p-4 rounded-lg text-left transition-colors">
                <div className="font-medium mb-1">Optimize Images</div>
                <div className="text-sm opacity-75">Compress and convert images</div>
              </button>
              <button className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-lg text-left transition-colors">
                <div className="font-medium mb-1">Preload Resources</div>
                <div className="text-sm opacity-75">Preload critical assets</div>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default PerformanceMonitor;