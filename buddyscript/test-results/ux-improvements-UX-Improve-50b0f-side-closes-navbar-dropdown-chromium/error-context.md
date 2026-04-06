# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ux-improvements.spec.ts >> UX Improvements Verification >> Feed UX (authenticated) >> Feed: click-outside closes navbar dropdown
- Location: e2e\ux-improvements.spec.ts:113:9

# Error details

```
Error: apiRequestContext.post: read ECONNRESET
Call log:
  - → POST http://localhost:3000/api/auth/register
    - user-agent: Playwright/1.59.1 (x64; windows 10.0) node/20.14
    - accept: */*
    - accept-encoding: gzip,deflate,br
    - Origin: http://localhost:3000
    - content-type: application/json
    - content-length: 106

```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | const BASE = 'http://localhost:3000';
  4   | 
  5   | test.describe('UX Improvements Verification', () => {
  6   | 
  7   |   /* ─── Auth Form UX ─── */
  8   | 
  9   |   test('Login: password visibility toggle exists', async ({ page }) => {
  10  |     await page.goto(`${BASE}/login`);
  11  |     const pwInput = page.locator('#login-password');
  12  |     await expect(pwInput).toHaveAttribute('type', 'password');
  13  | 
  14  |     // Eye toggle button should exist
  15  |     const toggle = page.locator('button[aria-label="Show password"]');
  16  |     await expect(toggle).toBeVisible();
  17  | 
  18  |     // Click it → type should become text
  19  |     await toggle.click();
  20  |     await expect(pwInput).toHaveAttribute('type', 'text');
  21  | 
  22  |     // Button label should change to "Hide password"
  23  |     const hideToggle = page.locator('button[aria-label="Hide password"]');
  24  |     await expect(hideToggle).toBeVisible();
  25  |   });
  26  | 
  27  |   test('Login: button shows spinner on submit', async ({ page }) => {
  28  |     await page.goto(`${BASE}/login`);
  29  |     await page.fill('#login-email', 'fake@example.com');
  30  |     await page.fill('#login-password', 'WrongPass123');
  31  |     await page.click('button[type="submit"]');
  32  | 
  33  |     // Spinner should appear briefly
  34  |     const spinner = page.locator('.btn-spinner');
  35  |     // The spinner may disappear quickly, so just check the button text changes
  36  |     await expect(page.locator('button[type="submit"]')).toContainText(/Logging in|Login now/);
  37  |   });
  38  | 
  39  |   test('Register: password visibility toggles on both fields', async ({ page }) => {
  40  |     await page.goto(`${BASE}/register`);
  41  | 
  42  |     // Both password inputs
  43  |     const pw = page.locator('#reg-password');
  44  |     const rpw = page.locator('#reg-repeatPassword');
  45  | 
  46  |     await expect(pw).toHaveAttribute('type', 'password');
  47  |     await expect(rpw).toHaveAttribute('type', 'password');
  48  | 
  49  |     // Both should have eye toggle siblings
  50  |     const toggles = page.locator('button[aria-label="Show password"]');
  51  |     expect(await toggles.count()).toBe(2);
  52  |   });
  53  | 
  54  |   test('Register: inline validation on blur shows errors', async ({ page }) => {
  55  |     await page.goto(`${BASE}/register`);
  56  | 
  57  |     // Focus and blur firstName → should show error
  58  |     await page.focus('#reg-firstName');
  59  |     await page.locator('#reg-email').focus(); // blur firstName
  60  |     await expect(page.getByText('First name is required')).toBeVisible();
  61  | 
  62  |     // Type short password and blur
  63  |     await page.fill('#reg-password', 'abc');
  64  |     await page.locator('#reg-email').focus(); // blur password
  65  |     await expect(page.getByText('At least 8 characters')).toBeVisible();
  66  |   });
  67  | 
  68  |   test('Register: real-time password match indicator', async ({ page }) => {
  69  |     await page.goto(`${BASE}/register`);
  70  | 
  71  |     await page.fill('#reg-password', 'Password1');
  72  |     await page.fill('#reg-repeatPassword', 'Password2');
  73  | 
  74  |     // Mismatch indicator should show
  75  |     await expect(page.getByText('Passwords do not match')).toBeVisible();
  76  | 
  77  |     // Fix the repeat password
  78  |     await page.fill('#reg-repeatPassword', 'Password1');
  79  | 
  80  |     // Match indicator should show
  81  |     await expect(page.getByText('Passwords match')).toBeVisible();
  82  |   });
  83  | 
  84  |   /* ─── Feed UX (requires auth) ─── */
  85  | 
  86  |   test.describe('Feed UX (authenticated)', () => {
  87  |     // Register a test user and login before each test
  88  |     const testEmail = `uxtest_${Date.now()}@example.com`;
  89  |     const testPassword = 'TestPass123';
  90  | 
  91  |     test.beforeAll(async ({ request }) => {
  92  |       // Register via API
> 93  |       await request.post(`${BASE}/api/auth/register`, {
      |                     ^ Error: apiRequestContext.post: read ECONNRESET
  94  |         data: {
  95  |           firstName: 'UX',
  96  |           lastName: 'Tester',
  97  |           email: testEmail,
  98  |           password: testPassword,
  99  |         },
  100 |         headers: { Origin: BASE },
  101 |       });
  102 |     });
  103 | 
  104 |     test.beforeEach(async ({ page }) => {
  105 |       // Login via form
  106 |       await page.goto(`${BASE}/login`);
  107 |       await page.fill('#login-email', testEmail);
  108 |       await page.fill('#login-password', testPassword);
  109 |       await page.click('button[type="submit"]');
  110 |       await page.waitForURL('**/feed', { timeout: 10000 });
  111 |     });
  112 | 
  113 |     test('Feed: click-outside closes navbar dropdown', async ({ page }) => {
  114 |       // Open the profile dropdown
  115 |       const dropdownBtn = page.locator('button._dropdown_toggle');
  116 |       await dropdownBtn.click();
  117 | 
  118 |       // Dropdown should be visible
  119 |       const dropdown = page.locator('._nav_profile_dropdown.show');
  120 |       await expect(dropdown).toBeVisible();
  121 | 
  122 |       // Click elsewhere (the feed area)
  123 |       await page.locator('._layout_middle_wrap').click();
  124 | 
  125 |       // Dropdown should close
  126 |       await expect(dropdown).not.toBeVisible();
  127 |     });
  128 | 
  129 |     test('Feed: create post shows character counter near limit', async ({ page }) => {
  130 |       // The counter only appears at 80% of 5000 = 4000 chars
  131 |       const longText = 'A'.repeat(4100);
  132 |       await page.fill('#createPostTextarea', longText);
  133 | 
  134 |       // Counter should be visible
  135 |       await expect(page.getByText('4100 / 5000')).toBeVisible();
  136 |     });
  137 | 
  138 |     test('Feed: post image has cursor zoom-in style', async ({ page }) => {
  139 |       // Check if any post with an image has the zoom-in cursor
  140 |       const postImages = page.locator('._time_img');
  141 |       const count = await postImages.count();
  142 |       if (count > 0) {
  143 |         const cursor = await postImages.first().evaluate(el => getComputedStyle(el).cursor);
  144 |         expect(cursor).toBe('zoom-in');
  145 |       }
  146 |     });
  147 | 
  148 |     test('Feed: comment section auto-focuses input', async ({ page }) => {
  149 |       // Need at least one post. Create one if empty
  150 |       const postCount = await page.locator('._feed_inner_timeline_post_area').count();
  151 |       if (postCount === 0) {
  152 |         await page.fill('#createPostTextarea', 'Test post for comments');
  153 |         await page.click('button._feed_inner_text_area_btn_link');
  154 |         await page.waitForTimeout(1000);
  155 |       }
  156 | 
  157 |       // Click Comment button on first post
  158 |       const commentBtn = page.locator('._feed_inner_timeline_reaction_comment').first();
  159 |       await commentBtn.click();
  160 |       await page.waitForTimeout(200);
  161 | 
  162 |       // Comment textarea should be focused
  163 |       const focused = await page.evaluate(() => document.activeElement?.tagName);
  164 |       expect(focused).toBe('TEXTAREA');
  165 |     });
  166 | 
  167 |     test('Feed: comment textarea shows Ctrl+Enter hint', async ({ page }) => {
  168 |       const postCount = await page.locator('._feed_inner_timeline_post_area').count();
  169 |       if (postCount === 0) {
  170 |         await page.fill('#createPostTextarea', 'Test post for hint check');
  171 |         await page.click('button._feed_inner_text_area_btn_link');
  172 |         await page.waitForTimeout(1000);
  173 |       }
  174 | 
  175 |       // Open comments
  176 |       const commentBtn = page.locator('._feed_inner_timeline_reaction_comment').first();
  177 |       await commentBtn.click();
  178 |       await page.waitForTimeout(200);
  179 | 
  180 |       // Hint should be visible
  181 |       await expect(page.getByText('Ctrl+Enter to send')).toBeVisible();
  182 |     });
  183 | 
  184 |     test('Feed: kebab menu closes on outside click', async ({ page }) => {
  185 |       const postCount = await page.locator('._feed_inner_timeline_post_area').count();
  186 |       if (postCount === 0) {
  187 |         await page.fill('#createPostTextarea', 'Test post for menu');
  188 |         await page.click('button._feed_inner_text_area_btn_link');
  189 |         await page.waitForTimeout(1000);
  190 |       }
  191 | 
  192 |       // Open kebab menu on the first post (if owned by current user)
  193 |       const kebab = page.locator('button._feed_timeline_post_dropdown_link').first();
```