// Ref: CLAUDE.md - Performance Optimization Service for ProtoThrive
import { cacheService } from './cacheService';
// Removed unused import

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count' | 'percent';
  timestamp: number;
  tags: Record<string, string>;
}

export interface ResourceTiming {
  name: string;
  startTime: number;
  endTime: number;
  duration: number;
  transferSize: number;
  encodedBodySize: number;
  decodedBodySize: number;
  initiatorType: string;
}

export interface WebVital {
  name: 'FCP' | 'LCP' | 'FID' | 'CLS' | 'TTFB' | 'INP';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  url: string;
  timestamp: number;
}

export interface PerformanceReport {
  pageLoad: {
    domContentLoaded: number;
    loadComplete: number;
    firstPaint: number;
    firstContentfulPaint: number;
    largestContentfulPaint: number;
    timeToInteractive: number;
  };
  webVitals: WebVital[];
  resources: ResourceTiming[];
  memory: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
  network: {
    effectiveType: string;
    downlink: number;
    rtt: number;
  };
  device: {
    deviceMemory: number;
    hardwareConcurrency: number;
  };
  customMetrics: PerformanceMetric[];
}

export interface OptimizationConfig {
  lazyLoading: boolean;
  imageOptimization: boolean;
  bundleSplitting: boolean;
  preloading: boolean;
  serviceworker: boolean;
  compression: boolean;
  minification: boolean;
  treeShaking: boolean;
  criticalCSS: boolean;
  resourceHints: boolean;
}

export class PerformanceService {
  private metrics: PerformanceMetric[] = [];
  private observer?: PerformanceObserver;
  private webVitalsObserver?: PerformanceObserver;
  private resourceObserver?: PerformanceObserver;
  private intersectionObserver?: IntersectionObserver;
  private config: OptimizationConfig;
  private isInitialized = false;

  constructor(config: Partial<OptimizationConfig> = {}) {
    this.config = {
      lazyLoading: true,
      imageOptimization: true,
      bundleSplitting: true,
      preloading: true,
      serviceworker: true,
      compression: true,
      minification: true,
      treeShaking: true,
      criticalCSS: true,
      resourceHints: true,
      ...config,
    };

    this.initialize();
  }

  private initialize() {
    if (typeof window === 'undefined' || this.isInitialized) return;

    this.setupPerformanceObservers();
    this.setupWebVitalsTracking();
    this.setupResourceTimingObserver();
    this.setupLazyLoading();
    this.setupImageOptimization();
    this.setupPreloading();
    this.setupServiceWorker();

    this.isInitialized = true;
    console.log('Thermonuclear Performance Service initialized with enterprise optimizations');
  }

  // Performance Monitoring
  private setupPerformanceObservers() {
    if (!('PerformanceObserver' in window)) return;

    // Navigation timing observer
    this.observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.processPerformanceEntry(entry);
      }
    });

    this.observer.observe({ entryTypes: ['navigation', 'paint', 'measure', 'mark'] });
  }

  private setupWebVitalsTracking() {
    // Track Core Web Vitals
    this.trackWebVital('FCP', this.trackFirstContentfulPaint.bind(this));
    this.trackWebVital('LCP', this.trackLargestContentfulPaint.bind(this));
    this.trackWebVital('FID', this.trackFirstInputDelay.bind(this));
    this.trackWebVital('CLS', this.trackCumulativeLayoutShift.bind(this));
    this.trackWebVital('TTFB', this.trackTimeToFirstByte.bind(this));
    this.trackWebVital('INP', this.trackInteractionToNextPaint.bind(this));
  }

  private setupResourceTimingObserver() {
    if (!('PerformanceObserver' in window)) return;

    this.resourceObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.processResourceTiming(entry as PerformanceResourceTiming);
      }
    });

    this.resourceObserver.observe({ entryTypes: ['resource'] });
  }

  // Web Vitals Tracking
  private trackWebVital(name: WebVital['name'], tracker: () => void) {
    try {
      tracker();
    } catch (error) {
      console.warn(`Failed to track ${name}:`, error);
    }
  }

  private trackFirstContentfulPaint() {
    const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0];
    if (fcpEntry) {
      this.reportWebVital('FCP', fcpEntry.startTime);
    }
  }

  private trackLargestContentfulPaint() {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      if (lastEntry) {
        this.reportWebVital('LCP', lastEntry.startTime);
      }
    });

    observer.observe({ entryTypes: ['largest-contentful-paint'] });
  }

  private trackFirstInputDelay() {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'first-input') {
          const fid = (entry as PerformanceEntry & { processingStart: number }).processingStart - entry.startTime;
          this.reportWebVital('FID', fid);
        }
      }
    });

    observer.observe({ entryTypes: ['first-input'] });
  }

  private trackCumulativeLayoutShift() {
    if (!('PerformanceObserver' in window)) return;

    let clsValue = 0;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as PerformanceEntry & { hadRecentInput: boolean }).hadRecentInput) {
          clsValue += (entry as PerformanceEntry & { value: number }).value;
        }
      }
      this.reportWebVital('CLS', clsValue);
    });

    observer.observe({ entryTypes: ['layout-shift'] });
  }

  private trackTimeToFirstByte() {
    const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigationEntry) {
      const ttfb = navigationEntry.responseStart - navigationEntry.requestStart;
      this.reportWebVital('TTFB', ttfb);
    }
  }

  private trackInteractionToNextPaint() {
    // INP tracking (simplified implementation)
    let maxDelay = 0;

    const trackINP = () => {
      const startTime = performance.now();

      requestAnimationFrame(() => {
        const delay = performance.now() - startTime;
        maxDelay = Math.max(maxDelay, delay);
        this.reportWebVital('INP', maxDelay);
      });
    };

    ['click', 'keydown', 'pointerdown'].forEach(type => {
      document.addEventListener(type, trackINP, { passive: true });
    });
  }

  private reportWebVital(name: WebVital['name'], value: number) {
    const rating = this.getWebVitalRating(name, value);

    const vital: WebVital = {
      name,
      value,
      rating,
      delta: value,
      id: this.generateId(),
      url: window.location.href,
      timestamp: Date.now(),
    };

    this.reportMetric({
      name: `webvital_${name.toLowerCase()}`,
      value,
      unit: 'ms',
      timestamp: Date.now(),
      tags: { rating, url: window.location.pathname },
    });

    // Cache web vital for analytics
    cacheService.set(`webvital_${name}_${Date.now()}`, vital, { ttl: 3600 });
  }

  private getWebVitalRating(name: WebVital['name'], value: number): WebVital['rating'] {
    const thresholds = {
      FCP: { good: 1800, poor: 3000 },
      LCP: { good: 2500, poor: 4000 },
      FID: { good: 100, poor: 300 },
      CLS: { good: 0.1, poor: 0.25 },
      TTFB: { good: 800, poor: 1800 },
      INP: { good: 200, poor: 500 },
    };

    const threshold = thresholds[name];
    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  }

  // Performance Optimization Features
  private setupLazyLoading() {
    if (!this.config.lazyLoading || !('IntersectionObserver' in window)) return;

    this.intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const element = entry.target as HTMLElement;

          // Lazy load images
          if (element.tagName === 'IMG') {
            const img = element as HTMLImageElement;
            const dataSrc = img.getAttribute('data-src');
            if (dataSrc) {
              img.src = dataSrc;
              img.removeAttribute('data-src');
              this.intersectionObserver?.unobserve(element);
            }
          }

          // Lazy load components
          if (element.hasAttribute('data-lazy-component')) {
            const componentName = element.getAttribute('data-lazy-component');
            this.loadComponent(componentName!);
            this.intersectionObserver?.unobserve(element);
          }
        }
      });
    }, {
      rootMargin: '50px 0px',
      threshold: 0.01,
    });

    // Observe all lazy-loadable elements
    document.querySelectorAll('[data-src], [data-lazy-component]').forEach(el => {
      this.intersectionObserver?.observe(el);
    });
  }

  private setupImageOptimization() {
    if (!this.config.imageOptimization) return;

    // Convert images to WebP when supported
    if (this.supportsWebP()) {
      document.querySelectorAll('img[data-webp]').forEach(img => {
        const webpSrc = (img as HTMLImageElement).getAttribute('data-webp');
        if (webpSrc) {
          (img as HTMLImageElement).src = webpSrc;
        }
      });
    }

    // Add responsive images with srcset
    document.querySelectorAll('img[data-responsive]').forEach(img => {
      const responsiveData = (img as HTMLImageElement).getAttribute('data-responsive');
      if (responsiveData) {
        (img as HTMLImageElement).srcset = responsiveData;
      }
    });
  }

  private setupPreloading() {
    if (!this.config.preloading) return;

    // Preload critical resources
    this.preloadCriticalResources();

    // Prefetch likely navigation targets
    this.setupPrefetching();
  }

  private setupServiceWorker() {
    if (!this.config.serviceworker || !('serviceWorker' in navigator)) return;

    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('Thermonuclear Service Worker registered:', registration.scope);

        // Update service worker when new version is available
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New content is available, refresh the page
                window.location.reload();
              }
            });
          }
        });
      })
      .catch(error => {
        console.warn('Thermonuclear Service Worker registration failed:', error);
      });
  }

  // Resource Management
  private preloadCriticalResources() {
    const criticalResources = [
      { href: '/fonts/inter-var.woff2', as: 'font', type: 'font/woff2' },
      { href: '/css/critical.css', as: 'style' },
      { href: '/js/core.js', as: 'script' },
    ];

    criticalResources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource.href;
      link.as = resource.as;
      if (resource.type) link.type = resource.type;
      if (resource.as === 'font') link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });
  }

  private setupPrefetching() {
    // Prefetch on hover/focus
    document.addEventListener('mouseover', (event) => {
      const target = event.target as HTMLElement;
      const link = target.closest('a[href]') as HTMLAnchorElement;

      if (link && this.shouldPrefetch(link.href)) {
        this.prefetchPage(link.href);
      }
    });

    // Prefetch visible links after page load
    setTimeout(() => {
      document.querySelectorAll('a[href]').forEach(link => {
        if (this.isInViewport(link as HTMLElement) && this.shouldPrefetch((link as HTMLAnchorElement).href)) {
          this.prefetchPage((link as HTMLAnchorElement).href);
        }
      });
    }, 2000);
  }

  private shouldPrefetch(url: string): boolean {
    // Don't prefetch external links, files, or anchors
    if (url.startsWith('http') && !url.includes(window.location.hostname)) return false;
    if (url.includes('#') || url.includes('?')) return false;
    if (/\.(pdf|zip|jpg|png|gif|svg)$/i.test(url)) return false;

    return true;
  }

  private prefetchPage(url: string) {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    document.head.appendChild(link);
  }

  private async loadComponent(componentName: string) {
    try {
      // Dynamic import for code splitting
      const component = await import(`../components/${componentName}`);
      console.log(`Thermonuclear Lazy Loaded: ${componentName}`);
      return component.default;
    } catch (error) {
      console.error(`Failed to lazy load component ${componentName}:`, error);
    }
  }

  // Utility Methods
  private supportsWebP(): boolean {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }

  private isInViewport(element: HTMLElement): boolean {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }

  private processPerformanceEntry(entry: PerformanceEntry) {
    this.reportMetric({
      name: `performance_${entry.entryType}_${entry.name}`,
      value: entry.duration || entry.startTime,
      unit: 'ms',
      timestamp: Date.now(),
      tags: { type: entry.entryType, name: entry.name },
    });
  }

  private processResourceTiming(entry: PerformanceResourceTiming) {
    const resourceTiming: ResourceTiming = {
      name: entry.name,
      startTime: entry.startTime,
      endTime: entry.responseEnd,
      duration: entry.duration,
      transferSize: entry.transferSize,
      encodedBodySize: entry.encodedBodySize,
      decodedBodySize: entry.decodedBodySize,
      initiatorType: entry.initiatorType,
    };

    // Report slow resources
    if (entry.duration > 1000) {
      this.reportMetric({
        name: 'slow_resource',
        value: entry.duration,
        unit: 'ms',
        timestamp: Date.now(),
        tags: {
          url: entry.name,
          type: entry.initiatorType,
          size: entry.transferSize.toString()
        },
      });
    }

    // Cache resource timing for analysis
    cacheService.set(`resource_timing_${Date.now()}`, resourceTiming, { ttl: 1800 });
  }

  private reportMetric(metric: PerformanceMetric) {
    this.metrics.push(metric);

    // Limit metrics array size
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    // Send to analytics service (would be real endpoint in production)
    if (process.env.NODE_ENV === 'production') {
      this.sendToAnalytics(metric);
    }
  }

  private async sendToAnalytics(metric: PerformanceMetric) {
    try {
      // In production, this would send to your analytics service
      await fetch('/api/analytics/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metric),
      });
    } catch (error) {
      console.warn('Failed to send performance metric:', error);
    }
  }

  private generateId(): string {
    return `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public API
  async generateReport(): Promise<PerformanceReport> {
    const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paintEntries = performance.getEntriesByType('paint');

    return {
      pageLoad: {
        domContentLoaded: navigationEntry?.domContentLoadedEventEnd - navigationEntry?.domContentLoadedEventStart || 0,
        loadComplete: navigationEntry?.loadEventEnd - navigationEntry?.loadEventStart || 0,
        firstPaint: paintEntries.find(e => e.name === 'first-paint')?.startTime || 0,
        firstContentfulPaint: paintEntries.find(e => e.name === 'first-contentful-paint')?.startTime || 0,
        largestContentfulPaint: 0, // Would be populated by LCP observer
        timeToInteractive: 0, // Would be calculated based on long tasks
      },
      webVitals: await this.getWebVitals(),
      resources: await this.getResourceTimings(),
      memory: this.getMemoryInfo(),
      network: this.getNetworkInfo(),
      device: this.getDeviceInfo(),
      customMetrics: this.metrics.slice(-100), // Last 100 metrics
    };
  }

  private async getWebVitals(): Promise<WebVital[]> {
    const cached = await cacheService.getByTags(['webvital']);
    return Array.from(cached.values()) as WebVital[];
  }

  private async getResourceTimings(): Promise<ResourceTiming[]> {
    const cached = await cacheService.getByTags(['resource_timing']);
    return Array.from(cached.values()) as ResourceTiming[];
  }

  private getMemoryInfo(): PerformanceReport['memory'] {
    if ('memory' in performance) {
      const memory = (performance as Performance & { memory: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
      };
    }
    return { usedJSHeapSize: 0, totalJSHeapSize: 0, jsHeapSizeLimit: 0 };
  }

  private getNetworkInfo(): PerformanceReport['network'] {
    if ('connection' in navigator) {
      const connection = (navigator as Navigator & { connection: { effectiveType: string; downlink: number; rtt: number } }).connection;
      return {
        effectiveType: connection.effectiveType || 'unknown',
        downlink: connection.downlink || 0,
        rtt: connection.rtt || 0,
      };
    }
    return { effectiveType: 'unknown', downlink: 0, rtt: 0 };
  }

  private getDeviceInfo(): PerformanceReport['device'] {
    return {
      deviceMemory: (navigator as Navigator & { deviceMemory: number }).deviceMemory || 0,
      hardwareConcurrency: navigator.hardwareConcurrency || 0,
    };
  }

  markFeatureUsage(feature: string, duration?: number) {
    this.reportMetric({
      name: 'feature_usage',
      value: duration || 1,
      unit: duration ? 'ms' : 'count',
      timestamp: Date.now(),
      tags: { feature },
    });
  }

  startTiming(name: string): () => number {
    const startTime = performance.now();
    performance.mark(`${name}_start`);

    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      performance.mark(`${name}_end`);
      performance.measure(name, `${name}_start`, `${name}_end`);

      this.reportMetric({
        name: `custom_timing_${name}`,
        value: duration,
        unit: 'ms',
        timestamp: Date.now(),
        tags: { operation: name },
      });

      return duration;
    };
  }

  // Bundle Analysis (for development)
  async analyzeBundles(): Promise<{
    totalSize: number;
    gzippedSize: number;
    chunks: Array<{
      name: string;
      size: number;
      assets: string[];
    }>;
    duplicates: string[];
    recommendations: string[];
  }> {
    // This would typically integrate with webpack-bundle-analyzer
    console.log('Thermonuclear Bundle Analysis: Analyzing bundles...');

    return {
      totalSize: 0,
      gzippedSize: 0,
      chunks: [],
      duplicates: [],
      recommendations: [
        'Consider lazy loading non-critical components',
        'Optimize image assets with WebP format',
        'Enable tree shaking for unused code elimination',
        'Use code splitting for better caching',
      ],
    };
  }

  // Performance Budget Monitoring
  checkPerformanceBudget(): {
    passed: boolean;
    results: Array<{
      metric: string;
      value: number;
      budget: number;
      passed: boolean;
    }>;
  } {
    const budgets = {
      firstContentfulPaint: 1800,
      largestContentfulPaint: 2500,
      firstInputDelay: 100,
      cumulativeLayoutShift: 0.1,
      timeToInteractive: 3800,
    };

    const results: Array<{ metric: string; value: number; budget: number; passed: boolean }> = [];
    let allPassed = true;

    Object.entries(budgets).forEach(([metric, budget]) => {
      const recent = this.metrics
        .filter(m => m.name.includes(metric))
        .sort((a, b) => b.timestamp - a.timestamp)[0];

      if (recent) {
        const passed = recent.value <= budget;
        allPassed = allPassed && passed;

        results.push({
          metric,
          value: recent.value,
          budget,
          passed,
        });
      }
    });

    return { passed: allPassed, results };
  }

  cleanup() {
    this.observer?.disconnect();
    this.webVitalsObserver?.disconnect();
    this.resourceObserver?.disconnect();
    this.intersectionObserver?.disconnect();
    this.metrics = [];
    this.isInitialized = false;
  }
}

// Export singleton instance
export const performanceService = new PerformanceService({
  lazyLoading: true,
  imageOptimization: true,
  bundleSplitting: true,
  preloading: true,
  serviceworker: true,
  compression: true,
  minification: true,
  treeShaking: true,
  criticalCSS: true,
  resourceHints: true,
});

// Convenience functions
export const perf = {
  mark: (name: string) => performanceService.startTiming(name),
  report: () => performanceService.generateReport(),
  budget: () => performanceService.checkPerformanceBudget(),
  feature: (name: string, duration?: number) => performanceService.markFeatureUsage(name, duration),
};