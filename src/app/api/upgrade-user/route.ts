import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { paymentsProvider } from '@/lib/payments';

/**
 * POST /api/upgrade-user
 * Update user subscription status in the database
 */
export async function POST(request: NextRequest) {
  try {
    const authUser = await getCurrentUser(request);

    if (!authUser) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userId, plan, auth0Sub } = body;

    // Validate required fields
    if (!plan) {
      return Response.json({ error: 'plan is required' }, { status: 400 });
    }

    // Validate plan value
    if (!['free', 'plus'].includes(plan)) {
      return Response.json(
        { error: "Invalid plan. Must be 'free' or 'plus'" },
        { status: 400 },
      );
    }

    // With Stripe on, Plus is only granted by a paid checkout (the webhook), never by this route
    if (plan === 'plus' && paymentsProvider() === 'stripe') {
      return Response.json(
        { error: 'Upgrades are completed through checkout' },
        { status: 403 },
      );
    }

    // Users may only change their own plan
    if (
      (auth0Sub && auth0Sub !== authUser.auth0Sub) ||
      (userId && userId !== authUser.id)
    ) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const user = authUser;

    // Calculate subscription dates for plus plan
    let subscriptionStartDate: Date | null = null;
    let subscriptionEndDate: Date | null = null;

    if (plan === 'plus') {
      subscriptionStartDate = new Date();
      subscriptionEndDate = new Date();
      subscriptionEndDate.setFullYear(subscriptionEndDate.getFullYear() + 1); // 1 year subscription
    }

    // Update user subscription
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionPlan: plan,
        subscriptionStartDate: subscriptionStartDate,
        subscriptionEndDate: subscriptionEndDate,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        auth0Sub: true,
        email: true,
        name: true,
        picture: true,
        subscriptionPlan: true,
        subscriptionStartDate: true,
        subscriptionEndDate: true,
        updatedAt: true,
      },
    });

    return Response.json({
      success: true,
      user: updatedUser,
      message: `User successfully upgraded to ${plan} plan`,
    });
  } catch (error) {
    console.error('User upgrade error:', error);
    return Response.json(
      { error: 'Internal server error during user upgrade' },
      { status: 500 },
    );
  }
}
