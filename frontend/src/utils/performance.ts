/**
 * Performance utilities for React components
 * Ref: CLAUDE.md - Optimized utility functions
 */

import React, { useCallback, useRef, useEffect } from 'react';

/**
 * Generic throttle function with proper cleanup
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastExecTime = 0;
  
  const throttledFunction = (...args: Parameters<T>) => {
    const currentTime = Date.now();
    const timeSinceLastExec = currentTime - lastExecTime;
    
    if (timeSinceLastExec > delay) {
      func(...args);
      lastExecTime = currentTime;
    } else {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      timeoutId = setTimeout(() => {
        func(...args);
        lastExecTime = Date.now();
        timeoutId = null;
      }, delay - timeSinceLastExec);
    }
  };
  
  // Add cleanup method
  (throttledFunction as any).cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };
  
  return throttledFunction;
}

/**
 * Debounce function with proper cleanup
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;
  
  const debouncedFunction = (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, delay);
  };
  
  // Add cleanup method
  (debouncedFunction as any).cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };
  
  return debouncedFunction;
}

/**
 * React hook for throttled callback with automatic cleanup
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: React.DependencyList = []
): (...args: Parameters<T>) => void {
  const throttledRef = useRef<ReturnType<typeof throttle>>();
  
  const throttledCallback = useCallback((...args: Parameters<T>) => {
    if (!throttledRef.current) {
      throttledRef.current = throttle(callback, delay);
    }
    throttledRef.current(...args);
  }, [callback, delay, ...deps]);
  
  // Cleanup on unmount or dependency change
  React.useEffect(() => {
    return () => {
      if (throttledRef.current && (throttledRef.current as any).cancel) {
        (throttledRef.current as any).cancel();
      }
    };
  }, [callback, delay, ...deps]);
  
  return throttledCallback;
}

/**
 * React hook for debounced callback with automatic cleanup
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: React.DependencyList = []
): (...args: Parameters<T>) => void {
  const debouncedRef = useRef<ReturnType<typeof debounce>>();
  
  const debouncedCallback = useCallback((...args: Parameters<T>) => {
    if (!debouncedRef.current) {
      debouncedRef.current = debounce(callback, delay);
    }
    debouncedRef.current(...args);
  }, [callback, delay, ...deps]);
  
  // Cleanup on unmount or dependency change
  React.useEffect(() => {
    return () => {
      if (debouncedRef.current && (debouncedRef.current as any).cancel) {
        (debouncedRef.current as any).cancel();
      }
    };
  }, [callback, delay, ...deps]);
  
  return debouncedCallback;
}

/**
 * Performance monitoring utilities
 */
export class PerformanceMonitor {
  private static measurements = new Map<string, number>();
  
  static startMeasurement(name: string): void {
    this.measurements.set(name, performance.now());
  }
  
  static endMeasurement(name: string): number {
    const startTime = this.measurements.get(name);
    if (!startTime) {
      console.warn(`No measurement found for: ${name}`);
      return 0;
    }
    
    const duration = performance.now() - startTime;
    this.measurements.delete(name);
    
    console.log(`Performance [${name}]: ${duration.toFixed(2)}ms`);
    return duration;
  }
  
  static measureFunction<T extends (...args: any[]) => any>(
    fn: T,
    name?: string
  ): (...args: Parameters<T>) => ReturnType<T> {
    return (...args: Parameters<T>) => {
      const measurementName = name || fn.name || 'anonymous';
      this.startMeasurement(measurementName);
      const result = fn(...args);
      this.endMeasurement(measurementName);
      return result;
    };
  }
  
  static measureAsync<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    name?: string
  ): (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>>> {
    return async (...args: Parameters<T>) => {
      const measurementName = name || fn.name || 'anonymous';
      this.startMeasurement(measurementName);
      const result = await fn(...args);
      this.endMeasurement(measurementName);
      return result;
    };
  }
}

/**
 * Memory leak prevention utilities
 */
export class MemoryManager {
  private static listeners = new WeakMap<object, (() => void)[]>();
  
  static addCleanupListener(component: object, cleanup: () => void): void {
    if (!this.listeners.has(component)) {
      this.listeners.set(component, []);
    }
    this.listeners.get(component)!.push(cleanup);
  }
  
  static cleanup(component: object): void {
    const listeners = this.listeners.get(component);
    if (listeners) {
      listeners.forEach(cleanup => {
        try {
          cleanup();
        } catch (error) {
          console.error('Cleanup error:', error);
        }
      });
      this.listeners.delete(component);
    }
  }
}

/**
 * Intersection Observer utilities for performance
 */
export function useIntersectionObserver(
  callback: IntersectionObserverCallback,
  options: IntersectionObserverInit = {}
): React.RefObject<HTMLElement> {
  const elementRef = useRef<HTMLElement>(null);
  const observerRef = useRef<IntersectionObserver>();
  
  React.useEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    
    observerRef.current = new IntersectionObserver(callback, {
      threshold: 0.1,
      rootMargin: '50px',
      ...options
    });
    
    observerRef.current.observe(element);
    
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [callback, options]);
  
  return elementRef;
}

/**
 * RAF-based animation utilities
 */
export class AnimationScheduler {
  private static callbacks = new Set<() => void>();
  private static running = false;
  
  static schedule(callback: () => void): () => void {
    this.callbacks.add(callback);
    
    if (!this.running) {
      this.running = true;
      requestAnimationFrame(this.flush.bind(this));
    }
    
    return () => this.callbacks.delete(callback);
  }
  
  private static flush(): void {
    for (const callback of this.callbacks) {
      try {
        callback();
      } catch (error) {
        console.error('Animation callback error:', error);
      }
    }
    
    this.callbacks.clear();
    this.running = false;
  }
}

export default {
  throttle,
  debounce,
  useThrottledCallback,
  useDebouncedCallback,
  PerformanceMonitor,
  MemoryManager,
  useIntersectionObserver,
  AnimationScheduler
};