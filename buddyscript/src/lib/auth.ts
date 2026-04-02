import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { prisma } from './db';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);
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
  const { payload } = await jwtVerify(token, JWT_SECRET);
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
  try {
    return await verifyJWT(token);
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
    throw new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }
  return post;
}
