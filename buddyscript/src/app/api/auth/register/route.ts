import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword, setAuthCookie } from '@/lib/auth';
import { validateRegistration } from '@/lib/validators';
import { registerRateLimit, getClientIP } from '@/lib/rate-limit';
import { generateAvatarUrl } from '@/lib/avatar';

export async function POST(request: Request) {
  const ip = getClientIP(request);
  const { success: rateLimitOk } = await registerRateLimit.limit(ip);
  if (!rateLimitOk) {
    return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  const validation = validateRegistration(body);
  if (!validation.success) {
    return NextResponse.json({ errors: validation.errors }, { status: 400 });
  }

  const { firstName, lastName, email, password } = validation.data;

  const hashedPassword = await hashPassword(password);
  const avatar = generateAvatarUrl(firstName, lastName);

  let user;
  try {
    user = await prisma.user.create({
      data: { firstName, lastName, email, password: hashedPassword, avatar },
    });
  } catch (error: unknown) {
    // Handle unique constraint violation (race condition or duplicate)
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }
    throw error;
  }

  await setAuthCookie(user.id);

  return NextResponse.json(
    { user: { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email } },
    { status: 201 }
  );
}

