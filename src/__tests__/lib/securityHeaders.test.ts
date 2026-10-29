import { contentSecurityPolicy, securityHeaders } from '@/lib/securityHeaders';

const env = {
  NEXT_PUBLIC_AUTH0_DOMAIN: 'tenant.us.auth0.com',
  NEXT_PUBLIC_SSE_SERVICE_URL: 'https://sse.example.com/path',
  NEXT_PUBLIC_UMAMI_SCRIPT_URL: 'https://stats.example.com/script.js',
};
const header = (name: string, e = env, dev = false) =>
  securityHeaders(e, dev)[0].headers.find(h => h.key === name)?.value;

describe('contentSecurityPolicy', () => {
  it('allows the services the app talks to, by origin only', () => {
    const csp = contentSecurityPolicy(env);
    expect(csp).toMatch(/connect-src [^;]*https:\/\/tenant\.us\.auth0\.com/);
    expect(csp).toMatch(/connect-src [^;]*https:\/\/sse\.example\.com(?!\/)/);
    expect(csp).toMatch(/script-src [^;]*https:\/\/stats\.example\.com/);
    expect(csp).toContain('frame-src https://tenant.us.auth0.com');
    expect(csp).toMatch(/connect-src [^;]*https:\/\/ipapi\.co/);
  });

  it('forbids framing, plugins and a changed base URL', () => {
    const csp = contentSecurityPolicy(env);
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
  });

  it('allows eval and websockets only in development', () => {
    expect(contentSecurityPolicy(env, false)).not.toContain('unsafe-eval');
    expect(contentSecurityPolicy(env, true)).toContain("'unsafe-eval'");
    expect(contentSecurityPolicy(env, true)).toContain('ws:');
  });

  it('copes with nothing configured', () => {
    const csp = contentSecurityPolicy({});
    expect(csp).toContain("frame-src 'none'");
    expect(csp).toContain("connect-src 'self'");
  });

  it('accepts a bare domain and ignores a malformed URL', () => {
    const csp = contentSecurityPolicy({
      NEXT_PUBLIC_AUTH0_DOMAIN: 'bare.auth0.com',
      NEXT_PUBLIC_SSE_SERVICE_URL: 'http://[bad',
    });
    expect(csp).toContain('https://bare.auth0.com');
    expect(csp).not.toContain('bad');
  });
});

describe('securityHeaders', () => {
  it('sets the standard protective headers on every route', () => {
    expect(securityHeaders(env)[0].source).toBe('/(.*)');
    expect(header('X-Content-Type-Options')).toBe('nosniff');
    expect(header('X-Frame-Options')).toBe('DENY');
    expect(header('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
    expect(header('Permissions-Policy')).toContain('camera=()');
  });

  it('keeps the CSP report-only for now', () => {
    expect(header('Content-Security-Policy-Report-Only')).toBeTruthy();
    expect(header('Content-Security-Policy')).toBeUndefined();
  });

  it('sends HSTS outside development only', () => {
    expect(header('Strict-Transport-Security', env, false)).toBe('max-age=31536000');
    expect(header('Strict-Transport-Security', env, true)).toBeUndefined();
  });
});
