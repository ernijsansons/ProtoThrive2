# ProtoThrive E2E Test Suite

Comprehensive end-to-end testing suite for the ProtoThrive platform using Playwright and Chrome DevTools.

## Overview

This test suite provides complete coverage of:

- ✅ Authentication flows (registration, login, logout, password reset)
- ✅ Roadmap management (create, edit, view, canvas interactions)
- ✅ Performance metrics (Core Web Vitals, load times, API response times)
- ✅ Security testing (OWASP Top 10, headers, authentication)
- ✅ Accessibility compliance (WCAG 2.1, keyboard navigation, screen readers)
- ✅ Mobile & responsive design (multiple devices and viewports)
- ✅ API integration (all endpoints, error handling, rate limiting)

## Test Structure

```
e2e/
├── config.ts                      # Test configuration
├── helpers.ts                     # Reusable test utilities
├── global-setup.ts               # Setup script
├── auth-flow.spec.ts             # Authentication tests
├── roadmap-management.spec.ts    # Roadmap CRUD tests
├── performance.spec.ts           # Performance & Core Web Vitals
├── security.spec.ts              # Security testing
├── accessibility.spec.ts         # Accessibility compliance
├── mobile-responsive.spec.ts     # Mobile & responsive tests
├── api-integration.spec.ts       # API endpoint tests
└── audit-report-generator.ts     # Report generation
```

## Installation

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install
```

## Running Tests

### Run all tests
```bash
npm run test:e2e
```

### Run specific test suites
```bash
# Authentication tests
npx playwright test auth-flow

# Performance tests
npx playwright test performance

# Security tests
npx playwright test security

# Accessibility tests
npx playwright test accessibility

# Mobile tests
npx playwright test mobile-responsive

# API tests
npx playwright test api-integration
```

### Run tests in specific browsers
```bash
# Chromium only
npx playwright test --project=chromium

# Firefox only
npx playwright test --project=firefox

# Mobile Chrome
npx playwright test --project="Mobile Chrome"
```

### Debug mode
```bash
# Run with UI mode
npx playwright test --ui

# Run with debug
npx playwright test --debug

# Run specific test in debug
npx playwright test auth-flow --debug
```

## Viewing Results

### HTML Report
```bash
# Generate and open HTML report
npx playwright show-report
```

### View Screenshots
All test screenshots are saved in `test-results/screenshots/`

### Audit Report
After running tests, generate the comprehensive audit report:

```bash
# Generate audit report
npm run test:audit

# Or directly
npx ts-node e2e/audit-report-generator.ts
```

The audit report will be saved as:
- `AUDIT_REPORT.md` - Human-readable markdown report
- `test-results/audit-report.json` - Machine-readable JSON

## Configuration

### Environment Variables

```bash
# Set custom URLs
export BASE_URL=https://your-frontend-url.com
export API_URL=https://your-api-url.com

# Run tests
npm run test:e2e
```

### Test Config

Edit `e2e/config.ts` to customize:
- Frontend and backend URLs
- Performance thresholds
- Timeout values
- Security test payloads
- Viewport sizes

## Test Coverage

### Authentication (auth-flow.spec.ts)
- User registration validation
- Email and password validation
- Login with valid/invalid credentials
- Session persistence
- Session expiration
- Logout functionality
- Password reset flow
- SQL injection protection
- XSS protection
- Rate limiting
- Security headers

### Roadmap Management (roadmap-management.spec.ts)
- Template library display
- Blank roadmap creation
- Template-based creation
- Roadmap editor loading
- Canvas interactions (zoom, pan, drag)
- Node operations (add, select, multi-select)
- Save functionality
- Dashboard navigation
- Keyboard shortcuts

### Performance (performance.spec.ts)
- Core Web Vitals (LCP, FID, CLS, TTFB, FCP)
- Page load times
- Navigation timing metrics
- Resource loading efficiency
- JavaScript and CSS optimization
- Compression verification
- Cache headers
- API response times
- Memory usage
- Network performance

### Security (security.spec.ts)
- Security headers verification
- SQL injection protection
- XSS (Cross-Site Scripting) protection
- CSRF token validation
- Password complexity enforcement
- Secure password transmission
- Account lockout after failed attempts
- Secure session management
- JWT token expiration
- Authorization checks
- Input validation and sanitization
- HTTPS enforcement

### Accessibility (accessibility.spec.ts)
- Automated accessibility checks (axe-core)
- Keyboard navigation
- Focus indicators
- Form navigation
- ARIA labels and roles
- Heading hierarchy
- Landmark regions
- Alt text on images
- Color contrast
- Form accessibility
- Screen reader support
- Text resizing
- Reduced motion support

### Mobile & Responsive (mobile-responsive.spec.ts)
- Multiple device testing (iPhone, Pixel, iPad)
- Custom viewport sizes (320px to 1920px)
- Responsive images
- Touch target sizes (44x44px minimum)
- Mobile navigation (hamburger menu)
- Responsive typography
- Form inputs on mobile
- Layout shifts (CLS)
- Orientation changes
- Mobile performance on slow connections

### API Integration (api-integration.spec.ts)
- Health and status endpoints
- User registration API
- User login API
- Token refresh
- Roadmap CRUD operations
- Snippet management
- Authentication requirements
- Error handling
- Rate limiting
- CORS headers
- Response format validation

## Performance Thresholds

```javascript
{
  lcp: 2500,    // Largest Contentful Paint (ms)
  fid: 100,     // First Input Delay (ms)
  cls: 0.1,     // Cumulative Layout Shift
  ttfb: 800,    // Time to First Byte (ms)
  fcp: 1800,    // First Contentful Paint (ms)
  apiResponseTime: 100,  // API response time (ms)
  pageLoadTime: 2000,    // Page load time (ms)
}
```

## Accessibility Standards

- **WCAG 2.1 Level AA** compliance
- **Section 508** compliance
- Keyboard navigation support
- Screen reader compatibility
- Color contrast ratios: 4.5:1 (normal text), 3:1 (large text)
- Touch target minimum: 44×44 pixels

## Security Standards

- **OWASP Top 10** protection
- Security headers (CSP, HSTS, X-Frame-Options, etc.)
- JWT authentication with proper expiration
- Password hashing with bcrypt (12+ rounds)
- Rate limiting: 100 req/min per IP
- HTTPS enforcement

## Browser Support

| Browser | Desktop | Mobile | Tablet |
|---------|---------|--------|--------|
| Chrome | ✅ | ✅ | ✅ |
| Firefox | ✅ | - | - |
| Safari | ✅ | ✅ | ✅ |
| Edge | ✅ | - | - |

## CI/CD Integration

### GitHub Actions

```yaml
- name: Install Playwright
  run: npx playwright install --with-deps

- name: Run E2E tests
  run: npm run test:e2e

- name: Upload test results
  uses: actions/upload-artifact@v3
  if: always()
  with:
    name: playwright-report
    path: playwright-report/
```

## Troubleshooting

### Tests failing on security headers
Ensure Cloudflare Workers has proper security headers configured in middleware.

### Tests timing out
Increase timeout in `playwright.config.ts` or individual tests.

### Screenshot failures
Check that `test-results/screenshots` directory has write permissions.

### Mobile tests failing
Verify mobile viewports are configured correctly in `e2e/config.ts`.

## Best Practices

1. **Run tests before deployment** to catch issues early
2. **Review failed test screenshots** to diagnose issues quickly
3. **Monitor performance trends** over time
4. **Update tests** when features change
5. **Run accessibility tests** on every PR
6. **Check security tests** weekly
7. **Review audit report** regularly

## Contributing

When adding new tests:

1. Follow existing test structure
2. Use helper functions from `helpers.ts`
3. Add meaningful test descriptions
4. Include both positive and negative test cases
5. Capture screenshots for visual verification
6. Update this README with new test coverage

## Support

For issues or questions:
- GitHub Issues: [ProtoThrive Issues](https://github.com/protothrive/issues)
- Documentation: See `CLAUDE.md` for technical details

---

**Built with ❤️ by the ProtoThrive Team**
**Powered by Playwright**
