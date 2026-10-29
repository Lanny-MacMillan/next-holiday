import { RATE_LIMIT, checkRateLimit, resetRateLimit } from '@/lib/rateLimit';

beforeEach(resetRateLimit);

describe('checkRateLimit', () => {
  it('allows up to the maximum in a window, then refuses', () => {
    for (let i = 0; i < RATE_LIMIT.max; i++) {
      expect(checkRateLimit('a', 1000).allowed).toBe(true);
    }
    expect(checkRateLimit('a', 1000).allowed).toBe(false);
  });

  it('starts a fresh window once the old one has ended', () => {
    for (let i = 0; i <= RATE_LIMIT.max; i++) checkRateLimit('a', 1000);
    expect(checkRateLimit('a', 1000 + RATE_LIMIT.windowMs).allowed).toBe(true);
  });

  it('keeps keys apart', () => {
    for (let i = 0; i <= RATE_LIMIT.max; i++) checkRateLimit('a', 1000);
    expect(checkRateLimit('b', 1000).allowed).toBe(true);
  });

  it('says how long to wait, at least a second', () => {
    for (let i = 0; i <= RATE_LIMIT.max; i++) checkRateLimit('a', 1000);
    expect(
      checkRateLimit('a', 1000 + RATE_LIMIT.windowMs - 200).retryAfterSeconds,
    ).toBe(1);
    expect(checkRateLimit('a', 1000).retryAfterSeconds).toBe(60);
  });

  it('drops expired buckets when the table gets large', () => {
    for (let i = 0; i < 10_001; i++) checkRateLimit(`k${i}`, 0);
    expect(checkRateLimit('fresh', RATE_LIMIT.windowMs + 1).allowed).toBe(true);
  });
});
