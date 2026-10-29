/** @jest-environment node */
import { NextRequest } from 'next/server';

const post = (body: unknown, headers: Record<string, string> = {}) =>
  new NextRequest('http://localhost/api/performance', {
    method: 'POST',
    body: typeof body === 'string' ? body : JSON.stringify(body),
    headers,
  });

const payload = (over: Record<string, unknown> = {}) => ({
  session: {
    sessionId: 's1',
    totalTime: 1234.5,
    metricsCount: 1,
    vitalsCount: 0,
    url: 'https://x.test/holidays/easter',
  },
  metrics: [{ name: 'load', value: 12.3 }],
  vitals: [],
  timestamp: 1,
  userAgent: 'jest',
  ...over,
});

let route: typeof import('@/app/api/performance/route');
const env = { ...process.env };

beforeEach(() => {
  jest.useFakeTimers();
  jest.resetModules();
  route = require('@/app/api/performance/route');
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
  delete process.env.PERFORMANCE_API_KEY;
});

afterEach(() => {
  process.env = { ...env };
  jest.useRealTimers();
  jest.restoreAllMocks();
});

const send = async (body: unknown, headers?: Record<string, string>) => {
  const res = await route.POST(post(body, headers));
  return { res, body: await res.json() };
};

describe('POST /api/performance', () => {
  it('accepts a report and echoes the session id with the rate limit headers', async () => {
    const { res, body } = await send(payload());

    expect(res.status).toBe(200);
    expect(body).toEqual({
      success: true,
      message: 'Performance data received',
      sessionId: 's1',
    });
    expect(res.headers.get('X-RateLimit-Limit')).toBe('10');
    expect(res.headers.get('X-RateLimit-Remaining')).toBe('9');
  });

  it('accepts engagement, errors, resources and vitals', async () => {
    const { res } = await send(
      payload({
        engagement: {
          timeOnPage: 5000,
          scrollDepth: 40,
          interactions: 2,
          clicks: 1,
        },
        errors: [{ message: 'boom', timestamp: 1, url: 'u' }],
        resources: { count: 3, totalSize: 2048, cacheHits: 1, cacheMisses: 1 },
        vitals: [{ name: 'LCP', value: 2000.123, rating: 'good' }],
      }),
    );
    expect(res.status).toBe(200);
  });

  it('copes with an unparseable page URL', async () => {
    const { res } = await send(
      payload({ session: { ...payload().session, url: 'not a url' } }),
    );
    expect(res.status).toBe(200);
  });

  describe('rate limiting', () => {
    const ip = (value: string) => ({ 'x-forwarded-for': value });

    it('allows ten requests a minute per address, then answers 429', async () => {
      for (let i = 0; i < 10; i++)
        expect((await send(payload(), ip('1.1.1.1'))).res.status).toBe(200);

      const { res, body } = await send(payload(), ip('1.1.1.1'));
      expect(res.status).toBe(429);
      expect(body.retryAfter).toBe(60);
      expect(res.headers.get('Retry-After')).toBe('60');
      expect(res.headers.get('X-RateLimit-Remaining')).toBe('0');
    });

    it('counts addresses separately, using the first forwarded address', async () => {
      for (let i = 0; i < 10; i++) await send(payload(), ip('1.1.1.1, 9.9.9.9'));

      expect((await send(payload(), ip('2.2.2.2'))).res.status).toBe(200);
      expect((await send(payload(), ip('1.1.1.1'))).res.status).toBe(429);
    });

    it.each(['x-real-ip', 'cf-connecting-ip'])('falls back to %s', async header => {
      for (let i = 0; i < 10; i++) await send(payload(), { [header]: '3.3.3.3' });
      expect((await send(payload(), { [header]: '3.3.3.3' })).res.status).toBe(429);
    });

    it('starts a new window after a minute', async () => {
      for (let i = 0; i < 11; i++) await send(payload(), ip('4.4.4.4'));
      jest.advanceTimersByTime(61_000);
      expect((await send(payload(), ip('4.4.4.4'))).res.status).toBe(200);
    });

    it('forgets expired addresses on its cleanup timer', async () => {
      for (let i = 0; i < 10; i++) await send(payload(), ip('5.5.5.5'));
      jest.advanceTimersByTime(121_000);
      expect(
        (await send(payload(), ip('5.5.5.5'))).res.headers.get(
          'X-RateLimit-Remaining',
        ),
      ).toBe('9');
    });
  });

  describe('API key', () => {
    beforeEach(() => (process.env.PERFORMANCE_API_KEY = 'k'));

    it('is required once configured', async () => {
      expect((await send(payload())).res.status).toBe(401);
      expect((await send(payload(), { 'x-api-key': 'wrong' })).res.status).toBe(401);
    });

    it('lets a matching key through', async () => {
      expect((await send(payload(), { 'x-api-key': 'k' })).res.status).toBe(200);
    });
  });

  it('is 500 for a body that is not JSON', async () => {
    expect((await send('{')).res.status).toBe(500);
  });

  it('rejects a report with no session with a 400', async () => {
    expect((await send({ metrics: [], vitals: [] })).res.status).toBe(400);
  });
});

describe('GET /api/performance', () => {
  it('is a placeholder that echoes the session id', async () => {
    const res = await route.GET(
      new NextRequest('http://localhost/api/performance?sessionId=abc'),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ sessionId: 'abc' });
  });
});
