import { test, expect } from '../fixtures/auth.fixture';

test.describe('Roadmap Management', () => {
  test.use({
    storageState: undefined, // Use authentication fixture instead
  });

  test('should create a new roadmap', async ({ page, authenticatedContext }) => {
    // Set authorization header
    await page.setExtraHTTPHeaders({
      'Authorization': `Bearer ${authenticatedContext.token}`,
    });

    await page.goto('/dashboard');

    // Click create roadmap button
    await page.click('button:has-text("Create Roadmap")');

    // Fill roadmap form
    await page.fill('input[name="title"]', 'Test Roadmap');
    await page.fill('textarea[name="description"]', 'This is a test roadmap for E2E testing');

    // Select template if available
    const templateSelect = page.locator('select[name="template"]');
    if (await templateSelect.isVisible()) {
      await templateSelect.selectOption({ index: 1 });
    }

    // Submit form
    await page.click('button[type="submit"]');

    // Verify roadmap created
    await expect(page.locator('h2')).toContainText('Test Roadmap');
  });

  test('should edit existing roadmap', async ({ page, authenticatedContext }) => {
    await page.setExtraHTTPHeaders({
      'Authorization': `Bearer ${authenticatedContext.token}`,
    });

    await page.goto('/dashboard');

    // Click on first roadmap
    await page.click('.roadmap-card:first-child');

    // Click edit button
    await page.click('button[aria-label="Edit Roadmap"]');

    // Update title
    await page.fill('input[name="title"]', 'Updated Test Roadmap');

    // Save changes
    await page.click('button:has-text("Save")');

    // Verify update
    await expect(page.locator('h2')).toContainText('Updated Test Roadmap');
  });

  test('should add nodes to roadmap canvas', async ({ page, authenticatedContext }) => {
    await page.setExtraHTTPHeaders({
      'Authorization': `Bearer ${authenticatedContext.token}`,
    });

    await page.goto('/roadmap/test-id');

    // Add a new node
    await page.click('button[aria-label="Add Node"]');

    // Fill node details
    await page.fill('input[name="nodeTitle"]', 'Feature Node');
    await page.fill('textarea[name="nodeDescription"]', 'Implement user authentication');
    await page.selectOption('select[name="nodeType"]', 'feature');

    // Save node
    await page.click('button:has-text("Add Node")');

    // Verify node appears on canvas
    await expect(page.locator('.react-flow__node')).toContainText('Feature Node');
  });

  test('should calculate thrive score', async ({ page, authenticatedContext }) => {
    await page.setExtraHTTPHeaders({
      'Authorization': `Bearer ${authenticatedContext.token}`,
    });

    await page.goto('/roadmap/test-id');

    // Click calculate score button
    await page.click('button[aria-label="Calculate Thrive Score"]');

    // Wait for score calculation
    await page.waitForSelector('.thrive-score', { timeout: 5000 });

    // Verify score is displayed
    const scoreElement = page.locator('.thrive-score');
    await expect(scoreElement).toBeVisible();

    const scoreText = await scoreElement.textContent();
    expect(scoreText).toMatch(/\d+/); // Should contain a number
  });

  test('should delete roadmap', async ({ page, authenticatedContext }) => {
    await page.setExtraHTTPHeaders({
      'Authorization': `Bearer ${authenticatedContext.token}`,
    });

    await page.goto('/dashboard');

    // Count initial roadmaps
    const initialCount = await page.locator('.roadmap-card').count();

    // Click delete on first roadmap
    await page.click('.roadmap-card:first-child button[aria-label="Delete"]');

    // Confirm deletion
    await page.click('button:has-text("Confirm Delete")');

    // Wait for deletion
    await page.waitForTimeout(1000);

    // Verify roadmap count decreased
    const newCount = await page.locator('.roadmap-card').count();
    expect(newCount).toBe(initialCount - 1);
  });

  test('should export and import roadmap', async ({ page, authenticatedContext }) => {
    await page.setExtraHTTPHeaders({
      'Authorization': `Bearer ${authenticatedContext.token}`,
    });

    await page.goto('/roadmap/test-id');

    // Export roadmap
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('button[aria-label="Export Roadmap"]'),
    ]);

    // Verify download
    expect(download.suggestedFilename()).toContain('roadmap');
    expect(download.suggestedFilename()).toContain('.json');

    // Import roadmap
    await page.goto('/dashboard');
    await page.click('button:has-text("Import Roadmap")');

    // Upload the downloaded file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(await download.path());

    // Confirm import
    await page.click('button:has-text("Import")');

    // Verify imported roadmap appears
    await expect(page.locator('.roadmap-card:last-child')).toContainText('Imported');
  });
});