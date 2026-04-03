import { describe, it, expect } from 'vitest';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const ORIGIN = new URL(BASE_URL).origin;
const JSON_HEADERS = { 'Content-Type': 'application/json', Origin: ORIGIN };

describe('Auth API', () => {
  let authCookie: string;

  it('registers a new user', async () => {
    // bcrypt is slow on first call (cold start)
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({
        firstName: 'Test', lastName: 'User',
        email: `test-${Date.now()}@example.com`, password: 'Test1234',
      }),
    });
    expect(res.status).toBe(201);
    authCookie = res.headers.get('set-cookie') || '';
    expect(authCookie).toContain('token=');
  });

  it('rejects duplicate email', async () => {
    const email = `dup-${Date.now()}@example.com`;
    await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ firstName: 'A', lastName: 'B', email, password: 'Test1234' }),
    });
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ firstName: 'C', lastName: 'D', email, password: 'Test1234' }),
    });
    expect(res.status).toBe(409);
  });

  it('logs in with correct credentials', async () => {
    const email = `login-${Date.now()}@example.com`;
    await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ firstName: 'A', lastName: 'B', email, password: 'Test1234' }),
    });
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ email, password: 'Test1234' }),
    });
    expect(res.status).toBe(200);
    authCookie = res.headers.get('set-cookie') || '';
    expect(authCookie).toContain('token=');
  });

  it('rejects wrong password', async () => {
    const email = `wrong-${Date.now()}@example.com`;
    await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ firstName: 'A', lastName: 'B', email, password: 'Test1234' }),
    });
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ email, password: 'Wrong123' }),
    });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Invalid email or password');
  });

  it('returns current user with valid cookie', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Cookie: authCookie },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user).toBeDefined();
    expect(body.user.email).toBeDefined();
  });

  it('returns 401 without cookie', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/me`);
    expect(res.status).toBe(401);
  });

  it('clears cookie on logout', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: { Cookie: authCookie, Origin: ORIGIN },
    });
    expect(res.status).toBe(200);
    const setCookie = res.headers.get('set-cookie') || '';
    expect(setCookie).toContain('token=');
    // Next.js cookieStore.delete() uses Expires=epoch instead of Max-Age=0
    expect(setCookie).toMatch(/Max-Age=0|Expires=Thu, 01 Jan 1970/);
  });
});
