# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: feed.spec.ts >> Feed Page >> private post visible only to author
- Location: e2e\feed.spec.ts:54:7

# Error details

```
Error: page.waitForURL: net::ERR_CONNECTION_REFUSED
=========================== logs ===========================
waiting for navigation to "**/feed" until "load"
============================================================
```

# Test source

```ts
  1  | import { test, expect, type Page } from '@playwright/test';
  2  | 
  3  | const BASE_URL = 'http://localhost:3000';
  4  | 
  5  | async function registerAndLogin(page: Page, email: string, password: string, firstName = 'Feed', lastName = 'User') {
  6  |   await page.goto(`${BASE_URL}/register`);
  7  |   await page.locator('#reg-firstName').fill(firstName);
  8  |   await page.locator('#reg-lastName').fill(lastName);
  9  |   await page.locator('#reg-email').fill(email);
  10 |   await page.locator('#reg-password').fill(password);
  11 |   await page.locator('#reg-repeatPassword').fill(password);
  12 |   await page.locator('#agreeTerms').check();
  13 |   await page.getByRole('button', { name: /register now/i }).click();
> 14 |   await page.waitForURL('**/feed', { timeout: 15000 });
     |              ^ Error: page.waitForURL: net::ERR_CONNECTION_REFUSED
  15 | }
  16 | 
  17 | async function createTextPost(page: Page, content: string) {
  18 |   await page.locator('#createPostTextarea').fill(content);
  19 |   // Wait for button to be enabled
  20 |   await expect(page.locator('._feed_inner_text_area_btn_link')).toBeEnabled();
  21 |   await page.locator('._feed_inner_text_area_btn_link').click();
  22 |   // Wait for the post to appear in feed and form to reset
  23 |   await page.waitForSelector(`text=${content}`, { timeout: 10000 });
  24 |   // Wait for textarea to clear (form reset after successful submit)
  25 |   await expect(page.locator('#createPostTextarea')).toHaveValue('');
  26 | }
  27 | 
  28 | test.describe('Feed Page', () => {
  29 |   test('create text post appears at top of feed', async ({ page }) => {
  30 |     const suffix = Date.now();
  31 |     const email = `feed-post-${suffix}@example.com`;
  32 |     await registerAndLogin(page, email, 'TestPass123', 'Alice', 'Poster');
  33 | 
  34 |     const postContent = `Hello from Alice ${suffix}`;
  35 |     await createTextPost(page, postContent);
  36 | 
  37 |     await expect(page.getByText(postContent)).toBeVisible();
  38 |     await expect(page.locator('._feed_inner_timeline_post_box_title').first()).toContainText('Alice Poster');
  39 |   });
  40 | 
  41 |   test('newest post appears first', async ({ page }) => {
  42 |     const suffix = Date.now();
  43 |     const email = `feed-order-${suffix}@example.com`;
  44 |     await registerAndLogin(page, email, 'TestPass123', 'Order', 'Tester');
  45 | 
  46 |     await createTextPost(page, `First post ${suffix}`);
  47 |     await createTextPost(page, `Second post ${suffix}`);
  48 | 
  49 |     // Second post should appear above first
  50 |     const posts = page.locator('._feed_inner_timeline_post_area');
  51 |     await expect(posts.first()).toContainText(`Second post ${suffix}`);
  52 |   });
  53 | 
  54 |   test('private post visible only to author', async ({ browser }) => {
  55 |     const suffix = Date.now();
  56 |     const userA = { email: `priv-a-${suffix}@example.com`, password: 'TestPass123' };
  57 |     const userB = { email: `priv-b-${suffix}@example.com`, password: 'TestPass123' };
  58 | 
  59 |     // Register both users
  60 |     const pageA = await browser.newPage();
  61 |     await registerAndLogin(pageA, userA.email, userA.password, 'PrivA', 'Tester');
  62 | 
  63 |     const pageB = await browser.newPage();
  64 |     await registerAndLogin(pageB, userB.email, userB.password, 'PrivB', 'Tester');
  65 | 
  66 |     // UserA creates a private post
  67 |     const privateContent = `Private secret ${suffix}`;
  68 |     await pageA.locator('#createPostTextarea').fill(privateContent);
  69 |     await pageA.locator('select.form-control').selectOption('PRIVATE');
  70 |     await expect(pageA.locator('._feed_inner_text_area_btn_link')).toBeEnabled();
  71 |     await pageA.locator('._feed_inner_text_area_btn_link').click();
  72 |     await pageA.waitForSelector(`text=${privateContent}`, { timeout: 10000 });
  73 | 
  74 |     // Verify it shows "Private" label
  75 |     const postCard = pageA.locator('._feed_inner_timeline_post_area').filter({ hasText: privateContent });
  76 |     await expect(postCard.locator('._feed_inner_timeline_post_box_para')).toContainText('Private');
  77 | 
  78 |     // UserB refreshes — should NOT see the private post
  79 |     await pageB.reload();
  80 |     await pageB.waitForLoadState('networkidle');
  81 |     await expect(pageB.getByText(privateContent)).not.toBeVisible();
  82 | 
  83 |     await pageA.close();
  84 |     await pageB.close();
  85 |   });
  86 | 
  87 |   test('feed page screenshot', async ({ page }) => {
  88 |     const email = `feed-ss-${Date.now()}@example.com`;
  89 |     await registerAndLogin(page, email, 'TestPass123', 'Screenshot', 'User');
  90 | 
  91 |     await createTextPost(page, 'Sample post for screenshot');
  92 |     await page.waitForLoadState('networkidle');
  93 |     await page.screenshot({ path: 'e2e/screenshots/feed.png', fullPage: true });
  94 |   });
  95 | });
  96 | 
```