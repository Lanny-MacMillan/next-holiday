import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

/**
 * GET /api/users/me/preferences
 * Get the current user's preferences
 */
export async function GET(request: NextRequest) {
	try {
		const currentUser = await requireAuth(request);

		// Get user preferences, create default if they don't exist
		let preferences = await prisma.userPreferences.findUnique({
			where: { userId: currentUser.id },
		});

		// If no preferences exist, create default ones
		if (!preferences) {
			preferences = await prisma.userPreferences.create({
				data: {
					userId: currentUser.id,
					// All fields will use their default values from the schema
				},
			});
		}

		return Response.json(preferences);
	} catch (error) {
		console.error("Error fetching user preferences:", error);
		return Response.json(
			{ error: "Failed to fetch user preferences" },
			{ status: 500 }
		);
	}
}

/**
 * PUT /api/users/me/preferences
 * Update the current user's preferences
 */
export async function PUT(request: NextRequest) {
	try {
		const currentUser = await requireAuth(request);
		const updateData = await request.json();

		// Validate the update data
		const allowedFields = [
			"theme",
			"displayMode",
			"showCompletedItems",
			"showCountdown",
			"showProgressBars",
			"emailNotifications",
			"pushNotifications",
			"reminderNotifications",
			"taskDueReminders",
			"holidayCountdownAlerts",
			"timezone",
			"locale",
			"reducedMotion",
			"highContrast",
			"fontSize",
		];

		// Filter out any fields that aren't allowed
		const filteredData = Object.keys(updateData)
			.filter((key) => allowedFields.includes(key))
			.reduce((obj, key) => {
				obj[key] = updateData[key];
				return obj;
			}, {} as any);

		// Add updatedAt timestamp
		filteredData.updatedAt = new Date();

		// Upsert preferences (create if they don't exist, update if they do)
		const updatedPreferences = await prisma.userPreferences.upsert({
			where: { userId: currentUser.id },
			update: filteredData,
			create: {
				userId: currentUser.id,
				...filteredData,
			},
		});

		return Response.json(updatedPreferences);
	} catch (error) {
		console.error("Error updating user preferences:", error);
		return Response.json(
			{ error: "Failed to update user preferences" },
			{ status: 500 }
		);
	}
}
