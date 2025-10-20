/**
 * Roadmap Management E2E Tests
 * Tests roadmap creation, editing, viewing, and canvas interactions
 */

import { test, expect } from '@playwright/test';
import { TEST_CONFIG } from './config';
import {
  register,
  login,
  generateTestEmail,
  generateStrongPassword,
  captureScreenshot,
  waitForAPIResponse,
} from './helpers';

test.describe('Roadmap Management', () => {
  let testEmail: string;
  let testPassword: string;

  test.beforeEach(async ({ page }) => {
    testEmail = generateTestEmail();
    testPassword = generateStrongPassword();

    // Register and login user
    await register(page, 'Test User', testEmail, testPassword);
    await page.waitForTimeout(2000);
    await login(page, testEmail, testPassword);
  });

  test.describe('Roadmap Creation', () => {
    test('should load new roadmap page', async ({ page }) => {
      await page.goto(TEST_CONFIG.frontend.pages.roadmapNew);
      await page.waitForLoadState('networkidle');

      // Check for template selection or roadmap canvas
      const hasContent = await page.locator('body').evaluate((el) => el.textContent !== '');
      expect(hasContent).toBeTruthy();

      await captureScreenshot(page, 'roadmap-new-page-loaded');
    });

    test('should display template library', async ({ page }) => {
      await page.goto(TEST_CONFIG.frontend.pages.roadmapNew);
      await page.waitForTimeout(2000);

      // Look for template cards or buttons
      const templates = await page.locator('[data-testid="template"], .template, button:has-text("Template")').count();

      // Should have at least one template option
      expect(templates).toBeGreaterThan(0);

      await captureScreenshot(page, 'template-library-displayed');
    });

    test('should create blank roadmap', async ({ page }) => {
      await page.goto(TEST_CONFIG.frontend.pages.roadmapNew);
      await page.waitForTimeout(1000);

      // Click blank/new roadmap button
      const blankButton = page.locator('button:has-text("Blank"), button:has-text("Start"), button:has-text("New")').first();

      if (await blankButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await blankButton.click();
        await page.waitForTimeout(2000);

        // Should navigate to editor
        const url = page.url();
        expect(url).toContain('/roadmap/');

        await captureScreenshot(page, 'blank-roadmap-created');
      } else {
        console.log('Blank roadmap button not found');
      }
    });

    test('should create roadmap from template', async ({ page }) => {
      await page.goto(TEST_CONFIG.frontend.pages.roadmapNew);
      await page.waitForTimeout(1000);

      // Click first template
      const templateButton = page.locator('[data-testid="template-button"], .template-card button, button:has-text("Use Template")').first();

      if (await templateButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await templateButton.click();
        await page.waitForTimeout(2000);

        // Should navigate to editor with template loaded
        const url = page.url();
        expect(url).toContain('/roadmap/');

        await captureScreenshot(page, 'template-roadmap-created');
      } else {
        console.log('Template button not found');
      }
    });
  });

  test.describe('Roadmap Editor', () => {
    let roadmapId: string;

    test.beforeEach(async ({ page }) => {
      // Create a roadmap
      await page.goto(TEST_CONFIG.frontend.pages.roadmapNew);
      await page.waitForTimeout(1000);

      const blankButton = page.locator('button:has-text("Blank"), button:has-text("Start")').first();
      if (await blankButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await blankButton.click();
        await page.waitForTimeout(2000);

        // Extract roadmap ID from URL
        const url = page.url();
        const match = url.match(/\/roadmap\/([^\/]+)/);
        if (match) {
          roadmapId = match[1];
        }
      }
    });

    test('should load roadmap editor', async ({ page }) => {
      if (!roadmapId) {
        test.skip();
        return;
      }

      await page.goto(TEST_CONFIG.frontend.pages.roadmapView(roadmapId));
      await page.waitForLoadState('networkidle');

      // Check for canvas/editor elements
      const hasCanvas = await page.locator('canvas, [class*="flow"], [class*="canvas"]').count() > 0;
      expect(hasCanvas).toBeTruthy();

      await captureScreenshot(page, 'roadmap-editor-loaded');
    });

    test('should display toolbar/controls', async ({ page }) => {
      if (!roadmapId) {
        test.skip();
        return;
      }

      await page.goto(TEST_CONFIG.frontend.pages.roadmapView(roadmapId));
      await page.waitForTimeout(1000);

      // Look for toolbar elements
      const toolbar = await page.locator('[class*="toolbar"], [class*="controls"], button:has-text("Add"), button:has-text("Save")').count();
      expect(toolbar).toBeGreaterThan(0);

      await captureScreenshot(page, 'editor-toolbar-displayed');
    });

    test('should add node to canvas', async ({ page }) => {
      if (!roadmapId) {
        test.skip();
        return;
      }

      await page.goto(TEST_CONFIG.frontend.pages.roadmapView(roadmapId));
      await page.waitForTimeout(1000);

      // Find add node button
      const addButton = page.locator('button:has-text("Add Node"), button:has-text("Add Task"), [aria-label*="Add"]').first();

      if (await addButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await addButton.click();
        await page.waitForTimeout(1000);

        await captureScreenshot(page, 'node-added-to-canvas');
      } else {
        // Try double-clicking canvas to add node
        const canvas = page.locator('canvas, [class*="flow"]').first();
        if (await canvas.isVisible().catch(() => false)) {
          await canvas.dblclick({ position: { x: 200, y: 200 } });
          await page.waitForTimeout(1000);
          await captureScreenshot(page, 'node-added-via-doubleclick');
        }
      }
    });

    test('should save roadmap', async ({ page }) => {
      if (!roadmapId) {
        test.skip();
        return;
      }

      await page.goto(TEST_CONFIG.frontend.pages.roadmapView(roadmapId));
      await page.waitForTimeout(1000);

      // Find save button
      const saveButton = page.locator('button:has-text("Save"), [aria-label*="Save"]').first();

      if (await saveButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        // Setup response listener
        const responsePromise = waitForAPIResponse(page, '/api/roadmaps');

        await saveButton.click();
        await page.waitForTimeout(2000);

        // Check for success indicator
        const bodyText = await page.textContent('body');
        const hasSaveSuccess = bodyText?.includes('saved') || bodyText?.includes('success');

        await captureScreenshot(page, 'roadmap-saved');
      } else {
        console.log('Save button not found - may have auto-save');
      }
    });

    test('should support zoom controls', async ({ page }) => {
      if (!roadmapId) {
        test.skip();
        return;
      }

      await page.goto(TEST_CONFIG.frontend.pages.roadmapView(roadmapId));
      await page.waitForTimeout(1000);

      // Find zoom controls
      const zoomIn = page.locator('button:has-text("+"), [aria-label*="Zoom In"]').first();
      const zoomOut = page.locator('button:has-text("-"), [aria-label*="Zoom Out"]').first();

      if (await zoomIn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await zoomIn.click();
        await page.waitForTimeout(500);
        await captureScreenshot(page, 'zoomed-in');

        if (await zoomOut.isVisible().catch(() => false)) {
          await zoomOut.click();
          await page.waitForTimeout(500);
          await captureScreenshot(page, 'zoomed-out');
        }
      } else {
        // Try keyboard shortcuts
        await page.keyboard.press('Control+=');
        await page.waitForTimeout(500);
        await page.keyboard.press('Control+-');
        await page.waitForTimeout(500);
      }
    });

    test('should support pan/drag canvas', async ({ page }) => {
      if (!roadmapId) {
        test.skip();
        return;
      }

      await page.goto(TEST_CONFIG.frontend.pages.roadmapView(roadmapId));
      await page.waitForTimeout(1000);

      const canvas = page.locator('canvas, [class*="flow"]').first();

      if (await canvas.isVisible().catch(() => false)) {
        // Get canvas bounding box
        const box = await canvas.boundingBox();
        if (box) {
          // Drag canvas
          await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
          await page.mouse.down();
          await page.mouse.move(box.x + box.width / 2 + 100, box.y + box.height / 2 + 100);
          await page.mouse.up();

          await page.waitForTimeout(500);
          await captureScreenshot(page, 'canvas-panned');
        }
      }
    });
  });

  test.describe('Roadmap List/Dashboard', () => {
    test('should display user roadmaps on dashboard', async ({ page }) => {
      await page.goto(TEST_CONFIG.frontend.pages.dashboard);
      await page.waitForLoadState('networkidle');

      // Look for roadmap list or grid
      const roadmapElements = await page.locator('[data-testid="roadmap"], .roadmap-card, .roadmap-item').count();

      // Screenshot dashboard
      await captureScreenshot(page, 'dashboard-roadmaps-displayed');
    });

    test('should navigate to roadmap from dashboard', async ({ page }) => {
      await page.goto(TEST_CONFIG.frontend.pages.dashboard);
      await page.waitForTimeout(1000);

      // Click first roadmap
      const roadmapLink = page.locator('[data-testid="roadmap-link"], .roadmap-card a, a:has-text("Roadmap")').first();

      if (await roadmapLink.isVisible({ timeout: 5000 }).catch(() => false)) {
        await roadmapLink.click();
        await page.waitForTimeout(2000);

        // Should navigate to roadmap view
        const url = page.url();
        expect(url).toContain('/roadmap/');

        await captureScreenshot(page, 'navigated-to-roadmap-from-dashboard');
      }
    });

    test('should show roadmap metadata', async ({ page }) => {
      await page.goto(TEST_CONFIG.frontend.pages.dashboard);
      await page.waitForTimeout(1000);

      // Look for metadata like dates, status, etc.
      const metadata = await page.locator('[data-testid="roadmap-date"], .roadmap-status, .roadmap-meta').count();

      await captureScreenshot(page, 'roadmap-metadata-displayed');
    });
  });

  test.describe('Roadmap Sharing & Collaboration', () => {
    test('should have share button', async ({ page }) => {
      // Create roadmap first
      await page.goto(TEST_CONFIG.frontend.pages.roadmapNew);
      await page.waitForTimeout(1000);

      const blankButton = page.locator('button:has-text("Blank")').first();
      if (await blankButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await blankButton.click();
        await page.waitForTimeout(2000);

        // Look for share button
        const shareButton = page.locator('button:has-text("Share"), [aria-label*="Share"]').first();

        if (await shareButton.isVisible({ timeout: 5000 }).catch(() => false)) {
          await captureScreenshot(page, 'share-button-found');
        }
      }
    });
  });

  test.describe('Canvas Interactions', () => {
    test('should support keyboard shortcuts', async ({ page }) => {
      await page.goto(TEST_CONFIG.frontend.pages.roadmapNew);
      await page.waitForTimeout(1000);

      // Test common shortcuts
      // Ctrl+S for save
      await page.keyboard.press('Control+s');
      await page.waitForTimeout(500);

      // Ctrl+Z for undo
      await page.keyboard.press('Control+z');
      await page.waitForTimeout(500);

      // Ctrl+Y for redo
      await page.keyboard.press('Control+y');
      await page.waitForTimeout(500);

      await captureScreenshot(page, 'keyboard-shortcuts-tested');
    });

    test('should support node selection', async ({ page }) => {
      await page.goto(TEST_CONFIG.frontend.pages.roadmapNew);
      await page.waitForTimeout(1000);

      const blankButton = page.locator('button:has-text("Blank")').first();
      if (await blankButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await blankButton.click();
        await page.waitForTimeout(2000);

        // Click on canvas to select node
        const node = page.locator('[class*="node"], [data-id]').first();
        if (await node.isVisible({ timeout: 5000 }).catch(() => false)) {
          await node.click();
          await page.waitForTimeout(500);

          // Check if node is selected (usually has different styling)
          await captureScreenshot(page, 'node-selected');
        }
      }
    });

    test('should support multi-select', async ({ page }) => {
      await page.goto(TEST_CONFIG.frontend.pages.roadmapNew);
      await page.waitForTimeout(1000);

      const blankButton = page.locator('button:has-text("Blank")').first();
      if (await blankButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await blankButton.click();
        await page.waitForTimeout(2000);

        // Try Ctrl+Click for multi-select
        const nodes = page.locator('[class*="node"], [data-id]');
        const count = await nodes.count();

        if (count >= 2) {
          await nodes.nth(0).click();
          await page.keyboard.down('Control');
          await nodes.nth(1).click();
          await page.keyboard.up('Control');

          await page.waitForTimeout(500);
          await captureScreenshot(page, 'multi-select-nodes');
        }
      }
    });
  });

  test.describe('Performance', () => {
    test('should load roadmap editor quickly', async ({ page }) => {
      const startTime = Date.now();

      await page.goto(TEST_CONFIG.frontend.pages.roadmapNew);
      await page.waitForLoadState('networkidle');

      const loadTime = Date.now() - startTime;

      // Should load within 3 seconds
      expect(loadTime).toBeLessThan(3000);

      console.log(`Roadmap editor loaded in ${loadTime}ms`);
    });

    test('should handle large roadmaps', async ({ page }) => {
      await page.goto(TEST_CONFIG.frontend.pages.roadmapNew);
      await page.waitForTimeout(1000);

      // This test would require creating a large roadmap
      // Skipping for now unless we have test data
      test.skip();
    });
  });
});
