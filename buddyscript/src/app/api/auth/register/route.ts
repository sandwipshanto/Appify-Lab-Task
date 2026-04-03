import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword, setAuthCookie } from '@/lib/auth';
import { validateRegistration } from '@/lib/validators';
import { registerRateLimit, getClientIP } from '@/lib/rate-limit';

export async function POST(request: Request) {
  const ip = getClientIP(request);
  const { success: rateLimitOk } = await registerRateLimit.limit(ip);
  if (!rateLimitOk) {
    return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
  }

  const body = await request.json();
  const validation = validateRegistration(body);
  if (!validation.success) {
    return NextResponse.json({ errors: validation.errors }, { status: 400 });
  }

  const { firstName, lastName, email, password } = validation.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
  }

  const hashedPassword = await hashPassword(password);
  const user = await prisma.user.create({
    data: { firstName, lastName, email, password: hashedPassword },
  });

  await setAuthCookie(user.id);

  return NextResponse.json(
    { user: { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email } },
    { status: 201 }
  );
}
