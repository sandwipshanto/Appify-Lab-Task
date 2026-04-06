import { NextRequest, NextResponse } from 'next/server';
import { requireUser, requirePostAccess } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { validateComment } from '@/lib/validators';
import { commentRateLimit, getClientIP } from '@/lib/rate-limit';
import {
  CacheKey, TTL, cacheGet, cacheSet, cacheDel,
  invalidateCommentCache, invalidateUserFeedCache,
  setPostCounter,
} from '@/lib/cache';

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
    const { id: postId } = await params;

    await requirePostAccess(postId, userId);

    const searchParams = request.nextUrl.searchParams;
    const cursor = searchParams.get('cursor');
    const limit = 20;

    // ─── Cache Check ─────────────────────────────────────────
    const cacheKey = CacheKey.comments(postId, userId, cursor);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cached = await cacheGet<{ comments: any[]; nextCursor: string | null }>(cacheKey);
    if (cached) return NextResponse.json(cached);

    // ─── DB Query ────────────────────────────────────────────
    // Fetch top-level comments (parentId = null), including soft-deleted ones
    const cursorFilter = cursor ? parseCursor(cursor) : null;
    const comments = await prisma.comment.findMany({
      where: {
        postId,
        parentId: null,
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
        // Fetch 4 replies to determine hasMoreReplies; return first 3
        replies: {
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          take: 4,
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
        },
      },
    });

    let nextCursor: string | null = null;
    if (comments.length > limit) {
      const last = comments[limit - 1];
      nextCursor = `${last.createdAt.toISOString()}_${last.id}`;
      comments.splice(limit);
    }

    const formatted = comments.map((c) => {
      const hasMoreReplies = c.replies.length > 3;
      const replies = c.replies.slice(0, 3).map((r) => formatComment(r));
      return {
        ...formatComment(c),
        replies,
        hasMoreReplies,
      };
    });

    const result = { comments: formatted, nextCursor };

    // ─── Cache Write ─────────────────────────────────────────
    cacheSet(cacheKey, result, TTL.comments);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireUser();
    const { id: postId } = await params;

    await requirePostAccess(postId, userId);

    const ip = getClientIP(request);
    const { success: rateLimitOk } = await commentRateLimit.limit(ip);
    if (!rateLimitOk) {
      return NextResponse.json(
        { error: 'Too many comments. Try again later.' },
        { status: 429 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const validation = validateComment(body);
    if (!validation.success) {
      return NextResponse.json({ errors: validation.errors }, { status: 400 });
    }

    const { content, parentId } = validation.data;

    // If parentId provided, validate it
    if (parentId) {
      const parent = await prisma.comment.findUnique({
        where: { id: parentId },
        select: { id: true, postId: true, parentId: true },
      });

      if (!parent) {
        return NextResponse.json(
          { error: 'Parent comment not found' },
          { status: 400 }
        );
      }

      if (parent.postId !== postId) {
        return NextResponse.json(
          { error: 'Parent comment belongs to a different post' },
          { status: 400 }
        );
      }

      // Enforce 2-level threading: reject reply-to-reply
      if (parent.parentId !== null) {
        return NextResponse.json(
          { error: 'Cannot reply to a reply. Only top-level comments accept replies.' },
          { status: 400 }
        );
      }
    }

    // Atomic: create comment + increment post's commentCount
    const [comment, updatedPost] = await prisma.$transaction([
      prisma.comment.create({
        data: {
          content,
          postId,
          authorId: userId,
          parentId: parentId || null,
        },
        select: {
          id: true,
          content: true,
          likeCount: true,
          deletedAt: true,
          createdAt: true,
          authorId: true,
          parentId: true,
          author: { select: AUTHOR_SELECT },
        },
      }),
      prisma.post.update({
        where: { id: postId },
        data: { commentCount: { increment: 1 } },
        select: { commentCount: true },
      }),
    ]);

    // Invalidate caches: comment tree + feed (for commentCount)
    await invalidateCommentCache(postId, userId);
    await setPostCounter(postId, 'comments', updatedPost.commentCount);
    await invalidateUserFeedCache(userId);
    // If it's a reply, also invalidate the parent's reply cache
    if (parentId) {
      await cacheDel(CacheKey.replies(parentId, userId, null));
    }

    return NextResponse.json(
      {
        comment: {
          id: comment.id,
          content: comment.content,
          likeCount: comment.likeCount,
          createdAt: comment.createdAt,
          authorId: comment.authorId,
          parentId: comment.parentId,
          liked: false,
          deleted: false,
          author: comment.author,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function formatComment(c: {
  id: string;
  content: string;
  likeCount: number;
  deletedAt: Date | null;
  createdAt: Date;
  authorId: string;
  author: { id: string; firstName: string; lastName: string; avatar: string | null };
  likes: { id: string }[];
}) {
  const deleted = c.deletedAt !== null;
  return {
    id: c.id,
    content: deleted ? null : c.content,
    likeCount: c.likeCount,
    createdAt: c.createdAt,
    authorId: c.authorId,
    liked: c.likes.length > 0,
    deleted,
    author: c.author,
  };
}

function parseCursor(cursor: string) {
  const idx = cursor.indexOf('_');
  if (idx === -1) return null;
  const date = new Date(cursor.slice(0, idx));
  const id = cursor.slice(idx + 1);
  if (isNaN(date.getTime()) || !id) return null;
  return { createdAt: date, id };
}
