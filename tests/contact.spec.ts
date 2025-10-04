import { test, expect } from '@playwright/test';

test.describe('Contact Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/kontakt');
  });

  test('should submit successfully with valid data', async ({ page }) => {
    // Fill out the form
    await page.locator('#name').fill('Test User');
    await page.locator('#email').fill('test.user@example.com');
    await page.locator('#message').fill('This is a test message.');

    // Mock the fetch request to Formspree to avoid actual submissions
    await page.route('https://formspree.io/f/mnqennra', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true }),
      });
    });

    // Submit the form
    await page.locator('button[type="submit"]').click();

    // Verify success message
    const feedback = page.locator('#form-feedback');
    await expect(feedback).toBeVisible();
    await expect(feedback).toHaveText(/Vielen Dank/);
    await expect(feedback).toHaveClass(/bg-green-600/);

    // Verify the form was reset
    await expect(page.locator('#name')).toBeEmpty();
  });

  test('should show an error for invalid email', async ({ page }) => {
    // Fill out the form with an invalid email
    await page.locator('#name').fill('Test User');
    await page.locator('#email').fill('not-an-email');
    await page.locator('#message').fill('This is a test message.');

    // Submit the form
    await page.locator('button[type="submit"]').click();

    // Verify error message
    const feedback = page.locator('#form-feedback');
    await expect(feedback).toBeVisible();
    await expect(feedback).toHaveText(/gültige E-Mail-Adresse/);
    await expect(feedback).toHaveClass(/bg-red-600/);
  });

  test('should show an error for empty required fields', async ({ page }) => {
    // Attempt to submit an empty form
    await page.locator('button[type="submit"]').click();

    // Verify error message
    const feedback = page.locator('#form-feedback');
    await expect(feedback).toBeVisible();
    await expect(feedback).toHaveText(/alle Felder aus/);
    await expect(feedback).toHaveClass(/bg-red-600/);
  });
});