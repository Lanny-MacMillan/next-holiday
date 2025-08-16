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

		// First, try to find the user to see if they exist
		const existingUser = await prisma.user.findUnique({
			where: { auth0Sub },
		});

		let user;

		if (existingUser) {
			// User exists, update them
			console.log("User exists, updating...");
			user = await prisma.user.update({
				where: { auth0Sub },
				data: {
					email,
					name,
					picture,
					isInDb: true,
					updatedAt: new Date(),
				},
			});
		} else {
			// User doesn't exist, create them
			console.log("User doesn't exist, creating...");
			user = await prisma.user.create({
				data: {
					auth0Sub,
					email,
					name,
					picture,
					isInDb: true,
					isFirstLogin: true,
				},
			});

			// Create default user preferences for new user
			console.log("Creating default user preferences for new user:", user.id);
			await prisma.userPreferences.create({
				data: {
					userId: user.id,
					...DEFAULT_USER_PREFERENCES,
				},
			});
			console.log("Default user preferences created successfully");
		}

		console.log("User created/updated successfully:", user.id);

		// Return user without sensitive fields
		const { auth0Sub: _, ...userResponse } = user;
		return Response.json(userResponse);
	} catch (error: any) {
		console.error("Error creating/updating user:", error);

		// Handle unique constraint violation specifically
		if (error.code === "P2002" && error.meta?.target?.includes("auth0_sub")) {
			console.log(
				"Unique constraint violation on auth0_sub - user likely already exists"
			);
			// Try to find and return the existing user
			try {
				const existingUser = await prisma.user.findUnique({
					where: { auth0Sub: body.auth0Sub },
				});
				if (existingUser) {
					const { auth0Sub: _, ...userResponse } = existingUser;
					return Response.json(userResponse);
				}
			} catch (findError) {
				console.error("Error finding existing user:", findError);
			}
		}

		return Response.json(
			{ error: "Failed to create/update user", details: error.message },
			{ status: 500 }
		);
	}
}
