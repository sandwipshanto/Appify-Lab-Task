import { test, expect, type Page } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

async function registerAndLogin(page: Page, email: string, password: string, firstName = 'Feed', lastName = 'User') {
  await page.goto(`${BASE_URL}/register`);
  await page.locator('#reg-firstName').fill(firstName);
  await page.locator('#reg-lastName').fill(lastName);
  await page.locator('#reg-email').fill(email);
  await page.locator('#reg-password').fill(password);
  await page.locator('#reg-repeatPassword').fill(password);
  await page.locator('#agreeTerms').check();
  await page.getByRole('button', { name: /register now/i }).click();
  await page.waitForURL('**/feed', { timeout: 15000 });
}

async function createTextPost(page: Page, content: string) {
  await page.locator('#createPostTextarea').fill(content);
  // Wait for button to be enabled
  await expect(page.locator('._feed_inner_text_area_btn_link')).toBeEnabled();
  await page.locator('._feed_inner_text_area_btn_link').click();
  // Wait for the post to appear in feed and form to reset
  await page.waitForSelector(`text=${content}`, { timeout: 10000 });
  // Wait for textarea to clear (form reset after successful submit)
  await expect(page.locator('#createPostTextarea')).toHaveValue('');
}

test.describe('Feed Page', () => {
  test('create text post appears at top of feed', async ({ page }) => {
    const suffix = Date.now();
    const email = `feed-post-${suffix}@example.com`;
    await registerAndLogin(page, email, 'TestPass123', 'Alice', 'Poster');

    const postContent = `Hello from Alice ${suffix}`;
    await createTextPost(page, postContent);

    await expect(page.getByText(postContent)).toBeVisible();
    await expect(page.locator('._feed_inner_timeline_post_box_title').first()).toContainText('Alice Poster');
  });

  test('newest post appears first', async ({ page }) => {
    const suffix = Date.now();
    const email = `feed-order-${suffix}@example.com`;
    await registerAndLogin(page, email, 'TestPass123', 'Order', 'Tester');

    await createTextPost(page, `First post ${suffix}`);
    await createTextPost(page, `Second post ${suffix}`);

    // Second post should appear above first
    const posts = page.locator('._feed_inner_timeline_post_area');
    await expect(posts.first()).toContainText(`Second post ${suffix}`);
  });

  test('private post visible only to author', async ({ browser }) => {
    const suffix = Date.now();
    const userA = { email: `priv-a-${suffix}@example.com`, password: 'TestPass123' };
    const userB = { email: `priv-b-${suffix}@example.com`, password: 'TestPass123' };

    // Register both users
    const pageA = await browser.newPage();
    await registerAndLogin(pageA, userA.email, userA.password, 'PrivA', 'Tester');

    const pageB = await browser.newPage();
    await registerAndLogin(pageB, userB.email, userB.password, 'PrivB', 'Tester');

    // UserA creates a private post
    const privateContent = `Private secret ${suffix}`;
    await pageA.locator('#createPostTextarea').fill(privateContent);
    await pageA.locator('select.form-control').selectOption('PRIVATE');
    await expect(pageA.locator('._feed_inner_text_area_btn_link')).toBeEnabled();
    await pageA.locator('._feed_inner_text_area_btn_link').click();
    await pageA.waitForSelector(`text=${privateContent}`, { timeout: 10000 });

    // Verify it shows "Private" label
    const postCard = pageA.locator('._feed_inner_timeline_post_area').filter({ hasText: privateContent });
    await expect(postCard.locator('._feed_inner_timeline_post_box_para')).toContainText('Private');

    // UserB refreshes — should NOT see the private post
    await pageB.reload();
    await pageB.waitForLoadState('networkidle');
    await expect(pageB.getByText(privateContent)).not.toBeVisible();

    await pageA.close();
    await pageB.close();
  });

  test('feed page screenshot', async ({ page }) => {
    const email = `feed-ss-${Date.now()}@example.com`;
    await registerAndLogin(page, email, 'TestPass123', 'Screenshot', 'User');

    await createTextPost(page, 'Sample post for screenshot');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'e2e/screenshots/feed.png', fullPage: true });
  });
});
