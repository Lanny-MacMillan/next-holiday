type Env = Record<string, string | undefined>;

const originOf = (value: string | undefined) => {
  if (!value) return null;
  try {
    return new URL(value.includes('://') ? value : `https://${value}`).origin;
  } catch {
    return null;
  }
};

// Umami Cloud loads its script from cloud.umami.is but reports to this origin.
const UMAMI_CLOUD_GATEWAY = 'https://gateway.umami.is';

export function contentSecurityPolicy(env: Env = process.env, dev = false) {
  const auth0 = originOf(env.NEXT_PUBLIC_AUTH0_DOMAIN);
  const sse = originOf(env.NEXT_PUBLIC_SSE_SERVICE_URL);
  const umami = originOf(env.NEXT_PUBLIC_UMAMI_SCRIPT_URL);
  const sentry = originOf(env.NEXT_PUBLIC_SENTRY_DSN);
  const some = (...origins: Array<string | null>) =>
    origins.filter((o): o is string => !!o);

  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],
    // Next.js emits inline bootstrap scripts, so a nonce-free policy needs 'unsafe-inline'.
    'script-src': [
      "'self'",
      "'unsafe-inline'",
      ...(dev ? ["'unsafe-eval'"] : []),
      ...some(umami),
    ],
    'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    'font-src': ["'self'", 'data:', 'https://fonts.gstatic.com'],
    'img-src': ["'self'", 'data:', 'blob:', 'https:'],
    'connect-src': [
      "'self'",
      ...some(auth0, sse, umami, sentry),
      ...(umami === 'https://cloud.umami.is' ? [UMAMI_CLOUD_GATEWAY] : []),
      ...(dev ? ['ws:', 'http:'] : []),
    ],
    'frame-src': some(auth0).length ? some(auth0) : ["'none'"],
    'worker-src': ["'self'", 'blob:'],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
  };

  return Object.entries(directives)
    .map(([name, sources]) => `${name} ${sources.join(' ')}`)
    .join('; ');
}

export function securityHeaders(env: Env = process.env, dev = false) {
  const headers = [
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    {
      key: 'Permissions-Policy',
      value: 'camera=(), microphone=(), geolocation=(), payment=()',
    },
    // Enforced in production. Under `next dev` it only reports, so hot reload and other
    // dev tooling can never be blocked.
    {
      key: dev ? 'Content-Security-Policy-Report-Only' : 'Content-Security-Policy',
      value: contentSecurityPolicy(env, dev),
    },
  ];

  if (!dev) {
    headers.push({ key: 'Strict-Transport-Security', value: 'max-age=31536000' });
  }

  return [{ source: '/(.*)', headers }];
}
