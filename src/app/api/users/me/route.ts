import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticate, claimsOtherUser, forbiddenResponse } from '@/lib/routeAuth';
import { logger } from '@/lib/logger';

/**
 * GET /api/users/me
 * Get the current authenticated user with their account relationships
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request);
    if (auth.response) return auth.response;

    // Only the caller's own profile is ever returned
    const url = new URL(request.url);
    const claimed =
      url.searchParams.get('auth0Sub') || request.headers.get('x-auth0-sub');
    if (claimsOtherUser(auth.user, claimed)) return forbiddenResponse();
    const auth0SubParam = auth.user.auth0Sub;

    // Find user by auth0Sub
    const currentUser = await prisma.user.findUnique({
      where: { auth0Sub: auth0SubParam },
    });

    if (!currentUser) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user with account relationships and preferences
    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
      include: {
        preferences: true,
        ownedAccounts: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    name: true,
                    picture: true,
                  },
                },
              },
            },
          },
        },
        accountMembers: {
          include: {
            account: {
              include: {
                owner: {
                  select: {
                    id: true,
                    email: true,
                    name: true,
                    picture: true,
                  },
                },
                members: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        email: true,
                        name: true,
                        picture: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    // Remove sensitive fields from response
    const { auth0Sub: _, ...userResponse } = user;
    return Response.json(userResponse);
  } catch (error) {
    logger.error('Error fetching current user:', error);
    return Response.json({ error: 'Failed to fetch current user' }, { status: 500 });
  }
}

/**
 * PUT /api/users/me
 * Update the current user's profile
 */
export async function PUT(request: NextRequest) {
  try {
    const auth = await authenticate(request);
    if (auth.response) return auth.response;

    const { name, picture, auth0Sub: claimedSub } = await request.json();
    if (claimsOtherUser(auth.user, claimedSub)) return forbiddenResponse();
    const auth0Sub = auth.user.auth0Sub;

    // Update user profile using auth0Sub
    const updatedUser = await prisma.user.update({
      where: { auth0Sub },
      data: {
        name,
        picture,
        updatedAt: new Date(),
      },
    });

    // Remove sensitive fields from response
    const { auth0Sub: _, ...userResponse } = updatedUser;
    return Response.json(userResponse);
  } catch (error) {
    logger.error('Error updating user profile:', error);
    return Response.json(
      { error: 'Failed to update user profile' },
      { status: 500 },
    );
  }
}
