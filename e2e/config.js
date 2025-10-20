/**
 * Test Configuration for ProtoThrive E2E Testing
 * Centralized configuration for all test suites
 */
export const TEST_CONFIG = {
    // Deployment URLs
    frontend: {
        url: 'https://876017e2.protothrive-frontend.pages.dev',
        pages: {
            home: '/',
            login: '/login',
            register: '/register',
            dashboard: '/dashboard',
            privacy: '/privacy',
            terms: '/terms',
            docs: '/docs',
            forgotPassword: '/forgot-password',
            roadmapNew: '/roadmap/new',
            roadmapView: (id) => `/roadmap/${id}`,
        },
    },
    backend: {
        url: 'https://protothrive-backend.ernijs-ansons.workers.dev',
        endpoints: {
            health: '/health',
            status: '/api/status',
            register: '/api/auth/register',
            login: '/api/auth/login',
            refresh: '/api/auth/refresh',
            roadmaps: '/api/roadmaps',
            snippets: '/api/snippets',
        },
    },
    // Test credentials
    testUser: {
        email: `test-${Date.now()}@protothrive-qa.com`,
        password: 'TestPassword123!@#',
        name: 'Test User',
    },
    // Performance thresholds
    performance: {
        lcp: 2500, // Largest Contentful Paint (ms)
        fid: 100, // First Input Delay (ms)
        cls: 0.1, // Cumulative Layout Shift
        ttfb: 800, // Time to First Byte (ms)
        fcp: 1800, // First Contentful Paint (ms)
        apiResponseTime: 100, // API response time (ms)
        pageLoadTime: 2000, // Page load time (ms)
    },
    // Lighthouse thresholds
    lighthouse: {
        performance: 90,
        accessibility: 95,
        bestPractices: 95,
        seo: 90,
    },
    // Timeouts
    timeouts: {
        navigation: 30000,
        api: 10000,
        element: 5000,
    },
    // Viewport sizes
    viewports: {
        mobile: { width: 375, height: 667 }, // iPhone SE
        tablet: { width: 768, height: 1024 }, // iPad
        desktop: { width: 1920, height: 1080 }, // Desktop
    },
    // Security testing
    security: {
        sqlInjectionPayloads: [
            "' OR '1'='1",
            "1' OR '1' = '1",
            "'; DROP TABLE users--",
            "1' UNION SELECT NULL--",
        ],
        xssPayloads: [
            '<script>alert("XSS")</script>',
            '<img src=x onerror=alert("XSS")>',
            'javascript:alert("XSS")',
            '<svg onload=alert("XSS")>',
        ],
    },
};
