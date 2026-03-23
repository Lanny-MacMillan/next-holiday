import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const auth0Sub = searchParams.get('sub');

    if (!auth0Sub) {
      return NextResponse.json(
        { error: 'Auth0 subject ID is required' },
        { status: 400 },
      );
    }

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
    console.error('Error fetching user by Auth0 sub:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
