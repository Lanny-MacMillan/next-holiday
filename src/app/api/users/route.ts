import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

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
	try {
		console.log("POST /api/users called");

		const body = await request.json();
		console.log("Request body:", body);

		const { auth0Sub, email, name, picture } = body;

		if (!auth0Sub) {
			console.log("Missing auth0Sub");
			return Response.json({ error: "Auth0 sub is required" }, { status: 400 });
		}

		console.log("Creating/updating user with auth0Sub:", auth0Sub);

		// Create or update user in database
		const user = await prisma.user.upsert({
			where: { auth0Sub },
			update: {
				email,
				name,
				picture,
				isInDb: true,
				updatedAt: new Date(),
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

		console.log("User created/updated successfully:", user.id);

		// Return user without sensitive fields
		const { auth0Sub: _, ...userResponse } = user;
		return Response.json(userResponse);
	} catch (error) {
		console.error("Error creating/updating user:", error);
		return Response.json(
			{ error: "Failed to create/update user", details: error.message },
			{ status: 500 }
		);
	}
}
