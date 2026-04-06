import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { validatePost } from '@/lib/validators';
import { createPostRateLimit, getClientIP } from '@/lib/rate-limit';
import { getFeedPage } from '@/lib/feed';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await requireUser();

    const searchParams = request.nextUrl.searchParams;
    const cursor = searchParams.get('cursor');
    const limitParam = searchParams.get('limit');
    const limit = Math.min(Math.max(parseInt(limitParam || '10', 10) || 10, 1), 50);

    const { posts, nextCursor } = await getFeedPage(userId, cursor, limit);

    return NextResponse.json({ posts, nextCursor });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await requireUser();

    const ip = getClientIP(request);
    const { success: rateLimitOk } = await createPostRateLimit.limit(ip);
    if (!rateLimitOk) {
      return NextResponse.json({ error: 'Too many posts. Try again later.' }, { status: 429 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const validation = validatePost(body);
    if (!validation.success) {
      return NextResponse.json({ errors: validation.errors }, { status: 400 });
    }

    const { content, visibility, imageUrl } = validation.data;

    const post = await prisma.post.create({
      data: {
        content,
        visibility,
        imageUrl,
        authorId: userId,
      },
      select: {
        id: true,
        content: true,
        imageUrl: true,
        visibility: true,
        shareCount: true,
        createdAt: true,
        authorId: true,
        author: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        _count: { select: { comments: { where: { deletedAt: null } }, likes: true } },
      },
    });

    const { _count, ...rest } = post as any;
    return NextResponse.json(
      { post: { ...rest, liked: false, likes: [], commentCount: _count.comments, likeCount: _count.likes } },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
