# ProtoThrive Fix Sprint Plan
## Engineering-Ready Implementation Guide

**Sprint Duration:** 3 weeks (15 business days)  
**Team Size:** 5-7 engineers  
**Start Date:** September 26, 2025  

---

## SPRINT 1: Critical Recovery (Days 1-5)
**Goal:** Restore basic functionality and stop revenue bleeding  
**Success Metric:** Application loads successfully for 100% of users

### 🔴 TICKET #001: Fix Application Access Issue
**Priority:** P0 - BLOCKER  
**Assignee:** DevOps Lead  
**Effort:** 8 hours  
**Dependencies:** None  

#### Problem Statement
Application returns "Access denied" or infinite loading state, preventing all user access.

#### Root Cause Analysis
- Cloudflare Pages WAF rules may be blocking legitimate traffic
- React application failing to initialize
- Missing or misconfigured environment variables
- Build artifacts not properly deployed

#### Implementation Steps
```bash
# 1. Check Cloudflare Pages settings
cf pages project list
cf pages deployment list protothrive-frontend

# 2. Verify environment variables
echo $REACT_APP_API_URL
echo $REACT_APP_ENV

# 3. Check build output
ls -la dist/
cat dist/index.html

# 4. Test direct CDN access
curl -I https://protothrive-frontend.pages.dev/static/js/main.*.js
```

#### Solution Implementation
```javascript
// src/App.jsx - Add error boundary and initialization check
import React, { Component, useState, useEffect } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingScreen from './components/LoadingScreen';
import { initializeApp } from './utils/initialization';

function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        await initializeApp();
        setIsInitialized(true);
      } catch (error) {
        console.error('App initialization failed:', error);
        setInitError(error);
      }
    };

    // Add timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (!isInitialized) {
        setInitError(new Error('Initialization timeout'));
      }
    }, 5000);

    init();
    return () => clearTimeout(timeout);
  }, []);

  if (initError) {
    return <ErrorFallback error={initError} />;
  }

  if (!isInitialized) {
    return <LoadingScreen message="Initializing ProtoThrive..." />;
  }

  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  );
}
```

#### Acceptance Criteria
- [ ] Application loads within 3 seconds on 4G connection
- [ ] No "Access Denied" errors in production
- [ ] Error boundary catches and displays user-friendly errors
- [ ] Loading timeout shows fallback UI after 5 seconds
- [ ] Console errors are logged to monitoring service
- [ ] Passes smoke test suite

#### Testing Instructions
```bash
# E2E test
npm run test:e2e -- --spec tests/smoke.spec.ts

# Manual verification
1. Clear browser cache
2. Navigate to https://protothrive-frontend.pages.dev
3. Verify page loads within 3 seconds
4. Check console for errors
5. Test on mobile device
```

---

### 🔴 TICKET #002: Implement Security Headers
**Priority:** P0 - CRITICAL SECURITY  
**Assignee:** DevOps Engineer  
**Effort:** 4 hours  
**Dependencies:** None  

#### Implementation
```toml
# _headers file for Cloudflare Pages
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://www.google-analytics.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https: blob:; connect-src 'self' https://api.protothrive.com wss://api.protothrive.com https://www.google-analytics.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests;

/*.js
  Cache-Control: public, max-age=31536000, immutable

/*.css
  Cache-Control: public, max-age=31536000, immutable

/*.html
  Cache-Control: no-cache, no-store, must-revalidate
  Pragma: no-cache
  Expires: 0

/api/*
  Cache-Control: no-store
  Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

#### Nginx Alternative
```nginx
# nginx.conf
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline';" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
```

#### Verification
```bash
# Test security headers
curl -I https://protothrive-frontend.pages.dev | grep -E "X-Frame-Options|Content-Security-Policy|Strict-Transport-Security"

# Use online tool
open https://securityheaders.com/?q=protothrive-frontend.pages.dev
```

#### Acceptance Criteria
- [ ] All 7 security headers present in responses
- [ ] SecurityHeaders.com grade A or better
- [ ] CSP not blocking legitimate resources
- [ ] HSTS preload eligible
- [ ] No mixed content warnings

---

### 🔴 TICKET #003: Add Error Boundary Component
**Priority:** P0 - UX CRITICAL  
**Assignee:** Senior Frontend Dev  
**Effort:** 6 hours  
**Dependencies:** None  

#### Component Implementation
```tsx
// src/components/ErrorBoundary/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';
import * as Sentry from '@sentry/react';
import styles from './ErrorBoundary.module.css';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const errorId = `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    return { hasError: true, error, errorId };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    
    // Log to Sentry
    Sentry.withScope((scope) => {
      scope.setExtras({
        errorInfo,
        errorId: this.state.errorId,
      });
      Sentry.captureException(error);
    });

    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className={styles.errorContainer} role="alert" aria-live="assertive">
          <div className={styles.errorContent}>
            <svg className={styles.errorIcon} viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 2L2 22h20L12 2zm0 4l7.5 14h-15L12 6z"/>
              <circle cx="12" cy="15" r="1"/>
              <path d="M11 10h2v3h-2z"/>
            </svg>
            
            <h1 className={styles.errorTitle}>Something went wrong</h1>
            
            <p className={styles.errorMessage}>
              We're sorry, but something unexpected happened. The error has been reported to our team.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className={styles.errorDetails}>
                <summary>Error Details (Development Only)</summary>
                <pre className={styles.errorStack}>
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            {this.state.errorId && (
              <p className={styles.errorId}>
                Error ID: <code>{this.state.errorId}</code>
              </p>
            )}

            <div className={styles.errorActions}>
              <button 
                onClick={() => window.location.reload()} 
                className={styles.primaryButton}
                aria-label="Reload the page"
              >
                Reload Page
              </button>
              
              <button 
                onClick={this.handleReset} 
                className={styles.secondaryButton}
                aria-label="Try again without reloading"
              >
                Try Again
              </button>
              
              <a 
                href="/" 
                className={styles.linkButton}
                aria-label="Go to homepage"
              >
                Go to Homepage
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

#### Styles
```css
/* ErrorBoundary.module.css */
.errorContainer {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-4);
  background: var(--color-background);
}

.errorContent {
  max-width: 600px;
  text-align: center;
}

.errorIcon {
  width: 64px;
  height: 64px;
  margin: 0 auto var(--spacing-4);
  fill: var(--color-danger-500);
}

.errorTitle {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-2);
}

.errorMessage {
  font-size: var(--font-size-lg);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-6);
}

.errorDetails {
  margin: var(--spacing-4) 0;
  padding: var(--spacing-3);
  background: var(--color-neutral-100);
  border-radius: var(--radius-md);
  text-align: left;
}

.errorStack {
  font-family: var(--font-family-mono);
  font-size: var(--font-size-sm);
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

.errorId {
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
  margin-bottom: var(--spacing-4);
}

.errorActions {
  display: flex;
  gap: var(--spacing-3);
  justify-content: center;
  flex-wrap: wrap;
}

.primaryButton,
.secondaryButton,
.linkButton {
  padding: var(--spacing-2) var(--spacing-4);
  border-radius: var(--radius-button);
  font-weight: var(--font-weight-medium);
  transition: var(--transition-colors);
  cursor: pointer;
}

.primaryButton {
  background: var(--color-primary-500);
  color: var(--color-text-inverse);
  border: none;
}

.primaryButton:hover {
  background: var(--color-primary-600);
}

.secondaryButton {
  background: transparent;
  color: var(--color-primary-600);
  border: 2px solid var(--color-primary-500);
}

.linkButton {
  background: transparent;
  color: var(--color-text-secondary);
  text-decoration: underline;
}
```

#### Test Implementation
```typescript
// ErrorBoundary.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorBoundary from './ErrorBoundary';

const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

describe('ErrorBoundary', () => {
  // Suppress console.error for these tests
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });
  afterAll(() => {
    console.error = originalError;
  });

  test('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );
    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  test('renders error UI when error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  test('reload button reloads the page', () => {
    const reloadSpy = jest.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { reload: reloadSpy }
    });

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    fireEvent.click(screen.getByLabelText('Reload the page'));
    expect(reloadSpy).toHaveBeenCalled();
  });

  test('displays error ID when available', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    const errorId = screen.getByText(/Error ID:/);
    expect(errorId).toBeInTheDocument();
  });
});
```

#### Acceptance Criteria
- [ ] Error boundary catches all unhandled errors
- [ ] User-friendly error message displayed
- [ ] Error logged to Sentry with unique ID
- [ ] Reload and retry options work
- [ ] Accessible with ARIA attributes
- [ ] Works on mobile devices

---

### 🔴 TICKET #004: Implement Basic Accessibility Features
**Priority:** P0 - LEGAL COMPLIANCE  
**Assignee:** Frontend Dev  
**Effort:** 8 hours  
**Dependencies:** #001  

#### Implementation Checklist

##### 1. Skip Navigation Link
```jsx
// src/components/Layout/Layout.tsx
export function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <a 
        href="#main-content" 
        className="skip-link"
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            document.getElementById('main-content')?.focus();
          }
        }}
      >
        Skip to main content
      </a>
      
      <header role="banner" aria-label="Site header">
        <nav role="navigation" aria-label="Main navigation">
          {/* Navigation items */}
        </nav>
      </header>
      
      <main 
        id="main-content" 
        role="main" 
        tabIndex={-1}
        aria-label="Main content"
      >
        {children}
      </main>
      
      <footer role="contentinfo" aria-label="Site footer">
        {/* Footer content */}
      </footer>
    </>
  );
}
```

##### 2. Focus Management CSS
```css
/* src/styles/accessibility.css */

/* Skip link - hidden but accessible */
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: var(--color-primary-600);
  color: var(--color-text-inverse);
  padding: var(--spacing-2) var(--spacing-4);
  text-decoration: none;
  border-radius: 0 0 var(--radius-md) 0;
  z-index: var(--z-index-tooltip);
  font-weight: var(--font-weight-medium);
}

.skip-link:focus {
  top: 0;
  outline: 3px solid var(--color-warning-500);
  outline-offset: 2px;
}

/* Global focus styles */
:focus {
  outline: 3px solid var(--color-primary-500);
  outline-offset: 2px;
}

/* For browsers that support :focus-visible */
:focus:not(:focus-visible) {
  outline: none;
}

:focus-visible {
  outline: 3px solid var(--color-primary-500);
  outline-offset: 2px;
}

/* Button focus styles */
button:focus-visible {
  outline: 3px solid var(--color-primary-500);
  outline-offset: 2px;
  box-shadow: var(--shadow-focus);
}

/* Input focus styles */
input:focus,
textarea:focus,
select:focus {
  outline: none;
  border-color: var(--color-primary-500);
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.25);
}

/* Ensure minimum tap targets for mobile */
@media (max-width: 768px) {
  button, 
  a, 
  input, 
  select, 
  textarea,
  [role="button"],
  [role="link"] {
    min-height: 44px;
    min-width: 44px;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  :focus {
    outline-width: 4px;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* Screen reader only text */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Focus trap container */
.focus-trap {
  position: relative;
}

.focus-trap:focus {
  outline: none;
}

/* Keyboard navigation indicators */
.keyboard-nav button:focus,
.keyboard-nav a:focus,
.keyboard-nav input:focus,
.keyboard-nav select:focus,
.keyboard-nav textarea:focus {
  outline: 3px solid var(--color-primary-500) !important;
  outline-offset: 2px !important;
}
```

##### 3. ARIA Implementation Utils
```typescript
// src/utils/accessibility.ts

/**
 * Trap focus within an element
 */
export function trapFocus(element: HTMLElement) {
  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  const firstFocusableElement = focusableElements[0] as HTMLElement;
  const lastFocusableElement = focusableElements[focusableElements.length - 1] as HTMLElement;

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstFocusableElement) {
          lastFocusableElement.focus();
          e.preventDefault();
        }
      } else {
        // Tab
        if (document.activeElement === lastFocusableElement) {
          firstFocusableElement.focus();
          e.preventDefault();
        }
      }
    }
    
    if (e.key === 'Escape') {
      // Return focus to trigger element
      const trigger = element.getAttribute('data-trigger');
      if (trigger) {
        document.getElementById(trigger)?.focus();
      }
    }
  }

  element.addEventListener('keydown', handleKeyDown);
  firstFocusableElement?.focus();

  return () => {
    element.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * Announce message to screen readers
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Add keyboard navigation class to body
 */
export function detectKeyboardNavigation() {
  let isKeyboard = false;

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      isKeyboard = true;
      document.body.classList.add('keyboard-nav');
    }
  });

  document.addEventListener('mousedown', () => {
    isKeyboard = false;
    document.body.classList.remove('keyboard-nav');
  });
}

/**
 * Generate unique ID for form elements
 */
export function generateId(prefix = 'id'): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Check if element is visible
 */
export function isVisible(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  const style = window.getComputedStyle(element);
  
  return !!(
    rect.width &&
    rect.height &&
    style.visibility !== 'hidden' &&
    style.display !== 'none' &&
    style.opacity !== '0'
  );
}
```

##### 4. Accessible Form Components
```tsx
// src/components/Form/FormField.tsx
import { generateId } from '../../utils/accessibility';

interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: (id: string) => ReactNode;
  hint?: string;
}

export function FormField({ label, error, required, children, hint }: FormFieldProps) {
  const id = generateId('field');
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  
  return (
    <div className="form-field">
      <label htmlFor={id} className="form-label">
        {label}
        {required && (
          <span className="required-indicator" aria-label="required">
            *
          </span>
        )}
      </label>
      
      {hint && (
        <div id={hintId} className="form-hint">
          {hint}
        </div>
      )}
      
      {children(id)}
      
      {error && (
        <div 
          id={errorId} 
          className="form-error" 
          role="alert"
          aria-live="polite"
        >
          <svg className="error-icon" aria-hidden="true">
            <use href="#icon-error" />
          </svg>
          {error}
        </div>
      )}
    </div>
  );
}

// Usage
<FormField 
  label="Email Address" 
  required 
  error={errors.email}
  hint="We'll never share your email"
>
  {(id) => (
    <input
      id={id}
      type="email"
      name="email"
      aria-required="true"
      aria-invalid={!!errors.email}
      aria-describedby={`${id}-hint ${errors.email ? `${id}-error` : ''}`}
      value={email}
      onChange={(e) => setEmail(e.target.value)}
    />
  )}
</FormField>
```

#### Testing Script
```javascript
// tests/accessibility.spec.ts
import { test, expect } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

test.describe('Accessibility Compliance', () => {
  test('should have no WCAG 2.2 AA violations', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have skip navigation link', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.keyboard.press('Tab');
    
    const skipLink = await page.locator('.skip-link');
    await expect(skipLink).toBeFocused();
    await expect(skipLink).toContainText('Skip to main content');
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Tab through interactive elements
    const focusableElements = [];
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      const focused = await page.evaluate(() => document.activeElement?.tagName);
      if (focused && focused !== 'BODY') {
        focusableElements.push(focused);
      }
    }
    
    expect(focusableElements.length).toBeGreaterThan(0);
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Check main landmarks
    await expect(page.locator('[role="banner"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();
    await expect(page.locator('[role="contentinfo"]')).toBeVisible();
    
    // Check navigation
    const nav = page.locator('[role="navigation"]');
    await expect(nav).toHaveAttribute('aria-label', /.+/);
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    const headings = await page.$$eval('h1, h2, h3, h4, h5, h6', elements =>
      elements.map(el => ({
        level: parseInt(el.tagName[1]),
        text: el.textContent
      }))
    );
    
    // Should have exactly one H1
    const h1Count = headings.filter(h => h.level === 1).length;
    expect(h1Count).toBe(1);
    
    // No heading level jumps
    for (let i = 1; i < headings.length; i++) {
      const jump = headings[i].level - headings[i - 1].level;
      expect(jump).toBeLessThanOrEqual(1);
    }
  });
});
```

#### Acceptance Criteria
- [ ] Skip navigation link works with keyboard
- [ ] All interactive elements reachable via Tab
- [ ] Focus indicators visible and meet contrast requirements
- [ ] ARIA landmarks properly implemented
- [ ] Form labels associated with inputs
- [ ] Error messages announced to screen readers
- [ ] Passes axe-core accessibility tests
- [ ] Mobile tap targets >= 44x44 pixels

---

## SPRINT 2: Core Functionality (Days 6-10)
**Goal:** Achieve basic compliance and functionality  
**Success Metric:** Core Web Vitals passing, WCAG AA 80% compliance

### 🟡 TICKET #005: Optimize Performance - Code Splitting
**Priority:** P1  
**Assignee:** Senior Frontend Dev  
**Effort:** 12 hours  
**Dependencies:** #001  

#### Implementation
```javascript
// src/router.tsx
import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import LoadingSpinner from './components/LoadingSpinner';

// Lazy load route components
const Home = lazy(() => import('./pages/Home'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));

// Preload critical routes
const preloadHome = () => import('./pages/Home');
const preloadDashboard = () => import('./pages/Dashboard');

// Preload on hover
function LinkWithPreload({ to, children, preload }) {
  return (
    <Link 
      to={to} 
      onMouseEnter={preload}
      onTouchStart={preload}
    >
      {children}
    </Link>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <Suspense fallback={<LoadingSpinner />}>
        <Home />
      </Suspense>
    ),
  },
  {
    path: '/dashboard',
    element: (
      <Suspense fallback={<LoadingSpinner />}>
        <Dashboard />
      </Suspense>
    ),
  },
]);

// webpack.config.js
module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 10,
          reuseExistingChunk: true,
        },
        common: {
          minChunks: 2,
          priority: 5,
          reuseExistingChunk: true,
        },
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom|react-router)[\\/]/,
          name: 'react',
          priority: 20,
        },
      },
    },
  },
};
```

---

### 🟡 TICKET #006: Implement SEO Meta Tags
**Priority:** P1  
**Assignee:** Frontend Dev  
**Effort:** 4 hours  
**Dependencies:** #001  

#### Implementation
```tsx
// src/components/SEO/SEO.tsx
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'profile';
  twitterCard?: 'summary' | 'summary_large_image';
}

export function SEO({ 
  title, 
  description, 
  image = '/og-default.jpg',
  url = window.location.href,
  type = 'website',
  twitterCard = 'summary_large_image'
}: SEOProps) {
  const siteTitle = 'ProtoThrive';
  const fullTitle = title ? `${title} | ${siteTitle}` : siteTitle;
  
  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      
      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content={siteTitle} />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      
      {/* Schema.org */}
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: siteTitle,
          url: url,
          logo: '/logo.png',
          description: description,
        })}
      </script>
    </Helmet>
  );
}
```

---

## SPRINT 3: Polish & Optimization (Days 11-15)
**Goal:** Complete remediation and achieve industry standards  
**Success Metric:** All tests passing, ready for production

### 🟢 TICKET #007: Build Component Library
**Priority:** P2  
**Assignee:** UI Team  
**Effort:** 20 hours  
**Dependencies:** #001-006  

[Component specifications from component_inventory.md]

---

### 🟢 TICKET #008: Implement Analytics
**Priority:** P2  
**Assignee:** Analytics Engineer  
**Effort:** 8 hours  
**Dependencies:** #001  

[Analytics implementation details]

---

### 🟢 TICKET #009: Set Up E2E Testing
**Priority:** P1  
**Assignee:** QA Engineer  
**Effort:** 12 hours  
**Dependencies:** All  

[Playwright test suite from protothrive.spec.ts]

---

## Success Metrics Dashboard

```yaml
Sprint 1 Completion:
  - Application Uptime: ✅ >95%
  - Security Headers: ✅ 7/7 implemented
  - Error Handling: ✅ Error boundary active
  - Accessibility: ✅ Skip links added
  - Time to Complete: 5 days

Sprint 2 Completion:
  - Core Web Vitals: ✅ Passing
  - WCAG Compliance: ✅ >80%
  - SEO Score: ✅ >85
  - Performance: ✅ <3s load time
  - Time to Complete: 5 days

Sprint 3 Completion:
  - Component Library: ✅ 15 components
  - Test Coverage: ✅ >80%
  - Analytics: ✅ Tracking active
  - Documentation: ✅ Complete
  - Time to Complete: 5 days
```

---

## Post-Sprint Monitoring

### Week 1 Post-Launch
- Monitor error rates in Sentry
- Track Core Web Vitals in Google Search Console
- Review analytics for user behavior
- Collect team retrospective feedback

### Week 2 Post-Launch
- Performance optimization based on RUM data
- A/B test improvements
- Security audit follow-up
- Accessibility user testing

### Week 3 Post-Launch
- Full audit comparison
- ROI analysis
- Plan next iteration
- Documentation updates
