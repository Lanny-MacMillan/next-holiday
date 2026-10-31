import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken } from '@/lib/verifyAuth0Token';
import { checkRateLimit } from '@/lib/rateLimit';
import { logger } from '@/lib/logger';

// Performance beacons and the health check are anonymous by design; Stripe's webhook
// proves who it is with a signature instead of a token.
const PUBLIC_API_PATHS = ['/api/performance', '/api/health', '/api/billing/webhook'];

const SAFE_REQUEST_ID = /^[A-Za-z0-9_-]{8,64}$/;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Every request gets an id, sent back in x-request-id so a report can quote it and
  // the matching log lines can be found
  const incomingId = request.headers.get('x-request-id');
  const requestId =
    incomingId && SAFE_REQUEST_ID.test(incomingId)
      ? incomingId
      : crypto.randomUUID();
  const context = { requestId, method: request.method, path: pathname };

  const reply = (response: NextResponse) => {
    response.headers.set('x-request-id', requestId);
    return response;
  };
  const forward = () => {
    const headers = new Headers(request.headers);
    headers.set('x-request-id', requestId);
    return reply(NextResponse.next({ request: { headers } }));
  };
  const refuse = (error: string, status: number, headers?: Record<string, string>) =>
    reply(NextResponse.json({ error }, { status, headers }));

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const limit = checkRateLimit(ip);
  if (!limit.allowed) {
    logger.warn('Rate limit exceeded', {
      ...context,
      retryAfterSeconds: limit.retryAfterSeconds,
    });
    return refuse('Too many requests', 429, {
      'Retry-After': String(limit.retryAfterSeconds),
    });
  }

  if (PUBLIC_API_PATHS.includes(pathname)) {
    return forward();
  }

  const authorization = request.headers.get('authorization');

  // Temporary escape hatch for legacy header auth (see lib/auth.ts)
  if (!authorization && process.env.ALLOW_LEGACY_TEST_USER_AUTH === 'true') {
    return forward();
  }

  const match = authorization ? /^Bearer\s+(.+)$/i.exec(authorization) : null;
  if (!match) {
    logger.info('Request without a bearer token', context);
    return refuse('Unauthorized', 401);
  }

  try {
    await verifyIdToken(match[1]);
    return forward();
  } catch (error) {
    logger.warn('Token rejected', {
      ...context,
      reason: error instanceof Error ? error.message : 'unknown',
    });
    return refuse('Unauthorized', 401);
  }
}

export const config = {
  matcher: '/api/:path*',
};
