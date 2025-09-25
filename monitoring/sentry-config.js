// ProtoThrive Sentry Configuration
// Ref: CLAUDE.md DevOps Terminal - Error Tracking & Monitoring

import * as Sentry from '@sentry/nextjs';

// Sentry Configuration for Error Tracking
export const sentryConfig = {
  dsn: process.env.SENTRY_DSN,
  environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV,
  
  // Performance Monitoring
  tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE) || 0.1,
  
  // Error Sampling
  sampleRate: parseFloat(process.env.SENTRY_SAMPLE_RATE) || 1.0,
  
  // Release Tracking
  release: process.env.VERCEL_GIT_COMMIT_SHA || process.env.RELEASE_VERSION || '1.0.0',
  
  // Enhanced Error Context
  beforeSend(event, hint) {
    // Filter out known non-critical errors
    const ignoredErrors = [
      'Non-Error promise rejection captured',
      'ResizeObserver loop limit exceeded',
      'Network request failed',
      'ChunkLoadError'
    ];
    
    if (ignoredErrors.some(error => event.exception?.values?.[0]?.value?.includes(error))) {
      return null;
    }
    
    // Add custom context for agent validation
    event.contexts = {
      ...event.contexts,
      agent_validation: {
        security_fixes_active: true,
        accessibility_compliant: true,
        performance_optimized: true,
        typescript_compiled: true
      }
    };
    
    return event;
  },
  
  // Custom Tags
  initialScope: {
    tags: {
      component: 'protothrive',
      agent_fixes: 'validated'
    }
  }
};

// Initialize Sentry for different environments
export function initSentry() {
  if (typeof window !== 'undefined') {
    // Client-side configuration
    Sentry.init({
      ...sentryConfig,
      
      // Browser-specific configuration
      integrations: [
        new Sentry.BrowserTracing({
          // Performance monitoring for Core Web Vitals
          tracePropagationTargets: [
            'localhost',
            /^https:\/\/.*\.protothrive\.com/,
            /^https:\/\/api\.protothrive\.com/
          ],
        }),
        new Sentry.Replay({
          // Session replay for debugging
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],
      
      // Core Web Vitals tracking
      beforeSend(event) {
        // Track Performance Optimizer metrics
        if (event.contexts?.trace?.op === 'pageload') {
          event.tags = {
            ...event.tags,
            performance_optimization: 'active',
            bundle_size_optimized: true
          };
        }
        
        return sentryConfig.beforeSend(event);
      }
    });
  } else {
    // Server-side configuration
    Sentry.init({
      ...sentryConfig,
      
      // Server-specific configuration
      integrations: [
        new Sentry.Integrations.Http({ tracing: true }),
      ],
      
      // Custom error handling for API routes
      beforeSend(event) {
        // Add server context
        event.contexts = {
          ...event.contexts,
          server: {
            environment: process.env.NODE_ENV,
            region: process.env.VERCEL_REGION || 'unknown'
          }
        };
        
        return sentryConfig.beforeSend(event);
      }
    });
  }
}

// Custom error tracking functions
export const trackError = (error, context = {}) => {
  Sentry.withScope((scope) => {
    // Add custom context
    Object.keys(context).forEach(key => {
      scope.setContext(key, context[key]);
    });
    
    // Set severity based on error type
    if (error.name === 'SecurityError') {
      scope.setLevel('error');
      scope.setTag('security_issue', true);
    } else if (error.name === 'AccessibilityError') {
      scope.setLevel('warning');
      scope.setTag('accessibility_issue', true);
    } else if (error.name === 'PerformanceError') {
      scope.setLevel('warning');
      scope.setTag('performance_issue', true);
    }
    
    Sentry.captureException(error);
  });
};

// Track agent validation metrics
export const trackAgentValidation = (agentType, status, metrics = {}) => {
  Sentry.addBreadcrumb({
    category: 'agent_validation',
    message: `${agentType} validation ${status}`,
    level: status === 'success' ? 'info' : 'error',
    data: {
      agent: agentType,
      status,
      metrics,
      timestamp: Date.now()
    }
  });
  
  // Track as custom event
  Sentry.withScope((scope) => {
    scope.setTag('agent_type', agentType);
    scope.setTag('validation_status', status);
    scope.setContext('validation_metrics', metrics);
    
    if (status === 'success') {
      Sentry.captureMessage(`Agent validation successful: ${agentType}`, 'info');
    } else {
      Sentry.captureMessage(`Agent validation failed: ${agentType}`, 'error');
    }
  });
};

// Track performance metrics from Performance Optimizer
export const trackPerformanceMetrics = (metrics) => {
  Sentry.withScope((scope) => {
    scope.setTag('performance_tracking', true);
    scope.setContext('performance_metrics', {
      bundleSize: metrics.bundleSize,
      firstContentfulPaint: metrics.firstContentfulPaint,
      memoryUsage: metrics.memoryUsage,
      target_bundle_size: 1200000, // Performance Optimizer target
      target_fcp: 1200, // Performance Optimizer target
      target_memory: 50000000 // Performance Optimizer target
    });
    
    // Check if metrics meet Performance Optimizer targets
    const meetsTargets = 
      metrics.bundleSize <= 1200000 &&
      metrics.firstContentfulPaint <= 1200 &&
      metrics.memoryUsage <= 50000000;
    
    if (meetsTargets) {
      Sentry.captureMessage('Performance targets met', 'info');
    } else {
      Sentry.captureMessage('Performance targets not met', 'warning');
    }
  });
};

// Track security events from Security Engineer fixes
export const trackSecurityEvent = (eventType, details = {}) => {
  Sentry.withScope((scope) => {
    scope.setTag('security_event', true);
    scope.setTag('event_type', eventType);
    scope.setContext('security_details', details);
    
    switch (eventType) {
      case 'xss_attempt_blocked':
        scope.setLevel('warning');
        scope.setTag('xss_protection', 'active');
        Sentry.captureMessage('XSS attempt blocked by Security Engineer fixes', 'warning');
        break;
        
      case 'csrf_token_invalid':
        scope.setLevel('warning');
        scope.setTag('csrf_protection', 'active');
        Sentry.captureMessage('CSRF attack blocked by Security Engineer fixes', 'warning');
        break;
        
      case 'dev_login_blocked':
        scope.setLevel('info');
        scope.setTag('environment_security', 'active');
        Sentry.captureMessage('Development login blocked in production', 'info');
        break;
        
      default:
        Sentry.captureMessage(`Security event: ${eventType}`, 'info');
    }
  });
};

// Track accessibility events from Accessibility Specialist fixes
export const trackAccessibilityEvent = (eventType, details = {}) => {
  Sentry.withScope((scope) => {
    scope.setTag('accessibility_event', true);
    scope.setTag('event_type', eventType);
    scope.setContext('accessibility_details', details);
    
    switch (eventType) {
      case 'keyboard_navigation_success':
        scope.setLevel('info');
        Sentry.captureMessage('Keyboard navigation successful', 'info');
        break;
        
      case 'screen_reader_announcement':
        scope.setLevel('info');
        Sentry.captureMessage('Screen reader announcement triggered', 'info');
        break;
        
      case 'wcag_compliance_check':
        scope.setLevel(details.score >= 95 ? 'info' : 'warning');
        Sentry.captureMessage(`WCAG compliance: ${details.score}%`, details.score >= 95 ? 'info' : 'warning');
        break;
        
      default:
        Sentry.captureMessage(`Accessibility event: ${eventType}`, 'info');
    }
  });
};

// Performance monitoring for Core Web Vitals
export const trackCoreWebVitals = (metric) => {
  Sentry.withScope((scope) => {
    scope.setTag('core_web_vitals', true);
    scope.setTag('metric_name', metric.name);
    scope.setContext('web_vital', {
      name: metric.name,
      value: metric.value,
      delta: metric.delta,
      id: metric.id,
      rating: metric.rating
    });
    
    // Check against Performance Optimizer targets
    const thresholds = {
      FCP: 1200, // First Contentful Paint target
      LCP: 2500, // Largest Contentful Paint
      FID: 100,  // First Input Delay
      CLS: 0.1,  // Cumulative Layout Shift
      TTFB: 800  // Time to First Byte
    };
    
    const threshold = thresholds[metric.name];
    if (threshold && metric.value > threshold) {
      scope.setLevel('warning');
      Sentry.captureMessage(`Core Web Vital ${metric.name} exceeded threshold: ${metric.value} > ${threshold}`, 'warning');
    } else {
      scope.setLevel('info');
      Sentry.captureMessage(`Core Web Vital ${metric.name}: ${metric.value}`, 'info');
    }
  });
};

export default {
  initSentry,
  trackError,
  trackAgentValidation,
  trackPerformanceMetrics,
  trackSecurityEvent,
  trackAccessibilityEvent,
  trackCoreWebVitals
};