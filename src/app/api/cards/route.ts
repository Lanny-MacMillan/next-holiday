import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    // Get the verified Auth0 user from the request
    const authUser = await getCurrentUser(request);

    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 },
      );
    }

    // Get user from database
    const dbUser = await prisma.user.findUnique({
      where: { auth0Sub: authUser.auth0Sub },
    });

    if (!dbUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 },
      );
    }

    // Find user's account
    const account = await prisma.account.findFirst({
      where: {
        members: {
          some: {
            userId: dbUser.id,
          },
        },
      },
    });

    if (!account) {
      return NextResponse.json(
        { success: false, error: 'Account not found' },
        { status: 404 },
      );
    }

    // Get all holidays for this account
    const holidays = await prisma.holiday.findMany({
      where: { accountId: account.id },
    });

    // Get all cards for all holidays of this user
    const cards = await prisma.card.findMany({
      where: {
        holidayId: {
          in: holidays.map(holiday => holiday.id),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: cards,
    });
  } catch (error) {
    logger.error('Error fetching cards:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}
