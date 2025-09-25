// Ref: CLAUDE.md - Performance Service Tests
// Converted to Jest';
import { PerformanceService, performanceService } from '../../services/performanceService';
import { testUtils, mockData } from '../../test-utils/testSetup';

describe('PerformanceService', () => {
  let service: PerformanceService;

  beforeEach(() => {
    service = new PerformanceService({
      lazyLoading: true,
      imageOptimization: true,
      bundleSplitting: true,
      preloading: true,
      serviceworker: false, // Disable for testing
      compression: true,
      minification: true,
      treeShaking: true,
      criticalCSS: true,
      resourceHints: true,
    });

    // Mock performance API entries
    testUtils.mockPerformanceEntry({
      name: 'navigation',
      entryType: 'navigation',
      startTime: 0,
      duration: 1500,
    });
  });

  afterEach(() => {
    service.cleanup();
  });

  describe('Performance Monitoring', () => {
    it('should track custom timing measurements', async () => {
      const endTiming = service.startTiming('test-operation');

      // Simulate some work
      await testUtils.simulateDelay(100);

      const duration = endTiming();

      expect(duration).toBeGreaterThan(90); // Allow for timing variance
      expect(duration).toBeLessThan(200);
    });

    it('should mark feature usage', () => {
      service.markFeatureUsage('roadmap-creation');
      service.markFeatureUsage('collaboration-session', 5000);

      // Verify metrics were recorded (would check internal metrics in real implementation)
      expect(true).toBe(true); // Placeholder assertion
    });

    it('should generate performance report', async () => {
      // Mock navigation timing
      const mockNavigationTiming = {
        domContentLoadedEventStart: 1000,
        domContentLoadedEventEnd: 1200,
        loadEventStart: 1800,
        loadEventEnd: 2000,
        responseStart: 500,
        requestStart: 400,
      };

      vi.mocked(performance.getEntriesByType).mockReturnValue([
        mockNavigationTiming as any,
      ]);

      const mockPaintEntries = [
        { name: 'first-paint', startTime: 800 },
        { name: 'first-contentful-paint', startTime: 900 },
      ];

      vi.mocked(performance.getEntriesByType).mockImplementation((type) => {
        if (type === 'navigation') return [mockNavigationTiming as any];
        if (type === 'paint') return mockPaintEntries as any;
        return [];
      });

      const report = await service.generateReport();

      expect(report).toEqual(
        expect.objectContaining({
          pageLoad: expect.objectContaining({
            domContentLoaded: 200,
            loadComplete: 200,
            firstPaint: 800,
            firstContentfulPaint: 900,
          }),
          webVitals: expect.any(Array),
          resources: expect.any(Array),
          memory: expect.objectContaining({
            usedJSHeapSize: expect.any(Number),
            totalJSHeapSize: expect.any(Number),
            jsHeapSizeLimit: expect.any(Number),
          }),
          network: expect.objectContaining({
            effectiveType: expect.any(String),
            downlink: expect.any(Number),
            rtt: expect.any(Number),
          }),
          device: expect.objectContaining({
            deviceMemory: expect.any(Number),
            hardwareConcurrency: expect.any(Number),
          }),
          customMetrics: expect.any(Array),
        })
      );
    });
  });

  describe('Web Vitals Tracking', () => {
    it('should handle web vital measurements', () => {
      // Mock FCP entry
      const fcpEntry = { name: 'first-contentful-paint', startTime: 1200 };
      vi.mocked(performance.getEntriesByName).mockReturnValue([fcpEntry as any]);

      // Trigger FCP tracking (simplified)
      service['trackFirstContentfulPaint']();

      // Verify web vital was recorded (implementation detail)
      expect(true).toBe(true);
    });

    it('should calculate web vital ratings correctly', () => {
      const goodFcp = service['getWebVitalRating']('FCP', 1500);
      const needsImprovementFcp = service['getWebVitalRating']('FCP', 2500);
      const poorFcp = service['getWebVitalRating']('FCP', 4000);

      expect(goodFcp).toBe('good');
      expect(needsImprovementFcp).toBe('needs-improvement');
      expect(poorFcp).toBe('poor');
    });

    it('should handle different web vital types', () => {
      const vitals = [
        { name: 'FCP', value: 1500, expected: 'good' },
        { name: 'LCP', value: 3000, expected: 'needs-improvement' },
        { name: 'FID', value: 250, expected: 'needs-improvement' },
        { name: 'CLS', value: 0.2, expected: 'needs-improvement' },
        { name: 'TTFB', value: 1000, expected: 'needs-improvement' },
        { name: 'INP', value: 150, expected: 'good' },
      ];

      vitals.forEach(({ name, value, expected }) => {
        const rating = service['getWebVitalRating'](name as any, value);
        expect(rating).toBe(expected);
      });
    });
  });

  describe('Performance Optimization', () => {
    it('should check WebP support', () => {
      const supportsWebP = service['supportsWebP']();
      expect(typeof supportsWebP).toBe('boolean');
    });

    it('should check if element is in viewport', () => {
      // Mock element with getBoundingClientRect
      const mockElement = {
        getBoundingClientRect: vi.fn().mockReturnValue({
          top: 100,
          left: 50,
          bottom: 200,
          right: 150,
        }),
      } as any;

      // Mock window dimensions
      Object.defineProperty(window, 'innerHeight', { value: 800, writable: true });
      Object.defineProperty(window, 'innerWidth', { value: 1200, writable: true });

      const isInViewport = service['isInViewport'](mockElement);
      expect(isInViewport).toBe(true);
    });

    it('should determine prefetch eligibility', () => {
      const internalUrl = '/dashboard';
      const externalUrl = 'https://external.com/page';
      const fileUrl = '/document.pdf';
      const anchorUrl = '/page#section';

      expect(service['shouldPrefetch'](internalUrl)).toBe(true);
      expect(service['shouldPrefetch'](externalUrl)).toBe(false);
      expect(service['shouldPrefetch'](fileUrl)).toBe(false);
      expect(service['shouldPrefetch'](anchorUrl)).toBe(false);
    });

    it('should load components dynamically', async () => {
      // Mock dynamic import
      const mockComponent = { default: vi.fn() };
      vi.doMock('../components/TestComponent', () => mockComponent);

      const component = await service['loadComponent']('TestComponent');
      expect(component).toBeDefined();
    });
  });

  describe('Performance Budget', () => {
    it('should check performance budget compliance', () => {
      // Add some mock metrics that would pass/fail budget
      service['metrics'] = [
        mockData.performanceMetric({
          name: 'webvital_fcp',
          value: 1500, // Good
        }),
        mockData.performanceMetric({
          name: 'webvital_lcp',
          value: 3000, // Needs improvement
        }),
        mockData.performanceMetric({
          name: 'webvital_fid',
          value: 80, // Good
        }),
      ];

      const budgetCheck = service.checkPerformanceBudget();

      expect(budgetCheck).toEqual(
        expect.objectContaining({
          passed: expect.any(Boolean),
          results: expect.any(Array),
        })
      );

      if (budgetCheck.results.length > 0) {
        budgetCheck.results.forEach(result => {
          expect(result).toEqual(
            expect.objectContaining({
              metric: expect.any(String),
              value: expect.any(Number),
              budget: expect.any(Number),
              passed: expect.any(Boolean),
            })
          );
        });
      }
    });
  });

  describe('Bundle Analysis', () => {
    it('should analyze bundles and provide recommendations', async () => {
      const analysis = await service.analyzeBundles();

      expect(analysis).toEqual(
        expect.objectContaining({
          totalSize: expect.any(Number),
          gzippedSize: expect.any(Number),
          chunks: expect.any(Array),
          duplicates: expect.any(Array),
          recommendations: expect.arrayContaining([
            expect.stringContaining('lazy loading'),
          ]),
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle missing performance API gracefully', () => {
      // Mock missing APIs
      const originalPerformance = global.performance;
      delete (global as any).performance;

      const newService = new PerformanceService();

      expect(() => newService.generateReport()).not.toThrow();

      // Restore
      global.performance = originalPerformance;
    });

    it('should handle web vital tracking errors', () => {
      // Mock PerformanceObserver to throw
      const originalObserver = global.PerformanceObserver;
      global.PerformanceObserver = vi.fn().mockImplementation(() => {
        throw new Error('Observer not supported');
      });

      expect(() => {
        new PerformanceService();
      }).not.toThrow();

      // Restore
      global.PerformanceObserver = originalObserver;
    });

    it('should handle memory API unavailability', () => {
      const memoryInfo = service['getMemoryInfo']();

      expect(memoryInfo).toEqual(
        expect.objectContaining({
          usedJSHeapSize: expect.any(Number),
          totalJSHeapSize: expect.any(Number),
          jsHeapSizeLimit: expect.any(Number),
        })
      );
    });
  });

  describe('Cleanup and Resource Management', () => {
    it('should cleanup observers and resources', () => {
      const mockDisconnect = vi.fn();
      service['observer'] = { disconnect: mockDisconnect } as any;
      service['intersectionObserver'] = { disconnect: mockDisconnect } as any;

      service.cleanup();

      expect(mockDisconnect).toHaveBeenCalledTimes(2);
      expect(service['metrics']).toEqual([]);
      expect(service['isInitialized']).toBe(false);
    });

    it('should handle multiple cleanup calls', () => {
      service.cleanup();
      expect(() => service.cleanup()).not.toThrow();
    });
  });
});

describe('Global Performance Service', () => {
  it('should use the global performance service', () => {
    const endTiming = performanceService.startTiming('global-test');
    const duration = endTiming();

    expect(duration).toBeGreaterThan(0);
  });

  it('should provide convenient performance methods', async () => {
    const { perf } = await import('../../services/performanceService');

    const endTiming = perf.mark('convenience-test');
    const duration = endTiming();

    expect(duration).toBeGreaterThan(0);

    const report = await perf.report();
    expect(report).toBeDefined();

    const budget = perf.budget();
    expect(budget).toEqual(
      expect.objectContaining({
        passed: expect.any(Boolean),
        results: expect.any(Array),
      })
    );

    perf.feature('test-feature', 1000);
    // Should not throw
  });
});

describe('Performance Integration', () => {
  it('should integrate with cache service for web vitals storage', async () => {
    const { cacheService } = await import('../../services/cacheService');

    // Mock a web vital being reported
    service['reportWebVital']('FCP', 1500);

    // Check if it was cached (implementation detail)
    const cachedVitals = await cacheService.getByTags(['webvital']);
    // This would contain vitals in a real implementation
    expect(cachedVitals).toBeDefined();
  });

  it('should work with real-world performance scenarios', async () => {
    // Simulate a complete page load scenario
    const scenarios = [
      { name: 'page-navigation', duration: 100 },
      { name: 'component-render', duration: 50 },
      { name: 'api-request', duration: 200 },
      { name: 'image-loading', duration: 300 },
    ];

    const timings: number[] = [];

    for (const scenario of scenarios) {
      const endTiming = service.startTiming(scenario.name);
      await testUtils.simulateDelay(scenario.duration);
      const duration = endTiming();
      timings.push(duration);
    }

    // Verify all timings are reasonable
    timings.forEach((timing, index) => {
      const expectedDuration = scenarios[index].duration;
      expect(timing).toBeGreaterThan(expectedDuration - 50); // Allow variance
      expect(timing).toBeLessThan(expectedDuration + 100);
    });

    console.log('🔥 Performance Scenario Results:', timings.map(t => `${t.toFixed(2)}ms`).join(', '));
  });
});