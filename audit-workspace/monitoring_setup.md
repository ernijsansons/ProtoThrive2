# ProtoThrive Monitoring & Observability Setup Guide

## Overview
Complete monitoring stack configuration for ProtoThrive frontend application covering performance, errors, security, and user analytics.

---

## 1. Error Tracking (Sentry)

### Installation
```bash
npm install @sentry/react @sentry/tracing
```

### Configuration
```javascript
// src/monitoring/sentry.js
import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

export function initSentry() {
  Sentry.init({
    dsn: process.env.REACT_APP_SENTRY_DSN,
    environment: process.env.REACT_APP_ENV,
    integrations: [
      new BrowserTracing(),
      new Sentry.Replay({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    
    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    // Session Replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    
    // Release Tracking
    release: process.env.REACT_APP_VERSION,
    
    // Error Filtering
    beforeSend(event, hint) {
      // Filter out known non-critical errors
      if (event.exception) {
        const error = hint.originalException;
        
        // Ignore network errors
        if (error?.message?.includes('Network request failed')) {
          return null;
        }
        
        // Ignore browser extension errors
        if (error?.stack?.includes('extension://')) {
          return null;
        }
      }
      
      // Add user context
      event.user = {
        id: getUserId(),
        email: getUserEmail(),
      };
      
      return event;
    },
    
    // Breadcrumb filtering
    beforeBreadcrumb(breadcrumb) {
      // Don't log sensitive data
      if (breadcrumb.category === 'console' && breadcrumb.level === 'debug') {
        return null;
      }
      return breadcrumb;
    },
  });
}

// Usage in App.jsx
import { ErrorBoundary } from '@sentry/react';

function App() {
  return (
    <ErrorBoundary fallback={ErrorFallback} showDialog>
      <Routes />
    </ErrorBoundary>
  );
}
```

### Custom Error Tracking
```javascript
// Track custom errors
Sentry.captureException(new Error('Custom error'), {
  tags: {
    section: 'payment',
    user_tier: 'premium'
  },
  level: 'error',
  extra: {
    order_id: '12345',
    amount: 99.99
  }
});

// Track messages
Sentry.captureMessage('User completed onboarding', 'info');

// Track user feedback
Sentry.showReportDialog({
  user: {
    email: 'user@example.com',
    name: 'User Name'
  }
});
```

---

## 2. Application Performance Monitoring (DataDog RUM)

### Installation
```bash
npm install @datadog/browser-rum @datadog/browser-logs
```

### Configuration
```javascript
// src/monitoring/datadog.js
import { datadogRum } from '@datadog/browser-rum';
import { datadogLogs } from '@datadog/browser-logs';

export function initDataDog() {
  datadogRum.init({
    applicationId: process.env.REACT_APP_DD_APPLICATION_ID,
    clientToken: process.env.REACT_APP_DD_CLIENT_TOKEN,
    site: 'datadoghq.com',
    service: 'protothrive-frontend',
    env: process.env.REACT_APP_ENV,
    version: process.env.REACT_APP_VERSION,
    sessionSampleRate: 100,
    sessionReplaySampleRate: 20,
    trackUserInteractions: true,
    trackResources: true,
    trackLongTasks: true,
    defaultPrivacyLevel: 'mask-user-input',
    
    // Custom actions
    trackViewsManually: false,
    
    // Performance tracking
    enableExperimentalFeatures: ['clickmap'],
  });
  
  datadogLogs.init({
    clientToken: process.env.REACT_APP_DD_CLIENT_TOKEN,
    site: 'datadoghq.com',
    service: 'protothrive-frontend',
    forwardErrorsToLogs: true,
    sampleRate: 100,
  });
  
  // Start RUM session
  datadogRum.startSessionReplayRecording();
}

// Custom metrics
export function trackCustomMetric(name, value, tags = {}) {
  datadogRum.addAction(name, {
    value,
    ...tags
  });
}

// User tracking
export function identifyUser(user) {
  datadogRum.setUser({
    id: user.id,
    email: user.email,
    name: user.name,
    plan: user.subscription_plan,
  });
}
```

---

## 3. Analytics (Google Analytics 4)

### Installation
```bash
npm install react-ga4
```

### Configuration
```javascript
// src/monitoring/analytics.js
import ReactGA from 'react-ga4';

export function initAnalytics() {
  ReactGA.initialize(process.env.REACT_APP_GA_MEASUREMENT_ID, {
    gaOptions: {
      siteSpeedSampleRate: 100,
      cookieFlags: 'SameSite=None;Secure'
    }
  });
}

// Track page views
export function trackPageView(path) {
  ReactGA.send({
    hitType: 'pageview',
    page: path,
    title: document.title
  });
}

// Track events
export function trackEvent(category, action, label, value) {
  ReactGA.event({
    category,
    action,
    label,
    value,
    transport: 'beacon'
  });
}

// Track conversions
export function trackConversion(type, value) {
  ReactGA.event({
    category: 'Conversion',
    action: type,
    value: value,
    transport: 'beacon'
  });
  
  // Also send to Google Ads if configured
  if (window.gtag) {
    window.gtag('event', 'conversion', {
      send_to: process.env.REACT_APP_GOOGLE_ADS_ID,
      value: value,
      currency: 'USD'
    });
  }
}

// E-commerce tracking
export function trackPurchase(transactionData) {
  ReactGA.event({
    category: 'Ecommerce',
    action: 'Purchase',
    value: transactionData.value
  });
  
  // Enhanced ecommerce
  ReactGA.gtag('event', 'purchase', {
    transaction_id: transactionData.id,
    value: transactionData.total,
    tax: transactionData.tax,
    shipping: transactionData.shipping,
    currency: 'USD',
    items: transactionData.items
  });
}
```

---

## 4. Synthetic Monitoring (Checkly)

### API Checks Configuration
```javascript
// checkly.checks.js
const { ApiCheck } = require('@checkly/cli/constructs');

new ApiCheck('health-check', {
  name: 'ProtoThrive Health Check',
  frequency: 5,
  locations: ['us-east-1', 'eu-west-1', 'ap-southeast-1'],
  request: {
    method: 'GET',
    url: 'https://protothrive-frontend.pages.dev/api/health',
    assertions: [
      {
        source: 'STATUS_CODE',
        comparison: 'EQUALS',
        target: '200'
      },
      {
        source: 'RESPONSE_TIME',
        comparison: 'LESS_THAN',
        target: '1000'
      }
    ]
  }
});
```

### Browser Checks
```javascript
// checkly.browser.js
const { BrowserCheck } = require('@checkly/cli/constructs');

new BrowserCheck('user-journey', {
  name: 'Critical User Journey',
  frequency: 10,
  locations: ['us-east-1', 'eu-west-1'],
  script: `
    const { chromium } = require('playwright');
    
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    // Navigate to homepage
    await page.goto('https://protothrive-frontend.pages.dev');
    
    // Check page loads
    await page.waitForSelector('h1', { timeout: 5000 });
    
    // Click sign up
    await page.click('button:has-text("Sign Up")');
    
    // Fill form
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'TestPassword123!');
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Verify redirect
    await page.waitForURL('**/dashboard');
    
    await browser.close();
  `
});
```

---

## 5. Infrastructure Monitoring (CloudWatch)

### Cloudflare Pages Metrics
```javascript
// cloudflare-metrics.js
const CloudflareAPI = require('cloudflare');

const cf = new CloudflareAPI({
  token: process.env.CF_API_TOKEN
});

async function getMetrics() {
  const zoneId = process.env.CF_ZONE_ID;
  
  // Get analytics
  const analytics = await cf.zones.analytics.get(zoneId, {
    since: '-1440',
    until: '0',
    continuous: true
  });
  
  // Get Web Analytics
  const webAnalytics = await cf.accounts.analytics.get(
    process.env.CF_ACCOUNT_ID,
    {
      site_tag: process.env.CF_SITE_TAG,
      since: '-1440'
    }
  );
  
  return {
    requests: analytics.totals.requests,
    bandwidth: analytics.totals.bandwidth,
    threats: analytics.totals.threats,
    pageViews: webAnalytics.pageViews,
    visits: webAnalytics.visits,
    bounceRate: webAnalytics.bounceRate
  };
}
```

---

## 6. Custom Metrics Dashboard

### Combined Monitoring Dashboard
```javascript
// src/monitoring/dashboard.js
class MonitoringDashboard {
  constructor() {
    this.metrics = {
      performance: {},
      errors: [],
      analytics: {},
      custom: {}
    };
  }
  
  // Collect Core Web Vitals
  collectWebVitals() {
    if ('PerformanceObserver' in window) {
      // LCP
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.metrics.performance.lcp = lastEntry.renderTime || lastEntry.loadTime;
      }).observe({ type: 'largest-contentful-paint', buffered: true });
      
      // FID
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          this.metrics.performance.fid = entry.processingStart - entry.startTime;
        });
      }).observe({ type: 'first-input', buffered: true });
      
      // CLS
      let clsValue = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            this.metrics.performance.cls = clsValue;
          }
        }
      }).observe({ type: 'layout-shift', buffered: true });
    }
  }
  
  // Track custom business metrics
  trackBusinessMetric(name, value, metadata = {}) {
    this.metrics.custom[name] = {
      value,
      timestamp: Date.now(),
      ...metadata
    };
    
    // Send to monitoring services
    this.sendToDataDog(name, value, metadata);
    this.sendToAnalytics(name, value, metadata);
  }
  
  // Error aggregation
  aggregateErrors() {
    return {
      total: this.metrics.errors.length,
      byType: this.groupBy(this.metrics.errors, 'type'),
      byPage: this.groupBy(this.metrics.errors, 'page'),
      bySeverity: this.groupBy(this.metrics.errors, 'severity')
    };
  }
  
  // Send to monitoring services
  sendToDataDog(metric, value, tags) {
    if (window.DD_RUM) {
      window.DD_RUM.addAction(metric, { value, ...tags });
    }
  }
  
  sendToAnalytics(metric, value, metadata) {
    if (window.gtag) {
      window.gtag('event', metric, {
        value,
        ...metadata
      });
    }
  }
  
  // Generate report
  generateReport() {
    return {
      timestamp: new Date().toISOString(),
      performance: this.metrics.performance,
      errors: this.aggregateErrors(),
      analytics: this.metrics.analytics,
      custom: this.metrics.custom
    };
  }
}

export default new MonitoringDashboard();
```

---

## 7. Alert Configuration

### PagerDuty Integration
```javascript
// alerts/pagerduty.js
const PagerDuty = require('node-pagerduty');

const pd = new PagerDuty(process.env.PAGERDUTY_API_KEY);

export async function triggerAlert(severity, title, details) {
  const incident = {
    incident: {
      type: 'incident',
      title,
      service: {
        id: process.env.PAGERDUTY_SERVICE_ID,
        type: 'service_reference'
      },
      urgency: severity === 'critical' ? 'high' : 'low',
      body: {
        type: 'incident_body',
        details
      }
    }
  };
  
  await pd.incidents.createIncident(incident);
}
```

### Alert Rules
```yaml
# monitoring/alerts.yml
alerts:
  - name: High Error Rate
    condition: error_rate > 5%
    duration: 5 minutes
    severity: critical
    notify:
      - pagerduty
      - slack
      - email
  
  - name: Slow Page Load
    condition: p95_load_time > 3s
    duration: 10 minutes
    severity: warning
    notify:
      - slack
      - email
  
  - name: Failed Deployments
    condition: deployment_status = failed
    severity: critical
    notify:
      - pagerduty
      - slack
  
  - name: Security Violations
    condition: csp_violations > 100
    duration: 1 minute
    severity: critical
    notify:
      - security_team
      - pagerduty
  
  - name: Low Conversion Rate
    condition: conversion_rate < 1%
    duration: 1 hour
    severity: warning
    notify:
      - product_team
      - slack
```

---

## 8. Performance Budget Monitoring

```javascript
// performance-budget.js
const performanceBudget = {
  metrics: {
    lcp: 2500, // ms
    fid: 100,  // ms
    cls: 0.1,
    tti: 3800, // ms
    fcp: 1800, // ms
  },
  resources: {
    javascript: 250, // KB
    css: 100,        // KB
    images: 500,     // KB
    total: 1000      // KB
  }
};

export function checkPerformanceBudget(metrics) {
  const violations = [];
  
  // Check metrics
  Object.keys(performanceBudget.metrics).forEach(metric => {
    if (metrics[metric] > performanceBudget.metrics[metric]) {
      violations.push({
        type: 'metric',
        name: metric,
        budget: performanceBudget.metrics[metric],
        actual: metrics[metric],
        exceeded: metrics[metric] - performanceBudget.metrics[metric]
      });
    }
  });
  
  // Check resources
  Object.keys(performanceBudget.resources).forEach(resource => {
    if (metrics.resources[resource] > performanceBudget.resources[resource]) {
      violations.push({
        type: 'resource',
        name: resource,
        budget: performanceBudget.resources[resource],
        actual: metrics.resources[resource],
        exceeded: metrics.resources[resource] - performanceBudget.resources[resource]
      });
    }
  });
  
  return violations;
}
```

---

## 9. Logging Strategy

```javascript
// src/utils/logger.js
class Logger {
  constructor(service = 'protothrive-frontend') {
    this.service = service;
    this.buffer = [];
    this.batchSize = 50;
    this.flushInterval = 5000;
    
    // Auto-flush
    setInterval(() => this.flush(), this.flushInterval);
  }
  
  log(level, message, metadata = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      service: this.service,
      message,
      metadata: {
        ...metadata,
        url: window.location.href,
        userAgent: navigator.userAgent,
        userId: this.getUserId()
      }
    };
    
    // Add to buffer
    this.buffer.push(logEntry);
    
    // Console output in dev
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${level.toUpperCase()}]`, message, metadata);
    }
    
    // Send to monitoring
    this.sendToMonitoring(logEntry);
    
    // Flush if buffer is full
    if (this.buffer.length >= this.batchSize) {
      this.flush();
    }
  }
  
  error(message, error, metadata = {}) {
    this.log('error', message, {
      ...metadata,
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      }
    });
    
    // Also send to Sentry
    if (window.Sentry) {
      window.Sentry.captureException(error);
    }
  }
  
  warn(message, metadata = {}) {
    this.log('warn', message, metadata);
  }
  
  info(message, metadata = {}) {
    this.log('info', message, metadata);
  }
  
  debug(message, metadata = {}) {
    if (process.env.NODE_ENV === 'development') {
      this.log('debug', message, metadata);
    }
  }
  
  metric(name, value, unit = 'count', metadata = {}) {
    this.log('metric', name, {
      value,
      unit,
      ...metadata
    });
  }
  
  async flush() {
    if (this.buffer.length === 0) return;
    
    const logs = [...this.buffer];
    this.buffer = [];
    
    try {
      await fetch('/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ logs })
      });
    } catch (error) {
      console.error('Failed to send logs:', error);
      // Re-add to buffer
      this.buffer.unshift(...logs);
    }
  }
  
  sendToMonitoring(logEntry) {
    // Send to DataDog
    if (window.DD_LOGS) {
      window.DD_LOGS.logger.log(
        logEntry.message,
        {
          level: logEntry.level,
          ...logEntry.metadata
        }
      );
    }
  }
  
  getUserId() {
    // Get from auth context or storage
    return localStorage.getItem('userId') || 'anonymous';
  }
}

export default new Logger();
```

---

## 10. Monitoring Checklist

### Pre-Deployment
- [ ] Sentry DSN configured
- [ ] DataDog RUM initialized
- [ ] Google Analytics configured
- [ ] Performance budgets set
- [ ] Alert rules defined
- [ ] Error boundaries implemented
- [ ] Logging strategy implemented

### Post-Deployment
- [ ] Verify error tracking working
- [ ] Confirm analytics events firing
- [ ] Check performance metrics collection
- [ ] Test alert notifications
- [ ] Validate session recordings
- [ ] Monitor real user metrics
- [ ] Review initial performance data

### Weekly Reviews
- [ ] Error rate trends
- [ ] Performance degradation
- [ ] User engagement metrics
- [ ] Conversion funnel analysis
- [ ] Resource utilization
- [ ] Security incidents
- [ ] Alert noise ratio

### Monthly Audits
- [ ] Update performance budgets
- [ ] Review alert thresholds
- [ ] Analyze user feedback
- [ ] Cost optimization
- [ ] Tool effectiveness
- [ ] Documentation updates
- [ ] Team training needs

---

## Environment Variables

```bash
# .env.production
REACT_APP_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
REACT_APP_DD_APPLICATION_ID=xxxxx
REACT_APP_DD_CLIENT_TOKEN=xxxxx
REACT_APP_GA_MEASUREMENT_ID=G-XXXXX
REACT_APP_GOOGLE_ADS_ID=AW-XXXXX
REACT_APP_ENV=production
REACT_APP_VERSION=1.0.0

# Monitoring endpoints
REACT_APP_METRICS_ENDPOINT=https://api.protothrive.com/metrics
REACT_APP_LOGS_ENDPOINT=https://api.protothrive.com/logs
REACT_APP_TRACES_ENDPOINT=https://api.protothrive.com/traces
```

---

## Support & Escalation

### Monitoring Team Contacts
- **On-Call Engineer:** pagerduty.com/protothrive
- **DevOps Lead:** devops@protothrive.com
- **Security Team:** security@protothrive.com

### Escalation Path
1. L1: Automated alerts → On-call engineer
2. L2: Unresolved after 30 min → Team Lead
3. L3: Customer impact → Director of Engineering
4. L4: Major outage → CTO

### Documentation
- Runbooks: [Internal Wiki]
- Dashboards: [DataDog Dashboard]
- Logs: [CloudWatch Logs]
- Metrics: [Grafana Dashboard]
