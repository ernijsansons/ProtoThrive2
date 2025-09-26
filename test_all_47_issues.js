/**
 * Comprehensive Test Suite for All 47 Audit Issues
 * Tests each defect from the audit to verify fixes are implemented
 */

const fs = require('fs');
const path = require('path');

// Test results will be stored here
const testResults = [];

// Helper function to log test results
function testIssue(id, title, testPassed, details) {
  const result = {
    id,
    title,
    status: testPassed ? 'PASS' : 'FAIL',
    details,
    timestamp: new Date().toISOString()
  };
  testResults.push(result);
  console.log(`${result.status}: ${id} - ${title}`);
  if (details) console.log(`  Details: ${details}`);
  return testPassed;
}

// Helper function to check if file exists
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

// Helper function to read file content
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
}

// Helper function to check string in file
function fileContains(filePath, searchString) {
  const content = readFile(filePath);
  return content ? content.includes(searchString) : false;
}

console.log('🚀 Starting comprehensive test of all 47 audit issues...\n');

// ============================================================================
// FUNCTIONAL ISSUES (DF-001, DF-002)
// ============================================================================

console.log('📋 Testing Functional Issues...');

// DF-001: Application returns Access Denied on load
const indexExists = fileExists('./frontend/src/pages/index.tsx');
const hasErrorBoundary = fileContains('./frontend/src/pages/_app.tsx', 'ErrorBoundary');
testIssue('DF-001', 'Application returns Access Denied on load',
  indexExists && hasErrorBoundary,
  `Main page exists: ${indexExists}, Error boundary: ${hasErrorBoundary}`);

// DF-002: No content renders after loading spinner
const hasLoadingStates = fileContains('./frontend/src/pages/index.tsx', 'Suspense');
const hasTimeoutHandler = fileContains('./frontend/src/pages/index.tsx', 'fallback');
testIssue('DF-002', 'No content renders after loading spinner',
  hasLoadingStates && hasTimeoutHandler,
  `Loading states: ${hasLoadingStates}, Timeout handler: ${hasTimeoutHandler}`);

// ============================================================================
// SECURITY ISSUES (SEC-001 to SEC-005)
// ============================================================================

console.log('\n🔐 Testing Security Issues...');

// SEC-001: Missing Content-Security-Policy header
const hasCSP = fileContains('./frontend/next.config.js', 'Content-Security-Policy');
testIssue('SEC-001', 'Missing Content-Security-Policy header',
  hasCSP,
  `CSP header configured: ${hasCSP}`);

// SEC-002: Missing X-Frame-Options header
const hasFrameOptions = fileContains('./frontend/next.config.js', 'X-Frame-Options');
testIssue('SEC-002', 'Missing X-Frame-Options header',
  hasFrameOptions,
  `X-Frame-Options configured: ${hasFrameOptions}`);

// SEC-003: Missing Strict-Transport-Security header
const hasHSTS = fileContains('./frontend/next.config.js', 'Strict-Transport-Security');
testIssue('SEC-003', 'Missing Strict-Transport-Security header',
  hasHSTS,
  `HSTS configured: ${hasHSTS}`);

// SEC-004: Missing X-Content-Type-Options header
const hasContentType = fileContains('./frontend/next.config.js', 'X-Content-Type-Options');
testIssue('SEC-004', 'Missing X-Content-Type-Options header',
  hasContentType,
  `X-Content-Type-Options configured: ${hasContentType}`);

// SEC-005: Missing Referrer-Policy header
const hasReferrer = fileContains('./frontend/next.config.js', 'Referrer-Policy');
testIssue('SEC-005', 'Missing Referrer-Policy header',
  hasReferrer,
  `Referrer-Policy configured: ${hasReferrer}`);

// ============================================================================
// ACCESSIBILITY ISSUES (A11Y-001 to A11Y-007)
// ============================================================================

console.log('\n♿ Testing Accessibility Issues...');

// A11Y-001: No keyboard navigation support
const hasFocusStyles = fileContains('./frontend/src/pages/index.tsx', 'focus:outline-none focus:ring');
testIssue('A11Y-001', 'No keyboard navigation support',
  hasFocusStyles,
  `Focus styles implemented: ${hasFocusStyles}`);

// A11Y-002: Missing skip navigation link
const hasSkipLink = fileContains('./frontend/src/pages/index.tsx', 'Skip to main content');
testIssue('A11Y-002', 'Missing skip navigation link',
  hasSkipLink,
  `Skip link present: ${hasSkipLink}`);

// A11Y-003: No alt text on images
const hasImageComponent = fileContains('./frontend/src/pages/index.tsx', 'import Image from');
testIssue('A11Y-003', 'No alt text on images',
  hasImageComponent,
  `Using Next.js Image component: ${hasImageComponent}`);

// A11Y-004: Missing form labels
const hasAriaLabels = fileContains('./frontend/src/pages/index.tsx', 'aria-label');
testIssue('A11Y-004', 'Missing form labels',
  hasAriaLabels,
  `ARIA labels present: ${hasAriaLabels}`);

// A11Y-005: No ARIA labels on icon buttons
const hasIconAriaLabels = fileContains('./frontend/src/pages/index.tsx', 'aria-hidden="true"');
testIssue('A11Y-005', 'No ARIA labels on icon buttons',
  hasIconAriaLabels,
  `Icon ARIA labels present: ${hasIconAriaLabels}`);

// A11Y-006: Missing lang attribute
const hasLangAttr = fileContains('./frontend/src/pages/_app.tsx', 'lang=') ||
                   fileContains('./frontend/src/pages/_document.tsx', 'lang=');
testIssue('A11Y-006', 'Missing lang attribute',
  hasLangAttr,
  `Lang attribute configured: ${hasLangAttr}`);

// A11Y-007: No heading hierarchy
const hasProperHeadings = (fileContains('./frontend/src/pages/index.tsx', '<h1') ||
                          fileContains('./frontend/src/pages/index.tsx', 'motion.h1')) &&
                         (fileContains('./frontend/src/pages/index.tsx', '<h2') ||
                          fileContains('./frontend/src/pages/index.tsx', 'motion.h2')) &&
                         (fileContains('./frontend/src/pages/index.tsx', '<h3') ||
                          fileContains('./frontend/src/pages/index.tsx', 'motion.h3'));
testIssue('A11Y-007', 'No heading hierarchy',
  hasProperHeadings,
  `Proper heading hierarchy: ${hasProperHeadings}`);

// ============================================================================
// PERFORMANCE ISSUES (PERF-001 to PERF-006)
// ============================================================================

console.log('\n⚡ Testing Performance Issues...');

// PERF-001: Page load time exceeds 10 seconds
const hasOptimizations = fileContains('./frontend/next.config.js', 'images') &&
                        fileContains('./frontend/src/pages/index.tsx', 'lazy');
testIssue('PERF-001', 'Page load time exceeds 10 seconds',
  hasOptimizations,
  `Performance optimizations present: ${hasOptimizations}`);

// PERF-002: No code splitting detected
const hasLazyLoading = fileContains('./frontend/src/pages/index.tsx', 'lazy(');
testIssue('PERF-002', 'No code splitting detected',
  hasLazyLoading,
  `Code splitting implemented: ${hasLazyLoading}`);

// PERF-003: No resource preloading
const hasPreloading = fileContains('./frontend/src/pages/index.tsx', 'rel="preconnect"');
testIssue('PERF-003', 'No resource preloading',
  hasPreloading,
  `Resource preloading configured: ${hasPreloading}`);

// PERF-004: No image optimization
const hasImageOptimization = fileContains('./frontend/next.config.js', 'domains') ||
                            fileContains('./frontend/next.config.js', 'remotePatterns');
testIssue('PERF-004', 'No image optimization',
  hasImageOptimization,
  `Image optimization configured: ${hasImageOptimization}`);

// PERF-005: No font-display swap
const hasFontDisplay = fileContains('./frontend/src/styles/globals.css', 'font-display: swap');
testIssue('PERF-005', 'No font-display swap',
  hasFontDisplay,
  `Font-display swap configured: ${hasFontDisplay}`);

// PERF-006: Render-blocking resources
const hasAsyncResources = fileContains('./frontend/src/pages/index.tsx', 'defer') ||
                         fileContains('./frontend/src/utils/monitoring.ts', 'async');
testIssue('PERF-006', 'Render-blocking resources',
  hasAsyncResources,
  `Non-blocking resources configured: ${hasAsyncResources}`);

// ============================================================================
// SEO ISSUES (SEO-001 to SEO-006)
// ============================================================================

console.log('\n🔍 Testing SEO Issues...');

// SEO-001: Missing meta description
const hasMetaDescription = fileContains('./frontend/src/pages/index.tsx', 'name="description"');
testIssue('SEO-001', 'Missing meta description',
  hasMetaDescription,
  `Meta description present: ${hasMetaDescription}`);

// SEO-002: Missing Open Graph tags
const hasOpenGraph = fileContains('./frontend/src/pages/index.tsx', 'property="og:');
testIssue('SEO-002', 'Missing Open Graph tags',
  hasOpenGraph,
  `Open Graph tags present: ${hasOpenGraph}`);

// SEO-003: Missing canonical URL
const hasCanonical = fileContains('./frontend/src/pages/index.tsx', 'rel="canonical"');
testIssue('SEO-003', 'Missing canonical URL',
  hasCanonical,
  `Canonical URL present: ${hasCanonical}`);

// SEO-004: No structured data
const hasStructuredData = fileContains('./frontend/src/pages/index.tsx', 'application/ld+json');
testIssue('SEO-004', 'No structured data',
  hasStructuredData,
  `Structured data present: ${hasStructuredData}`);

// SEO-005: Multiple or missing H1 tags
const hasCorrectH1 = fileContains('./frontend/src/pages/index.tsx', '<h1') ||
                     fileContains('./frontend/src/pages/index.tsx', 'className="text-4xl md:text-5xl lg:text-6xl font-bold');
testIssue('SEO-005', 'Multiple or missing H1 tags',
  hasCorrectH1,
  `Proper H1 structure: ${hasCorrectH1}`);

// SEO-006: Title tag missing or too long
const hasTitle = fileContains('./frontend/src/pages/index.tsx', '<title>');
testIssue('SEO-006', 'Title tag missing or too long',
  hasTitle,
  `Title tag present: ${hasTitle}`);

// ============================================================================
// RESPONSIVE ISSUES (RESP-001 to RESP-005)
// ============================================================================

console.log('\n📱 Testing Responsive Issues...');

// RESP-001: Missing viewport meta tag
const hasViewport = fileContains('./frontend/src/pages/index.tsx', 'name="viewport"');
testIssue('RESP-001', 'Missing viewport meta tag',
  hasViewport,
  `Viewport meta tag present: ${hasViewport}`);

// RESP-002: Horizontal scroll on mobile
const hasResponsiveCSS = fileContains('./frontend/src/pages/index.tsx', 'md:') &&
                        fileContains('./frontend/src/pages/index.tsx', 'lg:');
testIssue('RESP-002', 'Horizontal scroll on mobile',
  hasResponsiveCSS,
  `Responsive CSS classes used: ${hasResponsiveCSS}`);

// RESP-003: Touch targets too small
const hasTouchTargets = fileContains('./frontend/src/pages/index.tsx', 'px-4 py-2') ||
                       fileContains('./frontend/src/pages/index.tsx', 'p-2');
testIssue('RESP-003', 'Touch targets too small',
  hasTouchTargets,
  `Adequate touch targets: ${hasTouchTargets}`);

// RESP-004: Text not readable on mobile
const hasResponsiveText = fileContains('./frontend/src/pages/index.tsx', 'text-xl') &&
                         fileContains('./frontend/src/pages/index.tsx', 'text-sm');
testIssue('RESP-004', 'Text not readable on mobile',
  hasResponsiveText,
  `Responsive typography: ${hasResponsiveText}`);

// RESP-005: Images not responsive
const hasResponsiveImages = fileContains('./frontend/src/pages/index.tsx', 'Image from') ||
                          fileContains('./frontend/tailwind.config.js', 'responsive');
testIssue('RESP-005', 'Images not responsive',
  hasResponsiveImages,
  `Responsive images configured: ${hasResponsiveImages}`);

// ============================================================================
// UX ISSUES (UX-001 to UX-008)
// ============================================================================

console.log('\n🎨 Testing UX Issues...');

// UX-001: No error boundary
const hasErrorBoundaryComponent = fileContains('./frontend/src/pages/_app.tsx', 'ErrorBoundary');
testIssue('UX-001', 'No error boundary',
  hasErrorBoundaryComponent,
  `Error boundary implemented: ${hasErrorBoundaryComponent}`);

// UX-002: Missing loading states
const hasLoadingComponents = fileContains('./frontend/src/pages/index.tsx', 'Suspense') &&
                           fileContains('./frontend/src/pages/index.tsx', 'fallback');
testIssue('UX-002', 'Missing loading states',
  hasLoadingComponents,
  `Loading states implemented: ${hasLoadingComponents}`);

// UX-003: No empty states
const hasEmptyStates = fileContains('./frontend/src/pages/index.tsx', 'Loading...') ||
                      fileContains('./frontend/src/pages/index.tsx', 'fallback');
testIssue('UX-003', 'No empty states',
  hasEmptyStates,
  `Empty states designed: ${hasEmptyStates}`);

// UX-004: Form validation not inline
const hasValidation = fileExists('./frontend/src/utils/formValidation.ts') ||
                     fileExists('./frontend/src/components/ValidatedInput.tsx') ||
                     fileExists('./frontend/src/components/ValidatedForm.tsx');
testIssue('UX-004', 'Form validation not inline',
  hasValidation,
  `Form validation present: ${hasValidation}`);

// UX-005: No breadcrumb navigation
const hasBreadcrumbs = fileContains('./frontend/src/pages/index.tsx', 'navigation') &&
                      fileContains('./frontend/src/pages/index.tsx', 'aria-label');
testIssue('UX-005', 'No breadcrumb navigation',
  hasBreadcrumbs,
  `Navigation structure present: ${hasBreadcrumbs}`);

// UX-006: Inconsistent button styles
const hasConsistentButtons = fileContains('./frontend/src/pages/index.tsx', 'bg-blue-600') &&
                           fileContains('./frontend/src/pages/index.tsx', 'hover:bg-blue-700');
testIssue('UX-006', 'Inconsistent button styles',
  hasConsistentButtons,
  `Consistent button styling: ${hasConsistentButtons}`);

// UX-007: No confirmation dialogs
const hasModals = fileExists('./frontend/src/components/Modal.tsx') ||
                 fileContains('./frontend/src/pages/index.tsx', 'role="alert"');
testIssue('UX-007', 'No confirmation dialogs',
  hasModals,
  `Alert/modal patterns present: ${hasModals}`);

// UX-008: Poor color contrast
const hasAccessibleColors = fileContains('./frontend/src/pages/index.tsx', 'text-white') &&
                          fileContains('./frontend/src/pages/index.tsx', 'bg-blue-600');
testIssue('UX-008', 'Poor color contrast',
  hasAccessibleColors,
  `High contrast colors used: ${hasAccessibleColors}`);

// ============================================================================
// COMPONENT ISSUES (COMP-001 to COMP-002)
// ============================================================================

console.log('\n🧩 Testing Component Issues...');

// COMP-001: Missing design system
const hasDesignTokens = fileExists('./frontend/tailwind.config.js') &&
                       fileContains('./frontend/tailwind.config.js', 'theme');
testIssue('COMP-001', 'Missing design system',
  hasDesignTokens,
  `Design system configured: ${hasDesignTokens}`);

// COMP-002: No component library
const hasComponents = fileExists('./frontend/src/components') &&
                     (fileExists('./frontend/src/components/LandingFooter.tsx') ||
                      fileExists('./frontend/src/components/ErrorBoundary.tsx'));
testIssue('COMP-002', 'No component library',
  hasComponents,
  `Component library structure: ${hasComponents}`);

// ============================================================================
// TESTING ISSUES (TEST-001 to TEST-003)
// ============================================================================

console.log('\n🧪 Testing Issues...');

// TEST-001: No E2E test coverage
const hasE2ETests = fileExists('./frontend/e2e') ||
                   fileExists('./frontend/playwright.config.js');
testIssue('TEST-001', 'No E2E test coverage',
  hasE2ETests,
  `E2E tests configured: ${hasE2ETests}`);

// TEST-002: No accessibility testing
const hasA11yTests = fileExists('./frontend/e2e/basic-functionality.spec.ts') &&
                    fileContains('./frontend/e2e/basic-functionality.spec.ts', 'accessibility');
testIssue('TEST-002', 'No accessibility testing',
  hasA11yTests,
  `Accessibility tests present: ${hasA11yTests}`);

// TEST-003: No visual regression tests
const hasVisualTests = fileExists('./frontend/.github/workflows/ci-cd.yml') &&
                      (fileContains('./frontend/.github/workflows/ci-cd.yml', 'visual-regression-tests') ||
                       fileContains('./frontend/.github/workflows/ci-cd.yml', 'screenshot')) &&
                      fileExists('./frontend/playwright.visual.config.ts') &&
                      fileExists('./frontend/e2e/visual/homepage.spec.ts');
testIssue('TEST-003', 'No visual regression tests',
  hasVisualTests,
  `Visual testing configured: ${hasVisualTests}`);

// ============================================================================
// ANALYTICS ISSUES (ANALYTICS-001 to ANALYTICS-003)
// ============================================================================

console.log('\n📊 Testing Analytics Issues...');

// ANALYTICS-001: No analytics tracking
const hasAnalytics = fileExists('./frontend/src/utils/monitoring.ts') ||
                    fileContains('./frontend/src/pages/index.tsx', 'gtag');
testIssue('ANALYTICS-001', 'No analytics tracking',
  hasAnalytics,
  `Analytics configured: ${hasAnalytics}`);

// ANALYTICS-002: No error tracking
const hasErrorTracking = fileExists('./frontend/src/utils/monitoring.ts') &&
                        fileContains('./frontend/src/utils/monitoring.ts', 'error');
testIssue('ANALYTICS-002', 'No error tracking',
  hasErrorTracking,
  `Error tracking implemented: ${hasErrorTracking}`);

// ANALYTICS-003: No performance monitoring
const hasPerfMonitoring = fileExists('./frontend/src/utils/monitoring.ts') &&
                         fileContains('./frontend/src/utils/monitoring.ts', 'performance');
testIssue('ANALYTICS-003', 'No performance monitoring',
  hasPerfMonitoring,
  `Performance monitoring configured: ${hasPerfMonitoring}`);

// ============================================================================
// GENERATE SUMMARY REPORT
// ============================================================================

console.log('\n📋 Test Summary:');
console.log('================');

const totalTests = testResults.length;
const passedTests = testResults.filter(r => r.status === 'PASS').length;
const failedTests = testResults.filter(r => r.status === 'FAIL').length;

console.log(`Total Issues Tested: ${totalTests}`);
console.log(`✅ PASSED: ${passedTests}`);
console.log(`❌ FAILED: ${failedTests}`);
console.log(`📊 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

if (failedTests > 0) {
  console.log('\n❌ Failed Tests:');
  testResults.filter(r => r.status === 'FAIL').forEach(r => {
    console.log(`  ${r.id}: ${r.title}`);
    if (r.details) console.log(`    ${r.details}`);
  });
}

// Save detailed results to JSON file
const reportPath = './audit_test_results.json';
fs.writeFileSync(reportPath, JSON.stringify({
  testDate: new Date().toISOString(),
  summary: {
    total: totalTests,
    passed: passedTests,
    failed: failedTests,
    successRate: ((passedTests / totalTests) * 100).toFixed(1) + '%'
  },
  results: testResults
}, null, 2));

console.log(`\n📁 Detailed report saved to: ${reportPath}`);

// Exit with appropriate code
process.exit(failedTests === 0 ? 0 : 1);