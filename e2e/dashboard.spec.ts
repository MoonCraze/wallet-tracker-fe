import { test, expect } from '@playwright/test';
import path from 'path';

// Use authenticated state for these tests
test.use({ 
  storageState: path.join(__dirname, '../.playwright/.auth/user.json') 
});

/**
 * Dashboard Tests
 * Tests the main dashboard functionality with authenticated user
 */
test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display dashboard header', async ({ page }) => {
    // Check for header elements
    await expect(page.getByRole('banner')).toBeVisible();
    await expect(page.getByText(/whale tracker|dashboard/i).first()).toBeVisible();
  });

  test('should display sidebar navigation', async ({ page }) => {
    // Check for navigation links
    const nav = page.getByRole('navigation');
    await expect(nav).toBeVisible();
    
    // Check for key navigation items
    await expect(page.getByRole('link', { name: /dashboard|overview/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /transfers/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /config|settings/i })).toBeVisible();
  });

  test('should display stats cards', async ({ page }) => {
    // Wait for stats to load
    await page.waitForLoadState('networkidle');
    
    // Check for stats cards (using data-testid if available, or text content)
    const statsSection = page.locator('[class*="stats"], [class*="card"]').first();
    await expect(statsSection).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to transfers page', async ({ page }) => {
    await page.getByRole('link', { name: /transfers/i }).click();
    await expect(page).toHaveURL(/transfers/);
    await expect(page.getByText(/transfer/i).first()).toBeVisible();
  });

  test('should navigate to coordinated trades page', async ({ page }) => {
    await page.getByRole('link', { name: /coordinated/i }).click();
    await expect(page).toHaveURL(/coordinated/);
  });

  test('should navigate to config page', async ({ page }) => {
    await page.getByRole('link', { name: /config|settings/i }).click();
    await expect(page).toHaveURL(/config/);
  });

  test('should navigate to live feed page', async ({ page }) => {
    await page.getByRole('link', { name: /live/i }).click();
    await expect(page).toHaveURL(/live/);
  });

  test('should navigate to analytics page', async ({ page }) => {
    await page.getByRole('link', { name: /analytics/i }).click();
    await expect(page).toHaveURL(/analytics/);
  });
});

test.describe('Responsive Design', () => {
  test('should show mobile menu on small screens', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Sidebar should be hidden or collapsible on mobile
    // Look for menu toggle button
    const menuButton = page.getByRole('button', { name: /menu|toggle/i });
    
    // Either menu button exists OR sidebar adapts to mobile
    const hasMenuButton = await menuButton.isVisible().catch(() => false);
    const hasSidebar = await page.locator('[class*="sidebar"]').isVisible();
    
    expect(hasMenuButton || hasSidebar).toBe(true);
  });
});
