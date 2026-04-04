# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: interactions.spec.ts >> Interactions >> post interactions >> delete own comment shows deleted placeholder
- Location: e2e\interactions.spec.ts:206:9

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('This comment has been deleted')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByText('This comment has been deleted')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - alert [ref=e2]
  - generic [ref=e4]:
    - navigation [ref=e5]:
      - generic [ref=e6]:
        - link "BuddyScript" [ref=e8] [cursor=pointer]:
          - /url: /feed
          - img "BuddyScript" [ref=e9]
        - generic [ref=e10]:
          - generic [ref=e12]:
            - img [ref=e13]
            - searchbox "Search" [disabled] [ref=e16]
          - list [ref=e17]:
            - listitem [ref=e18]:
              - link [ref=e19] [cursor=pointer]:
                - /url: /feed
                - img [ref=e20]
            - listitem [ref=e23]:
              - img [ref=e25] [cursor=pointer]
            - listitem [ref=e27]:
              - img [ref=e29] [cursor=pointer]
            - listitem [ref=e31]:
              - img [ref=e33] [cursor=pointer]
          - generic [ref=e35]:
            - img "Profile" [ref=e37]
            - generic [ref=e38] [cursor=pointer]:
              - paragraph [ref=e39]: IntA Tester
              - button [ref=e40]:
                - img [ref=e41]
    - generic [ref=e45]:
      - generic [ref=e49]:
        - heading "Explore" [level=4] [ref=e50]
        - list [ref=e51]:
          - listitem [ref=e52]:
            - generic [ref=e53]:
              - img [ref=e54]
              - text: Feed
          - listitem [ref=e56]:
            - generic [ref=e57]:
              - img [ref=e58]
              - text: Friends
          - listitem [ref=e63]:
            - generic [ref=e64]:
              - img [ref=e65]
              - text: Learning
            - generic [ref=e67]: New
      - generic [ref=e70]:
        - generic [ref=e72]:
          - generic [ref=e73]:
            - img "Your avatar" [ref=e75] [cursor=pointer]
            - generic [ref=e76]:
              - textbox "Write something ..." [ref=e77]:
                - /placeholder: Write something...
              - generic: Write something ...
          - generic [ref=e78]:
            - generic [ref=e79]:
              - button "Photo" [ref=e81] [cursor=pointer]:
                - img [ref=e83]
                - text: Photo
              - combobox [ref=e86] [cursor=pointer]:
                - option "Public" [selected]
                - option "Private"
            - button "Post" [disabled] [ref=e88] [cursor=pointer]:
              - img [ref=e89]
              - generic [ref=e91]: Post
        - generic [ref=e92]:
          - generic [ref=e93]:
            - generic [ref=e94]:
              - generic [ref=e95]:
                - generic [ref=e96] [cursor=pointer]:
                  - img "IntA Tester" [ref=e98]
                  - generic [ref=e99]:
                    - heading "IntA Tester" [level=4] [ref=e100]
                    - paragraph [ref=e101]: 1m ago · Public
                - button [ref=e104] [cursor=pointer]:
                  - img [ref=e105]
              - heading "Interaction test post 1775247629504" [level=4] [ref=e109]
            - generic [ref=e110]:
              - button "Liked" [ref=e111] [cursor=pointer]:
                - generic [ref=e113]:
                  - img [ref=e114]
                  - text: Liked
              - button "1 like" [ref=e116] [cursor=pointer]
            - button "2 Comments" [ref=e118] [cursor=pointer]:
              - generic [ref=e120]:
                - img [ref=e121]
                - text: 2 Comments
          - generic [ref=e124]:
            - generic [ref=e125]:
              - textbox "Write a comment..." [ref=e126]
              - button "Send" [disabled] [ref=e127] [cursor=pointer]
            - generic [ref=e128]:
              - generic [ref=e129]:
                - img "IntA" [ref=e130]
                - generic [ref=e131]:
                  - generic [ref=e132]:
                    - strong [ref=e133]: IntA Tester
                    - paragraph [ref=e134]: Test comment 1775247629504
                  - generic [ref=e135]:
                    - generic [ref=e136]:
                      - button "Liked" [ref=e137] [cursor=pointer]:
                        - generic [ref=e139]:
                          - img [ref=e140]
                          - text: Liked
                      - button "1 like" [ref=e142] [cursor=pointer]
                    - button "Reply" [ref=e143] [cursor=pointer]
                    - button "Delete" [ref=e144] [cursor=pointer]
              - generic [ref=e145]:
                - generic [ref=e147]:
                  - img "IntB" [ref=e148]
                  - generic [ref=e149]:
                    - generic [ref=e150]:
                      - strong [ref=e151]: IntB Tester
                      - paragraph [ref=e152]: Test reply 1775247629504
                    - button "Like" [ref=e155] [cursor=pointer]:
                      - generic [ref=e157]:
                        - img [ref=e158]
                        - text: Like
                - generic [ref=e160]:
                  - textbox "Write a reply..." [ref=e161]
                  - button "Reply" [disabled] [ref=e162] [cursor=pointer]
        - generic [ref=e164]:
          - generic [ref=e165]:
            - generic [ref=e167] [cursor=pointer]:
              - img "IntA Tester" [ref=e169]
              - generic [ref=e170]:
                - heading "IntA Tester" [level=4] [ref=e171]
                - paragraph [ref=e172]: 2m ago · Public
            - heading "Interaction test post 1775247542254" [level=4] [ref=e173]
          - generic [ref=e174]:
            - button "Like" [ref=e175] [cursor=pointer]:
              - generic [ref=e177]:
                - img [ref=e178]
                - text: Like
            - button "1 like" [ref=e180] [cursor=pointer]
          - button "Comment" [ref=e182] [cursor=pointer]:
            - generic [ref=e184]:
              - img [ref=e185]
              - text: Comment
        - generic [ref=e189]:
          - generic [ref=e190]:
            - generic [ref=e192] [cursor=pointer]:
              - img "IntA Tester" [ref=e194]
              - generic [ref=e195]:
                - heading "IntA Tester" [level=4] [ref=e196]
                - paragraph [ref=e197]: 3m ago · Public
            - heading "Interaction test post 1775247480498" [level=4] [ref=e198]
          - generic [ref=e199]:
            - button "Like" [ref=e200] [cursor=pointer]:
              - generic [ref=e202]:
                - img [ref=e203]
                - text: Like
            - button "1 like" [ref=e205] [cursor=pointer]
          - button "1 Comments" [ref=e207] [cursor=pointer]:
            - generic [ref=e209]:
              - img [ref=e210]
              - text: 1 Comments
        - generic [ref=e214]:
          - generic [ref=e215]:
            - generic [ref=e217] [cursor=pointer]:
              - img "Screenshot User" [ref=e219]
              - generic [ref=e220]:
                - heading "Screenshot User" [level=4] [ref=e221]
                - paragraph [ref=e222]: 3m ago · Public
            - heading "Sample post for screenshot" [level=4] [ref=e223]
          - button "Like" [ref=e225] [cursor=pointer]:
            - generic [ref=e227]:
              - img [ref=e228]
              - text: Like
          - button "Comment" [ref=e231] [cursor=pointer]:
            - generic [ref=e233]:
              - img [ref=e234]
              - text: Comment
        - generic [ref=e238]:
          - generic [ref=e239]:
            - generic [ref=e241] [cursor=pointer]:
              - img "Order Tester" [ref=e243]
              - generic [ref=e244]:
                - heading "Order Tester" [level=4] [ref=e245]
                - paragraph [ref=e246]: 4m ago · Public
            - heading "Second post 1775247424367" [level=4] [ref=e247]
          - button "Like" [ref=e249] [cursor=pointer]:
            - generic [ref=e251]:
              - img [ref=e252]
              - text: Like
          - button "Comment" [ref=e255] [cursor=pointer]:
            - generic [ref=e257]:
              - img [ref=e258]
              - text: Comment
        - generic [ref=e262]:
          - generic [ref=e263]:
            - generic [ref=e265] [cursor=pointer]:
              - img "Order Tester" [ref=e267]
              - generic [ref=e268]:
                - heading "Order Tester" [level=4] [ref=e269]
                - paragraph [ref=e270]: 4m ago · Public
            - heading "First post 1775247424367" [level=4] [ref=e271]
          - button "Like" [ref=e273] [cursor=pointer]:
            - generic [ref=e275]:
              - img [ref=e276]
              - text: Like
          - button "Comment" [ref=e279] [cursor=pointer]:
            - generic [ref=e281]:
              - img [ref=e282]
              - text: Comment
        - generic [ref=e286]:
          - generic [ref=e287]:
            - generic [ref=e289] [cursor=pointer]:
              - img "Alice Poster" [ref=e291]
              - generic [ref=e292]:
                - heading "Alice Poster" [level=4] [ref=e293]
                - paragraph [ref=e294]: 4m ago · Public
            - heading "Hello from Alice 1775247417370" [level=4] [ref=e295]
          - button "Like" [ref=e297] [cursor=pointer]:
            - generic [ref=e299]:
              - img [ref=e300]
              - text: Like
          - button "Comment" [ref=e303] [cursor=pointer]:
            - generic [ref=e305]:
              - img [ref=e306]
              - text: Comment
        - generic [ref=e310]:
          - generic [ref=e311]:
            - generic [ref=e313] [cursor=pointer]:
              - img "Screenshot User" [ref=e315]
              - generic [ref=e316]:
                - heading "Screenshot User" [level=4] [ref=e317]
                - paragraph [ref=e318]: 5m ago · Public
            - heading "Sample post for screenshot" [level=4] [ref=e319]
          - button "Like" [ref=e321] [cursor=pointer]:
            - generic [ref=e323]:
              - img [ref=e324]
              - text: Like
          - button "Comment" [ref=e327] [cursor=pointer]:
            - generic [ref=e329]:
              - img [ref=e330]
              - text: Comment
        - generic [ref=e334]:
          - generic [ref=e335]:
            - generic [ref=e337] [cursor=pointer]:
              - img "Order Tester" [ref=e339]
              - generic [ref=e340]:
                - heading "Order Tester" [level=4] [ref=e341]
                - paragraph [ref=e342]: 6m ago · Public
            - heading "First post 1775247308643" [level=4] [ref=e343]
          - button "Like" [ref=e345] [cursor=pointer]:
            - generic [ref=e347]:
              - img [ref=e348]
              - text: Like
          - button "Comment" [ref=e351] [cursor=pointer]:
            - generic [ref=e353]:
              - img [ref=e354]
              - text: Comment
        - generic [ref=e358]:
          - generic [ref=e359]:
            - generic [ref=e361] [cursor=pointer]:
              - img "Alice Poster" [ref=e363]
              - generic [ref=e364]:
                - heading "Alice Poster" [level=4] [ref=e365]
                - paragraph [ref=e366]: 6m ago · Public
            - heading "Hello from Alice 1775247297758" [level=4] [ref=e367]
          - button "Like" [ref=e369] [cursor=pointer]:
            - generic [ref=e371]:
              - img [ref=e372]
              - text: Like
          - button "Comment" [ref=e375] [cursor=pointer]:
            - generic [ref=e377]:
              - img [ref=e378]
              - text: Comment
      - generic [ref=e384]:
        - generic [ref=e385]:
          - heading "You Might Like" [level=4] [ref=e386]
          - generic [ref=e387]: See All
        - separator [ref=e388]
        - generic [ref=e389]:
          - generic [ref=e390]:
            - img "User" [ref=e392]
            - generic [ref=e393]:
              - heading "Radovan SkillArena" [level=4] [ref=e394]
              - paragraph [ref=e395]: Founder & CEO at Trophy
          - generic [ref=e396]:
            - button "Ignore" [ref=e397] [cursor=pointer]
            - button "Follow" [ref=e398] [cursor=pointer]
```

# Test source

```ts
  121 |     });
  122 | 
  123 |     test('reply to comment appears nested', async ({ page }) => {
  124 |       await login(page, userB.email, userB.password);
  125 | 
  126 |       // Open comments
  127 |       const postArea = page.locator('._feed_inner_timeline_post_area').filter({ hasText: `Interaction test post ${suffix}` });
  128 |       await postArea.locator('._feed_inner_timeline_reaction_comment').click();
  129 | 
  130 |       // Wait for comments to load
  131 |       await expect(page.getByText(`Test comment ${suffix}`)).toBeVisible({ timeout: 10000 });
  132 | 
  133 |       // Click Reply on the comment
  134 |       await page.locator('button', { hasText: 'Reply' }).first().click();
  135 | 
  136 |       // Type and submit reply
  137 |       await page.locator('input[placeholder="Write a reply..."]').first().fill(`Test reply ${suffix}`);
  138 |       await page.locator('button[type="submit"]', { hasText: 'Reply' }).first().click();
  139 | 
  140 |       // Reply should appear
  141 |       await expect(page.getByText(`Test reply ${suffix}`)).toBeVisible({ timeout: 10000 });
  142 |     });
  143 | 
  144 |     test('like a comment increments count', async ({ page }) => {
  145 |       await login(page, userA.email, userA.password);
  146 | 
  147 |       // Open comments
  148 |       const postArea = page.locator('._feed_inner_timeline_post_area').filter({ hasText: `Interaction test post ${suffix}` });
  149 |       await postArea.locator('._feed_inner_timeline_reaction_comment').click();
  150 | 
  151 |       // Wait for comments
  152 |       await expect(page.getByText(`Test comment ${suffix}`)).toBeVisible({ timeout: 10000 });
  153 | 
  154 |       // Find the comment's like button (first one in the comment area, not in post)
  155 |       // Comment like buttons are smaller, 12px font ones
  156 |       const commentLike = page.locator('button._feed_inner_timeline_reaction_emoji').nth(1); // skip the post like button
  157 |       await commentLike.click();
  158 | 
  159 |       // Should show like count
  160 |       await expect(commentLike).toContainText('Liked');
  161 |     });
  162 | 
  163 |     test('click comment like count opens modal', async ({ page }) => {
  164 |       await login(page, userA.email, userA.password);
  165 | 
  166 |       // Open comments
  167 |       const postArea = page.locator('._feed_inner_timeline_post_area').filter({ hasText: `Interaction test post ${suffix}` });
  168 |       await postArea.locator('._feed_inner_timeline_reaction_comment').click();
  169 |       await expect(page.getByText(`Test comment ${suffix}`)).toBeVisible({ timeout: 10000 });
  170 | 
  171 |       // Find the "1 like" text in the comment area (not post area)
  172 |       const commentArea = page.locator('div').filter({ hasText: `Test comment ${suffix}` }).last();
  173 |       const likeCountBtn = commentArea.getByText('1 like');
  174 |       if (await likeCountBtn.isVisible()) {
  175 |         await likeCountBtn.click();
  176 |         const dialog = page.locator('[role="dialog"]');
  177 |         await expect(dialog).toBeVisible();
  178 |         await expect(dialog).toContainText('IntA Tester');
  179 |         await dialog.locator('button', { hasText: '×' }).click();
  180 |       }
  181 |     });
  182 | 
  183 |     test('delete own post removes it from feed', async ({ page }) => {
  184 |       await login(page, userA.email, userA.password);
  185 | 
  186 |       // Create a post to delete
  187 |       const deleteContent = `Delete me ${suffix}`;
  188 |       await page.locator('#createPostTextarea').fill(deleteContent);
  189 |       await page.locator('._feed_inner_text_area_btn_link').click();
  190 |       await page.waitForSelector(`text=${deleteContent}`, { timeout: 10000 });
  191 | 
  192 |       // Open the dropdown menu
  193 |       const postToDelete = page.locator('._feed_inner_timeline_post_area').filter({ hasText: deleteContent });
  194 |       await postToDelete.locator('._feed_timeline_post_dropdown_link').click();
  195 | 
  196 |       // Accept confirm dialog
  197 |       page.on('dialog', (dialog) => dialog.accept());
  198 | 
  199 |       // Click Delete Post
  200 |       await postToDelete.locator('button', { hasText: 'Delete Post' }).click();
  201 | 
  202 |       // Post should be removed
  203 |       await expect(page.getByText(deleteContent)).not.toBeVisible({ timeout: 10000 });
  204 |     });
  205 | 
  206 |     test('delete own comment shows deleted placeholder', async ({ page }) => {
  207 |       await login(page, userA.email, userA.password);
  208 | 
  209 |       // Open comments
  210 |       const postArea = page.locator('._feed_inner_timeline_post_area').filter({ hasText: `Interaction test post ${suffix}` });
  211 |       await postArea.locator('._feed_inner_timeline_reaction_comment').click();
  212 |       await expect(page.getByText(`Test comment ${suffix}`)).toBeVisible({ timeout: 10000 });
  213 | 
  214 |       // Accept confirm dialog
  215 |       page.on('dialog', (dialog) => dialog.accept());
  216 | 
  217 |       // Click Delete on the comment
  218 |       await page.locator('button', { hasText: 'Delete' }).first().click();
  219 | 
  220 |       // Should show deleted placeholder
> 221 |       await expect(page.getByText('This comment has been deleted')).toBeVisible({ timeout: 10000 });
      |                                                                     ^ Error: expect(locator).toBeVisible() failed
  222 |     });
  223 |   });
  224 | });
  225 | 
```