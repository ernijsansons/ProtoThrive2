/**
 * Performance Monitoring and Analytics Setup
 * Tracks Core Web Vitals and user interactions
 */

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  url: string;
  userId?: string;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === 'true';
    if (this.isEnabled && typeof window !== 'undefined') {
      this.initializeMonitoring();
    }
  }

  private initializeMonitoring() {
    // Core Web Vitals monitoring
    this.measureCoreWebVitals();

    // Navigation timing
    this.measureNavigationTiming();

    // Resource timing
    this.measureResourceTiming();

    // User interactions
    this.trackUserInteractions();
  }

  private measureCoreWebVitals() {
    if (!('web-vital' in window)) return;

    // Largest Contentful Paint (LCP)
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (entry.entryType === 'largest-contentful-paint') {
          this.recordMetric('LCP', entry.startTime);
        }
      }
    }).observe({ type: 'largest-contentful-paint', buffered: true });

    // First Input Delay (FID)
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (entry.entryType === 'first-input') {
          this.recordMetric('FID', (entry as any).processingStart - entry.startTime);
        }
      }
    }).observe({ type: 'first-input', buffered: true });

    // Cumulative Layout Shift (CLS)
    let clsValue = 0;
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      }
      this.recordMetric('CLS', clsValue);
    }).observe({ type: 'layout-shift', buffered: true });
  }

  private measureNavigationTiming() {
    if (typeof window === 'undefined') return;

    window.addEventListener('load', () => {
      const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

      if (perfData) {
        this.recordMetric('TTFB', perfData.responseStart - perfData.requestStart);
        this.recordMetric('DOMContentLoaded', perfData.domContentLoadedEventEnd - perfData.navigationStart);
        this.recordMetric('Load', perfData.loadEventEnd - perfData.navigationStart);
      }
    });
  }

  private measureResourceTiming() {
    if (typeof window === 'undefined') return;

    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        const resource = entry as PerformanceResourceTiming;
        if (resource.initiatorType === 'script' || resource.initiatorType === 'css') {
          this.recordMetric(`Resource-${resource.initiatorType}`, resource.duration);
        }
      }
    }).observe({ type: 'resource', buffered: true });
  }

  private trackUserInteractions() {
    if (typeof window === 'undefined') return;

    // Track page views
    this.recordMetric('PageView', Date.now());

    // Track clicks on important elements
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (target.matches('button, a, [role="button"]')) {
        this.recordMetric('Click', Date.now(), {
          element: target.tagName.toLowerCase(),
          text: target.textContent?.slice(0, 50) || '',
        });
      }
    });

    // Track form submissions
    document.addEventListener('submit', () => {
      this.recordMetric('FormSubmit', Date.now());
    });
  }

  private recordMetric(name: string, value: number, metadata?: any) {
    if (!this.isEnabled) return;

    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      url: typeof window !== 'undefined' ? window.location.href : '',
      userId: this.getUserId(),
    };

    this.metrics.push(metric);

    // Send to analytics service (mock implementation)
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', name, {
        value: value,
        custom_map: metadata,
      });
    }

    // Log for development
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Performance Metric:', metric);
    }

    // Batch send to monitoring service
    if (this.metrics.length >= 10) {
      this.sendMetrics();
    }
  }

  private getUserId(): string | undefined {
    if (typeof window === 'undefined') return undefined;
    return localStorage.getItem('protothrive_userId') || 'anonymous';
  }

  private async sendMetrics() {
    if (!this.isEnabled || this.metrics.length === 0) return;

    try {
      // In production, send to your analytics endpoint
      const response = await fetch('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metrics: this.metrics,
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
        }),
      });

      if (response.ok) {
        this.metrics = []; // Clear sent metrics
      }
    } catch (error) {
      console.error('Failed to send metrics:', error);
    }
  }

  // Public method to track custom events
  public trackEvent(eventName: string, value?: number, metadata?: any) {
    this.recordMetric(`Custom-${eventName}`, value || Date.now(), metadata);
  }

  // Public method to get current metrics
  public getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  // Cleanup method
  public cleanup() {
    this.sendMetrics(); // Send remaining metrics
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Export for manual usage
export default PerformanceMonitor;