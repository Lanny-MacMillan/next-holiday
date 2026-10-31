import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticate, claimsOtherUser, forbiddenResponse } from '@/lib/routeAuth';
import { cleanupSharesOnDowngrade } from '@/lib/server/subscriptionCleanup';
import { logger } from '@/lib/logger';

/**
 * POST /api/users/cancel-subscription-cleanup
 * Handle sharing cleanup when a user cancels their subscription
 * 1. Remove user from shared holidays they don't own (leave shares)
 * 2. Remove other users from shared holidays they own (retain their data)
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticate(request);
    if (auth.response) return auth.response;

    // A user may only run this cleanup for their own account
    const body = await request.json();
    if (claimsOtherUser(auth.user, body.auth0Sub)) return forbiddenResponse();
    const auth0Sub = auth.user.auth0Sub;

    // Find the user by Auth0 sub
    const user = await prisma.user.findUnique({
      where: { auth0Sub },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const cleanup = await cleanupSharesOnDowngrade(user.id);

    return NextResponse.json({
      success: true,
      message: 'Subscription cleanup completed',
      cleanup,
    });
  } catch (error) {
    logger.error('Error in subscription cleanup:', error);
    return NextResponse.json(
      { error: 'Failed to process subscription cleanup' },
      { status: 500 },
    );
  }
}
