import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../.playwright/.auth/user.json');

/**
 * Authentication setup for E2E tests
 * This runs once before all tests that depend on it
 * Saves authenticated state to be reused by other tests
 */
setup('authenticate', async ({ page }) => {
  // Navigate to login page
  await page.goto('/login');

  // Wait for login form to be visible
  await expect(page.getByRole('heading', { name: /login|sign in/i })).toBeVisible();

  // Fill in credentials from environment variables
  const email = process.env.TEST_USER_EMAIL || 'test@example.com';
  const password = process.env.TEST_USER_PASSWORD || 'testpassword';

  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);

  // Submit the form
  await page.getByRole('button', { name: /sign in|login|submit/i }).click();

  // Wait for successful login - should redirect to dashboard
  await expect(page).toHaveURL('/');
  
  // Verify we're on the dashboard
  await expect(page.getByText(/dashboard|overview|whale tracker/i)).toBeVisible();

  // Save authentication state for reuse
  await page.context().storageState({ path: authFile });
});
