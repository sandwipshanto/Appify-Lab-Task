import { prisma } from './db';

const POST_SELECT = (userId: string) => ({
  id: true,
  content: true,
  imageUrl: true,
  visibility: true,
  likeCount: true,
  commentCount: true,
  createdAt: true,
  authorId: true,
  author: { select: { id: true, firstName: true, lastName: true, avatar: true } },
  likes: { where: { userId }, select: { id: true } },
});

export async function getFeedPage(
  userId: string,
  cursor: string | null,
  limit: number = 10
) {
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

  const nextCursor =
    merged.length === limit
      ? `${merged[merged.length - 1].createdAt.toISOString()}_${merged[merged.length - 1].id}`
      : null;

  return { posts: merged, nextCursor };
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
