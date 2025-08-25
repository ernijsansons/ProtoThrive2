import { test, expect } from '@playwright/test';

test.describe('Roadmap Creation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.goto('/');
    
    // In a real test, you would sign in with Clerk
    // For now, we'll assume the user is authenticated
  });

  test('should create a new roadmap', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard');
    
    // Click create new roadmap button
    await page.click('button:has-text("Create Roadmap")');
    
    // Fill in the vision
    await page.fill('textarea[name="vision"]', 'Build an AI-powered SaaS platform');
    
    // Enable vibe mode
    await page.check('input[name="vibeMode"]');
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Wait for navigation to the roadmap page
    await page.waitForURL(/\/roadmap\/.+/);
    
    // Verify the canvas is loaded
    await expect(page.locator('.react-flow')).toBeVisible();
    
    // Verify initial nodes are present
    await expect(page.locator('.react-flow__node')).toHaveCount(2);
  });

  test('should enable 3D mode', async ({ page }) => {
    // Navigate to an existing roadmap
    await page.goto('/roadmap/test-id');
    
    // Click the vibe mode toggle
    await page.click('button:has-text("2D Mode")');
    
    // Verify 3D scene is loaded
    await expect(page.locator('canvas')).toBeVisible();
    
    // Verify button text changed
    await expect(page.locator('button:has-text("3D Mode")')).toBeVisible();
  });

  test('should drag and drop template', async ({ page }) => {
    await page.goto('/roadmap/test-id');
    
    // Open template library
    await page.click('button:has-text("Templates")');
    
    // Wait for templates to load
    await expect(page.locator('[data-testid="template-library"]')).toBeVisible();
    
    // Drag a template to the canvas
    const template = page.locator('[data-template-id="auth-flow"]');
    const canvas = page.locator('.react-flow__renderer');
    
    await template.dragTo(canvas, {
      targetPosition: { x: 300, y: 200 },
    });
    
    // Verify new node was added
    const nodeCount = await page.locator('.react-flow__node').count();
    expect(nodeCount).toBeGreaterThan(2);
  });

  test('should show real-time collaboration', async ({ browser }) => {
    // Create two browser contexts (users)
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();
    
    // Both users navigate to the same roadmap
    const roadmapUrl = '/roadmap/collab-test';
    await page1.goto(roadmapUrl);
    await page2.goto(roadmapUrl);
    
    // Wait for WebSocket connections
    await page1.waitForTimeout(1000);
    await page2.waitForTimeout(1000);
    
    // Verify presence indicators
    await expect(page1.locator('text=/2 users connected/')).toBeVisible();
    await expect(page2.locator('text=/2 users connected/')).toBeVisible();
    
    // User 1 moves a node
    const node = page1.locator('.react-flow__node').first();
    await node.dragTo(node, {
      targetPosition: { x: 100, y: 100 },
    });
    
    // Verify the change is reflected in user 2's view
    await page2.waitForTimeout(500);
    // In a real test, you would verify the node position changed
    
    await context1.close();
    await context2.close();
  });

  test('should export and import roadmap', async ({ page, downloads }) => {
    await page.goto('/roadmap/test-id');
    
    // Export the roadmap
    const downloadPromise = page.waitForEvent('download');
    await page.click('button[aria-label="Export roadmap"]');
    const download = await downloadPromise;
    
    // Verify download
    expect(download.suggestedFilename()).toMatch(/roadmap-.*\.json/);
    
    // Save the file
    const path = await download.path();
    expect(path).toBeTruthy();
    
    // Import the roadmap
    await page.goto('/dashboard');
    await page.click('button:has-text("Import Roadmap")');
    
    // Upload the file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(path!);
    
    // Verify import success
    await expect(page.locator('text=/Import successful/')).toBeVisible();
  });
});