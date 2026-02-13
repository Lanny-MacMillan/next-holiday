import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { DEFAULT_USER_PREFERENCES } from "@/lib/constants/userPreferences";

/**
 * GET /api/users
 * Get all users (for admin purposes or user listing)
 */
export async function GET(request: NextRequest) {
	try {
		const currentUser = await requireAuth(request);

		// For now, return all users (in production, you might want to restrict this)
		const users = await prisma.user.findMany({
			select: {
				id: true,
				email: true,
				name: true,
				picture: true,
				isInDb: true,
				isFirstLogin: true,
				createdAt: true,
				updatedAt: true,
				// Don't include auth0Sub for security
			},
		});

		return Response.json(users);
	} catch (error) {
		console.error("Error fetching users:", error);
		return Response.json({ error: "Failed to fetch users" }, { status: 500 });
	}
}

/**
 * POST /api/users
 * Create or update a user (called during Auth0 login)
 */
export async function POST(request: NextRequest) {
	const body = await request.json();
	console.log("Request body:", body);

	const { auth0Sub, email, name, picture } = body;

	try {
		console.log("POST /api/users called");

		if (!auth0Sub) {
			console.log("Missing auth0Sub");
			return Response.json({ error: "Auth0 sub is required" }, { status: 400 });
		}

		console.log("Creating/updating user with auth0Sub:", auth0Sub);

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
			console.log("Creating default user preferences for new user:", user.id);
			await prisma.userPreferences.upsert({
				where: { userId: user.id },
				create: {
					userId: user.id,
					...DEFAULT_USER_PREFERENCES,
				},
				update: {}, // No updates needed, just ensure it exists
			});
			console.log("Default user preferences created successfully");
		}

		console.log("User created/updated successfully:", user.id);

		// Return user without sensitive fields
		const { auth0Sub: _, ...userResponse } = user;
		return Response.json(userResponse);
	} catch (error: any) {
		console.error("Error creating/updating user:", error);

		// Handle the specific case where upsert fails due to concurrent requests
		if (error.code === "P2002" && error.meta?.target?.includes("auth0_sub")) {
			console.log("Concurrent user creation detected, fetching existing user");
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
						console.log("Creating missing default user preferences for:", existingUser.id);
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
				console.error("Error finding existing user after constraint violation:", findError);
			}
		}

		return Response.json(
			{ error: "Failed to create/update user", details: error.message },
			{ status: 500 }
		);
	}
}
