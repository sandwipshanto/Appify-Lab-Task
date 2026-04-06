import { NextResponse } from 'next/server';
import { requireUser, requirePostAccess } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { setPostCounter, getPostCounter, invalidateUserFeedCache } from '@/lib/cache';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireUser();
    const { id: postId } = await params;

    await requirePostAccess(postId, userId);

    // Check if already liked (idempotent)
    const existing = await prisma.postLike.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    if (existing) {
      // Try cached counter first to avoid DB hit
      const cachedCount = await getPostCounter(postId, 'likes');
      if (cachedCount !== null) {
        return NextResponse.json({ liked: true, likeCount: cachedCount });
      }
      const post = await prisma.post.findUnique({
        where: { id: postId },
        select: { likeCount: true },
      });
      await setPostCounter(postId, 'likes', post!.likeCount);
      return NextResponse.json({ liked: true, likeCount: post!.likeCount });
    }

    // Atomic: create like + increment counter
    try {
      const [, updatedPost] = await prisma.$transaction([
        prisma.postLike.create({ data: { userId, postId } }),
        prisma.post.update({
          where: { id: postId },
          data: { likeCount: { increment: 1 } },
          select: { likeCount: true },
        }),
      ]);
      // Write-through: update Redis counter + invalidate feed
      await setPostCounter(postId, 'likes', updatedPost.likeCount);
      await invalidateUserFeedCache(userId);
      return NextResponse.json({ liked: true, likeCount: updatedPost.likeCount });
    } catch (txError: unknown) {
      // Handle concurrent duplicate — unique constraint violation
      if (txError && typeof txError === 'object' && 'code' in txError && txError.code === 'P2002') {
        const post = await prisma.post.findUnique({ where: { id: postId }, select: { likeCount: true } });
        await setPostCounter(postId, 'likes', post!.likeCount);
        return NextResponse.json({ liked: true, likeCount: post!.likeCount });
      }
      throw txError;
    }
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireUser();
    const { id: postId } = await params;

    await requirePostAccess(postId, userId);

    // Check if like exists (idempotent)
    const existing = await prisma.postLike.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    if (!existing) {
      // Try cached counter first
      const cachedCount = await getPostCounter(postId, 'likes');
      if (cachedCount !== null) {
        return NextResponse.json({ liked: false, likeCount: cachedCount });
      }
      const post = await prisma.post.findUnique({
        where: { id: postId },
        select: { likeCount: true },
      });
      await setPostCounter(postId, 'likes', post!.likeCount);
      return NextResponse.json({ liked: false, likeCount: post!.likeCount });
    }

    // Atomic: delete like + decrement counter
    try {
      const [, updatedPost] = await prisma.$transaction([
        prisma.postLike.delete({
          where: { userId_postId: { userId, postId } },
        }),
        prisma.post.update({
          where: { id: postId },
          data: { likeCount: { decrement: 1 } },
          select: { likeCount: true },
        }),
      ]);
      await setPostCounter(postId, 'likes', updatedPost.likeCount);
      await invalidateUserFeedCache(userId);
      return NextResponse.json({ liked: false, likeCount: updatedPost.likeCount });
    } catch (txError: unknown) {
      // Handle concurrent duplicate delete — record not found
      if (txError && typeof txError === 'object' && 'code' in txError && txError.code === 'P2025') {
        const post = await prisma.post.findUnique({ where: { id: postId }, select: { likeCount: true } });
        await setPostCounter(postId, 'likes', post!.likeCount);
        return NextResponse.json({ liked: false, likeCount: post!.likeCount });
      }
      throw txError;
    }
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
