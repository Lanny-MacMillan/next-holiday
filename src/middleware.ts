import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken } from '@/lib/verifyAuth0Token';

// Performance beacons are anonymous by design.
const PUBLIC_API_PATHS = ['/api/performance'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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
