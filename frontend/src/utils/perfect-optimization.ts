// Perfect Optimization Utilities
import { useState, useEffect } from 'react';

export const perfectOptimization = {
  // Perfect performance monitoring
  performance: {
    metrics: {
      fcp: 0, // First Contentful Paint
      lcp: 0, // Largest Contentful Paint
      fid: 0, // First Input Delay
      cls: 0, // Cumulative Layout Shift
      ttfb: 0 // Time to First Byte
    },
    
    measure: () => {
      if ('PerformanceObserver' in window) {
        // Measure Core Web Vitals
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            // Use duration for paint entries, or cast to any for specialized entries
            const value = (entry as any).value || entry.duration || entry.startTime;
            perfectOptimization.performance.metrics[entry.name] = value;
          }
        });
        
        observer.observe({ entryTypes: ['paint', 'largest-contentful-paint', 'first-input', 'layout-shift'] });
      }
    },
    
    getScore: () => {
      const { fcp, lcp, fid, cls } = perfectOptimization.performance.metrics;
      let score = 100;
      
      if (fcp > 1800) score -= 10;
      if (lcp > 2500) score -= 25;
      if (fid > 100) score -= 10;
      if (cls > 0.1) score -= 10;
      
      return Math.max(0, score);
    }
  },
  
  // Perfect error handling
  errorHandling: {
    globalHandler: (error: Error, errorInfo?: any) => {
      console.error('Perfect Error Handler:', error, errorInfo);
      
      // Send to monitoring service
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'exception', {
          description: error.message,
          fatal: false
        });
      }
    },
    
    boundaryHandler: (error: Error, errorInfo: any) => {
      console.error('Perfect Error Boundary:', error, errorInfo);
      
      // Log to service
      fetch('/api/log-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: error.message, stack: error.stack, info: errorInfo })
      }).catch(console.error);
    }
  },
  
  // Perfect accessibility
  accessibility: {
    checkA11y: () => {
      const issues: string[] = [];
      
      // Check for alt text
      document.querySelectorAll('img').forEach(img => {
        if (!img.alt) issues.push('Missing alt text on image');
      });
      
      // Check for ARIA labels
      document.querySelectorAll('[role]').forEach(el => {
        if (!el.getAttribute('aria-label') && !el.getAttribute('aria-labelledby')) {
          issues.push('Missing ARIA label');
        }
      });
      
      // Check for keyboard navigation
      document.querySelectorAll('button, a, input').forEach(el => {
        const htmlEl = el as HTMLElement;
        if (!htmlEl.tabIndex && htmlEl.style.display !== 'none') {
          issues.push('Element not keyboard accessible');
        }
      });
      
      return issues;
    },
    
    fixA11y: () => {
      // Auto-fix common accessibility issues
      document.querySelectorAll('img:not([alt])').forEach(img => {
        (img as HTMLImageElement).alt = 'Image';
      });
      
      document.querySelectorAll('button:not([aria-label])').forEach(button => {
        if (button.textContent) {
          button.setAttribute('aria-label', button.textContent.trim());
        }
      });
    }
  },
  
  // Perfect SEO
  seo: {
    metaTags: {
      title: document.title,
      description: document.querySelector('meta[name="description"]')?.getAttribute('content') || '',
      keywords: document.querySelector('meta[name="keywords"]')?.getAttribute('content') || '',
      ogImage: document.querySelector('meta[property="og:image"]')?.getAttribute('content') || '',
      canonical: document.querySelector('link[rel="canonical"]')?.getAttribute('href') || ''
    },
    
    optimize: () => {
      // Ensure meta tags are present
      if (!document.querySelector('meta[name="description"]')) {
        const meta = document.createElement('meta');
        meta.name = 'description';
        meta.content = 'ProtoThrive - AI-first SaaS platform for software engineering';
        document.head.appendChild(meta);
      }
      
      if (!document.querySelector('meta[name="keywords"]')) {
        const meta = document.createElement('meta');
        meta.name = 'keywords';
        meta.content = 'AI, SaaS, software engineering, automation, productivity';
        document.head.appendChild(meta);
      }
    }
  }
};

// Perfect React hooks
export const usePerfectOptimization = () => {
  const [isOptimized, setIsOptimized] = useState(false);
  const [performanceScore, setPerformanceScore] = useState(100);
  const [accessibilityIssues, setAccessibilityIssues] = useState<string[]>([]);
  
  useEffect(() => {
    // Initialize perfect optimization
    perfectOptimization.performance.measure();
    perfectOptimization.accessibility.fixA11y();
    perfectOptimization.seo.optimize();
    
    setIsOptimized(true);
    
    // Monitor performance
    const interval = setInterval(() => {
      const score = perfectOptimization.performance.getScore();
      setPerformanceScore(score);
      
      const issues = perfectOptimization.accessibility.checkA11y();
      setAccessibilityIssues(issues);
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  return {
    isOptimized,
    performanceScore,
    accessibilityIssues,
    perfectOptimization
  };
};
