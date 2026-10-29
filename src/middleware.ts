import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken } from '@/lib/verifyAuth0Token';
import { checkRateLimit } from '@/lib/rateLimit';

// Performance beacons and the health check are anonymous by design; Stripe's webhook
// proves who it is with a signature instead of a token.
const PUBLIC_API_PATHS = ['/api/performance', '/api/health', '/api/billing/webhook'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const limit = checkRateLimit(ip);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } },
    );
  }

  if (PUBLIC_API_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  const authorization = request.headers.get('authorization');

  // Temporary escape hatch for legacy header auth (see lib/auth.ts)
  if (!authorization && process.env.ALLOW_LEGACY_TEST_USER_AUTH === 'true') {
    return NextResponse.next();
  }

  const match = authorization ? /^Bearer\s+(.+)$/i.exec(authorization) : null;
  if (!match) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await verifyIdToken(match[1]);
    return NextResponse.next();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export const config = {
  matcher: '/api/:path*',
};
