type Bucket = { count: number; resetAt: number };

// Per server instance, so with several instances the real ceiling is higher; it is an abuse guard.
const buckets = new Map<string, Bucket>();

export const RATE_LIMIT = { max: 300, windowMs: 60_000 };

export function checkRateLimit(key: string, now = Date.now()) {
  if (buckets.size > 10_000) {
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
  }

  const existing = buckets.get(key);
  const bucket =
    existing && existing.resetAt > now
      ? existing
      : { count: 0, resetAt: now + RATE_LIMIT.windowMs };
  bucket.count += 1;
  buckets.set(key, bucket);

  return {
    allowed: bucket.count <= RATE_LIMIT.max,
    retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
  };
}

export function resetRateLimit() {
  buckets.clear();
}
