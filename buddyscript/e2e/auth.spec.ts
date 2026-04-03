import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('Login Page', () => {
  test('shows login form elements', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await expect(page.locator('img._left_logo')).toBeVisible();
    await expect(page.getByText('Welcome back')).toBeVisible();
    await expect(page.getByText('Login to your account')).toBeVisible();
    await expect(page.locator('#login-email')).toBeVisible();
    await expect(page.locator('#login-password')).toBeVisible();
    await expect(page.getByRole('button', { name: /login now/i })).toBeVisible();
    await expect(page.getByText('Create New Account')).toBeVisible();
  });

  test('shows error on invalid credentials', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.locator('#login-email').fill('nonexistent@example.com');
    await page.locator('#login-password').fill('WrongPass123');
    await page.getByRole('button', { name: /login now/i }).click();
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test('takes screenshot', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'e2e/screenshots/login.png', fullPage: true });
  });
});

test.describe('Register Page', () => {
  test('shows registration form elements', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`);
    await expect(page.locator('img._right_logo')).toBeVisible();
    await expect(page.getByText('Get Started Now')).toBeVisible();
    await expect(page.getByText('Registration')).toBeVisible();
    await expect(page.locator('#reg-firstName')).toBeVisible();
    await expect(page.locator('#reg-lastName')).toBeVisible();
    await expect(page.locator('#reg-email')).toBeVisible();
    await expect(page.locator('#reg-password')).toBeVisible();
    await expect(page.locator('#reg-repeatPassword')).toBeVisible();
    await expect(page.locator('#agreeTerms')).toBeVisible();
    await expect(page.getByRole('button', { name: /register now/i })).toBeVisible();
    await expect(page.getByText('Already have an account?')).toBeVisible();
  });

  test('takes screenshot', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'e2e/screenshots/register.png', fullPage: true });
  });
});

test.describe('Auth Flow', () => {
  const testEmail = `e2e-${Date.now()}@example.com`;
  const testPassword = 'TestPass123';

  test('register new user and redirect to feed', async ({ page }) => {
    await page.goto(`${BASE_URL}/register`);
    await page.locator('#reg-firstName').fill('E2E');
    await page.locator('#reg-lastName').fill('Tester');
    await page.locator('#reg-email').fill(testEmail);
    await page.locator('#reg-password').fill(testPassword);
    await page.locator('#reg-repeatPassword').fill(testPassword);
    await page.locator('#agreeTerms').check();
    await page.getByRole('button', { name: /register now/i }).click();
    await page.waitForURL('**/feed', { timeout: 10000 });
    await expect(page).toHaveURL(/\/feed/);
  });

  test('login with registered user and redirect to feed', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.locator('#login-email').fill(testEmail);
    await page.locator('#login-password').fill(testPassword);
    await page.getByRole('button', { name: /login now/i }).click();
    await page.waitForURL('**/feed', { timeout: 10000 });
    await expect(page).toHaveURL(/\/feed/);
  });

  test('visiting /feed without auth redirects to /login', async ({ page }) => {
    await page.goto(`${BASE_URL}/feed`);
    await expect(page).toHaveURL(/\/login/);
  });

  test('visiting /login while logged in redirects to /feed', async ({ page }) => {
    // First login
    await page.goto(`${BASE_URL}/login`);
    await page.locator('#login-email').fill(testEmail);
    await page.locator('#login-password').fill(testPassword);
    await page.getByRole('button', { name: /login now/i }).click();
    await page.waitForURL('**/feed', { timeout: 10000 });

    // Then visit /login — should redirect to /feed
    await page.goto(`${BASE_URL}/login`);
    await expect(page).toHaveURL(/\/feed/);
  });
});
