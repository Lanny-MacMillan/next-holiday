import type { ErrorEvent } from '@sentry/nextjs';
import { scrubBreadcrumb, scrubEvent, sentryOptions } from '@/lib/sentryOptions';

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

describe('scrubBreadcrumb', () => {
  it('drops the query string from fetch and xhr requests', () => {
    for (const category of ['fetch', 'xhr']) {
      const out = scrubBreadcrumb({
        category,
        data: { url: '/api/shares?userId=google-oauth2|123', method: 'GET' },
      });
      expect(out.data).toEqual({ url: '/api/shares', method: 'GET' });
    }
  });

  it('leaves other breadcrumbs and urls without a query alone', () => {
    const click = { category: 'ui.click', data: { url: '/a?b=1' } };
    expect(scrubBreadcrumb(click)).toEqual({
      category: 'ui.click',
      data: { url: '/a?b=1' },
    });
    expect(
      scrubBreadcrumb({ category: 'fetch', data: { url: '/api/home' } }).data?.url,
    ).toBe('/api/home');
    expect(scrubBreadcrumb({ category: 'fetch' })).toEqual({ category: 'fetch' });
  });
});

describe('sentryOptions', () => {
  it('reports errors only and sends no default personal data', () => {
    expect(sentryOptions.tracesSampleRate).toBe(0);
    expect(sentryOptions.sendDefaultPii).toBe(false);
    expect(sentryOptions.beforeSend).toBe(scrubEvent);
    expect(sentryOptions.beforeBreadcrumb).toBe(scrubBreadcrumb);
  });

  it('stays off without a DSN', () => {
    expect(sentryOptions.enabled).toBe(!!sentryOptions.dsn);
  });
});
