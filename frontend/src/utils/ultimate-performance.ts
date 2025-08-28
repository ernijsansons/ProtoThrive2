// Ultimate Performance Utilities
export const ultimatePerformance = {
  // Virtual scrolling for large datasets
  virtualScroll: {
    itemHeight: 50,
    containerHeight: 400,
    overscan: 5,
    calculateVisibleRange: (scrollTop: number, containerHeight: number, itemHeight: number, totalItems: number) => {
      const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - 5);
      const endIndex = Math.min(totalItems, Math.ceil((scrollTop + containerHeight) / itemHeight) + 5);
      return { startIndex, endIndex };
    }
  },
  
  // Advanced caching strategies
  cache: {
    memory: new Map(),
    lru: new Map(),
    maxSize: 100,
    
    set: (key: string, value: any, ttl: number = 300000) => {
      const item = { value, expiry: Date.now() + ttl };
      ultimatePerformance.cache.memory.set(key, item);
      
      // LRU eviction
      if (ultimatePerformance.cache.memory.size > ultimatePerformance.cache.maxSize) {
        const firstKey = ultimatePerformance.cache.memory.keys().next().value;
        ultimatePerformance.cache.memory.delete(firstKey);
      }
    },
    
    get: (key: string) => {
      const item = ultimatePerformance.cache.memory.get(key);
      if (!item) return null;
      
      if (Date.now() > item.expiry) {
        ultimatePerformance.cache.memory.delete(key);
        return null;
      }
      
      return item.value;
    }
  },
  
  // Advanced debouncing and throttling
  debounce: (func: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  },
  
  throttle: (func: Function, limit: number) => {
    let inThrottle: boolean;
    return (...args: any[]) => {
      if (!inThrottle) {
        func.apply(null, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },
  
  // Web Workers for heavy computations
  createWorker: (script: string) => {
    const blob = new Blob([script], { type: 'application/javascript' });
    return new Worker(URL.createObjectURL(blob));
  },
  
  // Intersection Observer for lazy loading
  lazyLoad: (selector: string, callback: Function) => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          callback(entry.target);
          observer.unobserve(entry.target);
        }
      });
    });
    
    document.querySelectorAll(selector).forEach(el => observer.observe(el));
  }
};

// Advanced React performance hooks
export const useUltimatePerformance = () => {
  const performanceMetrics = {
    renderCount: 0,
    renderTime: 0,
    memoryUsage: 0,
    networkRequests: 0
  };
  
  const measureRender = (componentName: string) => {
    const start = performance.now();
    return () => {
      const end = performance.now();
      performanceMetrics.renderTime = end - start;
      performanceMetrics.renderCount++;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`⚡ ${componentName}: ${performanceMetrics.renderTime.toFixed(2)}ms`);
      }
    };
  };
  
  return { performanceMetrics, measureRender };
};
