import { NextResponse } from 'next/server';
import { requireUser, requirePostAccess } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { invalidateUserFeedCache } from '@/lib/cache';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireUser();
    const { id } = await params;

    await requirePostAccess(id, userId);

    const post = await prisma.post.findUnique({
      where: { id },
      select: {
        id: true,
        content: true,
        imageUrl: true,
        visibility: true,
        shareCount: true,
        _count: { select: { comments: { where: { deletedAt: null } }, likes: true } },
        createdAt: true,
        authorId: true,
        author: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        likes: { where: { userId }, select: { id: true } },
        comments: {
          where: { parentId: null, deletedAt: null },
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          take: 20,
          select: {
            id: true,
            content: true,
            likeCount: true,
            createdAt: true,
            authorId: true,
            author: { select: { id: true, firstName: true, lastName: true, avatar: true } },
            likes: { where: { userId }, select: { id: true } },
            replies: {
              where: { deletedAt: null },
              orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
              take: 3,
              select: {
                id: true,
                content: true,
                likeCount: true,
                createdAt: true,
                authorId: true,
                author: { select: { id: true, firstName: true, lastName: true, avatar: true } },
                likes: { where: { userId }, select: { id: true } },
              },
            },
          },
        },
      },
    });

    if (!post) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const { _count, ...rest } = post as any;
    const mappedPost = {
      ...rest,
      commentCount: _count.comments,
      likeCount: _count.likes,
    };

    return NextResponse.json({ post: mappedPost });
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
    const { id } = await params;

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    if (post.authorId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
      await prisma.post.delete({ where: { id } });
    } catch (e: unknown) {
      // P2025: record already deleted by concurrent request — treat as success
      if (e && typeof e === 'object' && 'code' in e && e.code === 'P2025') {
        return NextResponse.json({ message: 'Post deleted' }, { status: 200 });
      }
      throw e;
    }

    await invalidateUserFeedCache(userId);
    return NextResponse.json({ message: 'Post deleted' }, { status: 200 });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
