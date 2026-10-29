import type { ErrorEvent } from '@sentry/nextjs';
import { scrubEvent, sentryOptions } from '@/lib/sentryOptions';

const event = (over: Partial<ErrorEvent> = {}) =>
  ({
    type: undefined,
    request: {
      url: 'https://www.next-holiday.com/api/home',
      headers: {
        Authorization: 'Bearer secret',
        Cookie: 'a=b',
        'User-Agent': 'jest',
      },
      cookies: { a: 'b' },
    },
    user: { email: 'me@x.com' },
    ...over,
  }) as ErrorEvent;

describe('scrubEvent', () => {
  it('removes credentials from the request, whatever the header casing', () => {
    const out = scrubEvent(event());
    expect(out.request?.headers).toEqual({ 'User-Agent': 'jest' });
    expect(out.request?.cookies).toBeUndefined();
  });

  it('removes user details but keeps the rest of the report', () => {
    const out = scrubEvent(event());
    expect(out.user).toBeUndefined();
    expect(out.request?.url).toBe('https://www.next-holiday.com/api/home');
  });

  it('copes with an event that has no request', () => {
    expect(() => scrubEvent(event({ request: undefined }))).not.toThrow();
  });
});

describe('sentryOptions', () => {
  it('reports errors only and sends no default personal data', () => {
    expect(sentryOptions.tracesSampleRate).toBe(0);
    expect(sentryOptions.sendDefaultPii).toBe(false);
    expect(sentryOptions.beforeSend).toBe(scrubEvent);
  });

  it('stays off without a DSN', () => {
    expect(sentryOptions.enabled).toBe(!!sentryOptions.dsn);
  });
});
