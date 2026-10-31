import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateClaims, forbiddenResponse } from '@/lib/routeAuth';
import { DEFAULT_USER_PREFERENCES } from '@/lib/constants/userPreferences';
import { logger } from '@/lib/logger';

/**
 * POST /api/users
 * Create or update a user (called during Auth0 login)
 */
export async function POST(request: NextRequest) {
  const auth = await authenticateClaims(request);
  if (auth.response) return auth.response;
  const { claims } = auth;

  const body = await request.json();

  // The record is always the caller's own. Identity, email and picture come
  // from the verified token; only the display name may come from the body.
  if (body.auth0Sub && body.auth0Sub !== claims.sub) {
    return forbiddenResponse();
  }
  const auth0Sub = claims.sub;
  const email = claims.email;
  const picture = claims.picture;
  const name = body.name ?? claims.name;

  try {
    // Use upsert to handle create/update atomically and avoid race conditions
    const user = await prisma.user.upsert({
      where: { auth0Sub },
      update: {
        email,
        picture,
        isInDb: true,
        updatedAt: new Date(),
        // Only update name if it's null/empty (preserve custom names)
        ...(name && { name }),
      },
      create: {
        auth0Sub,
        email,
        name,
        picture,
        isInDb: true,
        isFirstLogin: true,
      },
    });

    // Check if this is a new user and create default preferences
    const userPreferencesExist = await prisma.userPreferences.findUnique({
      where: { userId: user.id },
    });

    if (!userPreferencesExist) {
      await prisma.userPreferences.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          ...DEFAULT_USER_PREFERENCES,
        },
        update: {}, // No updates needed, just ensure it exists
      });
    }

    // Return user without sensitive fields
    const { auth0Sub: _, ...userResponse } = user;
    return Response.json(userResponse);
  } catch (error: any) {
    logger.error('Error creating/updating user:', error);

    // Handle the specific case where upsert fails due to concurrent requests
    if (error.code === 'P2002' && error.meta?.target?.includes('auth0_sub')) {
      try {
        const existingUser = await prisma.user.findUnique({
          where: { auth0Sub },
        });

        if (existingUser) {
          // Ensure preferences exist for this user as well
          const userPreferencesExist = await prisma.userPreferences.findUnique({
            where: { userId: existingUser.id },
          });

          if (!userPreferencesExist) {
            await prisma.userPreferences.upsert({
              where: { userId: existingUser.id },
              create: {
                userId: existingUser.id,
                ...DEFAULT_USER_PREFERENCES,
              },
              update: {}, // No updates needed, just ensure it exists
            });
          }

          const { auth0Sub: _, ...userResponse } = existingUser;
          return Response.json(userResponse);
        }
      } catch (findError) {
        logger.error(
          'Error finding existing user after constraint violation:',
          findError,
        );
      }
    }

    return Response.json(
      { error: 'Failed to create/update user', details: error.message },
      { status: 500 },
    );
  }
}
