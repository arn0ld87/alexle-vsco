import { test, expect } from '@playwright/test';

test.describe('Theme Toggle', () => {
  test('should persist theme across reloads', async ({ page }) => {
    await page.goto('/');

    const themeToggle = page.locator('#theme-toggle');
    const html = page.locator('html');

    // --- Test Dark Mode ---
    // 1. Click to enable dark mode
    await themeToggle.click();
    await expect(html).toHaveClass(/dark/);
    await expect(html).toHaveAttribute('data-theme', 'dark');

    // 2. Reload and verify dark mode persists
    await page.reload();
    await expect(html).toHaveClass(/dark/);
    await expect(html).toHaveAttribute('data-theme', 'dark');

    // --- Test Light Mode ---
    // 3. Click to enable light mode
    await themeToggle.click();
    await expect(html).not.toHaveClass(/dark/);
    await expect(html).toHaveAttribute('data-theme', 'light');

    // 4. Reload and verify light mode persists
    await page.reload();
    await expect(html).not.toHaveClass(/dark/);
    await expect(html).toHaveAttribute('data-theme', 'light');
  });

  test('should not have flash of unstyled content (FOUC)', async ({ page }) => {
    // This test checks that the theme is applied before the page is fully loaded.
    // We can simulate this by checking the class immediately on navigation.

    // Set theme to dark in storage before navigating
    await page.goto('/');
    await page.evaluate(() => localStorage.setItem('theme', 'dark'));

    // Navigate to another page and check class immediately
    await page.goto('/kontakt');
    await expect(page.locator('html')).toHaveClass(/dark/);
  });
});