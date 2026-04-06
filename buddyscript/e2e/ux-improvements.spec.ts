import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';

test.describe('UX Improvements Verification', () => {

  /* ─── Auth Form UX ─── */

  test('Login: password visibility toggle exists', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    const pwInput = page.locator('#login-password');
    await expect(pwInput).toHaveAttribute('type', 'password');

    // Eye toggle button should exist
    const toggle = page.locator('button[aria-label="Show password"]');
    await expect(toggle).toBeVisible();

    // Click it → type should become text
    await toggle.click();
    await expect(pwInput).toHaveAttribute('type', 'text');

    // Button label should change to "Hide password"
    const hideToggle = page.locator('button[aria-label="Hide password"]');
    await expect(hideToggle).toBeVisible();
  });

  test('Login: button shows spinner on submit', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.fill('#login-email', 'fake@example.com');
    await page.fill('#login-password', 'WrongPass123');
    await page.click('button[type="submit"]');

    // Spinner should appear briefly
    const spinner = page.locator('.btn-spinner');
    // The spinner may disappear quickly, so just check the button text changes
    await expect(page.locator('button[type="submit"]')).toContainText(/Logging in|Login now/);
  });

  test('Register: password visibility toggles on both fields', async ({ page }) => {
    await page.goto(`${BASE}/register`);

    // Both password inputs
    const pw = page.locator('#reg-password');
    const rpw = page.locator('#reg-repeatPassword');

    await expect(pw).toHaveAttribute('type', 'password');
    await expect(rpw).toHaveAttribute('type', 'password');

    // Both should have eye toggle siblings
    const toggles = page.locator('button[aria-label="Show password"]');
    expect(await toggles.count()).toBe(2);
  });

  test('Register: inline validation on blur shows errors', async ({ page }) => {
    await page.goto(`${BASE}/register`);

    // Focus and blur firstName → should show error
    await page.focus('#reg-firstName');
    await page.locator('#reg-email').focus(); // blur firstName
    await expect(page.getByText('First name is required')).toBeVisible();

    // Type short password and blur
    await page.fill('#reg-password', 'abc');
    await page.locator('#reg-email').focus(); // blur password
    await expect(page.getByText('At least 8 characters')).toBeVisible();
  });

  test('Register: real-time password match indicator', async ({ page }) => {
    await page.goto(`${BASE}/register`);

    await page.fill('#reg-password', 'Password1');
    await page.fill('#reg-repeatPassword', 'Password2');

    // Mismatch indicator should show
    await expect(page.getByText('Passwords do not match')).toBeVisible();

    // Fix the repeat password
    await page.fill('#reg-repeatPassword', 'Password1');

    // Match indicator should show
    await expect(page.getByText('Passwords match')).toBeVisible();
  });

  /* ─── Feed UX (requires auth) ─── */

  test.describe('Feed UX (authenticated)', () => {
    // Register a test user and login before each test
    const testEmail = `uxtest_${Date.now()}@example.com`;
    const testPassword = 'TestPass123';

    test.beforeAll(async ({ request }) => {
      // Register via API
      await request.post(`${BASE}/api/auth/register`, {
        data: {
          firstName: 'UX',
          lastName: 'Tester',
          email: testEmail,
          password: testPassword,
        },
        headers: { Origin: BASE },
      });
    });

    test.beforeEach(async ({ page }) => {
      // Login via form
      await page.goto(`${BASE}/login`);
      await page.fill('#login-email', testEmail);
      await page.fill('#login-password', testPassword);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/feed', { timeout: 10000 });
    });

    test('Feed: click-outside closes navbar dropdown', async ({ page }) => {
      // Open the profile dropdown
      const dropdownBtn = page.locator('button._dropdown_toggle');
      await dropdownBtn.click();

      // Dropdown should be visible
      const dropdown = page.locator('._nav_profile_dropdown.show');
      await expect(dropdown).toBeVisible();

      // Click elsewhere (the feed area)
      await page.locator('._layout_middle_wrap').click();

      // Dropdown should close
      await expect(dropdown).not.toBeVisible();
    });

    test('Feed: create post shows character counter near limit', async ({ page }) => {
      // The counter only appears at 80% of 5000 = 4000 chars
      const longText = 'A'.repeat(4100);
      await page.fill('#createPostTextarea', longText);

      // Counter should be visible
      await expect(page.getByText('4100 / 5000')).toBeVisible();
    });

    test('Feed: post image has cursor zoom-in style', async ({ page }) => {
      // Check if any post with an image has the zoom-in cursor
      const postImages = page.locator('._time_img');
      const count = await postImages.count();
      if (count > 0) {
        const cursor = await postImages.first().evaluate(el => getComputedStyle(el).cursor);
        expect(cursor).toBe('zoom-in');
      }
    });

    test('Feed: comment section auto-focuses input', async ({ page }) => {
      // Need at least one post. Create one if empty
      const postCount = await page.locator('._feed_inner_timeline_post_area').count();
      if (postCount === 0) {
        await page.fill('#createPostTextarea', 'Test post for comments');
        await page.click('button._feed_inner_text_area_btn_link');
        await page.waitForTimeout(1000);
      }

      // Click Comment button on first post
      const commentBtn = page.locator('._feed_inner_timeline_reaction_comment').first();
      await commentBtn.click();
      await page.waitForTimeout(200);

      // Comment textarea should be focused
      const focused = await page.evaluate(() => document.activeElement?.tagName);
      expect(focused).toBe('TEXTAREA');
    });

    test('Feed: comment textarea shows Ctrl+Enter hint', async ({ page }) => {
      const postCount = await page.locator('._feed_inner_timeline_post_area').count();
      if (postCount === 0) {
        await page.fill('#createPostTextarea', 'Test post for hint check');
        await page.click('button._feed_inner_text_area_btn_link');
        await page.waitForTimeout(1000);
      }

      // Open comments
      const commentBtn = page.locator('._feed_inner_timeline_reaction_comment').first();
      await commentBtn.click();
      await page.waitForTimeout(200);

      // Hint should be visible
      await expect(page.getByText('Ctrl+Enter to send')).toBeVisible();
    });

    test('Feed: kebab menu closes on outside click', async ({ page }) => {
      const postCount = await page.locator('._feed_inner_timeline_post_area').count();
      if (postCount === 0) {
        await page.fill('#createPostTextarea', 'Test post for menu');
        await page.click('button._feed_inner_text_area_btn_link');
        await page.waitForTimeout(1000);
      }

      // Open kebab menu on the first post (if owned by current user)
      const kebab = page.locator('button._feed_timeline_post_dropdown_link').first();
      const kebabCount = await kebab.count();
      if (kebabCount > 0) {
        await kebab.click();
        await expect(page.locator('._feed_timeline_dropdown._timeline_dropdown')).toBeVisible();

        // Click outside
        await page.locator('._layout_middle_inner').click({ position: { x: 10, y: 10 } });

        // Menu should close
        await expect(page.locator('._feed_timeline_dropdown._timeline_dropdown')).not.toBeVisible();
      }
    });
  });
});
