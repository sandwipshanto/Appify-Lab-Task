import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('Feed Layout', () => {
  const testEmail = `feed-layout-${Date.now()}@example.com`;
  const testPassword = 'TestPass123';

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await page.goto(`${BASE_URL}/register`);
    await page.locator('#reg-firstName').fill('Feed');
    await page.locator('#reg-lastName').fill('Tester');
    await page.locator('#reg-email').fill(testEmail);
    await page.locator('#reg-password').fill(testPassword);
    await page.locator('#reg-repeatPassword').fill(testPassword);
    await page.locator('#agreeTerms').check();
    await page.getByRole('button', { name: /register now/i }).click();
    await page.waitForURL('**/feed', { timeout: 10000 });
    await page.close();
  });

  test('shows 3-column layout with navbar', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.locator('#login-email').fill(testEmail);
    await page.locator('#login-password').fill(testPassword);
    await page.getByRole('button', { name: /login now/i }).click();
    await page.waitForURL('**/feed', { timeout: 10000 });

    await expect(page.locator('._header_nav')).toBeVisible();
    await expect(page.locator('img._nav_logo')).toBeVisible();
    await expect(page.locator('._layout_inner_wrap')).toBeVisible();
    await expect(page.locator('._layout_left_sidebar_wrap')).toBeVisible();
    await expect(page.locator('._layout_middle_wrap')).toBeVisible();
    await expect(page.locator('._layout_right_sidebar_wrap')).toBeVisible();
    await expect(page.locator('._header_nav_para')).toContainText('Feed Tester');

    await page.screenshot({ path: 'e2e/screenshots/feed-layout.png', fullPage: true });
  });

  test('profile dropdown shows logout', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.locator('#login-email').fill(testEmail);
    await page.locator('#login-password').fill(testPassword);
    await page.getByRole('button', { name: /login now/i }).click();
    await page.waitForURL('**/feed', { timeout: 10000 });

    await page.locator('._dropdown_toggle').click();
    await expect(page.getByText('Log Out')).toBeVisible();
  });
});
