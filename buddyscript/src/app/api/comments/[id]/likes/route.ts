import { NextRequest, NextResponse } from 'next/server';
import { requireUser, requirePostAccess } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireUser();
    const { id: commentId } = await params;

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true, postId: true },
    });

    if (!comment) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Ensure the user can access the parent post
    await requirePostAccess(comment.postId, userId);

    // Historical likes on deleted comments can still be listed (no 409 for GET)

    const searchParams = request.nextUrl.searchParams;
    const cursor = searchParams.get('cursor');
    const limit = 50;

    const likes = await prisma.commentLike.findMany({
      where: {
        commentId,
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
