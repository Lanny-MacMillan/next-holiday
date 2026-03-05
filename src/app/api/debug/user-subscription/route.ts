import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/debug/user-subscription
 * Debug endpoint to check user subscription status in database
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const auth0Sub = searchParams.get('auth0Sub');

    if (!auth0Sub) {
      return NextResponse.json(
        { error: 'Missing required parameter: auth0Sub' },
        { status: 400 },
      );
    }

    // Find the user by Auth0 sub
    const user = await prisma.user.findUnique({
      where: { auth0Sub },
      select: {
        id: true,
        auth0Sub: true,
        email: true,
        name: true,
        subscriptionPlan: true,
        subscriptionStartDate: true,
        subscriptionEndDate: true,
        updatedAt: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Also get recent upgrade/downgrade history from audit logs if available
    // This would help track what happened

    return NextResponse.json({
      user,
      debugInfo: {
        timestamp: new Date().toISOString(),
        subscriptionActive: user.subscriptionPlan === 'plus',
        subscriptionExpired: user.subscriptionEndDate
          ? new Date(user.subscriptionEndDate) < new Date()
          : false,
      },
    });
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user debug info' },
      { status: 500 },
    );
  }
}
