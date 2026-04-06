# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: interactions.spec.ts >> Interactions >> delete own post removes it from feed
- Location: e2e\interactions.spec.ts:157:7

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/register
Call log:
  - navigating to "http://localhost:3000/register", waiting until "load"

```

# Test source

```ts
  1   | import { test, expect, type Page } from '@playwright/test';
  2   | 
  3   | const BASE_URL = 'http://localhost:3000';
  4   | 
  5   | async function registerAndLogin(page: Page, email: string, password: string, firstName = 'Int', lastName = 'Tester') {
> 6   |   await page.goto(`${BASE_URL}/register`);
      |              ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/register
  7   |   await page.locator('#reg-firstName').fill(firstName);
  8   |   await page.locator('#reg-lastName').fill(lastName);
  9   |   await page.locator('#reg-email').fill(email);
  10  |   await page.locator('#reg-password').fill(password);
  11  |   await page.locator('#reg-repeatPassword').fill(password);
  12  |   await page.locator('#agreeTerms').check();
  13  |   await page.getByRole('button', { name: /register now/i }).click();
  14  |   await page.waitForURL('**/feed', { timeout: 15000 });
  15  | }
  16  | 
  17  | async function login(page: Page, email: string, password: string) {
  18  |   await page.goto(`${BASE_URL}/login`);
  19  |   await page.locator('#login-email').fill(email);
  20  |   await page.locator('#login-password').fill(password);
  21  |   await page.getByRole('button', { name: /login now/i }).click();
  22  |   await page.waitForURL('**/feed', { timeout: 15000 });
  23  | }
  24  | 
  25  | async function createPost(page: Page, content: string) {
  26  |   await page.locator('#createPostTextarea').fill(content);
  27  |   await expect(page.locator('._feed_inner_text_area_btn_link')).toBeEnabled();
  28  |   await page.locator('._feed_inner_text_area_btn_link').click();
  29  |   await page.waitForSelector(`text=${content}`, { timeout: 10000 });
  30  |   await expect(page.locator('#createPostTextarea')).toHaveValue('');
  31  | }
  32  | 
  33  | test.describe('Interactions', () => {
  34  |   const suffix = Date.now();
  35  | 
  36  |   test('like and unlike a post', async ({ page }) => {
  37  |     const email = `like-test-${suffix}@example.com`;
  38  |     await registerAndLogin(page, email, 'TestPass123', 'LikeTest', 'User');
  39  |     await createPost(page, `Like test post ${suffix}`);
  40  | 
  41  |     const postArea = page.locator('._feed_inner_timeline_post_area').filter({ hasText: `Like test post ${suffix}` });
  42  |     const likeBtn = postArea.locator('button._feed_inner_timeline_reaction_emoji').first();
  43  | 
  44  |     // Should initially show "Like" (not liked)
  45  |     await expect(likeBtn).toContainText('Like');
  46  |     await expect(likeBtn).not.toContainText('Liked');
  47  | 
  48  |     // Click like
  49  |     const likeRes = page.waitForResponse((r) => r.url().includes('/like') && r.status() === 200);
  50  |     await likeBtn.click();
  51  |     await likeRes;
  52  | 
  53  |     // Should now show "Liked" and count
  54  |     await expect(likeBtn).toContainText('Liked');
  55  |     await expect(postArea.getByText('1 like')).toBeVisible();
  56  | 
  57  |     // Click to unlike
  58  |     const unlikeRes = page.waitForResponse((r) => r.url().includes('/like') && r.status() === 200);
  59  |     await likeBtn.click();
  60  |     await unlikeRes;
  61  | 
  62  |     // Should now show "Like" again (no count)
  63  |     await expect(likeBtn).toContainText('Like');
  64  |     await expect(likeBtn).not.toContainText('Liked');
  65  |   });
  66  | 
  67  |   test('click like count opens modal showing who liked', async ({ page }) => {
  68  |     const email = `likeslist-${suffix}@example.com`;
  69  |     await registerAndLogin(page, email, 'TestPass123', 'LikesList', 'User');
  70  |     await createPost(page, `Likes modal test ${suffix}`);
  71  | 
  72  |     const postArea = page.locator('._feed_inner_timeline_post_area').filter({ hasText: `Likes modal test ${suffix}` });
  73  |     const likeBtn = postArea.locator('button._feed_inner_timeline_reaction_emoji').first();
  74  | 
  75  |     // Like the post and wait for API
  76  |     const likeRes = page.waitForResponse((r) => r.url().includes('/like') && r.status() === 200);
  77  |     await likeBtn.click();
  78  |     await likeRes;
  79  | 
  80  |     // Click the like count to open modal
  81  |     await postArea.getByText('1 like').click();
  82  | 
  83  |     const dialog = page.locator('[role="dialog"]');
  84  |     await expect(dialog).toBeVisible();
  85  |     await expect(dialog).toContainText('Liked by');
  86  |     await expect(dialog).toContainText('LikesList User');
  87  | 
  88  |     // Close with X button
  89  |     await dialog.locator('button', { hasText: '×' }).click();
  90  |     await expect(dialog).not.toBeVisible();
  91  |   });
  92  | 
  93  |   test('add comment and see it under post', async ({ page }) => {
  94  |     const email = `comment-${suffix}@example.com`;
  95  |     await registerAndLogin(page, email, 'TestPass123', 'Comment', 'Tester');
  96  |     await createPost(page, `Comment test post ${suffix}`);
  97  | 
  98  |     // Toggle comments
  99  |     const postArea = page.locator('._feed_inner_timeline_post_area').filter({ hasText: `Comment test post ${suffix}` });
  100 |     await postArea.locator('._feed_inner_timeline_reaction_comment').click();
  101 | 
  102 |     // Type and submit comment
  103 |     await page.locator('input[placeholder="Write a comment..."]').first().fill(`My comment ${suffix}`);
  104 |     await page.locator('button:has-text("Send")').first().click();
  105 | 
  106 |     // Comment should appear
```