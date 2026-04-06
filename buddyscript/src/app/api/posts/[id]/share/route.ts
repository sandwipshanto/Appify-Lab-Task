import { NextResponse } from 'next/server';
import { requireUser, requirePostAccess } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { setPostCounter, invalidateUserFeedCache } from '@/lib/cache';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireUser();
    const { id: postId } = await params;

    await requirePostAccess(postId, userId);

    // Check if already shared (idempotent — each user can only share once)
    const existing = await prisma.postShare.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    if (existing) {
      const post = await prisma.post.findUnique({
        where: { id: postId },
        select: { shareCount: true },
      });
      return NextResponse.json({ shared: true, shareCount: post!.shareCount });
    }

    // Atomic: create share + increment counter
    try {
      const [, updatedPost] = await prisma.$transaction([
        prisma.postShare.create({ data: { userId, postId } }),
        prisma.post.update({
          where: { id: postId },
          data: { shareCount: { increment: 1 } },
          select: { shareCount: true },
        }),
      ]);
      await setPostCounter(postId, 'shares', updatedPost.shareCount);
      await invalidateUserFeedCache(userId);
      return NextResponse.json({ shared: true, shareCount: updatedPost.shareCount });
    } catch (txError: unknown) {
      // Handle concurrent duplicate — unique constraint violation
      if (txError && typeof txError === 'object' && 'code' in txError && txError.code === 'P2002') {
        const post = await prisma.post.findUnique({ where: { id: postId }, select: { shareCount: true } });
        return NextResponse.json({ shared: true, shareCount: post!.shareCount });
      }
      throw txError;
    }
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
