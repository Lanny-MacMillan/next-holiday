import { NextRequest } from "next/server";
import { prisma } from "./prisma";

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
async function getAuth0Session(
	request: NextRequest
): Promise<Auth0Session | null> {
	try {
		// In Next.js 15, we need to handle the session differently
		// For now, we'll mock this for the API scaffold
		// In a real implementation, you'd use the proper Auth0 session handling
		// Example: return await getSession(request, { sessionCache: new Map() });
		return null;
	} catch (error) {
		console.error("Error getting Auth0 session:", error);
		return null;
	}
}

export interface AuthUser {
	id: string;
	auth0Sub: string;
	email?: string | null;
	name?: string | null;
	picture?: string | null;
}

/**
 * Get the current authenticated user from Auth0 session
 */
export async function getCurrentUser(
	request: NextRequest
): Promise<AuthUser | null> {
	try {
		// Get Auth0 session
		const session = await getAuth0Session(request);

		if (!session?.user?.sub) {
			return null;
		}

		// Find or create user in database
		const user = await prisma.user.upsert({
			where: { auth0Sub: session.user.sub },
			update: {
				email: session.user.email,
				name: session.user.name,
				picture: session.user.picture,
				isInDb: true,
				updatedAt: new Date(),
			},
			create: {
				auth0Sub: session.user.sub,
				email: session.user.email,
				name: session.user.name,
				picture: session.user.picture,
				isInDb: true,
				isFirstLogin: true,
			},
		});

		return user;
	} catch (error) {
		console.error("Error getting current user:", error);
		return null;
	}
}

/**
 * Get the current user and throw if not authenticated
 */
export async function requireAuth(request: NextRequest): Promise<AuthUser> {
	const user = await getCurrentUser(request);

	if (!user) {
		throw new Error("Authentication required");
	}

	return user;
}

/**
 * Get user by Auth0 sub
 */
export async function getUserByAuth0Sub(
	auth0Sub: string
): Promise<AuthUser | null> {
	try {
		return await prisma.user.findUnique({
			where: { auth0Sub },
		});
	} catch (error) {
		console.error("Error getting user by Auth0 sub:", error);
		return null;
	}
}
