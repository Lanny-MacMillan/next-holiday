import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/upgrade-user
 * Update user subscription status in the database
 */
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { userId, plan, auth0Sub } = body;

		// Validate required fields
		if ((!userId && !auth0Sub) || !plan) {
			return Response.json(
				{ error: "User identifier (userId or auth0Sub) and plan are required" },
				{ status: 400 }
			);
		}

		// Validate plan value
		if (!["free", "plus"].includes(plan)) {
			return Response.json(
				{ error: "Invalid plan. Must be 'free' or 'plus'" },
				{ status: 400 }
			);
		}

		// Find user by userId or auth0Sub
		let whereClause: any;
		if (userId) {
			whereClause = { id: userId };
		} else {
			whereClause = { auth0Sub: auth0Sub };
		}

		const user = await prisma.user.findUnique({
			where: whereClause,
		});

		if (!user) {
			return Response.json({ error: "User not found" }, { status: 404 });
		}

		// Calculate subscription dates for plus plan
		let subscriptionStartDate: Date | null = null;
		let subscriptionEndDate: Date | null = null;

		if (plan === "plus") {
			subscriptionStartDate = new Date();
			subscriptionEndDate = new Date();
			subscriptionEndDate.setFullYear(subscriptionEndDate.getFullYear() + 1); // 1 year subscription
		}

		// Update user subscription
		const updatedUser = await prisma.user.update({
			where: { id: user.id },
			data: {
				subscriptionPlan: plan,
				subscriptionStartDate: subscriptionStartDate,
				subscriptionEndDate: subscriptionEndDate,
				updatedAt: new Date(),
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
				updatedAt: true,
			},
		});

		return Response.json({
			success: true,
			user: updatedUser,
			message: `User successfully upgraded to ${plan} plan`,
		});
	} catch (error) {
		console.error("User upgrade error:", error);
		return Response.json(
			{ error: "Internal server error during user upgrade" },
			{ status: 500 }
		);
	}
}