/**
 * Roadmap Generation E2E Tests for ProtoThrive
 * Tests core roadmap creation and AI generation flows
 *
 * Ref: CLAUDE.md Phase 3 - E2E Testing Framework
 */

import { test, expect } from '@playwright/test';
import { AuthHelper, RoadmapHelper, setupMockAPIs, waitForHydration } from './utils/test-helpers';
import { testProjects, selectors } from './fixtures/test-data';

test.describe('Roadmap Generation Flows', () => {
  let authHelper: AuthHelper;
  let roadmapHelper: RoadmapHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    roadmapHelper = new RoadmapHelper(page);
    await setupMockAPIs(page);
    await authHelper.loginWithDeveloper();
  });

  test.describe('Vision to Roadmap Generation', () => {
    test('should generate roadmap from simple web app vision', async ({ page }) => {
      const project = testProjects.simpleWebApp;

      await page.goto('/dashboard');
      await waitForHydration(page);

      // Start roadmap creation
      await page.click('[data-testid="create-roadmap-button"]');

      // Fill vision
      await page.fill(selectors.roadmap.visionInput, project.vision);
      await page.selectOption(selectors.roadmap.projectTypeSelect, project.projectType);

      // Generate roadmap
      await page.click(selectors.roadmap.generateButton);

      // Wait for generation
      await roadmapHelper.waitForRoadmapGeneration();

      // Verify roadmap structure
      const nodes = await page.locator(selectors.roadmap.node).count();
      expect(nodes).toBeGreaterThanOrEqual(project.expectedNodes - 2);
      expect(nodes).toBeLessThanOrEqual(project.expectedNodes + 2);

      // Check that nodes have proper data
      const firstNode = page.locator(selectors.roadmap.node).first();
      await expect(firstNode).toBeVisible();
      await expect(firstNode).toContainText(/setup|planning|kickoff/i);

      // Verify thrive score is calculated
      await expect(page.locator(selectors.dashboard.thriveScore)).toBeVisible();
      const thriveScore = await page.locator(selectors.dashboard.thriveScore).textContent();
      expect(parseFloat(thriveScore || '0')).toBeGreaterThan(0);
    });

    test('should generate mobile app roadmap with different structure', async ({ page }) => {
      const project = testProjects.mobileApp;

      await roadmapHelper.createRoadmapFromVision(project.vision, project.projectType);

      // Mobile apps should have platform-specific nodes
      await expect(page.locator('[data-testid*="mobile"]')).toBeVisible();
      await expect(page.locator('[data-testid*="backend"]')).toBeVisible();

      // Should have higher estimated duration
      const durationElement = page.locator('[data-testid="estimated-duration"]');
      if (await durationElement.isVisible()) {
        const duration = await durationElement.textContent();
        expect(parseInt(duration || '0')).toBeGreaterThanOrEqual(project.expectedDuration - 20);
      }
    });

    test('should handle AI product with complex features', async ({ page }) => {
      const project = testProjects.aiProduct;

      await roadmapHelper.createRoadmapFromVision(project.vision, project.projectType);

      // AI products should have AI-related nodes
      const roadmapText = await page.locator(selectors.dashboard.canvas).textContent();
      expect(roadmapText?.toLowerCase()).toMatch(/ai|machine learning|ml|model/);

      // Should suggest longer timeline for complex AI features
      const nodes = await page.locator(selectors.roadmap.node).count();
      expect(nodes).toBeGreaterThanOrEqual(project.expectedNodes - 2);
    });

    test('should extract features from detailed vision', async ({ page }) => {
      const detailedVision = `
        Users can register and login to the platform.
        They should be able to create projects and invite team members.
        The system must support real-time collaboration with live chat.
        Implement file sharing and document management.
        Add notification system with email and push notifications.
        Include analytics dashboard with charts and reports.
        Support multiple payment methods and subscription billing.
      `;

      await roadmapHelper.createRoadmapFromVision(detailedVision, 'web_platform');

      // Should create nodes for major features
      const roadmapContent = await page.locator(selectors.dashboard.canvas).textContent();
      expect(roadmapContent?.toLowerCase()).toMatch(/auth|login|register/);
      expect(roadmapContent?.toLowerCase()).toMatch(/real-time|chat|collaboration/);
      expect(roadmapContent?.toLowerCase()).toMatch(/notification|email/);
      expect(roadmapContent?.toLowerCase()).toMatch(/payment|billing/);
    });

    test('should handle empty or minimal vision gracefully', async ({ page }) => {
      await page.goto('/dashboard');
      await waitForHydration(page);

      await page.click('[data-testid="create-roadmap-button"]');

      // Try with empty vision
      await page.click(selectors.roadmap.generateButton);

      // Should show validation error
      await expect(page.locator('[data-testid="vision-error"]')).toBeVisible();

      // Try with minimal vision
      await page.fill(selectors.roadmap.visionInput, 'Build an app');
      await page.click(selectors.roadmap.generateButton);

      // Should still generate basic roadmap
      await roadmapHelper.waitForRoadmapGeneration();
      const nodes = await page.locator(selectors.roadmap.node).count();
      expect(nodes).toBeGreaterThan(0);
    });
  });

  test.describe('Canvas Interaction', () => {
    test('should switch between 2D and 3D modes', async ({ page }) => {
      await roadmapHelper.createRoadmapFromVision(testProjects.simpleWebApp.vision);

      // Switch to 3D mode
      await roadmapHelper.toggleCanvasMode();

      // Verify 3D canvas is active
      await expect(page.locator('[data-testid="3d-canvas"]')).toBeVisible();

      // Switch back to 2D
      await roadmapHelper.toggleCanvasMode();

      // Verify 2D canvas is active
      await expect(page.locator('[data-testid="2d-canvas"]')).toBeVisible();
    });

    test('should allow node selection and editing', async ({ page }) => {
      await roadmapHelper.createRoadmapFromVision(testProjects.simpleWebApp.vision);

      // Click on a node
      const firstNode = page.locator(selectors.roadmap.node).first();
      await firstNode.click();

      // Should show node details panel
      await expect(page.locator('[data-testid="node-details-panel"]')).toBeVisible();

      // Should highlight selected node
      await expect(firstNode).toHaveClass(/selected|highlighted/);

      // Should allow editing node properties
      const nodeTitle = page.locator('[data-testid="node-title-input"]');
      if (await nodeTitle.isVisible()) {
        await nodeTitle.fill('Updated Node Title');
        await page.keyboard.press('Enter');

        // Should update node in canvas
        await expect(firstNode).toContainText('Updated Node Title');
      }
    });

    test('should support drag and drop for node positioning', async ({ page }) => {
      await roadmapHelper.createRoadmapFromVision(testProjects.simpleWebApp.vision);

      const firstNode = page.locator(selectors.roadmap.node).first();
      const secondNode = page.locator(selectors.roadmap.node).nth(1);

      // Get initial positions
      const initialFirstBox = await firstNode.boundingBox();
      const initialSecondBox = await secondNode.boundingBox();

      // Drag first node
      await firstNode.dragTo(secondNode, { targetPosition: { x: 50, y: 50 } });

      // Wait for position update
      await page.waitForTimeout(500);

      // Verify position changed
      const newFirstBox = await firstNode.boundingBox();
      expect(newFirstBox?.x).not.toBe(initialFirstBox?.x);
    });

    test('should zoom and pan the canvas', async ({ page }) => {
      await roadmapHelper.createRoadmapFromVision(testProjects.simpleWebApp.vision);

      const canvas = page.locator(selectors.dashboard.canvas);

      // Test zoom in with wheel
      await canvas.hover();
      await page.mouse.wheel(0, -100);

      // Test zoom out
      await page.mouse.wheel(0, 100);

      // Test panning
      await canvas.hover();
      await page.mouse.down();
      await page.mouse.move(100, 100);
      await page.mouse.up();

      // Canvas should remain functional
      await expect(page.locator(selectors.roadmap.node).first()).toBeVisible();
    });
  });

  test.describe('Roadmap Operations', () => {
    test('should save roadmap successfully', async ({ page }) => {
      await roadmapHelper.createRoadmapFromVision(testProjects.simpleWebApp.vision);
      await roadmapHelper.saveRoadmap();

      // Should show success message
      await expect(page.locator('[data-testid="save-success"]')).toBeVisible();

      // Should update URL to show roadmap ID
      expect(page.url()).toMatch(/roadmap\/[\w-]+/);
    });

    test('should export roadmap in multiple formats', async ({ page }) => {
      await roadmapHelper.createRoadmapFromVision(testProjects.simpleWebApp.vision);

      // Test JSON export
      await page.click('[data-testid="export-dropdown"]');
      await page.click('[data-testid="export-json"]');

      const [download1] = await Promise.all([
        page.waitForEvent('download'),
        page.click('[data-testid="confirm-export"]')
      ]);

      expect(download1.suggestedFilename()).toContain('.json');

      // Test PNG export
      await page.click('[data-testid="export-dropdown"]');
      await page.click('[data-testid="export-png"]');

      const [download2] = await Promise.all([
        page.waitForEvent('download'),
        page.click('[data-testid="confirm-export"]')
      ]);

      expect(download2.suggestedFilename()).toContain('.png');
    });

    test('should share roadmap with team members', async ({ page }) => {
      await roadmapHelper.createRoadmapFromVision(testProjects.simpleWebApp.vision);
      await roadmapHelper.saveRoadmap();

      // Open share dialog
      await page.click('[data-testid="share-button"]');

      // Should show share options
      await expect(page.locator('[data-testid="share-dialog"]')).toBeVisible();

      // Generate share link
      await page.click('[data-testid="generate-link"]');

      // Should show shareable link
      const shareLink = page.locator('[data-testid="share-link"]');
      await expect(shareLink).toBeVisible();

      const linkText = await shareLink.textContent();
      expect(linkText).toMatch(/https?:\/\/.+\/roadmap\/[\w-]+/);
    });

    test('should handle roadmap templates', async ({ page }) => {
      await page.goto('/dashboard');
      await waitForHydration(page);

      // Open template selector
      await page.click('[data-testid="use-template-button"]');

      // Should show available templates
      await expect(page.locator('[data-testid="template-selector"]')).toBeVisible();

      // Select a template
      await page.click('[data-testid="template-web-app"]');

      // Should load template into canvas
      await expect(page.locator(selectors.roadmap.node)).toHaveCount.toBeGreaterThan(0);

      // Should be able to customize template
      await page.fill(selectors.roadmap.visionInput, 'Customized from template');
      await page.click('[data-testid="apply-customization"]');

      // Should update roadmap with customizations
      await page.waitForTimeout(1000);
      const nodeCount = await page.locator(selectors.roadmap.node).count();
      expect(nodeCount).toBeGreaterThan(2);
    });
  });

  test.describe('Error Handling', () => {
    test('should handle generation failures gracefully', async ({ page }) => {
      // Mock API failure
      await page.route('**/api/ai-roadmap', async route => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'AI service unavailable' })
        });
      });

      await page.goto('/dashboard');
      await waitForHydration(page);

      await page.click('[data-testid="create-roadmap-button"]');
      await page.fill(selectors.roadmap.visionInput, testProjects.simpleWebApp.vision);
      await page.click(selectors.roadmap.generateButton);

      // Should show error message
      await expect(page.locator('[data-testid="generation-error"]')).toBeVisible();

      // Should offer fallback options
      await expect(page.locator('[data-testid="use-template-fallback"]')).toBeVisible();
      await expect(page.locator('[data-testid="retry-generation"]')).toBeVisible();
    });

    test('should handle network timeouts', async ({ page }) => {
      // Mock slow response
      await page.route('**/api/ai-roadmap', async route => {
        await new Promise(resolve => setTimeout(resolve, 35000)); // Longer than timeout
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, nodes: [], edges: [] })
        });
      });

      await page.goto('/dashboard');
      await waitForHydration(page);

      await page.click('[data-testid="create-roadmap-button"]');
      await page.fill(selectors.roadmap.visionInput, testProjects.simpleWebApp.vision);
      await page.click(selectors.roadmap.generateButton);

      // Should show timeout error
      await expect(page.locator('[data-testid="timeout-error"]')).toBeVisible();

      // Should offer retry option
      await expect(page.locator('[data-testid="retry-generation"]')).toBeVisible();
    });

    test('should validate input before generation', async ({ page }) => {
      await page.goto('/dashboard');
      await waitForHydration(page);

      await page.click('[data-testid="create-roadmap-button"]');

      // Try to generate without vision
      await page.click(selectors.roadmap.generateButton);

      // Should show validation errors
      await expect(page.locator('[data-testid="vision-required"]')).toBeVisible();

      // Try with very short vision
      await page.fill(selectors.roadmap.visionInput, 'App');
      await page.click(selectors.roadmap.generateButton);

      // Should show minimum length error
      await expect(page.locator('[data-testid="vision-too-short"]')).toBeVisible();
    });
  });

  test.describe('Performance', () => {
    test('should generate roadmaps within acceptable time', async ({ page }) => {
      const startTime = Date.now();

      await roadmapHelper.createRoadmapFromVision(testProjects.simpleWebApp.vision);

      const endTime = Date.now();
      const generationTime = endTime - startTime;

      // Should complete within 10 seconds (including UI interactions)
      expect(generationTime).toBeLessThan(10000);
    });

    test('should handle large roadmaps efficiently', async ({ page }) => {
      const complexVision = `
        Build a comprehensive enterprise platform with user management, project management,
        document collaboration, real-time chat, video conferencing, file storage,
        advanced analytics, reporting dashboard, API integrations, mobile apps,
        security features, audit logging, backup systems, monitoring, and more.
      `;

      await roadmapHelper.createRoadmapFromVision(complexVision, 'web_platform');

      // Should handle complex roadmaps without performance issues
      const nodes = await page.locator(selectors.roadmap.node).count();
      expect(nodes).toBeGreaterThan(10);

      // Canvas should remain responsive
      const canvas = page.locator(selectors.dashboard.canvas);
      await canvas.hover();
      await page.mouse.wheel(0, -100); // Zoom should work smoothly

      await expect(page.locator(selectors.roadmap.node).first()).toBeVisible();
    });
  });
});

console.log('Thermonuclear E2E: Roadmap generation tests initialized for comprehensive coverage');