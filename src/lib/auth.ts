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
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] 🔐 getAuth0Session called`);

  try {
    // TODO: Implement proper Auth0 session reading for Next.js 15 App Router
    // For now, use the fallback method that works
    console.log(
      `[${timestamp}] 🔄 Using fallback URL parameter method (TODO: implement proper Auth0 session)...`,
    );

    // For testing purposes, we'll check for a test user header
    // In production, this would use proper Auth0 session handling
    const testUser = request.headers.get('x-test-user');
    console.log(
      `[${timestamp}] 🔍 x-test-user header:`,
      testUser ? 'FOUND' : 'NOT FOUND',
    );

    if (testUser) {
      console.log(`[${timestamp}] 📝 Parsing test user from header...`);
      // Parse test user data from header
      const userData = JSON.parse(testUser);
      console.log(`[${timestamp}] ✅ Header test user parsed successfully:`, {
        sub: userData.sub,
        email: userData.email,
        name: userData.name,
      });
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
    console.log(
      `[${timestamp}] 🔍 testUser query param:`,
      queryTestUser ? 'FOUND' : 'NOT FOUND',
    );

    if (queryTestUser) {
      console.log(
        `[${timestamp}] 🔍 Raw testUser param length:`,
        queryTestUser.length,
      );
      console.log(
        `[${timestamp}] 🔍 Raw testUser param (first 100 chars):`,
        queryTestUser.substring(0, 100),
      );

      try {
        console.log(
          `[${timestamp}] 📝 Decoding and parsing test user from query params...`,
        );
        const decoded = decodeURIComponent(queryTestUser);
        console.log(`[${timestamp}] 📝 Decoded length:`, decoded.length);
        console.log(
          `[${timestamp}] 📝 Decoded (first 200 chars):`,
          decoded.substring(0, 200),
        );

        const userData = JSON.parse(decoded);
        console.log(`[${timestamp}] ✅ Query test user parsed successfully:`, {
          sub: userData.sub,
          email: userData.email,
          name: userData.name,
        });

        return {
          user: {
            sub: userData.sub || 'test-auth0-sub',
            email: userData.email || 'test@example.com',
            name: userData.name || 'Test User',
            picture: userData.picture || null,
          },
        };
      } catch (parseError) {
        console.error(
          `[${timestamp}] ❌ Error parsing test user from query params:`,
          parseError,
        );
        console.error(`[${timestamp}] ❌ Parse error details:`, {
          message:
            parseError instanceof Error ? parseError.message : 'Unknown error',
          stack: parseError instanceof Error ? parseError.stack : undefined,
          rawParam: queryTestUser.substring(0, 200),
        });
      }
    }

    console.log(`[${timestamp}] ❌ No test user found in headers or query params`);
    console.log(`[${timestamp}] 🔍 Request URL:`, request.url);
    console.log(
      `[${timestamp}] 🔍 Available headers:`,
      Object.fromEntries(request.headers.entries()),
    );

    // For now, return null (no session)
    // TODO: Implement proper Auth0 session handling for Next.js 15
    // This will be handled by the frontend calling the API with user data
    return null;
  } catch (error) {
    console.error(`[${timestamp}] 💥 Error getting Auth0 session:`, error);
    console.error(
      `[${timestamp}] 💥 Auth session error stack:`,
      error instanceof Error ? error.stack : 'No stack trace',
    );
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
  console.log('🔑 getCurrentUser function called');

  try {
    // Get Auth0 session
    const session = await getAuth0Session(request);

    if (!session?.user?.sub) {
      console.log('No Auth0 session found');
      return null;
    }

    console.log(`Attempting to find user with auth0Sub: ${session.user.sub}`);

    // Find user in database (don't create/update here to avoid race conditions)
    let user;
    try {
      console.log('🔍 Starting Prisma query...');
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
      console.log(
        '✅ Prisma query completed',
        user ? 'USER FOUND' : 'USER NOT FOUND',
      );
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
      console.log(`🆕 Creating test/demo user for auth0Sub: ${session.user.sub}`);
      try {
        user = await prisma.user.create({
          data: {
            auth0Sub: session.user.sub,
            email: session.user.email || 'test@example.com',
            name: session.user.name || 'Test User',
            picture: session.user.picture,
            subscriptionPlan: 'plus', // Give test users premium access
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
        console.log(`✅ Successfully created user: ${user.id}`);
      } catch (createError) {
        console.error('💥 USER CREATION FAILED:', createError);
        return null;
      }
    }

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
