/**
 * End-to-End User Journey Tests
 * Complete user workflows from registration to roadmap management
 *
 * Test Scenarios:
 * - New user onboarding journey
 * - Roadmap creation and collaboration
 * - Code snippet management
 * - Account settings and security
 * - Mobile and desktop experiences
 */

import { test, expect, Page } from '@playwright/test';

test.describe('New User Onboarding Journey', () => {
  test('should complete full registration and onboarding flow', async ({ page }) => {
    // Step 1: Navigate to landing page
    await page.goto('/');
    await expect(page).toHaveTitle(/ProtoThrive/i);

    // Step 2: Click registration CTA
    await page.click('text=Get Started');
    await expect(page).toHaveURL(/\/register/);

    // Step 3: Fill registration form
    const timestamp = Date.now();
    await page.fill('input[name="email"]', `test-${timestamp}@example.com`);
    await page.fill('input[name="password"]', 'SecureTestPassword123!');
    await page.fill('input[name="name"]', 'Test User');

    // Step 4: Submit registration
    await page.click('button[type="submit"]');

    // Step 5: Verify redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('text=Welcome')).toBeVisible();

    // Step 6: Complete onboarding tutorial
    await expect(page.locator('[data-testid="onboarding-modal"]')).toBeVisible();
    await page.click('button:has-text("Next")');
    await page.click('button:has-text("Next")');
    await page.click('button:has-text("Get Started")');

    // Step 7: Verify onboarding completion
    await expect(page.locator('[data-testid="onboarding-modal"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="dashboard-content"]')).toBeVisible();
  });

  test('should show validation errors for invalid registration', async ({ page }) => {
    await page.goto('/register');

    // Weak password
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'weak');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=/password.*strong|complexity/i')).toBeVisible();

    // Invalid email
    await page.fill('input[name="email"]', 'not-an-email');
    await page.fill('input[name="password"]', 'SecurePass123!');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=/invalid.*email/i')).toBeVisible();
  });
});

test.describe('Roadmap Creation Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await loginUser(page, 'user@example.com', 'SecurePass123!');
  });

  test('should create and save a new roadmap', async ({ page }) => {
    // Step 1: Navigate to dashboard
    await page.goto('/dashboard');

    // Step 2: Click "Create Roadmap"
    await page.click('button:has-text("Create Roadmap")');
    await expect(page).toHaveURL(/\/roadmap\/new/);

    // Step 3: Enter roadmap details
    await page.fill('input[name="title"]', 'My First Roadmap');
    await page.fill('textarea[name="description"]', 'Testing roadmap creation');

    // Step 4: Add nodes to canvas
    await page.click('[data-testid="add-node-button"]');
    await page.selectOption('[data-testid="node-type"]', 'feature');
    await page.fill('input[name="nodeLabel"]', 'Feature 1');
    await page.click('button:has-text("Add Node")');

    await expect(page.locator('[data-node-label="Feature 1"]')).toBeVisible();

    // Step 5: Add another node
    await page.click('[data-testid="add-node-button"]');
    await page.selectOption('[data-testid="node-type"]', 'task');
    await page.fill('input[name="nodeLabel"]', 'Task 1');
    await page.click('button:has-text("Add Node")');

    // Step 6: Connect nodes with edge
    await page.click('[data-node-label="Feature 1"]');
    await page.keyboard.down('Shift');
    await page.click('[data-node-label="Task 1"]');
    await page.keyboard.up('Shift');

    await expect(page.locator('[data-edge-source="Feature 1"]')).toBeVisible();

    // Step 7: Save roadmap
    await page.click('button:has-text("Save")');
    await expect(page.locator('text=/saved.*successfully/i')).toBeVisible();

    // Step 8: Verify roadmap in list
    await page.goto('/dashboard');
    await expect(page.locator('text=My First Roadmap')).toBeVisible();
  });

  test('should switch between 2D and 3D view modes', async ({ page }) => {
    await page.goto('/roadmap/test-roadmap-id');

    // Default 2D view
    await expect(page.locator('[data-testid="2d-canvas"]')).toBeVisible();

    // Switch to 3D
    await page.click('button:has-text("3D View")');
    await expect(page.locator('[data-testid="3d-canvas"]')).toBeVisible();
    await expect(page.locator('[data-testid="spline-viewer"]')).toBeVisible();

    // Switch back to 2D
    await page.click('button:has-text("2D View")');
    await expect(page.locator('[data-testid="2d-canvas"]')).toBeVisible();
  });

  test('should use templates for quick roadmap creation', async ({ page }) => {
    await page.goto('/roadmap/new');

    // Click "Use Template"
    await page.click('button:has-text("Use Template")');

    // Select template
    await page.click('[data-template="web-app"]');
    await expect(page.locator('text=Web Application Template')).toBeVisible();

    // Apply template
    await page.click('button:has-text("Apply Template")');

    // Verify pre-populated nodes
    await expect(page.locator('[data-node-label="Frontend"]')).toBeVisible();
    await expect(page.locator('[data-node-label="Backend"]')).toBeVisible();
    await expect(page.locator('[data-node-label="Database"]')).toBeVisible();
  });

  test('should export roadmap as JSON', async ({ page }) => {
    await page.goto('/roadmap/test-roadmap-id');

    // Click export button
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('button:has-text("Export")'),
    ]);

    expect(download.suggestedFilename()).toMatch(/\.json$/);

    // Verify downloaded content
    const path = await download.path();
    expect(path).toBeTruthy();
  });
});

test.describe('Real-Time Collaboration Journey', () => {
  test('should show live updates from other users', async ({ browser }) => {
    // Create two browser contexts (two users)
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    // User 1 logs in
    await loginUser(page1, 'user1@example.com', 'Pass123!');
    await page1.goto('/roadmap/shared-roadmap-id');

    // User 2 logs in
    await loginUser(page2, 'user2@example.com', 'Pass123!');
    await page2.goto('/roadmap/shared-roadmap-id');

    // User 1 adds a node
    await page1.click('[data-testid="add-node-button"]');
    await page1.fill('input[name="nodeLabel"]', 'Collaborative Node');
    await page1.click('button:has-text("Add Node")');

    // User 2 should see the new node (real-time update)
    await expect(page2.locator('[data-node-label="Collaborative Node"]')).toBeVisible({
      timeout: 3000,
    });

    // Verify presence indicator
    await expect(page1.locator('[data-testid="online-users"]')).toContainText('2 users online');

    await context1.close();
    await context2.close();
  });
});

test.describe('Code Snippet Management Journey', () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page, 'user@example.com', 'SecurePass123!');
  });

  test('should create and save code snippet', async ({ page }) => {
    await page.goto('/snippets');

    // Click "New Snippet"
    await page.click('button:has-text("New Snippet")');

    // Fill snippet details
    await page.fill('input[name="title"]', 'React Component');
    await page.selectOption('select[name="language"]', 'typescript');
    await page.selectOption('select[name="category"]', 'react');

    // Fill code editor
    const codeEditor = page.locator('[data-testid="code-editor"]');
    await codeEditor.click();
    await page.keyboard.type(`function Component() {
  return <div>Hello World</div>;
}`);

    // Add tags
    await page.fill('input[name="tags"]', 'react,component,typescript');

    // Save snippet
    await page.click('button:has-text("Save Snippet")');
    await expect(page.locator('text=/saved.*successfully/i')).toBeVisible();

    // Verify in list
    await page.goto('/snippets');
    await expect(page.locator('text=React Component')).toBeVisible();
  });

  test('should search and filter snippets', async ({ page }) => {
    await page.goto('/snippets');

    // Search by keyword
    await page.fill('input[placeholder="Search snippets"]', 'react');
    await page.press('input[placeholder="Search snippets"]', 'Enter');

    await expect(page.locator('[data-snippet-language="typescript"]')).toBeVisible();

    // Filter by language
    await page.selectOption('select[name="languageFilter"]', 'typescript');
    await expect(page.locator('[data-snippet-language="javascript"]')).not.toBeVisible();

    // Filter by category
    await page.selectOption('select[name="categoryFilter"]', 'react');
    await expect(page.locator('[data-snippet-category="react"]')).toBeVisible();
  });

  test('should copy snippet code to clipboard', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    await page.goto('/snippets/test-snippet-id');

    // Click copy button
    await page.click('button:has-text("Copy")');

    // Verify toast notification
    await expect(page.locator('text=/copied.*clipboard/i')).toBeVisible();

    // Verify clipboard content
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toContain('function Component()');
  });
});

test.describe('Account Settings Journey', () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page, 'user@example.com', 'SecurePass123!');
  });

  test('should update profile information', async ({ page }) => {
    await page.goto('/settings');

    // Navigate to profile tab
    await page.click('button:has-text("Profile")');

    // Update name
    await page.fill('input[name="name"]', 'Updated Name');

    // Upload avatar
    await page.setInputFiles('input[type="file"]', {
      name: 'avatar.png',
      mimeType: 'image/png',
      buffer: Buffer.from('fake-image-data'),
    });

    // Save changes
    await page.click('button:has-text("Save Changes")');
    await expect(page.locator('text=/updated.*successfully/i')).toBeVisible();

    // Verify changes persist
    await page.reload();
    await expect(page.locator('input[name="name"]')).toHaveValue('Updated Name');
  });

  test('should change password with validation', async ({ page }) => {
    await page.goto('/settings');
    await page.click('button:has-text("Security")');

    // Fill password change form
    await page.fill('input[name="currentPassword"]', 'SecurePass123!');
    await page.fill('input[name="newPassword"]', 'NewSecurePass456!');
    await page.fill('input[name="confirmPassword"]', 'NewSecurePass456!');

    // Submit
    await page.click('button:has-text("Change Password")');
    await expect(page.locator('text=/password.*changed/i')).toBeVisible();

    // Verify old password no longer works
    await page.click('[data-testid="user-menu"]');
    await page.click('text=Logout');

    const loginResult = await loginUser(page, 'user@example.com', 'SecurePass123!');
    expect(loginResult).toBe(false);

    // New password should work
    const newLoginResult = await loginUser(page, 'user@example.com', 'NewSecurePass456!');
    expect(newLoginResult).toBe(true);
  });

  test('should enable two-factor authentication', async ({ page }) => {
    await page.goto('/settings');
    await page.click('button:has-text("Security")');

    // Enable 2FA
    await page.click('button:has-text("Enable 2FA")');

    // Verify QR code displayed
    await expect(page.locator('[data-testid="qr-code"]')).toBeVisible();

    // Enter verification code
    await page.fill('input[name="verificationCode"]', '123456');
    await page.click('button:has-text("Verify")');

    // Save backup codes
    await expect(page.locator('text=/backup codes/i')).toBeVisible();
    await page.click('button:has-text("Download Backup Codes")');

    await page.click('button:has-text("Complete Setup")');
    await expect(page.locator('text=/2FA.*enabled/i')).toBeVisible();
  });
});

test.describe('Mobile Responsiveness Journey', () => {
  test('should work on mobile devices', async ({ page, context }) => {
    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'userAgent', {
        get: () => 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
      });
    });

    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE

    await loginUser(page, 'user@example.com', 'SecurePass123!');
    await page.goto('/dashboard');

    // Verify mobile navigation
    await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();

    // Open mobile menu
    await page.click('[data-testid="mobile-menu-button"]');
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();

    // Navigate to roadmaps
    await page.click('text=Roadmaps');
    await expect(page).toHaveURL(/\/dashboard/);

    // Verify touch gestures work
    await page.goto('/roadmap/test-roadmap-id');
    await expect(page.locator('[data-testid="mobile-controls"]')).toBeVisible();
  });
});

test.describe('Accessibility Journey', () => {
  test('should be navigable with keyboard only', async ({ page }) => {
    await page.goto('/');

    // Tab through navigation
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toHaveAttribute('href', '/features');

    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toHaveAttribute('href', '/pricing');

    // Navigate to registration with Enter
    await page.keyboard.press('Tab'); // Focus on "Get Started"
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/register/);

    // Fill form with keyboard
    await page.keyboard.press('Tab'); // Email field
    await page.keyboard.type('test@example.com');

    await page.keyboard.press('Tab'); // Password field
    await page.keyboard.type('SecurePass123!');

    await page.keyboard.press('Tab'); // Submit button
    await page.keyboard.press('Enter');
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await loginUser(page, 'user@example.com', 'SecurePass123!');
    await page.goto('/dashboard');

    // Check important elements have ARIA labels
    await expect(page.locator('[aria-label="Create new roadmap"]')).toBeVisible();
    await expect(page.locator('[aria-label="User menu"]')).toBeVisible();
    await expect(page.locator('[role="navigation"]')).toBeVisible();

    await page.goto('/roadmap/test-roadmap-id');
    await expect(page.locator('[aria-label="Roadmap canvas"]')).toBeVisible();
    await expect(page.locator('[role="toolbar"]')).toBeVisible();
  });

  test('should work with screen readers', async ({ page }) => {
    await page.goto('/');

    // Verify semantic HTML
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('footer')).toBeVisible();

    // Verify heading hierarchy
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBe(1);

    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    expect(headings.length).toBeGreaterThan(0);
  });
});

test.describe('Error Handling Journey', () => {
  test('should handle network errors gracefully', async ({ page, context }) => {
    await loginUser(page, 'user@example.com', 'SecurePass123!');

    // Simulate offline
    await context.setOffline(true);

    await page.goto('/dashboard');
    await page.click('button:has-text("Create Roadmap")');

    // Verify error message
    await expect(page.locator('text=/network.*error|offline/i')).toBeVisible();

    // Verify retry mechanism
    await context.setOffline(false);
    await page.click('button:has-text("Retry")');
    await expect(page).toHaveURL(/\/roadmap\/new/);
  });

  test('should handle validation errors clearly', async ({ page }) => {
    await page.goto('/register');

    // Submit empty form
    await page.click('button[type="submit"]');

    // Verify field-specific errors
    await expect(page.locator('input[name="email"] ~ .error')).toContainText('required');
    await expect(page.locator('input[name="password"] ~ .error')).toContainText('required');

    // Error summary
    await expect(page.locator('[data-testid="error-summary"]')).toBeVisible();
  });
});

// Helper Functions
async function loginUser(page: Page, email: string, password: string): Promise<boolean> {
  try {
    await page.goto('/login');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await page.waitForURL(/\/dashboard/, { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}
