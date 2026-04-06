import { prisma } from './db';
import { CacheKey, TTL, cacheGet, cacheSet } from './cache';

const POST_SELECT = (userId: string) => ({
  id: true,
  content: true,
  imageUrl: true,
  visibility: true,
  shareCount: true,
  createdAt: true,
  authorId: true,
  author: { select: { id: true, firstName: true, lastName: true, avatar: true } },
  likes: { select: { user: { select: { id: true, firstName: true, avatar: true } } }, orderBy: { createdAt: 'desc' as const }, take: 5 },
  _count: { select: { comments: { where: { deletedAt: null } }, likes: true, shares: true } },
});

export async function getFeedPage(
  userId: string,
  cursor: string | null,
  limit: number = 10
) {
  // ─── Cache Check ─────────────────────────────────────────────
  const cacheKey = CacheKey.feed(userId, cursor, limit);
  const cached = await cacheGet<{ posts: any[]; nextCursor: string | null }>(cacheKey);
  if (cached) return cached;

  // ─── DB Query ────────────────────────────────────────────────
  const cursorFilter = cursor ? parseCursor(cursor) : null;

  const [publicPosts, privatePosts] = await Promise.all([
    prisma.post.findMany({
      where: {
        visibility: 'PUBLIC',
        ...(cursorFilter && {
          OR: [
            { createdAt: { lt: cursorFilter.createdAt } },
            { createdAt: cursorFilter.createdAt, id: { lt: cursorFilter.id } },
          ],
        }),
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit,
      select: POST_SELECT(userId),
    }),
    prisma.post.findMany({
      where: {
        authorId: userId,
        visibility: 'PRIVATE',
        ...(cursorFilter && {
          OR: [
            { createdAt: { lt: cursorFilter.createdAt } },
            { createdAt: cursorFilter.createdAt, id: { lt: cursorFilter.id } },
          ],
        }),
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit,
      select: POST_SELECT(userId),
    }),
  ]);

  const merged = [...publicPosts, ...privatePosts]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime() || b.id.localeCompare(a.id))
    .slice(0, limit);

  const postIds = merged.map((p) => p.id);
  const userLikes = await prisma.postLike.findMany({
    where: { userId, postId: { in: postIds } },
    select: { postId: true },
  });
  const likedPostIds = new Set(userLikes.map((ul) => ul.postId));

  const userShares = await prisma.postShare.findMany({
    where: { userId, postId: { in: postIds } },
    select: { postId: true },
  });
  const sharedPostIds = new Set(userShares.map((us) => us.postId));

  const postsWithLiked = merged.map((p) => {
    const { _count, ...rest } = p;
    return {
      ...rest,
      liked: likedPostIds.has(p.id),
      shared: sharedPostIds.has(p.id),
      commentCount: _count.comments,
      likeCount: _count.likes,
    };
  });

  const nextCursor =
    merged.length === limit
      ? `${merged[merged.length - 1].createdAt.toISOString()}_${merged[merged.length - 1].id}`
      : null;

  const result = { posts: postsWithLiked, nextCursor };

  // ─── Cache Write (fire-and-forget) ───────────────────────────
  cacheSet(cacheKey, result, TTL.feed);

  return result;
}

function parseCursor(cursor: string) {
  const underscoreIdx = cursor.indexOf('_');
  if (underscoreIdx === -1) return null;
  const iso = cursor.slice(0, underscoreIdx);
  const id = cursor.slice(underscoreIdx + 1);
  const date = new Date(iso);
  if (isNaN(date.getTime()) || !id) return null;
  return { createdAt: date, id };
}
