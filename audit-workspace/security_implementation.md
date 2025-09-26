# ProtoThrive Security Implementation Guide
## Complete Frontend Security Hardening

**Classification:** CONFIDENTIAL  
**Date:** September 25, 2025  
**Version:** 1.0  
**Compliance:** OWASP Top 10, CSP Level 3

---

## Executive Summary

This guide provides comprehensive security implementation for the ProtoThrive frontend application. All recommendations are based on OWASP best practices and modern security standards.

**Current Security Score:** F (0/100)  
**Target Security Score:** A+ (95+/100)  
**Estimated Implementation:** 40 hours  

---

## Critical Security Headers Implementation

### 1. Content Security Policy (CSP)

```nginx
# Nginx Configuration
add_header Content-Security-Policy "
  default-src 'self';
  script-src 'self' 'nonce-$request_id' https://cdn.jsdelivr.net https://www.google-analytics.com;
  script-src-elem 'self' 'nonce-$request_id';
  script-src-attr 'none';
  style-src 'self' 'nonce-$request_id' https://fonts.googleapis.com;
  style-src-elem 'self' 'nonce-$request_id' https://fonts.googleapis.com;
  style-src-attr 'nonce-$request_id';
  img-src 'self' data: https: blob:;
  font-src 'self' https://fonts.gstatic.com data:;
  connect-src 'self' https://api.protothrive.com wss://api.protothrive.com https://www.google-analytics.com;
  media-src 'self' https: blob:;
  object-src 'none';
  child-src 'self';
  frame-src 'self' https://www.youtube.com;
  frame-ancestors 'none';
  form-action 'self';
  base-uri 'self';
  manifest-src 'self';
  worker-src 'self' blob:;
  upgrade-insecure-requests;
  block-all-mixed-content;
  require-trusted-types-for 'script';
  trusted-types default;
" always;
```

<details>
<summary>Implementation in HTML (with nonces)</summary>

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="
    default-src 'self';
    script-src 'self' 'nonce-RANDOM_NONCE';
    style-src 'self' 'nonce-RANDOM_NONCE';
  ">
  
  <!-- Inline scripts with nonce -->
  <script nonce="RANDOM_NONCE">
    // Trusted inline script
  </script>
  
  <!-- Inline styles with nonce -->
  <style nonce="RANDOM_NONCE">
    /* Trusted inline styles */
  </style>
</head>
</html>
```

</details>

<details>
<summary>React Implementation</summary>

```javascript
// server.js - Express example
const crypto = require('crypto');
const helmet = require('helmet');

app.use((req, res, next) => {
  // Generate nonce
  res.locals.nonce = crypto.randomBytes(16).toString('base64');
  next();
});

app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", (req, res) => `'nonce-${res.locals.nonce}'`],
    styleSrc: ["'self'", (req, res) => `'nonce-${res.locals.nonce}'`],
    imgSrc: ["'self'", "data:", "https:"],
    connectSrc: ["'self'", "https://api.protothrive.com"],
    fontSrc: ["'self'", "https://fonts.gstatic.com"],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    frameSrc: ["'none'"],
  },
}));

// React component
function App() {
  return (
    <div>
      {/* Use data attributes instead of inline handlers */}
      <button data-action="submit">Submit</button>
    </div>
  );
}
```

</details>

### 2. Strict Transport Security (HSTS)

```nginx
# Enable HSTS with preload
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
```

**Preload Submission:**
1. Ensure HTTPS on all subdomains
2. Submit to https://hstspreload.org/
3. Monitor status

### 3. Additional Security Headers

```nginx
# Complete security headers configuration
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "0" always;  # Disabled in modern browsers
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "
  accelerometer=(),
  ambient-light-sensor=(),
  autoplay=(),
  battery=(),
  camera=(),
  cross-origin-isolated=(self),
  display-capture=(),
  document-domain=(),
  encrypted-media=(),
  execution-while-not-rendered=(),
  execution-while-out-of-viewport=(),
  fullscreen=(self),
  geolocation=(),
  gyroscope=(),
  keyboard-map=(),
  magnetometer=(),
  microphone=(),
  midi=(),
  navigation-override=(),
  payment=(),
  picture-in-picture=(),
  publickey-credentials-get=(),
  screen-wake-lock=(),
  sync-xhr=(),
  usb=(),
  web-share=(),
  xr-spatial-tracking=(),
  interest-cohort=()
" always;
add_header Cross-Origin-Embedder-Policy "require-corp" always;
add_header Cross-Origin-Opener-Policy "same-origin" always;
add_header Cross-Origin-Resource-Policy "same-origin" always;
```

---

## XSS Prevention

### Input Sanitization

```javascript
// utils/sanitization.js
import DOMPurify from 'dompurify';

/**
 * Sanitize user input for display
 */
export function sanitizeHTML(dirty) {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href', 'title'],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  });
}

/**
 * Escape HTML entities
 */
export function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
    '/': '&#x2F;',
  };
  return text.replace(/[&<>"'\/]/g, (m) => map[m]);
}

/**
 * Validate and sanitize URL
 */
export function sanitizeUrl(url) {
  const allowedProtocols = ['http:', 'https:', 'mailto:'];
  
  try {
    const parsed = new URL(url);
    if (!allowedProtocols.includes(parsed.protocol)) {
      return '#';
    }
    return url;
  } catch {
    return '#';
  }
}

// React component usage
function UserContent({ content }) {
  const sanitized = sanitizeHTML(content);
  
  return (
    <div 
      dangerouslySetInnerHTML={{ __html: sanitized }}
      data-testid="user-content"
    />
  );
}
```

### Trusted Types API

```javascript
// trusted-types.js
if (window.trustedTypes && trustedTypes.createPolicy) {
  // Create default policy
  trustedTypes.createPolicy('default', {
    createHTML: (string) => DOMPurify.sanitize(string),
    createScriptURL: (url) => {
      const allowedHosts = ['cdn.jsdelivr.net', 'www.google-analytics.com'];
      const parsed = new URL(url);
      
      if (allowedHosts.includes(parsed.host)) {
        return url;
      }
      throw new Error('Blocked script URL');
    },
    createScript: (script) => {
      // Only allow specific scripts
      throw new Error('Inline scripts not allowed');
    },
  });
  
  // Create policy for specific use cases
  const policy = trustedTypes.createPolicy('protothrive', {
    createHTML: (html) => DOMPurify.sanitize(html, { 
      RETURN_TRUSTED_TYPE: true 
    }),
  });
}
```

---

## CSRF Protection

### Implementation Strategy

```javascript
// csrf-protection.js
import Cookies from 'js-cookie';

class CSRFProtection {
  constructor() {
    this.tokenName = 'XSRF-TOKEN';
    this.headerName = 'X-XSRF-TOKEN';
  }
  
  /**
   * Get CSRF token from cookie
   */
  getToken() {
    return Cookies.get(this.tokenName);
  }
  
  /**
   * Set CSRF token in headers
   */
  setHeaders(headers = {}) {
    const token = this.getToken();
    if (token) {
      headers[this.headerName] = token;
    }
    return headers;
  }
  
  /**
   * Axios interceptor
   */
  setupAxios(axios) {
    axios.interceptors.request.use((config) => {
      if (['post', 'put', 'patch', 'delete'].includes(config.method)) {
        config.headers = this.setHeaders(config.headers);
      }
      return config;
    });
  }
  
  /**
   * Fetch wrapper
   */
  async secureFetch(url, options = {}) {
    const method = options.method || 'GET';
    
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase())) {
      options.headers = this.setHeaders(options.headers || {});
    }
    
    options.credentials = 'include';
    
    return fetch(url, options);
  }
}

export const csrf = new CSRFProtection();

// Usage in React
function App() {
  useEffect(() => {
    // Setup CSRF for axios
    csrf.setupAxios(axios);
  }, []);
  
  const handleSubmit = async (data) => {
    const response = await csrf.secureFetch('/api/submit', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  };
}
```

### Double Submit Cookie Pattern

```javascript
// server.js
const crypto = require('crypto');

app.use((req, res, next) => {
  if (!req.cookies['csrf-token']) {
    const token = crypto.randomBytes(32).toString('hex');
    res.cookie('csrf-token', token, {
      httpOnly: false, // Needs to be readable by JS
      secure: true,
      sameSite: 'strict',
    });
  }
  next();
});

// Verify CSRF token
app.use((req, res, next) => {
  if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
    const cookieToken = req.cookies['csrf-token'];
    const headerToken = req.headers['x-csrf-token'];
    
    if (!cookieToken || cookieToken !== headerToken) {
      return res.status(403).json({ error: 'Invalid CSRF token' });
    }
  }
  next();
});
```

---

## Authentication Security

### JWT Best Practices

```javascript
// auth-service.js
class AuthService {
  constructor() {
    this.accessTokenExpiry = 15 * 60 * 1000; // 15 minutes
    this.refreshTokenExpiry = 7 * 24 * 60 * 60 * 1000; // 7 days
  }
  
  /**
   * Store tokens securely
   */
  storeTokens(access, refresh) {
    // Store access token in memory only
    this.accessToken = access;
    
    // Store refresh token in httpOnly cookie (server-side)
    // Never store in localStorage!
  }
  
  /**
   * Get access token
   */
  getAccessToken() {
    return this.accessToken;
  }
  
  /**
   * Refresh access token
   */
  async refreshAccessToken() {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include', // Include httpOnly cookies
      });
      
      if (response.ok) {
        const { accessToken } = await response.json();
        this.accessToken = accessToken;
        return accessToken;
      }
      
      throw new Error('Failed to refresh token');
    } catch (error) {
      this.logout();
      throw error;
    }
  }
  
  /**
   * Auto-refresh before expiry
   */
  setupAutoRefresh() {
    setInterval(() => {
      this.refreshAccessToken();
    }, this.accessTokenExpiry - 60000); // Refresh 1 min before expiry
  }
  
  /**
   * Secure logout
   */
  async logout() {
    this.accessToken = null;
    
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
    
    window.location.href = '/login';
  }
}

// Axios interceptor for token refresh
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const token = await authService.refreshAccessToken();
        originalRequest.headers['Authorization'] = `Bearer ${token}`;
        return axios(originalRequest);
      } catch {
        authService.logout();
      }
    }
    
    return Promise.reject(error);
  }
);
```

### Secure Session Management

```javascript
// session-manager.js
class SessionManager {
  constructor() {
    this.sessionTimeout = 20 * 60 * 1000; // 20 minutes
    this.warningTime = 2 * 60 * 1000; // 2 minute warning
    this.lastActivity = Date.now();
  }
  
  /**
   * Initialize session monitoring
   */
  init() {
    // Monitor user activity
    ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(event => {
      document.addEventListener(event, () => this.updateActivity());
    });
    
    // Check session periodically
    setInterval(() => this.checkSession(), 10000); // Every 10 seconds
    
    // Monitor visibility
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.validateSession();
      }
    });
  }
  
  /**
   * Update last activity
   */
  updateActivity() {
    this.lastActivity = Date.now();
  }
  
  /**
   * Check session timeout
   */
  checkSession() {
    const idle = Date.now() - this.lastActivity;
    
    if (idle > this.sessionTimeout) {
      this.expireSession();
    } else if (idle > this.sessionTimeout - this.warningTime) {
      this.showWarning();
    }
  }
  
  /**
   * Validate session on focus
   */
  async validateSession() {
    try {
      const response = await fetch('/api/auth/validate', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        this.expireSession();
      }
    } catch {
      this.expireSession();
    }
  }
  
  /**
   * Expire session
   */
  expireSession() {
    // Clear sensitive data
    sessionStorage.clear();
    
    // Redirect to login
    window.location.href = '/login?expired=true';
  }
}
```

---

## Data Protection

### Encryption in Transit

```javascript
// api-client.js
class SecureAPIClient {
  constructor(baseURL) {
    this.client = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    this.setupInterceptors();
  }
  
  setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Ensure HTTPS
        if (!config.url.startsWith('https://') && process.env.NODE_ENV === 'production') {
          throw new Error('HTTPS required');
        }
        
        // Add security headers
        config.headers['X-Requested-With'] = 'XMLHttpRequest';
        
        return config;
      },
      (error) => Promise.reject(error)
    );
    
    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        // Validate response
        this.validateResponse(response);
        return response;
      },
      (error) => {
        // Handle security errors
        if (error.response?.status === 401) {
          // Handle unauthorized
        }
        return Promise.reject(error);
      }
    );
  }
  
  validateResponse(response) {
    // Check for security headers
    const headers = response.headers;
    
    if (!headers['strict-transport-security']) {
      console.warn('Missing HSTS header');
    }
    
    // Validate content type
    const contentType = headers['content-type'];
    if (contentType && !contentType.includes('application/json')) {
      throw new Error('Unexpected content type');
    }
  }
}
```

### Sensitive Data Handling

```javascript
// sensitive-data.js
class SensitiveDataHandler {
  /**
   * Mask sensitive data for display
   */
  maskData(data, type) {
    switch (type) {
      case 'ssn':
        return data.replace(/^(\d{3})\d{2}(\d{4})$/, '$1-**-$2');
      
      case 'creditCard':
        return data.replace(/^(\d{4})\d{8}(\d{4})$/, '$1 **** **** $2');
      
      case 'email':
        const [local, domain] = data.split('@');
        return `${local.substring(0, 2)}****@${domain}`;
      
      case 'phone':
        return data.replace(/^(\d{3})\d{3}(\d{4})$/, '$1-***-$2');
      
      default:
        return data.substring(0, 3) + '****';
    }
  }
  
  /**
   * Clear sensitive data from memory
   */
  clearSensitiveData() {
    // Clear form data
    document.querySelectorAll('input[type="password"], input[data-sensitive="true"]')
      .forEach(input => {
        input.value = '';
        input.setAttribute('value', '');
      });
    
    // Clear clipboard
    if (navigator.clipboard) {
      navigator.clipboard.writeText('');
    }
    
    // Clear session storage
    const keysToRemove = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.includes('sensitive')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => sessionStorage.removeItem(key));
  }
  
  /**
   * Prevent copy/paste of sensitive data
   */
  preventCopy(element) {
    element.addEventListener('copy', (e) => {
      e.preventDefault();
      return false;
    });
    
    element.addEventListener('cut', (e) => {
      e.preventDefault();
      return false;
    });
    
    // Prevent right-click
    element.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      return false;
    });
  }
}
```

---

## Third-Party Security

### Subresource Integrity (SRI)

```html
<!-- HTML Implementation -->
<!DOCTYPE html>
<html>
<head>
  <!-- CSS with SRI -->
  <link 
    rel="stylesheet" 
    href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.0/dist/css/bootstrap.min.css"
    integrity="sha384-..."
    crossorigin="anonymous"
  >
  
  <!-- JavaScript with SRI -->
  <script 
    src="https://cdn.jsdelivr.net/npm/react@18.0.0/umd/react.production.min.js"
    integrity="sha384-..."
    crossorigin="anonymous"
  ></script>
</head>
</html>
```

```javascript
// Dynamic SRI generation
const crypto = require('crypto');
const fs = require('fs');

function generateSRI(filePath) {
  const content = fs.readFileSync(filePath);
  const hash = crypto.createHash('sha384').update(content).digest('base64');
  return `sha384-${hash}`;
}

// Webpack plugin for SRI
const SubresourceIntegrityPlugin = require('webpack-subresource-integrity');

module.exports = {
  plugins: [
    new SubresourceIntegrityPlugin({
      hashFuncNames: ['sha384'],
      enabled: process.env.NODE_ENV === 'production',
    }),
  ],
};
```

### Dependency Security

```json
// package.json
{
  "scripts": {
    "audit": "npm audit --audit-level=moderate",
    "audit:fix": "npm audit fix",
    "check:dependencies": "npm-check-updates",
    "check:licenses": "license-checker --production --summary",
    "check:vulnerabilities": "snyk test"
  },
  "husky": {
    "hooks": {
      "pre-commit": "npm audit --audit-level=moderate"
    }
  }
}
```

```yaml
# .github/workflows/security.yml
name: Security Checks

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 0 * * *' # Daily

jobs:
  security:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Run npm audit
        run: npm audit --audit-level=moderate
      
      - name: Run Snyk
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
      
      - name: Run OWASP Dependency Check
        uses: dependency-check/Dependency-Check_Action@main
        with:
          project: 'ProtoThrive'
          path: '.'
          format: 'HTML'
      
      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: security-reports
          path: reports/
```

---

## Security Monitoring

### Client-Side Security Monitoring

```javascript
// security-monitor.js
class SecurityMonitor {
  constructor() {
    this.violations = [];
    this.setupMonitoring();
  }
  
  setupMonitoring() {
    // Monitor CSP violations
    document.addEventListener('securitypolicyviolation', (e) => {
      this.logViolation({
        type: 'CSP',
        directive: e.violatedDirective,
        blocked: e.blockedURI,
        source: e.sourceFile,
        line: e.lineNumber,
      });
    });
    
    // Monitor console errors
    const originalError = console.error;
    console.error = (...args) => {
      this.checkForSecurityIssues(args);
      originalError.apply(console, args);
    };
    
    // Monitor network errors
    window.addEventListener('error', (e) => {
      if (e.message.includes('CORS') || e.message.includes('Mixed Content')) {
        this.logViolation({
          type: 'Network',
          message: e.message,
          source: e.filename,
        });
      }
    });
    
    // Monitor suspicious activity
    this.monitorSuspiciousActivity();
  }
  
  monitorSuspiciousActivity() {
    let clickCount = 0;
    let clickTimer;
    
    // Detect rapid clicking (potential bot)
    document.addEventListener('click', () => {
      clickCount++;
      
      if (clickCount > 10) {
        this.logViolation({
          type: 'Suspicious',
          activity: 'Rapid clicking detected',
          count: clickCount,
        });
      }
      
      clearTimeout(clickTimer);
      clickTimer = setTimeout(() => {
        clickCount = 0;
      }, 1000);
    });
    
    // Detect console opening (potential tampering)
    const devtools = { open: false, orientation: null };
    setInterval(() => {
      if (window.outerHeight - window.innerHeight > 200) {
        if (!devtools.open) {
          devtools.open = true;
          this.logViolation({
            type: 'Suspicious',
            activity: 'DevTools opened',
          });
        }
      } else {
        devtools.open = false;
      }
    }, 500);
  }
  
  checkForSecurityIssues(args) {
    const message = args.join(' ');
    const patterns = [
      /eval\(/,
      /innerHTML/,
      /document\.write/,
      /javascript:/,
      /<script>/,
    ];
    
    patterns.forEach(pattern => {
      if (pattern.test(message)) {
        this.logViolation({
          type: 'Security',
          pattern: pattern.source,
          message: message.substring(0, 100),
        });
      }
    });
  }
  
  logViolation(violation) {
    violation.timestamp = Date.now();
    violation.url = window.location.href;
    violation.userAgent = navigator.userAgent;
    
    this.violations.push(violation);
    
    // Send to server
    if (this.violations.length >= 10) {
      this.sendViolations();
    }
  }
  
  sendViolations() {
    if (this.violations.length === 0) return;
    
    const payload = {
      violations: this.violations,
      session: this.getSessionInfo(),
    };
    
    // Use sendBeacon for reliability
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/security/violations', JSON.stringify(payload));
    } else {
      fetch('/api/security/violations', {
        method: 'POST',
        body: JSON.stringify(payload),
        keepalive: true,
      });
    }
    
    this.violations = [];
  }
  
  getSessionInfo() {
    return {
      referrer: document.referrer,
      screen: {
        width: screen.width,
        height: screen.height,
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  }
}

// Initialize monitoring
const securityMonitor = new SecurityMonitor();

// Send violations on page unload
window.addEventListener('beforeunload', () => {
  securityMonitor.sendViolations();
});
```

---

## Security Testing

### Automated Security Tests

```javascript
// security.test.js
describe('Security Tests', () => {
  describe('XSS Prevention', () => {
    test('should sanitize user input', () => {
      const malicious = '<script>alert("XSS")</script>';
      const sanitized = sanitizeHTML(malicious);
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('alert');
    });
    
    test('should escape HTML entities', () => {
      const input = '<div onclick="alert()">Test</div>';
      const escaped = escapeHtml(input);
      expect(escaped).toBe('&lt;div onclick=&quot;alert()&quot;&gt;Test&lt;&#x2F;div&gt;');
    });
  });
  
  describe('CSP Compliance', () => {
    test('should not use inline scripts', () => {
      const html = document.documentElement.innerHTML;
      expect(html).not.toMatch(/<script[^>]*>(?!.*nonce)/);
    });
    
    test('should not use eval', () => {
      const scripts = Array.from(document.scripts);
      scripts.forEach(script => {
        expect(script.textContent).not.toMatch(/eval\(/);
      });
    });
  });
  
  describe('Authentication', () => {
    test('should not store tokens in localStorage', () => {
      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
    });
    
    test('should include CSRF token in requests', async () => {
      const mockFetch = jest.spyOn(global, 'fetch');
      
      await csrf.secureFetch('/api/data', {
        method: 'POST',
        body: JSON.stringify({ data: 'test' }),
      });
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-XSRF-TOKEN': expect.any(String),
          }),
        })
      );
    });
  });
  
  describe('HTTPS Enforcement', () => {
    test('should redirect HTTP to HTTPS', () => {
      if (window.location.protocol === 'http:') {
        expect(window.location.protocol).toBe('https:');
      }
    });
    
    test('should not load mixed content', () => {
      const resources = performance.getEntriesByType('resource');
      resources.forEach(resource => {
        if (resource.name.startsWith('http://')) {
          fail(`Mixed content detected: ${resource.name}`);
        }
      });
    });
  });
});
```

### Security Checklist

```yaml
Security Audit Checklist:
  Headers:
    ✓ Content-Security-Policy configured
    ✓ Strict-Transport-Security enabled
    ✓ X-Frame-Options set to DENY
    ✓ X-Content-Type-Options set to nosniff
    ✓ Referrer-Policy configured
    ✓ Permissions-Policy restrictive
  
  XSS Prevention:
    ✓ Input sanitization implemented
    ✓ Output encoding in place
    ✓ CSP preventing inline scripts
    ✓ Trusted Types API used
    ✓ No use of dangerous functions (eval, innerHTML)
  
  Authentication:
    ✓ Tokens stored securely (not in localStorage)
    ✓ CSRF protection implemented
    ✓ Session timeout configured
    ✓ Secure logout implemented
    ✓ Password requirements enforced
  
  Data Protection:
    ✓ HTTPS enforced everywhere
    ✓ Sensitive data masked
    ✓ No sensitive data in URLs
    ✓ Secure cookies (httpOnly, secure, sameSite)
  
  Third-Party:
    ✓ Subresource Integrity (SRI) used
    ✓ Dependencies audited
    ✓ Licenses checked
    ✓ No known vulnerabilities
  
  Monitoring:
    ✓ CSP violations logged
    ✓ Security metrics tracked
    ✓ Suspicious activity detected
    ✓ Error reporting configured
```

---

## Incident Response Plan

### Security Incident Workflow

```javascript
// incident-response.js
class IncidentResponse {
  async handleSecurityIncident(incident) {
    // 1. Detect
    const severity = this.assessSeverity(incident);
    
    // 2. Contain
    if (severity === 'critical') {
      await this.containThreat(incident);
    }
    
    // 3. Investigate
    const investigation = await this.investigate(incident);
    
    // 4. Remediate
    await this.remediate(investigation);
    
    // 5. Report
    await this.report(incident, investigation);
    
    // 6. Review
    this.postIncidentReview(incident);
  }
  
  assessSeverity(incident) {
    if (incident.type === 'data-breach' || incident.type === 'account-takeover') {
      return 'critical';
    }
    if (incident.type === 'xss' || incident.type === 'csrf') {
      return 'high';
    }
    return 'medium';
  }
  
  async containThreat(incident) {
    // Immediate actions
    if (incident.type === 'account-takeover') {
      // Invalidate all sessions
      await fetch('/api/security/invalidate-all-sessions', {
        method: 'POST',
      });
    }
    
    // Block malicious IPs
    if (incident.sourceIP) {
      await fetch('/api/security/block-ip', {
        method: 'POST',
        body: JSON.stringify({ ip: incident.sourceIP }),
      });
    }
  }
}
```

---

## Compliance & Reporting

### Security Metrics Dashboard

```javascript
// security-metrics.js
class SecurityMetrics {
  collect() {
    return {
      headers: this.checkSecurityHeaders(),
      https: this.checkHTTPS(),
      csp: this.checkCSP(),
      dependencies: this.checkDependencies(),
      authentication: this.checkAuthentication(),
    };
  }
  
  checkSecurityHeaders() {
    const required = [
      'content-security-policy',
      'strict-transport-security',
      'x-frame-options',
      'x-content-type-options',
    ];
    
    const headers = {};
    // Check implementation
    
    return {
      score: Object.keys(headers).length / required.length * 100,
      missing: required.filter(h => !headers[h]),
    };
  }
  
  generateReport() {
    const metrics = this.collect();
    const overallScore = Object.values(metrics)
      .reduce((sum, m) => sum + m.score, 0) / Object.keys(metrics).length;
    
    return {
      score: overallScore,
      grade: this.getGrade(overallScore),
      timestamp: Date.now(),
      details: metrics,
    };
  }
  
  getGrade(score) {
    if (score >= 95) return 'A+';
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }
}
```

---

## Implementation Timeline

### Phase 1: Critical (Week 1)
- [ ] Implement security headers
- [ ] Enable HTTPS everywhere
- [ ] Setup CSP
- [ ] Fix XSS vulnerabilities

### Phase 2: High Priority (Week 2)
- [ ] Implement CSRF protection
- [ ] Secure authentication
- [ ] Setup monitoring
- [ ] Audit dependencies

### Phase 3: Enhancement (Week 3)
- [ ] Add SRI
- [ ] Implement Trusted Types
- [ ] Setup incident response
- [ ] Complete security tests

---

**Security Status:** 🔴 Critical - Immediate Action Required  
**Target Completion:** October 10, 2025  
**Compliance Target:** OWASP Top 10  
**Risk Level:** CRITICAL - Multiple vulnerabilities
