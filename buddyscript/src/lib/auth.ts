import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { prisma } from './db';
import { CacheKey, TTL, cacheGet, cacheSet, cacheDel } from './cache';

function getJWTSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET environment variable is required');
  return new TextEncoder().encode(secret);
}

const JWT_SECRET = getJWTSecret();
const COOKIE_NAME = 'token';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signJWT(payload: { userId: string }): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

export async function verifyJWT(token: string): Promise<{ userId: string }> {
  const { payload } = await jwtVerify(token, JWT_SECRET, { algorithms: ['HS256'] });
  return payload as { userId: string };
}

export async function setAuthCookie(userId: string): Promise<void> {
  const token = await signJWT({ userId });
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearAuthCookie(): Promise<void> {
  // Invalidate session cache before clearing cookie
  const token = await getAuthToken();
  if (token) {
    const tokenKey = token.slice(-16);
    cacheDel(CacheKey.session(tokenKey));
  }
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getAuthToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value;
}

export async function requireUser(): Promise<{ userId: string }> {
  const token = await getAuthToken();
  if (!token) {
    throw new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  // Check session cache first
  const tokenKey = token.slice(-16);
  const sessionKey = CacheKey.session(tokenKey);
  const cached = await cacheGet<{ userId: string }>(sessionKey);
  if (cached) return cached;

  try {
    const payload = await verifyJWT(token);
    cacheSet(sessionKey, payload, TTL.session);
    return payload;
  } catch {
    throw new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
}

export async function requirePostAccess(postId: string, userId: string) {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) {
    throw new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  }
  if (post.visibility === 'PRIVATE' && post.authorId !== userId) {
    throw new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  }
  return post;
}
