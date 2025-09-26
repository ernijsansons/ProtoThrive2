# ProtoThrive Performance Budget Configuration
## Complete Performance Monitoring & Optimization Guide

**Date:** September 25, 2025  
**Version:** 1.0  
**Status:** Implementation Ready

---

## Performance Budget Definition

### Core Web Vitals Targets

```javascript
// performance-budget.js
export const performanceBudget = {
  // Core Web Vitals (Required)
  metrics: {
    // Largest Contentful Paint
    LCP: {
      mobile: {
        target: 2500,    // milliseconds
        warning: 2000,
        critical: 3000
      },
      desktop: {
        target: 2000,
        warning: 1500,
        critical: 2500
      }
    },
    
    // First Input Delay / Interaction to Next Paint
    FID_INP: {
      mobile: {
        target: 100,     // milliseconds
        warning: 75,
        critical: 200
      },
      desktop: {
        target: 75,
        warning: 50,
        critical: 100
      }
    },
    
    // Cumulative Layout Shift
    CLS: {
      mobile: {
        target: 0.1,     // score
        warning: 0.05,
        critical: 0.25
      },
      desktop: {
        target: 0.05,
        warning: 0.025,
        critical: 0.1
      }
    },
    
    // Time to First Byte
    TTFB: {
      mobile: {
        target: 800,     // milliseconds
        warning: 600,
        critical: 1200
      },
      desktop: {
        target: 600,
        warning: 400,
        critical: 800
      }
    },
    
    // First Contentful Paint
    FCP: {
      mobile: {
        target: 1800,    // milliseconds
        warning: 1500,
        critical: 2500
      },
      desktop: {
        target: 1500,
        warning: 1200,
        critical: 2000
      }
    },
    
    // Time to Interactive
    TTI: {
      mobile: {
        target: 3800,    // milliseconds
        warning: 3500,
        critical: 5000
      },
      desktop: {
        target: 3000,
        warning: 2500,
        critical: 3800
      }
    },
    
    // Total Blocking Time
    TBT: {
      mobile: {
        target: 200,     // milliseconds
        warning: 150,
        critical: 350
      },
      desktop: {
        target: 150,
        warning: 100,
        critical: 250
      }
    },
    
    // Speed Index
    SI: {
      mobile: {
        target: 3400,    // score
        warning: 3000,
        critical: 4500
      },
      desktop: {
        target: 2500,
        warning: 2000,
        critical: 3400
      }
    }
  },
  
  // Resource Budgets
  resources: {
    // JavaScript Budget
    javascript: {
      total: {
        uncompressed: 500,    // KB
        compressed: 150       // KB (gzipped)
      },
      initial: {
        uncompressed: 200,    // KB
        compressed: 70        // KB (gzipped)
      },
      perRoute: {
        uncompressed: 50,     // KB
        compressed: 20        // KB (gzipped)
      },
      thirdParty: {
        uncompressed: 100,    // KB
        compressed: 35        // KB (gzipped)
      }
    },
    
    // CSS Budget
    css: {
      total: {
        uncompressed: 150,    // KB
        compressed: 30        // KB (gzipped)
      },
      critical: {
        inline: 15,           // KB (uncompressed)
        external: 0           // Should be inlined
      },
      perRoute: {
        uncompressed: 25,     // KB
        compressed: 8         // KB (gzipped)
      }
    },
    
    // Image Budget
    images: {
      hero: {
        mobile: 100,          // KB
        desktop: 200          // KB
      },
      thumbnail: {
        size: 30,             // KB
        dimensions: '400x300' // pixels
      },
      icon: {
        size: 5,              // KB
        dimensions: '64x64'   // pixels
      },
      total: {
        aboveFold: 300,       // KB
        perPage: 1000         // KB (1MB)
      }
    },
    
    // Font Budget
    fonts: {
      families: 2,            // Maximum font families
      total: 150,             // KB total
      perFont: 50,            // KB per font file
      variants: 4             // Maximum variants per family
    },
    
    // Document Budget
    html: {
      uncompressed: 15,       // KB
      compressed: 5           // KB (gzipped)
    },
    
    // API/Data Budget
    api: {
      criticalData: 50,       // KB
      lazyData: 200,          // KB
      responseTime: 200       // milliseconds
    }
  },
  
  // Request Budgets
  requests: {
    total: 50,                // Total requests
    critical: 10,             // Critical path requests
    domains: 5,               // Maximum domains
    thirdParty: 10,           // Third-party requests
    apiCalls: 20              // API calls
  },
  
  // Cache Performance
  caching: {
    hitRate: 80,              // Percentage
    staticAssets: 31536000,   // 1 year in seconds
    apiResponses: 300,        // 5 minutes in seconds
    htmlDocuments: 0          // No cache (always fresh)
  }
};
```

### Lighthouse CI Configuration

```javascript
// lighthouserc.js
module.exports = {
  ci: {
    collect: {
      url: [
        'https://protothrive-frontend.pages.dev/',
        'https://protothrive-frontend.pages.dev/features',
        'https://protothrive-frontend.pages.dev/pricing',
        'https://protothrive-frontend.pages.dev/about'
      ],
      numberOfRuns: 5,
      settings: {
        preset: 'desktop',
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1
        },
        screenEmulation: {
          mobile: false,
          width: 1920,
          height: 1080,
          deviceScaleFactor: 1
        }
      }
    },
    assert: {
      preset: 'lighthouse:recommended',
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
        'categories:pwa': ['warn', { minScore: 0.9 }],
        
        // Specific metric assertions
        'first-contentful-paint': ['error', { maxNumericValue: 1800 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'interactive': ['error', { maxNumericValue: 3800 }],
        'speed-index': ['error', { maxNumericValue: 3400 }],
        'total-blocking-time': ['error', { maxNumericValue: 200 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        
        // Resource size assertions
        'resource-summary:script:size': ['error', { maxNumericValue: 150000 }],
        'resource-summary:stylesheet:size': ['error', { maxNumericValue: 30000 }],
        'resource-summary:image:size': ['error', { maxNumericValue: 300000 }],
        'resource-summary:font:size': ['error', { maxNumericValue: 150000 }],
        'resource-summary:total:size': ['error', { maxNumericValue: 750000 }],
        
        // Request count assertions
        'resource-summary:script:count': ['error', { maxNumericValue: 10 }],
        'resource-summary:stylesheet:count': ['error', { maxNumericValue: 5 }],
        'resource-summary:image:count': ['error', { maxNumericValue: 20 }],
        'resource-summary:font:count': ['error', { maxNumericValue: 4 }],
        'resource-summary:third-party:count': ['error', { maxNumericValue: 10 }],
        
        // Accessibility specific
        'aria-*': 'error',
        'color-contrast': 'error',
        'document-title': 'error',
        'html-has-lang': 'error',
        'meta-description': 'error',
        
        // Best practices
        'errors-in-console': 'error',
        'no-document-write': 'error',
        'js-libraries': 'warn',
        'notification-on-start': 'error',
        'password-inputs-can-be-pasted-into': 'error',
        
        // SEO specific
        'meta-viewport': 'error',
        'http-status-code': 'error',
        'link-text': 'error',
        'crawlable-anchors': 'error',
        'canonical': 'error'
      }
    },
    upload: {
      target: 'temporary-public-storage'
    },
    server: {
      port: 9001,
      storage: {
        storageMethod: 'sql',
        sqlDatabasePath: './lighthouse-ci.db'
      }
    }
  }
};
```

### Webpack Bundle Analyzer Configuration

```javascript
// webpack.config.js - Bundle Analysis
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const CompressionPlugin = require('compression-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

module.exports = {
  mode: 'production',
  
  entry: {
    app: './src/index.js',
    vendor: ['react', 'react-dom', 'react-router-dom']
  },
  
  output: {
    filename: '[name].[contenthash].js',
    chunkFilename: '[name].[contenthash].chunk.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true
  },
  
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          parse: { ecma: 8 },
          compress: {
            ecma: 5,
            warnings: false,
            inline: 2,
            drop_console: true,
            drop_debugger: true,
            pure_funcs: ['console.log']
          },
          mangle: { safari10: true },
          format: {
            ecma: 5,
            comments: false,
            ascii_only: true
          }
        }
      }),
      new CssMinimizerPlugin()
    ],
    
    splitChunks: {
      chunks: 'all',
      maxInitialRequests: 25,
      minSize: 20000,
      maxSize: 244000,
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name(module) {
            const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1];
            return `npm.${packageName.replace('@', '')}`;
          },
          priority: 10,
          reuseExistingChunk: true
        },
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom|react-router)[\\/]/,
          name: 'react',
          priority: 20,
          reuseExistingChunk: true
        },
        common: {
          minChunks: 2,
          priority: -10,
          reuseExistingChunk: true
        },
        styles: {
          name: 'styles',
          test: /\.css$/,
          chunks: 'all',
          enforce: true
        }
      }
    },
    
    runtimeChunk: 'single',
    moduleIds: 'deterministic',
    
    usedExports: true,
    providedExports: true,
    sideEffects: false
  },
  
  plugins: [
    // Bundle analyzer
    new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      reportFilename: 'bundle-report.html',
      openAnalyzer: false,
      generateStatsFile: true,
      statsFilename: 'bundle-stats.json'
    }),
    
    // Compression
    new CompressionPlugin({
      algorithm: 'gzip',
      test: /\.(js|css|html|svg)$/,
      threshold: 10240,
      minRatio: 0.8
    }),
    
    // Brotli compression
    new CompressionPlugin({
      filename: '[path][base].br',
      algorithm: 'brotliCompress',
      test: /\.(js|css|html|svg)$/,
      compressionOptions: { level: 11 },
      threshold: 10240,
      minRatio: 0.8
    })
  ],
  
  performance: {
    hints: 'error',
    maxEntrypointSize: 250000,
    maxAssetSize: 250000,
    assetFilter: function(assetFilename) {
      return assetFilename.endsWith('.js') || assetFilename.endsWith('.css');
    }
  }
};
```

### Performance Monitoring Script

```typescript
// src/utils/performance-monitor.ts

interface PerformanceMetrics {
  FCP: number | null;
  LCP: number | null;
  FID: number | null;
  CLS: number | null;
  TTFB: number | null;
  INP: number | null;
  navigationTiming: PerformanceNavigationTiming | null;
  resources: PerformanceResourceTiming[];
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics;
  private budget: typeof performanceBudget;
  
  constructor(budget: typeof performanceBudget) {
    this.budget = budget;
    this.metrics = {
      FCP: null,
      LCP: null,
      FID: null,
      CLS: null,
      TTFB: null,
      INP: null,
      navigationTiming: null,
      resources: []
    };
    
    this.initialize();
  }
  
  private initialize() {
    if (typeof window === 'undefined') return;
    
    // Observe Core Web Vitals
    this.observeFCP();
    this.observeLCP();
    this.observeFID();
    this.observeCLS();
    this.observeINP();
    this.observeTTFB();
    
    // Monitor resources
    this.observeResources();
    
    // Set up reporting
    this.setupReporting();
  }
  
  private observeFCP() {
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
      if (fcpEntry) {
        this.metrics.FCP = fcpEntry.startTime;
        this.checkBudget('FCP', fcpEntry.startTime);
      }
    }).observe({ entryTypes: ['paint'] });
  }
  
  private observeLCP() {
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.metrics.LCP = lastEntry.startTime;
      this.checkBudget('LCP', lastEntry.startTime);
    }).observe({ entryTypes: ['largest-contentful-paint'] });
  }
  
  private observeFID() {
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const fidEntry = entries[0];
      if (fidEntry) {
        this.metrics.FID = fidEntry.processingStart - fidEntry.startTime;
        this.checkBudget('FID_INP', this.metrics.FID);
      }
    }).observe({ entryTypes: ['first-input'] });
  }
  
  private observeCLS() {
    let clsValue = 0;
    let clsEntries: PerformanceEntry[] = [];
    let sessionValue = 0;
    let sessionEntries: PerformanceEntry[] = [];
    
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          const firstSessionEntry = sessionEntries[0];
          const lastSessionEntry = sessionEntries[sessionEntries.length - 1];
          
          if (sessionValue && 
              entry.startTime - (lastSessionEntry as any).startTime < 1000 &&
              entry.startTime - (firstSessionEntry as any).startTime < 5000) {
            sessionValue += entry.value;
            sessionEntries.push(entry);
          } else {
            sessionValue = entry.value;
            sessionEntries = [entry];
          }
          
          if (sessionValue > clsValue) {
            clsValue = sessionValue;
            clsEntries = sessionEntries;
            this.metrics.CLS = clsValue;
            this.checkBudget('CLS', clsValue);
          }
        }
      });
    }).observe({ entryTypes: ['layout-shift'] });
  }
  
  private observeINP() {
    let worstINP = 0;
    
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      
      entries.forEach((entry: any) => {
        if (entry.interactionId) {
          const inp = entry.processingEnd - entry.startTime;
          if (inp > worstINP) {
            worstINP = inp;
            this.metrics.INP = worstINP;
            this.checkBudget('FID_INP', worstINP);
          }
        }
      });
    }).observe({ entryTypes: ['event'] });
  }
  
  private observeTTFB() {
    const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigationEntry) {
      this.metrics.TTFB = navigationEntry.responseStart - navigationEntry.requestStart;
      this.metrics.navigationTiming = navigationEntry;
      this.checkBudget('TTFB', this.metrics.TTFB);
    }
  }
  
  private observeResources() {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    
    this.metrics.resources = resources;
    
    // Check resource budgets
    const jsSize = resources
      .filter(r => r.name.endsWith('.js'))
      .reduce((sum, r) => sum + (r.transferSize || 0), 0);
    
    const cssSize = resources
      .filter(r => r.name.endsWith('.css'))
      .reduce((sum, r) => sum + (r.transferSize || 0), 0);
    
    const imageSize = resources
      .filter(r => r.initiatorType === 'img')
      .reduce((sum, r) => sum + (r.transferSize || 0), 0);
    
    const fontSize = resources
      .filter(r => r.name.includes('font') || r.name.endsWith('.woff') || r.name.endsWith('.woff2'))
      .reduce((sum, r) => sum + (r.transferSize || 0), 0);
    
    // Check against budgets
    this.checkResourceBudget('javascript', jsSize / 1024);
    this.checkResourceBudget('css', cssSize / 1024);
    this.checkResourceBudget('images', imageSize / 1024);
    this.checkResourceBudget('fonts', fontSize / 1024);
  }
  
  private checkBudget(metric: string, value: number) {
    const isMobile = window.innerWidth < 768;
    const device = isMobile ? 'mobile' : 'desktop';
    const budget = this.budget.metrics[metric]?.[device];
    
    if (!budget) return;
    
    if (value > budget.critical) {
      console.error(`⚠️ Performance Budget Violation: ${metric} = ${value}ms (critical: ${budget.critical}ms)`);
      this.reportViolation(metric, value, 'critical');
    } else if (value > budget.warning) {
      console.warn(`⚡ Performance Budget Warning: ${metric} = ${value}ms (warning: ${budget.warning}ms)`);
      this.reportViolation(metric, value, 'warning');
    } else if (value <= budget.target) {
      console.log(`✅ Performance Budget Met: ${metric} = ${value}ms (target: ${budget.target}ms)`);
    }
  }
  
  private checkResourceBudget(resourceType: string, sizeKB: number) {
    const budget = this.budget.resources[resourceType]?.total?.compressed;
    
    if (!budget) return;
    
    if (sizeKB > budget) {
      console.error(`⚠️ Resource Budget Violation: ${resourceType} = ${sizeKB.toFixed(2)}KB (budget: ${budget}KB)`);
      this.reportViolation(resourceType, sizeKB, 'critical');
    }
  }
  
  private reportViolation(metric: string, value: number, severity: 'warning' | 'critical') {
    // Send to analytics
    if (typeof window.gtag !== 'undefined') {
      window.gtag('event', 'performance_budget_violation', {
        metric,
        value,
        severity,
        url: window.location.href,
        device: window.innerWidth < 768 ? 'mobile' : 'desktop'
      });
    }
    
    // Send to monitoring service
    if (typeof window.Sentry !== 'undefined') {
      window.Sentry.captureMessage(`Performance Budget ${severity}: ${metric}`, {
        level: severity === 'critical' ? 'error' : 'warning',
        tags: {
          metric,
          value: value.toString(),
          url: window.location.href
        }
      });
    }
  }
  
  private setupReporting() {
    // Report metrics when page is about to unload
    window.addEventListener('beforeunload', () => {
      this.reportMetrics();
    });
    
    // Also report after 10 seconds
    setTimeout(() => {
      this.reportMetrics();
    }, 10000);
  }
  
  private reportMetrics() {
    const metrics = this.getMetrics();
    
    // Send to analytics
    if (typeof window.gtag !== 'undefined') {
      window.gtag('event', 'performance_metrics', metrics);
    }
    
    // Send to custom endpoint
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/metrics', JSON.stringify(metrics));
    }
    
    console.table(metrics);
  }
  
  public getMetrics(): PerformanceMetrics {
    return this.metrics;
  }
  
  public getBudgetStatus() {
    const isMobile = window.innerWidth < 768;
    const device = isMobile ? 'mobile' : 'desktop';
    const status: any = {};
    
    Object.keys(this.metrics).forEach(metric => {
      if (metric === 'resources' || metric === 'navigationTiming') return;
      
      const value = this.metrics[metric];
      const budget = this.budget.metrics[metric]?.[device];
      
      if (value !== null && budget) {
        status[metric] = {
          value,
          target: budget.target,
          status: value <= budget.target ? 'pass' : 
                  value <= budget.warning ? 'warning' : 'fail',
          percentage: ((value / budget.target) * 100).toFixed(2) + '%'
        };
      }
    });
    
    return status;
  }
}

// Initialize performance monitoring
if (typeof window !== 'undefined') {
  (window as any).performanceMonitor = new PerformanceMonitor(performanceBudget);
}

export default PerformanceMonitor;
```

### Real User Monitoring (RUM) Setup

```javascript
// src/utils/rum.js

class RealUserMonitoring {
  constructor() {
    this.sessionId = this.generateSessionId();
    this.metrics = {};
    this.init();
  }
  
  init() {
    // Web Vitals
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(this.sendMetric.bind(this));
      getFID(this.sendMetric.bind(this));
      getFCP(this.sendMetric.bind(this));
      getLCP(this.sendMetric.bind(this));
      getTTFB(this.sendMetric.bind(this));
    });
    
    // Custom metrics
    this.measureResourceTiming();
    this.measureUserTiming();
    this.trackErrors();
    this.trackPageViews();
  }
  
  generateSessionId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  sendMetric({ name, value, delta, id, entries }) {
    const metric = {
      metric: name,
      value,
      delta,
      id,
      sessionId: this.sessionId,
      url: window.location.href,
      timestamp: Date.now(),
      connection: navigator.connection?.effectiveType,
      device: this.getDeviceType(),
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };
    
    // Batch and send
    this.batchMetric(metric);
  }
  
  batchMetric(metric) {
    if (!this.metrics[metric.metric]) {
      this.metrics[metric.metric] = [];
    }
    this.metrics[metric.metric].push(metric);
    
    // Send batch every 5 seconds
    if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => {
        this.sendBatch();
        this.batchTimer = null;
      }, 5000);
    }
  }
  
  sendBatch() {
    if (Object.keys(this.metrics).length === 0) return;
    
    const payload = {
      sessionId: this.sessionId,
      metrics: this.metrics,
      timestamp: Date.now()
    };
    
    // Send via beacon API
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/rum', JSON.stringify(payload));
    } else {
      fetch('/api/rum', {
        method: 'POST',
        body: JSON.stringify(payload),
        keepalive: true
      });
    }
    
    // Clear metrics
    this.metrics = {};
  }
  
  measureResourceTiming() {
    const resources = performance.getEntriesByType('resource');
    
    const summary = {
      total: resources.length,
      totalSize: 0,
      totalDuration: 0,
      byType: {}
    };
    
    resources.forEach(resource => {
      const type = this.getResourceType(resource.name);
      
      if (!summary.byType[type]) {
        summary.byType[type] = {
          count: 0,
          size: 0,
          duration: 0
        };
      }
      
      summary.byType[type].count++;
      summary.byType[type].size += resource.transferSize || 0;
      summary.byType[type].duration += resource.duration || 0;
      
      summary.totalSize += resource.transferSize || 0;
      summary.totalDuration += resource.duration || 0;
    });
    
    this.sendMetric({
      name: 'resource-timing',
      value: summary,
      delta: 0,
      id: 'resources'
    });
  }
  
  getResourceType(url) {
    if (url.match(/\.(js|mjs)$/)) return 'script';
    if (url.match(/\.css$/)) return 'stylesheet';
    if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) return 'image';
    if (url.match(/\.(woff|woff2|ttf|eot)$/)) return 'font';
    if (url.match(/\.json$/)) return 'json';
    return 'other';
  }
  
  measureUserTiming() {
    // Measure custom user timings
    if (performance.getEntriesByType) {
      const measures = performance.getEntriesByType('measure');
      measures.forEach(measure => {
        this.sendMetric({
          name: `user-timing-${measure.name}`,
          value: measure.duration,
          delta: 0,
          id: measure.name
        });
      });
    }
  }
  
  trackErrors() {
    window.addEventListener('error', (event) => {
      this.sendMetric({
        name: 'javascript-error',
        value: 1,
        delta: 0,
        id: 'error',
        entries: [{
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          stack: event.error?.stack
        }]
      });
    });
    
    window.addEventListener('unhandledrejection', (event) => {
      this.sendMetric({
        name: 'unhandled-promise-rejection',
        value: 1,
        delta: 0,
        id: 'promise-error',
        entries: [{
          reason: event.reason,
          promise: event.promise
        }]
      });
    });
  }
  
  trackPageViews() {
    // Track initial page view
    this.sendMetric({
      name: 'page-view',
      value: 1,
      delta: 0,
      id: 'initial',
      entries: [{
        url: window.location.href,
        referrer: document.referrer,
        title: document.title
      }]
    });
    
    // Track navigation
    if (window.PerformanceObserver) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'navigation') {
            this.sendMetric({
              name: 'navigation',
              value: entry.duration,
              delta: 0,
              id: 'navigation',
              entries: [entry]
            });
          }
        });
      });
      
      observer.observe({ entryTypes: ['navigation'] });
    }
  }
  
  getDeviceType() {
    const ua = navigator.userAgent;
    if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
    if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(ua)) return 'mobile';
    return 'desktop';
  }
}

// Initialize RUM
if (typeof window !== 'undefined' && !window.RUM) {
  window.RUM = new RealUserMonitoring();
}
```

---

## Performance Optimization Checklist

### Critical Path Optimization
- [ ] Inline critical CSS
- [ ] Defer non-critical CSS
- [ ] Preload critical fonts
- [ ] Preconnect to required origins
- [ ] DNS prefetch third-party domains
- [ ] Lazy load below-fold images
- [ ] Implement resource hints

### JavaScript Optimization
- [ ] Code splitting implemented
- [ ] Tree shaking enabled
- [ ] Dead code eliminated
- [ ] Dynamic imports for routes
- [ ] Web Workers for heavy computation
- [ ] Service Worker for caching
- [ ] Bundle size < 150KB gzipped

### CSS Optimization
- [ ] Critical CSS inlined
- [ ] Unused CSS removed
- [ ] CSS-in-JS optimized
- [ ] PostCSS optimizations enabled
- [ ] Tailwind JIT mode enabled
- [ ] CSS < 30KB gzipped

### Image Optimization
- [ ] Next-gen formats (WebP/AVIF)
- [ ] Responsive images with srcset
- [ ] Lazy loading implemented
- [ ] Image CDN configured
- [ ] Placeholder/blur-up technique
- [ ] SVG optimization
- [ ] Hero image < 200KB

### Font Optimization
- [ ] Font-display: swap
- [ ] Subset fonts
- [ ] Variable fonts used
- [ ] Self-hosted fonts
- [ ] Preload critical fonts
- [ ] Maximum 2 font families
- [ ] < 150KB total font size

### Network Optimization
- [ ] HTTP/2 enabled
- [ ] Brotli compression
- [ ] CDN configured
- [ ] Cache headers optimized
- [ ] API response caching
- [ ] GraphQL/REST optimization
- [ ] WebSocket for real-time

### Runtime Optimization
- [ ] React.memo for expensive components
- [ ] useMemo/useCallback optimization
- [ ] Virtual scrolling for lists
- [ ] Debounced/throttled handlers
- [ ] RequestIdleCallback for non-critical
- [ ] Web Workers for computation
- [ ] Intersection Observer for visibility

---

## Monitoring Dashboard Setup

### Grafana Dashboard Config
```json
{
  "dashboard": {
    "title": "ProtoThrive Performance Metrics",
    "panels": [
      {
        "title": "Core Web Vitals",
        "targets": [
          {
            "metric": "LCP",
            "aggregation": "p75"
          },
          {
            "metric": "FID",
            "aggregation": "p75"
          },
          {
            "metric": "CLS",
            "aggregation": "p75"
          }
        ]
      },
      {
        "title": "Resource Budgets",
        "targets": [
          {
            "metric": "javascript_size",
            "threshold": 150
          },
          {
            "metric": "css_size",
            "threshold": 30
          },
          {
            "metric": "image_size",
            "threshold": 300
          }
        ]
      },
      {
        "title": "Performance Score",
        "targets": [
          {
            "metric": "lighthouse_performance",
            "threshold": 90
          }
        ]
      }
    ]
  }
}
```

---

## Alert Configuration

```yaml
# prometheus-alerts.yml
groups:
  - name: performance
    interval: 30s
    rules:
      - alert: HighLCP
        expr: histogram_quantile(0.75, lcp_histogram) > 2500
        for: 5m
        annotations:
          summary: "LCP exceeds budget ({{ $value }}ms)"
          
      - alert: HighCLS
        expr: cls_score > 0.1
        for: 5m
        annotations:
          summary: "CLS exceeds budget ({{ $value }})"
          
      - alert: SlowAPI
        expr: api_response_time > 200
        for: 5m
        annotations:
          summary: "API response time exceeds budget"
          
      - alert: LargeBundleSize
        expr: bundle_size_kb > 150
        for: 5m
        annotations:
          summary: "JavaScript bundle exceeds budget"
```

---

**Performance Budget Status:** ✅ Ready for Implementation  
**Monitoring:** ✅ Configured  
**Alerting:** ✅ Set Up  
**Documentation:** ✅ Complete
