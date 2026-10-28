import { NextRequest } from 'next/server';
import { prisma } from './prisma';
import { verifyIdToken } from './verifyAuth0Token';

// Auth0 session interface
interface Auth0Session {
  user?: {
    sub?: string;
    email?: string;
    name?: string;
    picture?: string;
    emailVerified?: boolean;
  };
}

// The legacy path trusts an identity header the client controls, so it is
// off unless explicitly enabled (temporary, for rolling out token auth).
function isLegacyTestAuthAllowed(): boolean {
  return process.env.ALLOW_LEGACY_TEST_USER_AUTH === 'true';
}

function getLegacyTestSession(request: NextRequest): Auth0Session | null {
  const timestamp = new Date().toISOString();
  const toSession = (raw: string): Auth0Session => {
    const userData = JSON.parse(raw);
    return {
      user: {
        sub: userData.sub || 'test-auth0-sub',
        email: userData.email || 'test@example.com',
        name: userData.name || 'Test User',
        picture: userData.picture || null,
      },
    };
  };

  const testUser = request.headers.get('x-test-user');
  if (testUser) {
    try {
      return toSession(testUser);
    } catch (parseError) {
      console.error(`[${timestamp}] Error parsing x-test-user header:`, parseError);
      return null;
    }
  }

  // SSE endpoints cannot set headers, so they pass the user as a query param
  const queryTestUser = new URL(request.url).searchParams.get('testUser');
  if (queryTestUser) {
    try {
      return toSession(decodeURIComponent(queryTestUser));
    } catch (parseError) {
      console.error(
        `[${timestamp}] Error parsing testUser query param:`,
        parseError,
      );
    }
  }

  return null;
}

// Helper function to get session from NextRequest
async function getAuth0Session(request: NextRequest): Promise<Auth0Session | null> {
  const authorization = request.headers.get('authorization');

  if (authorization) {
    // A presented token must verify; never fall back to the legacy path
    const match = /^Bearer\s+(.+)$/i.exec(authorization);
    if (!match) return null;

    try {
      const claims = await verifyIdToken(match[1]);
      return { user: claims };
    } catch (error) {
      console.warn(
        'Auth0 token verification failed:',
        error instanceof Error ? error.message : 'unknown error',
      );
      return null;
    }
  }

  return isLegacyTestAuthAllowed() ? getLegacyTestSession(request) : null;
}

/**
 * Verified token claims for the caller, without touching the database.
 * Used by the routes that create the user record on first login.
 */
export async function getVerifiedClaims(request: NextRequest) {
  const session = await getAuth0Session(request);
  const user = session?.user;
  return user?.sub
    ? {
        sub: user.sub,
        email: user.email ?? undefined,
        name: user.name ?? undefined,
        picture: user.picture ?? undefined,
        emailVerified: user.emailVerified === true,
      }
    : null;
}

export interface AuthUser {
  id: string;
  auth0Sub: string;
  email?: string | null;
  name?: string | null;
  picture?: string | null;
  // Only set when the login token says the email is verified
  verifiedEmail?: string | null;
  subscriptionPlan?: 'free' | 'plus';
  subscriptionStartDate?: Date | null;
  subscriptionEndDate?: Date | null;
  createdAt?: Date | null;
}

/**
 * Get the current authenticated user from Auth0 session
 * Note: User creation/update is handled by UserSetupHandler to avoid race conditions
 */
export async function getCurrentUser(
  request: NextRequest,
): Promise<AuthUser | null> {
  try {
    // Get Auth0 session
    const session = await getAuth0Session(request);

    if (!session?.user?.sub) {
      return null;
    }

    // Find user in database (don't create/update here to avoid race conditions)
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { auth0Sub: session.user.sub },
        select: {
          id: true,
          auth0Sub: true,
          email: true,
          name: true,
          picture: true,
          subscriptionPlan: true,
          subscriptionStartDate: true,
          subscriptionEndDate: true,
          createdAt: true,
        },
      });
    } catch (prismaError) {
      console.error('💥 PRISMA QUERY FAILED:', prismaError);
      console.error('Prisma error details:', {
        message:
          prismaError instanceof Error
            ? prismaError.message
            : 'Unknown prisma error',
        stack: prismaError instanceof Error ? prismaError.stack : undefined,
      });
      throw prismaError; // Re-throw to trigger outer catch
    }

    // For test users, create them if they don't exist
    if (
      !user &&
      (session.user.sub.includes('test') ||
        session.user.sub.includes('google-oauth2'))
    ) {
      try {
        user = await prisma.user.create({
          data: {
            auth0Sub: session.user.sub,
            email: session.user.email || 'test@example.com',
            name: session.user.name || 'Test User',
            picture: session.user.picture,
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
            createdAt: true,
          },
        });
      } catch (createError) {
        console.error('💥 USER CREATION FAILED:', createError);
        return null;
      }
    }

    if (!user) return user;

    const verifiedEmail =
      session.user.emailVerified === true ? (session.user.email ?? null) : null;
    return { ...user, verifiedEmail };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Get the current user and throw if not authenticated
 */
export async function requireAuth(request: NextRequest): Promise<AuthUser> {
  const user = await getCurrentUser(request);

  if (!user) {
    throw new Error('Authentication required');
  }

  return user;
}

/**
 * Assert that a user has access to a holiday through their account membership OR share membership
 * Returns a 403 response if access is denied, null if access is granted
 */
export async function assertHolidayAccess(
  holidayId: string,
  userId: string,
): Promise<Response | null> {
  try {
    // Check if user has access through account membership OR share membership
    const holiday = await prisma.holiday.findFirst({
      where: {
        id: holidayId,
        OR: [
          // Access through account membership (original logic)
          {
            account: {
              members: {
                some: {
                  userId: userId,
                },
              },
            },
          },
          // Access through share membership (new logic)
          // Note: Holiday has a one-to-one relationship with Share
          {
            shares: {
              members: {
                some: {
                  userId: userId,
                },
              },
            },
          },
          // Access as share owner (new logic)
          {
            shares: {
              ownerUserId: userId,
            },
          },
        ],
      },
      select: { id: true },
    });

    if (!holiday) {
      return new Response(JSON.stringify({ success: false, error: 'Forbidden' }), {
        status: 403,
      });
    }

    return null; // Access granted
  } catch (error) {
    console.error('Error checking holiday access:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500 },
    );
  }
}
