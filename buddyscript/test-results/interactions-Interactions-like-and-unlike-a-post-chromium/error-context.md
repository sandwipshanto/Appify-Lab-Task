# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: interactions.spec.ts >> Interactions >> like and unlike a post
- Location: e2e\interactions.spec.ts:36:7

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('._feed_inner_timeline_post_area').filter({ hasText: 'Like test post 1775484912018' }).locator('button._feed_inner_timeline_reaction_emoji').first()
Expected substring: "Like"
Received string:    " React"
Timeout: 5000ms

Call log:
  - Expect "toContainText" with timeout 5000ms
  - waiting for locator('._feed_inner_timeline_post_area').filter({ hasText: 'Like test post 1775484912018' }).locator('button._feed_inner_timeline_reaction_emoji').first()
    9 × locator resolved to <button type="button" class="_feed_inner_timeline_reaction_emoji _feed_reaction">…</button>
      - unexpected value " React"

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - navigation [ref=e4]:
      - generic [ref=e5]:
        - link "BuddyScript" [ref=e7] [cursor=pointer]:
          - /url: /feed
          - img "BuddyScript" [ref=e8]
        - generic [ref=e9]:
          - generic [ref=e11]:
            - img [ref=e12]
            - searchbox "Search" [disabled] [ref=e15]
          - list [ref=e16]:
            - listitem [ref=e17]:
              - link [ref=e18] [cursor=pointer]:
                - /url: /feed
                - img [ref=e19]
            - listitem [ref=e22]:
              - img [ref=e24] [cursor=pointer]
            - listitem [ref=e26]:
              - img [ref=e28] [cursor=pointer]
            - listitem [ref=e30]:
              - img [ref=e32] [cursor=pointer]
          - generic [ref=e34]:
            - img "Profile" [ref=e36] [cursor=pointer]
            - button "LikeTest User" [ref=e37] [cursor=pointer]:
              - paragraph [ref=e38]: LikeTest User
              - img [ref=e40]
    - generic [ref=e44]:
      - generic [ref=e48]:
        - heading "Explore" [level=4] [ref=e49]
        - list [ref=e50]:
          - listitem [ref=e51]:
            - generic [ref=e52]:
              - img [ref=e53]
              - text: Feed
          - listitem [ref=e55]:
            - generic [ref=e56]:
              - img [ref=e57]
              - text: Friends
          - listitem [ref=e62]:
            - generic [ref=e63]:
              - img [ref=e64]
              - text: Learning
            - generic [ref=e66]: New
      - generic [ref=e69]:
        - generic [ref=e71]:
          - generic [ref=e72]:
            - img "Your avatar" [ref=e74] [cursor=pointer]
            - generic [ref=e75]:
              - textbox "Write something ..." [ref=e76]:
                - /placeholder: Write something...
              - generic:
                - text: Write something ...
                - img
          - generic [ref=e77]:
            - generic [ref=e78]:
              - button [ref=e80] [cursor=pointer]:
                - img [ref=e82]
              - button "Public" [ref=e85]:
                - img [ref=e87]
                - combobox [ref=e90] [cursor=pointer]:
                  - option "Public" [selected]
                  - option "Private"
                - img
            - button "Post" [disabled] [ref=e92] [cursor=pointer]:
              - img [ref=e93]
              - generic [ref=e95]: Post
        - generic [ref=e97]:
          - generic [ref=e98]:
            - generic [ref=e99]:
              - generic [ref=e100] [cursor=pointer]:
                - img "LikeTest User" [ref=e102]
                - generic [ref=e103]:
                  - heading "LikeTest User" [level=4] [ref=e104]
                  - paragraph [ref=e105]: Just now · Public
              - button [ref=e108] [cursor=pointer]:
                - img [ref=e109]
            - heading "Like test post 1775484912018" [level=4] [ref=e113]
          - generic [ref=e114]:
            - paragraph [ref=e116] [cursor=pointer]: "0"
            - generic [ref=e117]:
              - paragraph [ref=e118] [cursor=pointer]: 0 Comments
              - paragraph [ref=e119] [cursor=pointer]: 0 Share
          - generic [ref=e120]:
            - button "React" [ref=e121] [cursor=pointer]:
              - generic [ref=e123]:
                - img [ref=e124]
                - text: React
            - button "Comment" [ref=e126] [cursor=pointer]:
              - generic [ref=e128]:
                - img [ref=e129]
                - text: Comment
            - button "Share" [ref=e132] [cursor=pointer]:
              - generic [ref=e134]:
                - img [ref=e135]
                - text: Share
        - generic [ref=e138]:
          - generic [ref=e139]:
            - generic [ref=e141] [cursor=pointer]:
              - img "shanto shill" [ref=e143]
              - generic [ref=e144]:
                - heading "shanto shill" [level=4] [ref=e145]
                - paragraph [ref=e146]: 2h ago · Public
            - heading "fgdfg" [level=4] [ref=e147]
          - generic [ref=e148]:
            - generic [ref=e149] [cursor=pointer]:
              - img "Like" [ref=e150]
              - img "Heart" [ref=e151]
              - paragraph [ref=e152]: "1"
            - generic [ref=e153]:
              - paragraph [ref=e154] [cursor=pointer]: 0 Comments
              - paragraph [ref=e155] [cursor=pointer]: 0 Share
          - generic [ref=e156]:
            - button "React" [ref=e157] [cursor=pointer]:
              - generic [ref=e159]:
                - img [ref=e160]
                - text: React
            - button "Comment" [ref=e162] [cursor=pointer]:
              - generic [ref=e164]:
                - img [ref=e165]
                - text: Comment
            - button "Share" [ref=e168] [cursor=pointer]:
              - generic [ref=e170]:
                - img [ref=e171]
                - text: Share
        - generic [ref=e174]:
          - generic [ref=e175]:
            - generic [ref=e177] [cursor=pointer]:
              - img "shanto shill" [ref=e179]
              - generic [ref=e180]:
                - heading "shanto shill" [level=4] [ref=e181]
                - paragraph [ref=e182]: 1d ago · Public
            - img "Post image" [ref=e184]
          - generic [ref=e185]:
            - generic [ref=e186] [cursor=pointer]:
              - img "Like" [ref=e187]
              - img "Heart" [ref=e188]
              - paragraph [ref=e189]: "1"
            - generic [ref=e190]:
              - paragraph [ref=e191] [cursor=pointer]: 0 Comments
              - paragraph [ref=e192] [cursor=pointer]: 0 Share
          - generic [ref=e193]:
            - button "React" [ref=e194] [cursor=pointer]:
              - generic [ref=e196]:
                - img [ref=e197]
                - text: React
            - button "Comment" [ref=e199] [cursor=pointer]:
              - generic [ref=e201]:
                - img [ref=e202]
                - text: Comment
            - button "Share" [ref=e205] [cursor=pointer]:
              - generic [ref=e207]:
                - img [ref=e208]
                - text: Share
        - generic [ref=e211]:
          - generic [ref=e212]:
            - generic [ref=e214] [cursor=pointer]:
              - img "shanto shill" [ref=e216]
              - generic [ref=e217]:
                - heading "shanto shill" [level=4] [ref=e218]
                - paragraph [ref=e219]: 1d ago · Public
            - heading "hoo" [level=4] [ref=e220]
          - generic [ref=e221]:
            - paragraph [ref=e223] [cursor=pointer]: "0"
            - generic [ref=e224]:
              - paragraph [ref=e225] [cursor=pointer]: 0 Comments
              - paragraph [ref=e226] [cursor=pointer]: 0 Share
          - generic [ref=e227]:
            - button "React" [ref=e228] [cursor=pointer]:
              - generic [ref=e230]:
                - img [ref=e231]
                - text: React
            - button "Comment" [ref=e233] [cursor=pointer]:
              - generic [ref=e235]:
                - img [ref=e236]
                - text: Comment
            - button "Share" [ref=e239] [cursor=pointer]:
              - generic [ref=e241]:
                - img [ref=e242]
                - text: Share
        - generic [ref=e245]:
          - generic [ref=e246]:
            - generic [ref=e248] [cursor=pointer]:
              - img "Bob Smith" [ref=e250]
              - generic [ref=e251]:
                - heading "Bob Smith" [level=4] [ref=e252]
                - paragraph [ref=e253]: 2d ago · Public
            - heading "Debugging is like being a detective in a crime movie where you are also the criminal." [level=4] [ref=e254]
          - generic [ref=e255]:
            - generic [ref=e256] [cursor=pointer]:
              - img "Like" [ref=e257]
              - img "Heart" [ref=e258]
              - paragraph [ref=e259]: "2"
            - generic [ref=e260]:
              - paragraph [ref=e261] [cursor=pointer]: 2 Comments
              - paragraph [ref=e262] [cursor=pointer]: 0 Share
          - generic [ref=e263]:
            - button "React" [ref=e264] [cursor=pointer]:
              - generic [ref=e266]:
                - img [ref=e267]
                - text: React
            - button "Comment" [ref=e269] [cursor=pointer]:
              - generic [ref=e271]:
                - img [ref=e272]
                - text: Comment
            - button "Share" [ref=e275] [cursor=pointer]:
              - generic [ref=e277]:
                - img [ref=e278]
                - text: Share
        - generic [ref=e281]:
          - generic [ref=e282]:
            - generic [ref=e284] [cursor=pointer]:
              - img "Alice Johnson" [ref=e286]
              - generic [ref=e287]:
                - heading "Alice Johnson" [level=4] [ref=e288]
                - paragraph [ref=e289]: 2d ago · Public
            - heading "CSS Grid vs Flexbox? The answer is both, depending on the layout." [level=4] [ref=e290]
          - generic [ref=e291]:
            - generic [ref=e292] [cursor=pointer]:
              - img "Like" [ref=e293]
              - img "Heart" [ref=e294]
              - paragraph [ref=e295]: "2"
            - generic [ref=e296]:
              - paragraph [ref=e297] [cursor=pointer]: 1 Comment
              - paragraph [ref=e298] [cursor=pointer]: 0 Share
          - generic [ref=e299]:
            - button "React" [ref=e300] [cursor=pointer]:
              - generic [ref=e302]:
                - img [ref=e303]
                - text: React
            - button "Comment" [ref=e305] [cursor=pointer]:
              - generic [ref=e307]:
                - img [ref=e308]
                - text: Comment
            - button "Share" [ref=e311] [cursor=pointer]:
              - generic [ref=e313]:
                - img [ref=e314]
                - text: Share
        - generic [ref=e317]:
          - generic [ref=e318]:
            - generic [ref=e320] [cursor=pointer]:
              - img "Charlie Brown" [ref=e322]
              - generic [ref=e323]:
                - heading "Charlie Brown" [level=4] [ref=e324]
                - paragraph [ref=e325]: 2d ago · Public
            - heading "Had an amazing team standup today. Great alignment on Q2 goals." [level=4] [ref=e326]
          - generic [ref=e327]:
            - generic [ref=e328] [cursor=pointer]:
              - img "Like" [ref=e329]
              - img "Heart" [ref=e330]
              - paragraph [ref=e331]: "1"
            - generic [ref=e332]:
              - paragraph [ref=e333] [cursor=pointer]: 0 Comments
              - paragraph [ref=e334] [cursor=pointer]: 0 Share
          - generic [ref=e335]:
            - button "React" [ref=e336] [cursor=pointer]:
              - generic [ref=e338]:
                - img [ref=e339]
                - text: React
            - button "Comment" [ref=e341] [cursor=pointer]:
              - generic [ref=e343]:
                - img [ref=e344]
                - text: Comment
            - button "Share" [ref=e347] [cursor=pointer]:
              - generic [ref=e349]:
                - img [ref=e350]
                - text: Share
        - generic [ref=e353]:
          - generic [ref=e354]:
            - generic [ref=e356] [cursor=pointer]:
              - img "Bob Smith" [ref=e358]
              - generic [ref=e359]:
                - heading "Bob Smith" [level=4] [ref=e360]
                - paragraph [ref=e361]: 2d ago · Public
            - heading "React Server Components are the future. Change my mind." [level=4] [ref=e362]
          - generic [ref=e363]:
            - generic [ref=e364] [cursor=pointer]:
              - img "Like" [ref=e365]
              - img "Heart" [ref=e366]
              - paragraph [ref=e367]: "1"
            - generic [ref=e368]:
              - paragraph [ref=e369] [cursor=pointer]: 0 Comments
              - paragraph [ref=e370] [cursor=pointer]: 0 Share
          - generic [ref=e371]:
            - button "React" [ref=e372] [cursor=pointer]:
              - generic [ref=e374]:
                - img [ref=e375]
                - text: React
            - button "Comment" [ref=e377] [cursor=pointer]:
              - generic [ref=e379]:
                - img [ref=e380]
                - text: Comment
            - button "Share" [ref=e383] [cursor=pointer]:
              - generic [ref=e385]:
                - img [ref=e386]
                - text: Share
        - generic [ref=e389]:
          - generic [ref=e390]:
            - generic [ref=e392] [cursor=pointer]:
              - img "Alice Johnson" [ref=e394]
              - generic [ref=e395]:
                - heading "Alice Johnson" [level=4] [ref=e396]
                - paragraph [ref=e397]: 2d ago · Public
            - 'heading "Weekend plans: code, coffee, repeat." [level=4] [ref=e398]'
          - generic [ref=e399]:
            - paragraph [ref=e401] [cursor=pointer]: "0"
            - generic [ref=e402]:
              - paragraph [ref=e403] [cursor=pointer]: 0 Comments
              - paragraph [ref=e404] [cursor=pointer]: 0 Share
          - generic [ref=e405]:
            - button "React" [ref=e406] [cursor=pointer]:
              - generic [ref=e408]:
                - img [ref=e409]
                - text: React
            - button "Comment" [ref=e411] [cursor=pointer]:
              - generic [ref=e413]:
                - img [ref=e414]
                - text: Comment
            - button "Share" [ref=e417] [cursor=pointer]:
              - generic [ref=e419]:
                - img [ref=e420]
                - text: Share
        - generic [ref=e423]:
          - generic [ref=e424]:
            - generic [ref=e426] [cursor=pointer]:
              - img "Charlie Brown" [ref=e428]
              - generic [ref=e429]:
                - heading "Charlie Brown" [level=4] [ref=e430]
                - paragraph [ref=e431]: 2d ago · Public
            - heading "Just deployed my first app to Vercel. So smooth!" [level=4] [ref=e432]
          - generic [ref=e433]:
            - paragraph [ref=e435] [cursor=pointer]: "0"
            - generic [ref=e436]:
              - paragraph [ref=e437] [cursor=pointer]: 1 Comment
              - paragraph [ref=e438] [cursor=pointer]: 0 Share
          - generic [ref=e439]:
            - button "React" [ref=e440] [cursor=pointer]:
              - generic [ref=e442]:
                - img [ref=e443]
                - text: React
            - button "Comment" [ref=e445] [cursor=pointer]:
              - generic [ref=e447]:
                - img [ref=e448]
                - text: Comment
            - button "Share" [ref=e451] [cursor=pointer]:
              - generic [ref=e453]:
                - img [ref=e454]
                - text: Share
        - generic [ref=e457]:
          - generic [ref=e458]:
            - generic [ref=e460] [cursor=pointer]:
              - img "Alice Johnson" [ref=e462]
              - generic [ref=e463]:
                - heading "Alice Johnson" [level=4] [ref=e464]
                - paragraph [ref=e465]: 2d ago · Public
            - heading "Does anyone else find TypeScript generics confusing at first but then love them?" [level=4] [ref=e466]
          - generic [ref=e467]:
            - generic [ref=e468] [cursor=pointer]:
              - img "Like" [ref=e469]
              - img "Heart" [ref=e470]
              - paragraph [ref=e471]: "2"
            - generic [ref=e472]:
              - paragraph [ref=e473] [cursor=pointer]: 3 Comments
              - paragraph [ref=e474] [cursor=pointer]: 0 Share
          - generic [ref=e475]:
            - button "React" [ref=e476] [cursor=pointer]:
              - generic [ref=e478]:
                - img [ref=e479]
                - text: React
            - button "Comment" [ref=e481] [cursor=pointer]:
              - generic [ref=e483]:
                - img [ref=e484]
                - text: Comment
            - button "Share" [ref=e487] [cursor=pointer]:
              - generic [ref=e489]:
                - img [ref=e490]
                - text: Share
      - generic [ref=e495]:
        - generic [ref=e496]:
          - heading "You Might Like" [level=4] [ref=e497]
          - generic [ref=e498]: See All
        - separator [ref=e499]
        - generic [ref=e500]:
          - generic [ref=e501]:
            - img "User" [ref=e503]
            - generic [ref=e504]:
              - heading "Radovan SkillArena" [level=4] [ref=e505]
              - paragraph [ref=e506]: Founder & CEO at Trophy
          - generic [ref=e507]:
            - button "Ignore" [ref=e508] [cursor=pointer]
            - button "Follow" [ref=e509] [cursor=pointer]
  - alert [ref=e510]
```

# Test source

```ts
  1   | import { test, expect, type Page } from '@playwright/test';
  2   | 
  3   | const BASE_URL = 'http://localhost:3000';
  4   | 
  5   | async function registerAndLogin(page: Page, email: string, password: string, firstName = 'Int', lastName = 'Tester') {
  6   |   await page.goto(`${BASE_URL}/register`);
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
> 45  |     await expect(likeBtn).toContainText('Like');
      |                           ^ Error: expect(locator).toContainText(expected) failed
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
  107 |     await expect(page.getByText(`My comment ${suffix}`)).toBeVisible({ timeout: 10000 });
  108 |   });
  109 | 
  110 |   test('reply to comment appears nested', async ({ page }) => {
  111 |     const email = `reply-${suffix}@example.com`;
  112 |     await registerAndLogin(page, email, 'TestPass123', 'Reply', 'Tester');
  113 |     await createPost(page, `Reply test post ${suffix}`);
  114 | 
  115 |     // Open comments and create a comment first
  116 |     const postArea = page.locator('._feed_inner_timeline_post_area').filter({ hasText: `Reply test post ${suffix}` });
  117 |     await postArea.locator('._feed_inner_timeline_reaction_comment').click();
  118 | 
  119 |     await page.locator('input[placeholder="Write a comment..."]').first().fill(`Parent comment ${suffix}`);
  120 |     await page.locator('button:has-text("Send")').first().click();
  121 |     await expect(page.getByText(`Parent comment ${suffix}`)).toBeVisible({ timeout: 10000 });
  122 | 
  123 |     // Click Reply
  124 |     await page.locator('button:has-text("Reply")').first().click();
  125 | 
  126 |     // Type and submit reply
  127 |     await page.locator('input[placeholder="Write a reply..."]').first().fill(`Child reply ${suffix}`);
  128 |     // Find the Reply submit button in the reply form (not the toggle button)
  129 |     await page.locator('button[type="submit"]:has-text("Reply")').first().click();
  130 | 
  131 |     // Reply should appear
  132 |     await expect(page.getByText(`Child reply ${suffix}`)).toBeVisible({ timeout: 10000 });
  133 |   });
  134 | 
  135 |   test('like a comment increments count', async ({ page }) => {
  136 |     const email = `clike-${suffix}@example.com`;
  137 |     await registerAndLogin(page, email, 'TestPass123', 'CLike', 'Tester');
  138 |     await createPost(page, `Comment like test ${suffix}`);
  139 | 
  140 |     // Open comments and create one
  141 |     const postArea = page.locator('._feed_inner_timeline_post_area').filter({ hasText: `Comment like test ${suffix}` });
  142 |     await postArea.locator('._feed_inner_timeline_reaction_comment').click();
  143 | 
  144 |     await page.locator('input[placeholder="Write a comment..."]').first().fill(`Likeable comment ${suffix}`);
  145 |     await page.locator('button:has-text("Send")').first().click();
```