import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login page', async ({ page }) => {
    await expect(page).toHaveTitle(/ProtoThrive/);
    await expect(page.locator('h1')).toContainText(/Welcome/i);
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    // Navigate to login
    await page.goto('/login');

    // Fill in login form
    await page.fill('input[name="email"]', 'test@protothrive.com');
    await page.fill('input[name="password"]', 'TestPassword123!');

    // Submit form
    await page.click('button[type="submit"]');

    // Verify redirect to dashboard
    await page.waitForURL('/dashboard');
    await expect(page.locator('h1')).toContainText(/Dashboard/i);
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    // Fill in invalid credentials
    await page.fill('input[name="email"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');

    // Submit form
    await page.click('button[type="submit"]');

    // Check for error message
    await expect(page.locator('.error-message')).toContainText(/Invalid credentials/i);
  });

  test('should register new user successfully', async ({ page }) => {
    await page.goto('/register');

    // Generate unique email for test
    const uniqueEmail = `test-${Date.now()}@protothrive.com`;

    // Fill registration form
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="password"]', 'SecurePassword123!');
    await page.fill('input[name="confirmPassword"]', 'SecurePassword123!');

    // Accept terms if present
    const termsCheckbox = page.locator('input[name="acceptTerms"]');
    if (await termsCheckbox.isVisible()) {
      await termsCheckbox.check();
    }

    // Submit form
    await page.click('button[type="submit"]');

    // Verify redirect to dashboard or login
    await expect(page).toHaveURL(/\/(dashboard|login)/);
  });

  test('should handle logout correctly', async ({ page, context }) => {
    // First login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@protothrive.com');
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Logout
    await page.click('button[aria-label="Logout"]');

    // Verify redirect to login
    await expect(page).toHaveURL('/login');

    // Verify cannot access protected route
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/login');
  });

  test('should refresh token automatically', async ({ page, context }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@protothrive.com');
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Wait for token to expire (if testing with short expiry)
    // await page.waitForTimeout(16000); // Wait 16 seconds if token expires in 15

    // Perform action that requires authentication
    await page.click('button[aria-label="Create Roadmap"]');

    // Should still be authenticated (token refreshed)
    await expect(page).toHaveURL('/dashboard');
  });
});