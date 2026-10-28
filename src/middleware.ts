import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken } from '@/lib/verifyAuth0Token';

// Anonymous by design: browser performance beacons carry no user identity.
const PUBLIC_API_PATHS = ['/api/performance'];

/**
 * Deny-by-default gate for the API: every /api route needs a valid Auth0 ID
 * token unless listed above. Route handlers still resolve the user and check
 * ownership themselves; this only guarantees no route is reachable anonymously.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_API_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  const authorization = request.headers.get('authorization');

  // Temporary escape hatch for the legacy header auth (see lib/auth.ts)
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
