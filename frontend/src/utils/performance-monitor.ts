// Performance monitoring utilities
export const performanceMonitor = {
  // Measure component render time
  measureRender: (componentName: string) => {
    const start = performance.now();
    return () => {
      const end = performance.now();
      const duration = end - start;
      
      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`⚡ ${componentName} rendered in ${duration.toFixed(2)}ms`);
      }
      
      // Send to analytics in production
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'timing_complete', {
          name: componentName,
          value: Math.round(duration),
          event_category: 'performance'
        });
      }
    };
  },
  
  // Measure API call performance
  measureApiCall: async (apiCall: () => Promise<any>, endpoint: string) => {
    const start = performance.now();
    try {
      const result = await apiCall();
      const duration = performance.now() - start;
      
      // Log performance
      if (process.env.NODE_ENV === 'development') {
        console.log(`🌐 ${endpoint} completed in ${duration.toFixed(2)}ms`);
      }
      
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      console.error(`❌ ${endpoint} failed after ${duration.toFixed(2)}ms:`, error);
      throw error;
    }
  },
  
  // Monitor memory usage
  getMemoryUsage: () => {
    if (typeof window !== 'undefined' && 'memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit
      };
    }
    return null;
  }
};

// React performance hook
import { useEffect, useRef } from 'react';

export const usePerformanceMonitor = (componentName: string) => {
  const renderCount = useRef(0);
  
  useEffect(() => {
    renderCount.current += 1;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔄 ${componentName} rendered ${renderCount.current} times`);
    }
  });
  
  return renderCount.current;
};
