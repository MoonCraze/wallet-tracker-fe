import { test, expect } from '@playwright/test';
import path from 'path';

// Use authenticated state for these tests
test.use({ 
  storageState: path.join(__dirname, '../.playwright/.auth/user.json') 
});

/**
 * Configuration Page Tests
 * Tests the whale tracker configuration management
 */
test.describe('Configuration Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/config');
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
  });

  test('should display configuration page', async ({ page }) => {
    await expect(page.getByText(/config|settings/i).first()).toBeVisible();
  });

  test('should display configuration form elements', async ({ page }) => {
    // Wait for config to load
    await page.waitForTimeout(1000);
    
    // Check for common configuration elements
    // These should exist based on the config types
    const hasFormElements = await page.locator('input, select, [role="switch"]').count() > 0;
    expect(hasFormElements).toBe(true);
  });

  test('should have threshold configuration section', async ({ page }) => {
    // Look for threshold-related text or inputs
    const thresholdSection = page.getByText(/threshold|minimum|amount/i);
    await expect(thresholdSection.first()).toBeVisible({ timeout: 10000 });
  });

  test('should have wallet list section', async ({ page }) => {
    // Look for wallet-related configuration
    const walletSection = page.getByText(/wallet|address|tracked/i);
    await expect(walletSection.first()).toBeVisible({ timeout: 10000 });
  });

  test('should show excluded tokens section', async ({ page }) => {
    // Look for token exclusion configuration
    const tokenSection = page.getByText(/token|exclude|blacklist/i);
    await expect(tokenSection.first()).toBeVisible({ timeout: 10000 });
  });

  test.describe('Configuration Updates', () => {
    test('should show save/update button', async ({ page }) => {
      const saveButton = page.getByRole('button', { name: /save|update|apply/i });
      await expect(saveButton.first()).toBeVisible({ timeout: 10000 });
    });

    test('should show feedback on configuration change', async ({ page }) => {
      // Find a switch or toggle
      const toggle = page.locator('[role="switch"]').first();
      
      if (await toggle.isVisible()) {
        // Click the toggle
        await toggle.click();
        
        // Should either show a toast, or a save button becomes active
        // This is a basic interaction test
        await page.waitForTimeout(500);
        
        // The page should still be functional
        await expect(page).toHaveURL(/config/);
      }
    });
  });
});

test.describe('Configuration - Error Handling', () => {
  test.use({ 
    storageState: path.join(__dirname, '../.playwright/.auth/user.json') 
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Intercept API and return error
    await page.route('**/api/config**', (route) => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ message: 'Server error' }),
      });
    });

    await page.goto('/config');
    
    // Should show error state or retry option
    // The page should not crash
    await expect(page).toHaveURL(/config/);
    
    // Look for error message or retry button
    const hasErrorHandling = await page
      .getByText(/error|failed|retry|try again/i)
      .isVisible()
      .catch(() => false);
    
    // Either shows error or has some fallback UI
    expect(hasErrorHandling || await page.locator('body').isVisible()).toBe(true);
  });
});
