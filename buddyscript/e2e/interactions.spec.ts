import { test, expect, type Page } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

async function registerAndLogin(page: Page, email: string, password: string, firstName = 'Int', lastName = 'Tester') {
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

async function login(page: Page, email: string, password: string) {
  await page.goto(`${BASE_URL}/login`);
  await page.locator('#login-email').fill(email);
  await page.locator('#login-password').fill(password);
  await page.getByRole('button', { name: /login now/i }).click();
  await page.waitForURL('**/feed', { timeout: 15000 });
}

async function createPost(page: Page, content: string) {
  await page.locator('#createPostTextarea').fill(content);
  await expect(page.locator('._feed_inner_text_area_btn_link')).toBeEnabled();
  await page.locator('._feed_inner_text_area_btn_link').click();
  await page.waitForSelector(`text=${content}`, { timeout: 10000 });
  await expect(page.locator('#createPostTextarea')).toHaveValue('');
}

test.describe('Interactions', () => {
  const suffix = Date.now();

  test('like and unlike a post', async ({ page }) => {
    const email = `like-test-${suffix}@example.com`;
    await registerAndLogin(page, email, 'TestPass123', 'LikeTest', 'User');
    await createPost(page, `Like test post ${suffix}`);

    const postArea = page.locator('._feed_inner_timeline_post_area').filter({ hasText: `Like test post ${suffix}` });
    const likeBtn = postArea.locator('button._feed_inner_timeline_reaction_emoji').first();

    // Should initially show "Like" (not liked)
    await expect(likeBtn).toContainText('Like');
    await expect(likeBtn).not.toContainText('Liked');

    // Click like
    const likeRes = page.waitForResponse((r) => r.url().includes('/like') && r.status() === 200);
    await likeBtn.click();
    await likeRes;

    // Should now show "Liked" and count
    await expect(likeBtn).toContainText('Liked');
    await expect(postArea.getByText('1 like')).toBeVisible();

    // Click to unlike
    const unlikeRes = page.waitForResponse((r) => r.url().includes('/like') && r.status() === 200);
    await likeBtn.click();
    await unlikeRes;

    // Should now show "Like" again (no count)
    await expect(likeBtn).toContainText('Like');
    await expect(likeBtn).not.toContainText('Liked');
  });

  test('click like count opens modal showing who liked', async ({ page }) => {
    const email = `likeslist-${suffix}@example.com`;
    await registerAndLogin(page, email, 'TestPass123', 'LikesList', 'User');
    await createPost(page, `Likes modal test ${suffix}`);

    const postArea = page.locator('._feed_inner_timeline_post_area').filter({ hasText: `Likes modal test ${suffix}` });
    const likeBtn = postArea.locator('button._feed_inner_timeline_reaction_emoji').first();

    // Like the post and wait for API
    const likeRes = page.waitForResponse((r) => r.url().includes('/like') && r.status() === 200);
    await likeBtn.click();
    await likeRes;

    // Click the like count to open modal
    await postArea.getByText('1 like').click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('Liked by');
    await expect(dialog).toContainText('LikesList User');

    // Close with X button
    await dialog.locator('button', { hasText: '×' }).click();
    await expect(dialog).not.toBeVisible();
  });

  test('add comment and see it under post', async ({ page }) => {
    const email = `comment-${suffix}@example.com`;
    await registerAndLogin(page, email, 'TestPass123', 'Comment', 'Tester');
    await createPost(page, `Comment test post ${suffix}`);

    // Toggle comments
    const postArea = page.locator('._feed_inner_timeline_post_area').filter({ hasText: `Comment test post ${suffix}` });
    await postArea.locator('._feed_inner_timeline_reaction_comment').click();

    // Type and submit comment
    await page.locator('input[placeholder="Write a comment..."]').first().fill(`My comment ${suffix}`);
    await page.locator('button:has-text("Send")').first().click();

    // Comment should appear
    await expect(page.getByText(`My comment ${suffix}`)).toBeVisible({ timeout: 10000 });
  });

  test('reply to comment appears nested', async ({ page }) => {
    const email = `reply-${suffix}@example.com`;
    await registerAndLogin(page, email, 'TestPass123', 'Reply', 'Tester');
    await createPost(page, `Reply test post ${suffix}`);

    // Open comments and create a comment first
    const postArea = page.locator('._feed_inner_timeline_post_area').filter({ hasText: `Reply test post ${suffix}` });
    await postArea.locator('._feed_inner_timeline_reaction_comment').click();

    await page.locator('input[placeholder="Write a comment..."]').first().fill(`Parent comment ${suffix}`);
    await page.locator('button:has-text("Send")').first().click();
    await expect(page.getByText(`Parent comment ${suffix}`)).toBeVisible({ timeout: 10000 });

    // Click Reply
    await page.locator('button:has-text("Reply")').first().click();

    // Type and submit reply
    await page.locator('input[placeholder="Write a reply..."]').first().fill(`Child reply ${suffix}`);
    // Find the Reply submit button in the reply form (not the toggle button)
    await page.locator('button[type="submit"]:has-text("Reply")').first().click();

    // Reply should appear
    await expect(page.getByText(`Child reply ${suffix}`)).toBeVisible({ timeout: 10000 });
  });

  test('like a comment increments count', async ({ page }) => {
    const email = `clike-${suffix}@example.com`;
    await registerAndLogin(page, email, 'TestPass123', 'CLike', 'Tester');
    await createPost(page, `Comment like test ${suffix}`);

    // Open comments and create one
    const postArea = page.locator('._feed_inner_timeline_post_area').filter({ hasText: `Comment like test ${suffix}` });
    await postArea.locator('._feed_inner_timeline_reaction_comment').click();

    await page.locator('input[placeholder="Write a comment..."]').first().fill(`Likeable comment ${suffix}`);
    await page.locator('button:has-text("Send")').first().click();
    await expect(page.getByText(`Likeable comment ${suffix}`)).toBeVisible({ timeout: 10000 });

    // The like buttons — first is the post's, second is the comment's
    const commentLikeBtn = page.locator('button._feed_inner_timeline_reaction_emoji').nth(1);
    const likeRes = page.waitForResponse((r) => r.url().includes('/like') && r.status() === 200);
    await commentLikeBtn.click();
    await likeRes;

    await expect(commentLikeBtn).toContainText('Liked');
  });

  test('delete own post removes it from feed', async ({ page }) => {
    const email = `delpost-${suffix}@example.com`;
    await registerAndLogin(page, email, 'TestPass123', 'DelPost', 'Tester');

    const deleteContent = `Delete me ${suffix}`;
    await createPost(page, deleteContent);

    const postToDelete = page.locator('._feed_inner_timeline_post_area').filter({ hasText: deleteContent });
    await postToDelete.locator('._feed_timeline_post_dropdown_link').click();

    page.on('dialog', (dialog) => dialog.accept());
    await postToDelete.locator('button:has-text("Delete Post")').click();

    await expect(page.getByText(deleteContent)).not.toBeVisible({ timeout: 10000 });
  });

  test('delete own comment shows deleted placeholder', async ({ page }) => {
    const email = `delcom-${suffix}@example.com`;
    await registerAndLogin(page, email, 'TestPass123', 'DelCom', 'Tester');
    await createPost(page, `Del comment test ${suffix}`);

    // Open comments and create one
    const postArea = page.locator('._feed_inner_timeline_post_area').filter({ hasText: `Del comment test ${suffix}` });
    await postArea.locator('._feed_inner_timeline_reaction_comment').click();

    await page.locator('input[placeholder="Write a comment..."]').first().fill(`Delete this comment ${suffix}`);
    await page.locator('button:has-text("Send")').first().click();
    await expect(page.getByText(`Delete this comment ${suffix}`)).toBeVisible({ timeout: 10000 });

    page.on('dialog', (dialog) => dialog.accept());
    await page.locator('button:has-text("Delete")').first().click();

    await expect(page.getByText('This comment has been deleted')).toBeVisible({ timeout: 10000 });
  });
});
