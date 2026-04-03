import { NextResponse } from 'next/server';
import { requireUser, requirePostAccess } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireUser();
    const { id: commentId } = await params;

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true, postId: true, authorId: true, deletedAt: true },
    });

    if (!comment) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Verify user can access the parent post
    await requirePostAccess(comment.postId, userId);

    // Only the author can delete their own comment
    if (comment.authorId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Idempotent: already soft-deleted
    if (comment.deletedAt) {
      return NextResponse.json({ deleted: true });
    }

    // Atomic: soft delete + decrement post's commentCount
    // Use updateMany with deletedAt IS NULL to prevent concurrent double-decrement
    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.comment.updateMany({
        where: { id: commentId, deletedAt: null },
        data: { deletedAt: new Date() },
      });
      if (updated.count > 0) {
        await tx.post.update({
          where: { id: comment.postId },
          data: { commentCount: { decrement: 1 } },
        });
      }
      return updated.count;
    });

    return NextResponse.json({ deleted: true });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
