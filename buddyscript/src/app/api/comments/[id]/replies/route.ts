import { NextRequest, NextResponse } from 'next/server';
import { requireUser, requirePostAccess } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { CacheKey, TTL, cacheGet, cacheSet } from '@/lib/cache';

const AUTHOR_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  avatar: true,
} as const;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireUser();
    const { id: commentId } = await params;

    const parent = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true, postId: true },
    });

    if (!parent) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await requirePostAccess(parent.postId, userId);

    const searchParams = request.nextUrl.searchParams;
    const cursor = searchParams.get('cursor');
    const limit = 20;

    // ─── Cache Check ─────────────────────────────────────────
    const cacheKey = CacheKey.replies(commentId, userId, cursor);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cached = await cacheGet<{ replies: any[]; nextCursor: string | null }>(cacheKey);
    if (cached) return NextResponse.json(cached);

    // ─── DB Query ────────────────────────────────────────────
    const cursorFilter = cursor ? parseCursor(cursor) : null;
    const replies = await prisma.comment.findMany({
      where: {
        parentId: commentId,
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
        content: true,
        likeCount: true,
        deletedAt: true,
        createdAt: true,
        authorId: true,
        author: { select: AUTHOR_SELECT },
        likes: { where: { userId }, select: { id: true } },
      },
    });

    let nextCursor: string | null = null;
    if (replies.length > limit) {
      const last = replies[limit - 1];
      nextCursor = `${last.createdAt.toISOString()}_${last.id}`;
      replies.splice(limit);
    }

    const formatted = replies.map((r) => {
      const deleted = r.deletedAt !== null;
      return {
        id: r.id,
        content: deleted ? null : r.content,
        likeCount: r.likeCount,
        createdAt: r.createdAt,
        authorId: r.authorId,
        liked: r.likes.length > 0,
        deleted,
        author: r.author,
      };
    });

    const result = { replies: formatted, nextCursor };

    // ─── Cache Write ─────────────────────────────────────────
    cacheSet(cacheKey, result, TTL.replies);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function parseCursor(cursor: string) {
  const idx = cursor.indexOf('_');
  if (idx === -1) return null;
  const date = new Date(cursor.slice(0, idx));
  const id = cursor.slice(idx + 1);
  if (isNaN(date.getTime()) || !id) return null;
  return { createdAt: date, id };
}
