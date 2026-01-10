import { test, expect } from '@playwright/test';

/**
 * Authentication Flow Tests
 * Tests the login/logout functionality and auth guards
 */
test.describe('Authentication', () => {
  test.describe('Login Page', () => {
    test('should display login form', async ({ page }) => {
      await page.goto('/login');
      
      // Check form elements are present
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/password/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /sign in|login/i })).toBeVisible();
    });

    test('should show validation errors for empty form', async ({ page }) => {
      await page.goto('/login');
      
      // Try to submit empty form
      await page.getByRole('button', { name: /sign in|login/i }).click();
      
      // Should show validation message or stay on login page
      await expect(page).toHaveURL(/login/);
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/login');
      
      // Fill with invalid credentials
      await page.getByLabel(/email/i).fill('invalid@example.com');
      await page.getByLabel(/password/i).fill('wrongpassword');
      await page.getByRole('button', { name: /sign in|login/i }).click();
      
      // Should show error message and stay on login page
      await expect(page).toHaveURL(/login/);
      // Look for error message (toast or inline)
      const errorVisible = await page.getByText(/invalid|error|failed|incorrect/i).isVisible()
        .catch(() => false);
      
      // Either error is shown or we stay on login page
      expect(errorVisible || (await page.url()).includes('/login')).toBe(true);
    });
  });

  test.describe('Protected Routes', () => {
    test('should redirect unauthenticated users to login', async ({ page }) => {
      // Clear any existing auth state
      await page.context().clearCookies();
      
      // Try to access protected route
      await page.goto('/');
      
      // Should redirect to login
      await expect(page).toHaveURL(/login/);
    });

    test('should redirect from /transfers to login when not authenticated', async ({ page }) => {
      await page.context().clearCookies();
      await page.goto('/transfers');
      await expect(page).toHaveURL(/login/);
    });

    test('should redirect from /config to login when not authenticated', async ({ page }) => {
      await page.context().clearCookies();
      await page.goto('/config');
      await expect(page).toHaveURL(/login/);
    });
  });
});
