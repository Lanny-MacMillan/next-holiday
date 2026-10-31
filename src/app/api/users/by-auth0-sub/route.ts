import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticate, claimsOtherUser, forbiddenResponse } from '@/lib/routeAuth';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request);
    if (auth.response) return auth.response;

    // Callers may only look themselves up
    const { searchParams } = new URL(request.url);
    if (claimsOtherUser(auth.user, searchParams.get('sub'))) {
      return forbiddenResponse();
    }
    const auth0Sub = auth.user.auth0Sub;

    // Find user by Auth0 subject ID
    const user = await prisma.user.findUnique({
      where: { auth0Sub },
      select: {
        id: true,
        auth0Sub: true,
        email: true,
        name: true,
        picture: true,
        subscriptionPlan: true,
        subscriptionStartDate: true,
        subscriptionEndDate: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    logger.error('Error fetching user by Auth0 sub:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
