import { describe, it, expect } from 'vitest';
import { hashPassword, comparePassword, signJWT, verifyJWT } from '@/lib/auth';

describe('Password hashing', () => {
  it('hashes and verifies a password', async () => {
    const hash = await hashPassword('Test1234');
    expect(hash).not.toBe('Test1234');
    expect(await comparePassword('Test1234', hash)).toBe(true);
    expect(await comparePassword('wrong', hash)).toBe(false);
  });

  it('produces different hashes for the same password', async () => {
    const hash1 = await hashPassword('Test1234');
    const hash2 = await hashPassword('Test1234');
    expect(hash1).not.toBe(hash2);
  });
});

describe('JWT', () => {
  it('signs and verifies a token', async () => {
    const token = await signJWT({ userId: 'test-id' });
    const payload = await verifyJWT(token);
    expect(payload.userId).toBe('test-id');
  });

  it('rejects a tampered token', async () => {
    const token = await signJWT({ userId: 'test-id' });
    await expect(verifyJWT(token + 'x')).rejects.toThrow();
  });

  it('returns a non-empty string token', async () => {
    const token = await signJWT({ userId: 'abc-123' });
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);
  });
});
