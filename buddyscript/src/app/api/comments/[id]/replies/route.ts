import { NextRequest, NextResponse } from 'next/server';
import { requireUser, requirePostAccess } from '@/lib/auth';
import { prisma } from '@/lib/db';

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

    const replies = await prisma.comment.findMany({
      where: {
        parentId: commentId,
        ...(cursor && {
          OR: [
            { createdAt: { lt: new Date(cursor.split('_')[0]) } },
            {
              createdAt: new Date(cursor.split('_')[0]),
              id: { lt: cursor.split('_')[1] },
            },
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

    return NextResponse.json({ replies: formatted, nextCursor });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
