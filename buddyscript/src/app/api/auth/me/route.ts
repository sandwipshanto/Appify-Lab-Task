import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const { userId } = await requireUser();
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
    });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    return NextResponse.json({ user });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
