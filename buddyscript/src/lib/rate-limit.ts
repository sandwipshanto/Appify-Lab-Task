import { Ratelimit } from '@upstash/ratelimit';
import { redis } from './redis';

const isProduction = process.env.NODE_ENV === 'production';

function createRateLimiter(limit: number, window: string, prefix: string) {
  if (!isProduction || !redis) {
    return { limit: async () => ({ success: true, limit, remaining: limit, reset: 0 }) };
  }
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, window as '1 m'),
    prefix,
  });
}

export const loginRateLimit = createRateLimiter(5, '1 m', 'ratelimit:login');
export const registerRateLimit = createRateLimiter(3, '1 m', 'ratelimit:register');
export const createPostRateLimit = createRateLimiter(10, '1 m', 'ratelimit:post');
export const commentRateLimit = createRateLimiter(20, '1 m', 'ratelimit:comment');
export const uploadRateLimit = createRateLimiter(5, '1 m', 'ratelimit:upload');

export function getClientIP(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}
