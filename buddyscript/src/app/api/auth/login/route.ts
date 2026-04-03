import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { comparePassword, setAuthCookie } from '@/lib/auth';
import { validateLogin } from '@/lib/validators';
import { loginRateLimit, getClientIP } from '@/lib/rate-limit';

export async function POST(request: Request) {
  const ip = getClientIP(request);
  const { success: rateLimitOk } = await loginRateLimit.limit(ip);
  if (!rateLimitOk) {
    return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  const validation = validateLogin(body);
  if (!validation.success) {
    return NextResponse.json({ errors: validation.errors }, { status: 400 });
  }

  const { email, password } = validation.data;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !(await comparePassword(password, user.password))) {
    console.error(`[AUTH] Failed login attempt from IP: ${ip}`);
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  await setAuthCookie(user.id);

  return NextResponse.json({
    user: { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email },
  });
}
