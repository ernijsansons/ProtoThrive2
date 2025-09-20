import { useEffect, useRef, useState } from 'react';

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  componentCount: number;
  reRenderCount: number;
}

export const usePerformanceMonitor = (componentName: string) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    memoryUsage: 0,
    componentCount: 0,
    reRenderCount: 0
  });

  const renderStartTime = useRef<number>(0);
  const reRenderCount = useRef<number>(0);

  useEffect(() => {
    renderStartTime.current = performance.now();
    reRenderCount.current += 1;

    const measurePerformance = () => {
      const renderTime = performance.now() - renderStartTime.current;
      
      // Get memory usage if available
      const memoryUsage = (performance as any).memory?.usedJSHeapSize || 0;
      
      // Count React components (approximate)
      const componentCount = document.querySelectorAll('[data-reactroot]').length;

      setMetrics({
        renderTime,
        memoryUsage: Math.round(memoryUsage / 1024 / 1024), // Convert to MB
        componentCount,
        reRenderCount: reRenderCount.current
      });
    };

    // Measure after render
    const timeoutId = setTimeout(measurePerformance, 0);

    return () => clearTimeout(timeoutId);
  });

  return {
    metrics,
    logPerformance: () => {
      console.log(`[Performance] ${componentName}:`, {
        renderTime: `${metrics.renderTime.toFixed(2)}ms`,
        memoryUsage: `${metrics.memoryUsage}MB`,
        componentCount: metrics.componentCount,
        reRenderCount: metrics.reRenderCount
      });
    }
  };
};
