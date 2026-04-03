import { describe, it, expect, beforeAll } from 'vitest';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const ORIGIN = new URL(BASE_URL).origin;

let cookieA = '';
let cookieB = '';

async function registerUser(name: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN },
    body: JSON.stringify({
      firstName: name,
      lastName: 'Test',
      email: `${name.toLowerCase()}-comment-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
      password: 'Test1234',
    }),
  });
  expect(res.status).toBe(201);
  return res.headers.get('set-cookie') || '';
}

describe('Comments API', () => {
  let publicPostId = '';
  let privatePostId = '';
  let commentId = '';
  let replyId = '';

  beforeAll(async () => {
    cookieA = await registerUser('ComAlice');
    cookieB = await registerUser('ComBob');

    // UserA creates a public post
    const pubRes = await fetch(`${BASE_URL}/api/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: ORIGIN, Cookie: cookieA },
      body: JSON.stringify({ content: 'Public post for comments', visibility: 'PUBLIC' }),
    });
    expect(pubRes.status).toBe(201);
    const pubData = await pubRes.json();
    publicPostId = pubData.post.id;

    // UserA creates a private post
    const privRes = await fetch(`${BASE_URL}/api/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: ORIGIN, Cookie: cookieA },
      body: JSON.stringify({ content: 'Private post for comments', visibility: 'PRIVATE' }),
    });
    expect(privRes.status).toBe(201);
    const privData = await privRes.json();
    privatePostId = privData.post.id;
  });

  it('UserA creates a comment on the public post', async () => {
    const res = await fetch(`${BASE_URL}/api/posts/${publicPostId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: ORIGIN, Cookie: cookieA },
      body: JSON.stringify({ content: 'First comment!' }),
    });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.comment).toBeDefined();
    expect(data.comment.content).toBe('First comment!');
    expect(data.comment.liked).toBe(false);
    expect(data.comment.deleted).toBe(false);
    commentId = data.comment.id;
  });

  it('UserB creates a reply to that comment', async () => {
    const res = await fetch(`${BASE_URL}/api/posts/${publicPostId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: ORIGIN, Cookie: cookieB },
      body: JSON.stringify({ content: 'Reply to first comment', parentId: commentId }),
    });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.comment.content).toBe('Reply to first comment');
    expect(data.comment.parentId).toBe(commentId);
    replyId = data.comment.id;
  });

  it('UserB tries reply-to-reply and gets 400', async () => {
    const res = await fetch(`${BASE_URL}/api/posts/${publicPostId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: ORIGIN, Cookie: cookieB },
      body: JSON.stringify({ content: 'Nested reply attempt', parentId: replyId }),
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('reply');
  });

  it('UserB tries to comment with parentId from a different post and gets 400', async () => {
    // Create a second public post by UserA
    const postRes = await fetch(`${BASE_URL}/api/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: ORIGIN, Cookie: cookieA },
      body: JSON.stringify({ content: 'Another post', visibility: 'PUBLIC' }),
    });
    expect(postRes.status).toBe(201);
    const postData = await postRes.json();
    const otherPostId = postData.post.id;

    // Try to create comment on otherPost using commentId from publicPost
    const res = await fetch(`${BASE_URL}/api/posts/${otherPostId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: ORIGIN, Cookie: cookieB },
      body: JSON.stringify({ content: 'Cross-post reply', parentId: commentId }),
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('different post');
  });

  it('GET /api/posts/:id/comments returns comment with inline reply', async () => {
    const res = await fetch(`${BASE_URL}/api/posts/${publicPostId}/comments`, {
      headers: { Cookie: cookieA },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.comments).toBeDefined();
    expect(data.comments.length).toBeGreaterThanOrEqual(1);

    const topComment = data.comments.find((c: { id: string }) => c.id === commentId);
    expect(topComment).toBeDefined();
    expect(topComment.content).toBe('First comment!');
    expect(topComment.deleted).toBe(false);
    expect(topComment.replies).toBeDefined();
    expect(topComment.replies.length).toBe(1);
    expect(topComment.replies[0].content).toBe('Reply to first comment');
    expect(topComment.hasMoreReplies).toBe(false);
  });

  it('UserA soft-deletes own comment', async () => {
    const res = await fetch(`${BASE_URL}/api/comments/${commentId}`, {
      method: 'DELETE',
      headers: { Origin: ORIGIN, Cookie: cookieA },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.deleted).toBe(true);
  });

  it('GET comments shows deleted comment with content null, reply still visible', async () => {
    const res = await fetch(`${BASE_URL}/api/posts/${publicPostId}/comments`, {
      headers: { Cookie: cookieA },
    });
    expect(res.status).toBe(200);
    const data = await res.json();

    const deletedComment = data.comments.find((c: { id: string }) => c.id === commentId);
    expect(deletedComment).toBeDefined();
    expect(deletedComment.content).toBeNull();
    expect(deletedComment.deleted).toBe(true);

    // Reply should still be visible
    expect(deletedComment.replies.length).toBe(1);
    expect(deletedComment.replies[0].content).toBe('Reply to first comment');
    expect(deletedComment.replies[0].deleted).toBe(false);
  });

  it('UserB tries to comment on the private post and gets 404', async () => {
    const res = await fetch(`${BASE_URL}/api/posts/${privatePostId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: ORIGIN, Cookie: cookieB },
      body: JSON.stringify({ content: 'Should be forbidden' }),
    });
    // Returns 404 instead of 403 to avoid leaking post existence
    expect(res.status).toBe(404);
  });

  it('Unauthenticated user tries to comment and gets 401', async () => {
    const res = await fetch(`${BASE_URL}/api/posts/${publicPostId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: ORIGIN },
      body: JSON.stringify({ content: 'No auth' }),
    });
    expect(res.status).toBe(401);
  });

  it('commentCount reflects creates and deletes correctly', async () => {
    // Create a fresh post for clean counting
    const postRes = await fetch(`${BASE_URL}/api/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: ORIGIN, Cookie: cookieA },
      body: JSON.stringify({ content: 'Count test post', visibility: 'PUBLIC' }),
    });
    expect(postRes.status).toBe(201);
    const postData = await postRes.json();
    const countPostId = postData.post.id;
    expect(postData.post.commentCount).toBe(0);

    // Create 2 comments
    const c1Res = await fetch(`${BASE_URL}/api/posts/${countPostId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: ORIGIN, Cookie: cookieA },
      body: JSON.stringify({ content: 'Count comment 1' }),
    });
    expect(c1Res.status).toBe(201);
    const c1 = await c1Res.json();

    const c2Res = await fetch(`${BASE_URL}/api/posts/${countPostId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: ORIGIN, Cookie: cookieA },
      body: JSON.stringify({ content: 'Count comment 2' }),
    });
    expect(c2Res.status).toBe(201);

    // Verify commentCount is 2
    const getRes1 = await fetch(`${BASE_URL}/api/posts/${countPostId}`, {
      headers: { Cookie: cookieA },
    });
    expect(getRes1.status).toBe(200);
    const getData1 = await getRes1.json();
    expect(getData1.post.commentCount).toBe(2);

    // Delete first comment
    const delRes = await fetch(`${BASE_URL}/api/comments/${c1.comment.id}`, {
      method: 'DELETE',
      headers: { Origin: ORIGIN, Cookie: cookieA },
    });
    expect(delRes.status).toBe(200);

    // Verify commentCount is 1
    const getRes2 = await fetch(`${BASE_URL}/api/posts/${countPostId}`, {
      headers: { Cookie: cookieA },
    });
    expect(getRes2.status).toBe(200);
    const getData2 = await getRes2.json();
    expect(getData2.post.commentCount).toBe(1);
  });
});
