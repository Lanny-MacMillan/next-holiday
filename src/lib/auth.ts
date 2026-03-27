import { NextRequest } from 'next/server';
import { prisma } from './prisma';

// Auth0 session interface
interface Auth0Session {
  user?: {
    sub?: string;
    email?: string;
    name?: string;
    picture?: string;
  };
}

// Helper function to get session from NextRequest
async function getAuth0Session(request: NextRequest): Promise<Auth0Session | null> {
  try {
    // For testing purposes, we'll check for a test user header
    // In production, this would use proper Auth0 session handling
    const testUser = request.headers.get('x-test-user');

    if (testUser) {
      // Parse test user data from header
      const userData = JSON.parse(testUser);
      return {
        user: {
          sub: userData.sub || 'test-auth0-sub',
          email: userData.email || 'test@example.com',
          name: userData.name || 'Test User',
          picture: userData.picture || null,
        },
      };
    }

    // Also check for test user data in query parameters (for SSE endpoints)
    const url = new URL(request.url);
    const queryTestUser = url.searchParams.get('testUser');

    if (queryTestUser) {
      try {
        const userData = JSON.parse(decodeURIComponent(queryTestUser));
        return {
          user: {
            sub: userData.sub || 'test-auth0-sub',
            email: userData.email || 'test@example.com',
            name: userData.name || 'Test User',
            picture: userData.picture || null,
          },
        };
      } catch (parseError) {
        console.error('Error parsing test user from query params:', parseError);
      }
    }

    // For now, return null (no session)
    // TODO: Implement proper Auth0 session handling for Next.js 15
    // This will be handled by the frontend calling the API with user data
    return null;
  } catch (error) {
    console.error('Error getting Auth0 session:', error);
    return null;
  }
}

export interface AuthUser {
  id: string;
  auth0Sub: string;
  email?: string | null;
  name?: string | null;
  picture?: string | null;
  subscriptionPlan?: 'free' | 'plus';
  subscriptionStartDate?: Date | null;
  subscriptionEndDate?: Date | null;
  createdAt?: Date | null;
}

/**
 * Get the current authenticated user from Auth0 session
 * Note: User creation/update is handled by UserSync component to avoid race conditions
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
    const user = await prisma.user.findUnique({
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

    return user;
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
 * Get user by Auth0 sub
 */
export async function getUserByAuth0Sub(auth0Sub: string): Promise<AuthUser | null> {
  try {
    return await prisma.user.findUnique({
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
        createdAt: true,
      },
    });
  } catch (error) {
    console.error('Error getting user by Auth0 sub:', error);
    return null;
  }
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
