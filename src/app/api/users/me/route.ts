import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

/**
 * GET /api/users/me
 * Get the current authenticated user with their account relationships
 */
export async function GET(request: NextRequest) {
	try {
		const currentUser = await requireAuth(request);

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
			return Response.json({ error: "User not found" }, { status: 404 });
		}

		// Remove sensitive fields from response
		const { auth0Sub, ...userResponse } = user;
		return Response.json(userResponse);
	} catch (error) {
		console.error("Error fetching current user:", error);
		return Response.json(
			{ error: "Failed to fetch current user" },
			{ status: 500 }
		);
	}
}

/**
 * PUT /api/users/me
 * Update the current user's profile
 */
export async function PUT(request: NextRequest) {
	try {
		const currentUser = await requireAuth(request);
		const { name, picture } = await request.json();

		// Update user profile
		const updatedUser = await prisma.user.update({
			where: { id: currentUser.id },
			data: {
				name,
				picture,
				updatedAt: new Date(),
			},
		});

		// Remove sensitive fields from response
		const { auth0Sub, ...userResponse } = updatedUser;
		return Response.json(userResponse);
	} catch (error) {
		console.error("Error updating user profile:", error);
		return Response.json(
			{ error: "Failed to update user profile" },
			{ status: 500 }
		);
	}
}
