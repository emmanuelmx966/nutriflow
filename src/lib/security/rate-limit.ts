/**
 * Simple in-memory rate limiter for auth endpoints.
 * Protects against brute-force credential stuffing.
 * Uses a sliding window per identifier (IP or email).
 */
type RateBucket = { count: number; resetAt: number };

const store = new Map<string, RateBucket>();

const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 min
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, bucket] of store) {
    if (bucket.resetAt < now) store.delete(key);
  }
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

export class RateLimiter {
  constructor(
    private readonly maxAttempts: number,
    private readonly windowMs: number,
  ) {}

  check(identifier: string): RateLimitResult {
    cleanup();
    const now = Date.now();
    const bucket = store.get(identifier);

    if (!bucket || bucket.resetAt < now) {
      const fresh = { count: 1, resetAt: now + this.windowMs };
      store.set(identifier, fresh);
      return {
        success: true,
        remaining: this.maxAttempts - 1,
        resetAt: fresh.resetAt,
      };
    }

    bucket.count += 1;
    const remaining = Math.max(0, this.maxAttempts - bucket.count);
    return {
      success: bucket.count <= this.maxAttempts,
      remaining,
      resetAt: bucket.resetAt,
    };
  }

  reset(identifier: string) {
    store.delete(identifier);
  }
}

// Auth-specific limiters: 10 attempts per 15 min per identifier
export const authRateLimiter = new RateLimiter(10, 15 * 60 * 1000);
// General API limiter: 100 requests per minute
export const apiRateLimiter = new RateLimiter(100, 60 * 1000);
