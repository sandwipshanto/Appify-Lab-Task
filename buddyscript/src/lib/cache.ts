import { redis } from './redis';

// ─── Cache Key Patterns ─────────────────────────────────────────

export const CacheKey = {
  /** Per-user feed page */
  feed: (userId: string, cursor: string | null, limit: number) =>
    `feed:v1:${userId}:${cursor ?? 'top'}:${limit}`,

  /** JWT session */
  session: (tokenSuffix: string) => `session:${tokenSuffix}`,

  /** Post interaction counter */
  postCounter: (postId: string, type: 'likes' | 'comments' | 'shares') =>
    `cnt:post:${postId}:${type}`,

  /** Comment like counter */
  commentCounter: (commentId: string) => `cnt:cmt:${commentId}:likes`,

  /** Per-user comment tree for a post */
  comments: (postId: string, userId: string, cursor: string | null) =>
    `cmt:v1:${postId}:${userId}:${cursor ?? 'top'}`,

  /** Per-user replies for a comment */
  replies: (commentId: string, userId: string, cursor: string | null) =>
    `rpl:v1:${commentId}:${userId}:${cursor ?? 'top'}`,
};

// ─── TTLs (seconds) ────────────────────────────────────────────

export const TTL = {
  feed: 30,
  session: 3600,
  counter: 300,
  comments: 60,
  replies: 60,
};

// ─── Generic Cache Operations (all swallow errors — cache is non-critical) ───

export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!redis) return null;
  try {
    return await redis.get<T>(key);
  } catch {
    return null;
  }
}

export async function cacheSet(
  key: string,
  value: unknown,
  ttlSeconds: number,
): Promise<void> {
  if (!redis) return;
  try {
    await redis.set(key, value, { ex: ttlSeconds });
  } catch {
    // non-critical
  }
}

export async function cacheDel(...keys: string[]): Promise<void> {
  if (!redis || keys.length === 0) return;
  try {
    await redis.del(...keys);
  } catch {
    // non-critical
  }
}

// ─── Domain-Specific Helpers ───────────────────────────────────

/** Invalidate a user's first-page feed cache. TTL handles the rest. */
export async function invalidateUserFeedCache(
  userId: string,
): Promise<void> {
  await cacheDel(CacheKey.feed(userId, null, 10));
}

/** Invalidate comment tree cache for a post for a specific user. */
export async function invalidateCommentCache(
  postId: string,
  userId: string,
): Promise<void> {
  await cacheDel(CacheKey.comments(postId, userId, null));
}

/** Write-through: set a post counter in cache after a DB mutation. */
export async function setPostCounter(
  postId: string,
  type: 'likes' | 'comments' | 'shares',
  value: number,
): Promise<void> {
  await cacheSet(CacheKey.postCounter(postId, type), value, TTL.counter);
}

/** Read a cached post counter (returns null on miss). */
export async function getPostCounter(
  postId: string,
  type: 'likes' | 'comments' | 'shares',
): Promise<number | null> {
  return cacheGet<number>(CacheKey.postCounter(postId, type));
}

/** Write-through: set a comment like counter in cache. */
export async function setCommentCounter(
  commentId: string,
  value: number,
): Promise<void> {
  await cacheSet(CacheKey.commentCounter(commentId), value, TTL.counter);
}

/** Read a cached comment like counter. */
export async function getCommentCounter(
  commentId: string,
): Promise<number | null> {
  return cacheGet<number>(CacheKey.commentCounter(commentId));
}
