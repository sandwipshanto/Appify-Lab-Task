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

describe('Likes API', () => {
  let publicPostId = '';
  let privatePostId = '';

  beforeAll(async () => {
    cookieA = await registerUser('LikeAlice');
    cookieB = await registerUser('LikeBob');

    // UserA creates a public post
    const pubRes = await fetch(`${BASE_URL}/api/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: ORIGIN, Cookie: cookieA },
      body: JSON.stringify({ content: 'Public post for likes', visibility: 'PUBLIC' }),
    });
    expect(pubRes.status).toBe(201);
    const pubData = await pubRes.json();
    publicPostId = pubData.post.id;

    // UserA creates a private post
    const privRes = await fetch(`${BASE_URL}/api/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: ORIGIN, Cookie: cookieA },
      body: JSON.stringify({ content: 'Private post for likes', visibility: 'PRIVATE' }),
    });
    expect(privRes.status).toBe(201);
    const privData = await privRes.json();
    privatePostId = privData.post.id;
  });

  it('UserA likes own public post', async () => {
    const res = await fetch(`${BASE_URL}/api/posts/${publicPostId}/like`, {
      method: 'POST',
      headers: { Origin: ORIGIN, Cookie: cookieA },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.liked).toBe(true);
    expect(data.likeCount).toBe(1);
  });

  it('UserA likes same post again — idempotent 200', async () => {
    const res = await fetch(`${BASE_URL}/api/posts/${publicPostId}/like`, {
      method: 'POST',
      headers: { Origin: ORIGIN, Cookie: cookieA },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.liked).toBe(true);
    expect(data.likeCount).toBe(1);
  });

  it('UserB likes the public post', async () => {
    const res = await fetch(`${BASE_URL}/api/posts/${publicPostId}/like`, {
      method: 'POST',
      headers: { Origin: ORIGIN, Cookie: cookieB },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.liked).toBe(true);
    expect(data.likeCount).toBe(2);
  });

  it('UserA unlikes the public post', async () => {
    const res = await fetch(`${BASE_URL}/api/posts/${publicPostId}/like`, {
      method: 'DELETE',
      headers: { Origin: ORIGIN, Cookie: cookieA },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.liked).toBe(false);
    expect(data.likeCount).toBe(1);
  });

  it('UserA unlikes again — idempotent 200', async () => {
    const res = await fetch(`${BASE_URL}/api/posts/${publicPostId}/like`, {
      method: 'DELETE',
      headers: { Origin: ORIGIN, Cookie: cookieA },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.liked).toBe(false);
    expect(data.likeCount).toBe(1);
  });

  it('GET /api/posts/:id/likes returns list with UserB', async () => {
    const res = await fetch(`${BASE_URL}/api/posts/${publicPostId}/likes`, {
      headers: { Cookie: cookieA },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.users).toBeDefined();
    expect(data.users.length).toBe(1);
    expect(data.users[0].firstName).toBe('LikeBob');
    expect(data.users[0].lastName).toBe('Test');
    expect(data.users[0]).toHaveProperty('id');
  });

  it('UserB cannot like the private post — 404', async () => {
    const res = await fetch(`${BASE_URL}/api/posts/${privatePostId}/like`, {
      method: 'POST',
      headers: { Origin: ORIGIN, Cookie: cookieB },
    });
    // Returns 404 instead of 403 to avoid leaking post existence
    expect(res.status).toBe(404);
  });

  it('Unauthenticated request returns 401', async () => {
    const res = await fetch(`${BASE_URL}/api/posts/${publicPostId}/like`, {
      method: 'POST',
      headers: { Origin: ORIGIN },
    });
    expect(res.status).toBe(401);
  });

  it('Like on nonexistent post returns 404', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const res = await fetch(`${BASE_URL}/api/posts/${fakeId}/like`, {
      method: 'POST',
      headers: { Origin: ORIGIN, Cookie: cookieA },
    });
    expect(res.status).toBe(404);
  });

  describe('Comment likes', () => {
    let commentId = '';

    beforeAll(async () => {
      // Create a comment directly via the post detail endpoint isn't available,
      // so we use Prisma-level insertion via a dedicated test helper endpoint.
      // Since no comments API exists yet, we'll create the comment by fetching
      // the user ID from the me endpoint and using a workaround.

      // Get userA's ID
      const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
        headers: { Cookie: cookieA },
      });
      const meData = await meRes.json();
      const userAId = meData.user.id;

      // We need to create a comment in the DB. Since there's no comments API yet,
      // we'll import prisma directly in this test file via a dynamic approach.
      // Actually, let's use the prisma client directly.
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      try {
        const comment = await prisma.comment.create({
          data: {
            content: 'Test comment for like testing',
            postId: publicPostId,
            authorId: userAId,
          },
        });
        // Also increment the post's commentCount
        await prisma.post.update({
          where: { id: publicPostId },
          data: { commentCount: { increment: 1 } },
        });
        commentId = comment.id;
      } finally {
        await prisma.$disconnect();
      }
    });

    it('UserB likes the comment', async () => {
      const res = await fetch(`${BASE_URL}/api/comments/${commentId}/like`, {
        method: 'POST',
        headers: { Origin: ORIGIN, Cookie: cookieB },
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.liked).toBe(true);
      expect(data.likeCount).toBe(1);
    });

    it('UserB likes the comment again — idempotent', async () => {
      const res = await fetch(`${BASE_URL}/api/comments/${commentId}/like`, {
        method: 'POST',
        headers: { Origin: ORIGIN, Cookie: cookieB },
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.liked).toBe(true);
      expect(data.likeCount).toBe(1);
    });

    it('GET /api/comments/:id/likes returns UserB', async () => {
      const res = await fetch(`${BASE_URL}/api/comments/${commentId}/likes`, {
        headers: { Cookie: cookieA },
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.users).toBeDefined();
      expect(data.users.length).toBe(1);
      expect(data.users[0].firstName).toBe('LikeBob');
    });

    it('UserB unlikes the comment', async () => {
      const res = await fetch(`${BASE_URL}/api/comments/${commentId}/like`, {
        method: 'DELETE',
        headers: { Origin: ORIGIN, Cookie: cookieB },
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.liked).toBe(false);
      expect(data.likeCount).toBe(0);
    });

    it('Like on nonexistent comment returns 404', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await fetch(`${BASE_URL}/api/comments/${fakeId}/like`, {
        method: 'POST',
        headers: { Origin: ORIGIN, Cookie: cookieA },
      });
      expect(res.status).toBe(404);
    });
  });
});
