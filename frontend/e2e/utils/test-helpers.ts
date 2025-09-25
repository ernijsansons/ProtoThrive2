/**
 * E2E Test Helper Utilities for ProtoThrive
 * Reusable functions for common E2E testing patterns
 *
 * Ref: CLAUDE.md Phase 3 - E2E Testing Framework
 */

import { Page, expect, Locator } from '@playwright/test';
import { testUsers, selectors, mockResponses } from '../fixtures/test-data';

export class AuthHelper {
  constructor(private page: Page) {}

  async loginWithDeveloper() {
    await this.page.goto('/login');
    await this.page.waitForLoadState('networkidle');

    // Click development login button
    await this.page.click(selectors.auth.devLoginButton);

    // Wait for redirect to dashboard
    await this.page.waitForURL('/dashboard');
    await this.waitForAuthState(true);
  }

  async loginWithCredentials(email: string, password: string) {
    await this.page.goto('/login');
    await this.page.waitForLoadState('networkidle');

    await this.page.fill(selectors.auth.emailInput, email);
    await this.page.fill(selectors.auth.passwordInput, password);
    await this.page.click(selectors.auth.loginButton);

    await this.page.waitForURL('/dashboard');
    await this.waitForAuthState(true);
  }

  async logout() {
    await this.page.click(selectors.auth.userMenu);
    await this.page.click(selectors.auth.logoutButton);
    await this.page.waitForURL('/login');
    await this.waitForAuthState(false);
  }

  async waitForAuthState(isAuthenticated: boolean) {
    if (isAuthenticated) {
      await expect(this.page.locator(selectors.auth.userMenu)).toBeVisible();
    } else {
      await expect(this.page.locator(selectors.auth.loginButton)).toBeVisible();
    }
  }

  async mockAuthAPI() {
    // Mock login endpoint
    await this.page.route('**/api/auth/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockResponses.auth.success)
      });
    });

    // Mock demo token endpoint
    await this.page.route('**/auth/demo-token', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockResponses.auth.demoToken)
      });
    });

    // Mock validation endpoint
    await this.page.route('**/api/auth/validate', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ valid: true, user: mockResponses.auth.success.user })
      });
    });
  }
}

export class RoadmapHelper {
  constructor(private page: Page) {}

  async createRoadmapFromVision(vision: string, projectType: string = 'web_platform') {
    await this.page.goto('/dashboard');
    await this.page.waitForLoadState('networkidle');

    // Open roadmap creation
    await this.page.click('[data-testid="create-roadmap-button"]');

    // Fill vision
    await this.page.fill(selectors.roadmap.visionInput, vision);

    // Select project type
    await this.page.selectOption(selectors.roadmap.projectTypeSelect, projectType);

    // Generate roadmap
    await this.page.click(selectors.roadmap.generateButton);

    // Wait for generation to complete
    await this.waitForRoadmapGeneration();

    // Verify nodes are created
    await expect(this.page.locator(selectors.roadmap.node).first()).toBeVisible();
  }

  async waitForRoadmapGeneration() {
    // Wait for loading state to finish
    await this.page.waitForSelector('[data-testid="generation-loading"]', { state: 'hidden' });

    // Wait for canvas to render
    await this.page.waitForSelector(selectors.dashboard.canvas);

    // Wait for at least one node to appear
    await this.page.waitForSelector(selectors.roadmap.node);
  }

  async saveRoadmap() {
    await this.page.click(selectors.roadmap.saveButton);
    await expect(this.page.locator('[data-testid="save-success"]')).toBeVisible();
  }

  async exportRoadmap() {
    await this.page.click(selectors.roadmap.exportButton);

    // Wait for download to start
    const downloadPromise = this.page.waitForEvent('download');
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toContain('roadmap');
    return download;
  }

  async toggleCanvasMode() {
    await this.page.click(selectors.dashboard.modeToggle);

    // Wait for mode transition
    await this.page.waitForTimeout(1000);
  }

  async mockRoadmapAPI() {
    // Mock roadmap creation
    await this.page.route('**/api/roadmaps', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(mockResponses.roadmap.created)
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([mockResponses.roadmap.created])
        });
      }
    });

    // Mock specific roadmap fetch
    await this.page.route('**/api/roadmaps/*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockResponses.roadmap.created)
      });
    });
  }
}

export class AgentHelper {
  constructor(private page: Page) {}

  async runAnalysis(task: string = 'Analyze this roadmap', budget: number = 0.5) {
    // Open agent panel
    await this.page.click('[data-testid="agent-panel-toggle"]');

    // Configure analysis
    await this.page.fill(selectors.agent.taskInput, task);
    await this.page.fill(selectors.agent.budgetInput, budget.toString());

    // Start analysis
    await this.page.click(selectors.agent.analysisButton);

    // Wait for analysis to complete
    await this.waitForAnalysisComplete();
  }

  async waitForAnalysisComplete() {
    // Wait for progress bar to appear and complete
    await expect(this.page.locator(selectors.agent.progressBar)).toBeVisible();
    await this.page.waitForSelector('[data-testid="analysis-complete"]');

    // Verify results are shown
    await expect(this.page.locator(selectors.agent.results)).toBeVisible();
  }

  async selectAgent(agentType: 'enterprise' | 'lightweight' | 'auto') {
    await this.page.selectOption(selectors.agent.agentSelect, agentType);
  }

  async mockAgentAPI() {
    await this.page.route('**/api/agent/run', async route => {
      // Simulate analysis delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockResponses.agent.analysis)
      });
    });
  }
}

export class PerformanceHelper {
  constructor(private page: Page) {}

  async measurePageLoad(url: string) {
    const startTime = Date.now();

    await this.page.goto(url);
    await this.page.waitForLoadState('networkidle');

    const endTime = Date.now();
    const loadTime = endTime - startTime;

    // Get performance metrics
    const metrics = await this.page.evaluate(() => {
      const perf = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: perf.domContentLoadedEventEnd - perf.domContentLoadedEventStart,
        firstContentfulPaint: 0, // Would need additional measurement
        timeToInteractive: perf.loadEventEnd - perf.fetchStart,
        totalLoadTime: perf.loadEventEnd - (perf as any).navigationStart
      };
    });

    return {
      loadTime,
      ...metrics
    };
  }

  async measureInteraction(action: () => Promise<void>) {
    const startTime = Date.now();
    await action();
    const endTime = Date.now();

    return endTime - startTime;
  }

  async checkMemoryUsage() {
    return await this.page.evaluate(() => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        return {
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit
        };
      }
      return null;
    });
  }
}

export class AccessibilityHelper {
  constructor(private page: Page) {}

  async checkFocusTrapping(containerSelector: string) {
    const container = this.page.locator(containerSelector);
    const focusableElements = await container.locator('button, input, select, textarea, [tabindex]:not([tabindex="-1"])').all();

    if (focusableElements.length === 0) return true;

    // Focus first element
    await focusableElements[0].focus();

    // Tab through all elements
    for (let i = 0; i < focusableElements.length; i++) {
      await this.page.keyboard.press('Tab');
    }

    // Should cycle back to first element
    const focused = await this.page.evaluate(() => document.activeElement?.tagName);
    const firstElementTag = await focusableElements[0].evaluate(el => el.tagName);

    return focused === firstElementTag;
  }

  async checkAriaLabels(containerSelector: string) {
    const issues = await this.page.locator(containerSelector).evaluate(container => {
      const issues: string[] = [];
      const elementsNeedingLabels = container.querySelectorAll('button, input, select, textarea');

      elementsNeedingLabels.forEach((element, index) => {
        const hasAriaLabel = element.hasAttribute('aria-label');
        const hasAriaLabelledBy = element.hasAttribute('aria-labelledby');
        const hasAssociatedLabel = element.id && document.querySelector(`label[for="${element.id}"]`);

        if (!hasAriaLabel && !hasAriaLabelledBy && !hasAssociatedLabel) {
          issues.push(`Element ${index} (${element.tagName}) missing accessible label`);
        }
      });

      return issues;
    });

    return issues;
  }

  async checkColorContrast() {
    // This would typically use a contrast checking library
    // For now, we'll do a basic check
    return await this.page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      const issues: string[] = [];

      elements.forEach((element, index) => {
        const style = window.getComputedStyle(element);
        const color = style.color;
        const backgroundColor = style.backgroundColor;

        // Basic check - in real implementation, you'd calculate actual contrast ratio
        if (color && backgroundColor && color === backgroundColor) {
          issues.push(`Element ${index} may have poor color contrast`);
        }
      });

      return issues;
    });
  }
}

export async function setupMockAPIs(page: Page) {
  const authHelper = new AuthHelper(page);
  const roadmapHelper = new RoadmapHelper(page);
  const agentHelper = new AgentHelper(page);

  await authHelper.mockAuthAPI();
  await roadmapHelper.mockRoadmapAPI();
  await agentHelper.mockAgentAPI();
}

export async function waitForHydration(page: Page) {
  // Wait for React hydration to complete
  await page.waitForFunction(() => {
    // Check if React has hydrated by looking for React DevTools
    return window.React !== undefined || document.querySelector('[data-reactroot]') !== null;
  });
}

console.log('Thermonuclear E2E: Test helpers initialized for comprehensive testing');