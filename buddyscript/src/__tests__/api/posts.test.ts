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
      email: `${name.toLowerCase()}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
      password: 'Test1234',
    }),
  });
  expect(res.status).toBe(201);
  return res.headers.get('set-cookie') || '';
}

describe('Posts API', () => {
  beforeAll(async () => {
    cookieA = await registerUser('Alice');
    cookieB = await registerUser('Bob');
  });

  let publicPostId = '';
  let privatePostId = '';

  it('UserA creates a public post', async () => {
    const res = await fetch(`${BASE_URL}/api/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: ORIGIN, Cookie: cookieA },
      body: JSON.stringify({ content: 'Hello public world!', visibility: 'PUBLIC' }),
    });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.post).toBeDefined();
    expect(data.post.content).toBe('Hello public world!');
    expect(data.post.visibility).toBe('PUBLIC');
    publicPostId = data.post.id;
  });

  it('UserA creates a private post', async () => {
    const res = await fetch(`${BASE_URL}/api/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: ORIGIN, Cookie: cookieA },
      body: JSON.stringify({ content: 'Secret post', visibility: 'PRIVATE' }),
    });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.post.visibility).toBe('PRIVATE');
    privatePostId = data.post.id;
  });

  it('UserA gets feed and sees both posts', async () => {
    const res = await fetch(`${BASE_URL}/api/posts`, {
      headers: { Cookie: cookieA },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    const ids = data.posts.map((p: { id: string }) => p.id);
    expect(ids).toContain(publicPostId);
    expect(ids).toContain(privatePostId);
  });

  it('UserB gets feed and sees only public post', async () => {
    const res = await fetch(`${BASE_URL}/api/posts`, {
      headers: { Cookie: cookieB },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    const ids = data.posts.map((p: { id: string }) => p.id);
    expect(ids).toContain(publicPostId);
    expect(ids).not.toContain(privatePostId);
  });

  it('UserB cannot GET private post directly', async () => {
    const res = await fetch(`${BASE_URL}/api/posts/${privatePostId}`, {
      headers: { Cookie: cookieB },
    });
    // Returns 404 instead of 403 to avoid leaking post existence
    expect(res.status).toBe(404);
  });

  it('UserB cannot DELETE UserA public post', async () => {
    const res = await fetch(`${BASE_URL}/api/posts/${publicPostId}`, {
      method: 'DELETE',
      headers: { Origin: ORIGIN, Cookie: cookieB },
    });
    expect(res.status).toBe(403);
  });

  it('UserA deletes own public post', async () => {
    const res = await fetch(`${BASE_URL}/api/posts/${publicPostId}`, {
      method: 'DELETE',
      headers: { Origin: ORIGIN, Cookie: cookieA },
    });
    expect(res.status).toBe(200);
  });

  it('Deleted post is gone from feed', async () => {
    const res = await fetch(`${BASE_URL}/api/posts`, {
      headers: { Cookie: cookieA },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    const ids = data.posts.map((p: { id: string }) => p.id);
    expect(ids).not.toContain(publicPostId);
  });

  it('Cursor pagination works correctly', { timeout: 60000 }, async () => {
    // Create 12 posts for pagination test
    const postIds: string[] = [];
    for (let i = 0; i < 12; i++) {
      const res = await fetch(`${BASE_URL}/api/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Origin: ORIGIN, Cookie: cookieA },
        body: JSON.stringify({ content: `Pagination post ${i}`, visibility: 'PUBLIC' }),
      });
      expect(res.status).toBe(201);
      const data = await res.json();
      postIds.push(data.post.id);
    }

    // Fetch first page (limit 10)
    const page1Res = await fetch(`${BASE_URL}/api/posts?limit=10`, {
      headers: { Cookie: cookieA },
    });
    expect(page1Res.status).toBe(200);
    const page1 = await page1Res.json();
    expect(page1.posts.length).toBe(10);
    expect(page1.nextCursor).toBeTruthy();

    // Fetch second page using cursor
    const page2Res = await fetch(`${BASE_URL}/api/posts?limit=10&cursor=${encodeURIComponent(page1.nextCursor)}`, {
      headers: { Cookie: cookieA },
    });
    expect(page2Res.status).toBe(200);
    const page2 = await page2Res.json();
    // Should have remaining posts (private post + at least 2 pagination posts)
    expect(page2.posts.length).toBeGreaterThanOrEqual(2);

    // No overlap between pages
    const page1Ids = new Set(page1.posts.map((p: { id: string }) => p.id));
    for (const p of page2.posts) {
      expect(page1Ids.has(p.id)).toBe(false);
    }
  });

  it('Unauthenticated request returns 401', async () => {
    const res = await fetch(`${BASE_URL}/api/posts`);
    expect(res.status).toBe(401);
  });

  it('POST with invalid body returns 400', async () => {
    const res = await fetch(`${BASE_URL}/api/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: ORIGIN, Cookie: cookieA },
      body: 'not json',
    });
    expect(res.status).toBe(400);
  });
});
