import { Redis } from '@upstash/redis';

const globalForRedis = globalThis as unknown as { redis: Redis | null };

function createRedisClient(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

// Disable Redis in test environment to avoid side effects
export const redis: Redis | null =
  process.env.NODE_ENV === 'test'
    ? null
    : (globalForRedis.redis ?? (globalForRedis.redis = createRedisClient()));
