import { describe, it, expect, beforeAll } from 'vitest';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const ORIGIN = new URL(BASE_URL).origin;

let cookie = '';

async function registerUser(): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN },
    body: JSON.stringify({
      firstName: 'Upload',
      lastName: 'Tester',
      email: `upload-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`,
      password: 'Test1234',
    }),
  });
  expect(res.status).toBe(201);
  return res.headers.get('set-cookie') || '';
}

describe('Upload Signature API', () => {
  beforeAll(async () => {
    cookie = await registerUser();
  });

  it('returns 401 for unauthenticated requests', async () => {
    const res = await fetch(`${BASE_URL}/api/upload/signature`, {
      method: 'POST',
      headers: { Origin: ORIGIN },
    });
    expect(res.status).toBe(401);
  });

  it('returns signed params for authenticated user', async () => {
    const res = await fetch(`${BASE_URL}/api/upload/signature`, {
      method: 'POST',
      headers: { Origin: ORIGIN, Cookie: cookie },
    });
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data).toHaveProperty('timestamp');
    expect(data).toHaveProperty('signature');
    expect(data).toHaveProperty('apiKey');
    expect(data).toHaveProperty('cloudName');
    expect(data).toHaveProperty('folder', 'buddyscript');
    expect(data).toHaveProperty('allowedFormats', 'jpg,png,gif,webp');
    expect(data).toHaveProperty('maxFileSize', 5242880);
    expect(typeof data.timestamp).toBe('number');
    expect(typeof data.signature).toBe('string');
    expect(data.signature.length).toBeGreaterThan(0);
  });

  it('rejects non-POST methods', async () => {
    const res = await fetch(`${BASE_URL}/api/upload/signature`, {
      method: 'GET',
      headers: { Origin: ORIGIN, Cookie: cookie },
    });
    expect(res.status).toBe(405);
  });
});
