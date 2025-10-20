import * as React from 'react';
import { useEffect, useState } from 'react';

interface PerformanceMetrics {
  loadTime: number;
  memoryUsage: number;
  renderTime: number;
  errorCount: number;
  userAgent: string;
  timestamp: number;
}

interface ProductionMonitorProps {
  enabled?: boolean;
  apiEndpoint?: string;
  sampleRate?: number;
}

const ProductionMonitor: React.FC<ProductionMonitorProps> = ({
  enabled = process.env.NODE_ENV === 'production',
  apiEndpoint = '/api/monitoring',
  sampleRate = 0.1 // 10% sampling rate
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    if (!enabled) return;

    // Only send metrics for a percentage of users
    if (Math.random() > sampleRate) return;

    const collectMetrics = () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const memory = (performance as any).memory;
      
      const performanceMetrics: PerformanceMetrics = {
        loadTime: navigation ? navigation.loadEventEnd - navigation.loadEventStart : 0,
        memoryUsage: memory ? Math.round(memory.usedJSHeapSize / 1024 / 1024) : 0,
        renderTime: performance.now(),
        errorCount: 0, // This would be tracked by error boundary
        userAgent: navigator.userAgent,
        timestamp: Date.now(),
      };

      setMetrics(performanceMetrics);
      sendMetrics(performanceMetrics);
    };

    const sendMetrics = async (metrics: PerformanceMetrics) => {
      try {
        await fetch(apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(metrics),
        });
      } catch (error) {
        console.warn('Failed to send metrics:', error);
      }
    };

    // Collect metrics after page load
    if (document.readyState === 'complete') {
      collectMetrics();
    } else {
      window.addEventListener('load', collectMetrics);
    }

    // Monitor online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup
    return () => {
      window.removeEventListener('load', collectMetrics);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [enabled, apiEndpoint, sampleRate]);

  // Track errors
  useEffect(() => {
    if (!enabled) return;

    const handleError = (event: ErrorEvent) => {
      console.error('Production error:', event.error);
      // Send error to monitoring service
      fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'error',
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          stack: event.error?.stack,
          timestamp: Date.now(),
        }),
      }).catch(console.warn);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      // Send error to monitoring service
      fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'unhandledRejection',
          reason: event.reason,
          timestamp: Date.now(),
        }),
      }).catch(console.warn);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [enabled, apiEndpoint]);

  // Track user interactions
  useEffect(() => {
    if (!enabled) return;

    const trackInteraction = (event: Event) => {
      // Send interaction data
      fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'interaction',
          eventType: event.type,
          target: (event.target as Element)?.tagName,
          timestamp: Date.now(),
        }),
      }).catch(console.warn);
    };

    // Track key interactions
    document.addEventListener('click', trackInteraction);
    document.addEventListener('keydown', trackInteraction);
    document.addEventListener('scroll', trackInteraction);

    return () => {
      document.removeEventListener('click', trackInteraction);
      document.removeEventListener('keydown', trackInteraction);
      document.removeEventListener('scroll', trackInteraction);
    };
  }, [enabled, apiEndpoint]);

  // Don't render anything in production
  if (enabled) return null;

  // Development mode - show metrics
  return (
    <div className="fixed bottom-4 right-4 bg-gray-900/90 backdrop-blur-sm border border-gray-700/50 rounded-lg p-3 text-xs text-gray-300 z-50">
      <div className="font-semibold text-white mb-2">Production Monitor</div>
      {metrics && (
        <div className="space-y-1">
          <div>Load Time: {metrics.loadTime.toFixed(2)}ms</div>
          <div>Memory: {metrics.memoryUsage}MB</div>
          <div>Render: {metrics.renderTime.toFixed(2)}ms</div>
          <div>Online: {isOnline ? '✅' : '❌'}</div>
        </div>
      )}
    </div>
  );
};

export default ProductionMonitor;
