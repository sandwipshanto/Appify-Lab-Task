import { NextResponse } from 'next/server';
import { requireUser, requirePostAccess } from '@/lib/auth';
import { prisma } from '@/lib/db';

async function resolveComment(commentId: string, userId: string) {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { id: true, postId: true, deletedAt: true },
  });

  if (!comment) {
    throw new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  }

  // Ensure the user can access the parent post
  await requirePostAccess(comment.postId, userId);

  return comment;
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireUser();
    const { id: commentId } = await params;

    const comment = await resolveComment(commentId, userId);

    // Don't allow liking deleted comments
    if (comment.deletedAt) {
      return NextResponse.json(
        { error: 'Cannot like a deleted comment' },
        { status: 409 }
      );
    }

    // Check if already liked (idempotent)
    const existing = await prisma.commentLike.findUnique({
      where: { userId_commentId: { userId, commentId } },
    });

    if (existing) {
      const current = await prisma.comment.findUnique({
        where: { id: commentId },
        select: { likeCount: true },
      });
      return NextResponse.json({ liked: true, likeCount: current!.likeCount });
    }

    // Atomic: create like + increment counter
    try {
      const [, updatedComment] = await prisma.$transaction([
        prisma.commentLike.create({ data: { userId, commentId } }),
        prisma.comment.update({
          where: { id: commentId },
          data: { likeCount: { increment: 1 } },
          select: { likeCount: true },
        }),
      ]);
      return NextResponse.json({ liked: true, likeCount: updatedComment.likeCount });
    } catch (txError: unknown) {
      if (txError && typeof txError === 'object' && 'code' in txError && txError.code === 'P2002') {
        const current = await prisma.comment.findUnique({ where: { id: commentId }, select: { likeCount: true } });
        return NextResponse.json({ liked: true, likeCount: current!.likeCount });
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
    const { id: commentId } = await params;

    const comment = await resolveComment(commentId, userId);

    // Don't allow unliking deleted comments
    if (comment.deletedAt) {
      return NextResponse.json(
        { error: 'Cannot unlike a deleted comment' },
        { status: 409 }
      );
    }

    // Check if like exists (idempotent)
    const existing = await prisma.commentLike.findUnique({
      where: { userId_commentId: { userId, commentId } },
    });

    if (!existing) {
      const current = await prisma.comment.findUnique({
        where: { id: commentId },
        select: { likeCount: true },
      });
      return NextResponse.json({ liked: false, likeCount: current!.likeCount });
    }

    // Atomic: delete like + decrement counter
    try {
      const [, updatedComment] = await prisma.$transaction([
        prisma.commentLike.delete({
          where: { userId_commentId: { userId, commentId } },
        }),
        prisma.comment.update({
          where: { id: commentId },
          data: { likeCount: { decrement: 1 } },
          select: { likeCount: true },
        }),
      ]);
      return NextResponse.json({ liked: false, likeCount: updatedComment.likeCount });
    } catch (txError: unknown) {
      if (txError && typeof txError === 'object' && 'code' in txError && txError.code === 'P2025') {
        const current = await prisma.comment.findUnique({ where: { id: commentId }, select: { likeCount: true } });
        return NextResponse.json({ liked: false, likeCount: current!.likeCount });
      }
      throw txError;
    }
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
