/**
 * @jest-environment jsdom
 */
import 'whatwg-fetch';

type AuthFetch = typeof import('@/lib/authFetch');

let lib: AuthFetch;
let underlying: jest.Mock;

const headersOf = (call: unknown[]) =>
  new Headers((call[1] as RequestInit | undefined)?.headers);

beforeEach(() => {
  jest.resetModules();
  underlying = jest.fn().mockResolvedValue({ ok: true });
  window.fetch = underlying as unknown as typeof fetch;
  lib = require('@/lib/authFetch');
  lib.installAuthFetch();
  lib.setAuthTokenProvider(async () => 'tok-123');
});

describe('authFetch', () => {
  it('adds the bearer token to a same-origin API request', async () => {
    await window.fetch('/api/home');
    expect(headersOf(underlying.mock.calls[0]).get('Authorization')).toBe(
      'Bearer tok-123',
    );
  });

  it('also covers absolute same-origin URLs and URL objects', async () => {
    await window.fetch(`${window.location.origin}/api/home`);
    await window.fetch(new URL('/api/home', window.location.origin));
    for (const call of underlying.mock.calls) {
      expect(headersOf(call).get('Authorization')).toBe('Bearer tok-123');
    }
  });

  it('keeps the method, body and other headers', async () => {
    await window.fetch('/api/x', {
      method: 'POST',
      body: '{}',
      headers: { 'Content-Type': 'application/json' },
    });
    const init = underlying.mock.calls[0][1] as RequestInit;
    expect(init.method).toBe('POST');
    expect(init.body).toBe('{}');
    expect(headersOf(underlying.mock.calls[0]).get('Content-Type')).toBe(
      'application/json',
    );
  });

  it('does not touch other origins', async () => {
    await window.fetch('https://api.sse-notifs.com/health');
    expect(underlying).toHaveBeenCalledWith(
      'https://api.sse-notifs.com/health',
      undefined,
    );
  });

  it('does not touch same-origin requests outside /api', async () => {
    await window.fetch('/favicon.ico');
    expect(underlying).toHaveBeenCalledWith('/favicon.ico', undefined);
  });

  it('keeps an Authorization header the caller already set', async () => {
    await window.fetch('/api/x', { headers: { Authorization: 'Bearer mine' } });
    expect(headersOf(underlying.mock.calls[0]).get('Authorization')).toBe(
      'Bearer mine',
    );
  });

  it('sends the request without a token when nobody is signed in', async () => {
    lib.setAuthTokenProvider(null);
    await window.fetch('/api/home');
    expect(underlying).toHaveBeenCalledWith('/api/home', undefined);
  });

  it('still sends the request if getting a token fails', async () => {
    lib.setAuthTokenProvider(async () => {
      throw new Error('expired');
    });
    await window.fetch('/api/home');
    expect(headersOf(underlying.mock.calls[0]).has('Authorization')).toBe(false);
  });

  it('only wraps fetch once however often it is installed', async () => {
    lib.installAuthFetch();
    lib.installAuthFetch();
    await window.fetch('/api/home');
    expect(underlying).toHaveBeenCalledTimes(1);
  });
});
