import { NextRequest, NextResponse } from 'next/server';
import { requireUser, requirePostAccess } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireUser();
    const { id: postId } = await params;

    await requirePostAccess(postId, userId);

    const searchParams = request.nextUrl.searchParams;
    const cursor = searchParams.get('cursor');
    const limit = 50;

    const cursorFilter = cursor ? parseLikeCursor(cursor) : null;

    const likes = await prisma.postLike.findMany({
      where: {
        postId,
        ...(cursorFilter && {
          OR: [
            { createdAt: { lt: cursorFilter.createdAt } },
            { createdAt: cursorFilter.createdAt, id: { lt: cursorFilter.id } },
          ],
        }),
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
      select: {
        id: true,
        createdAt: true,
        user: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
      },
    });

    let nextCursor: string | null = null;
    if (likes.length > limit) {
      const last = likes[limit - 1];
      nextCursor = `${last.createdAt.toISOString()}_${last.id}`;
      likes.splice(limit);
    }

    const users = likes.map((l) => l.user);

    return NextResponse.json({ users, nextCursor });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function parseLikeCursor(cursor: string) {
  const idx = cursor.indexOf('_');
  if (idx === -1) return null;
  const date = new Date(cursor.slice(0, idx));
  const id = cursor.slice(idx + 1);
  if (isNaN(date.getTime()) || !id) return null;
  return { createdAt: date, id };
}
