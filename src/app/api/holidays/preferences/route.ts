import { NextRequest } from "next/server";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { requireAccountAccess } from "@/lib/rbac";
import { toPlain } from "@/lib/json";
import { dateOnlyToUTC, toDateOnlyString } from "@/lib/dates";
import { ok, badRequest, serverError } from "@/lib/http";

// Validation schemas
const HolidayPreferenceSchema = z.object({
	holiday: z.string().min(1),
	budget: z.number().min(0).optional(),
	countdownTimer: z.string().datetime().optional(), // ISO datetime string
});

const SaveHolidayPreferencesSchema = z.object({
	accountId: z.string().min(1),
	preferences: z.array(HolidayPreferenceSchema).min(1),
});

// POST /api/holidays/preferences - Save holiday preferences
export async function POST(request: NextRequest) {
	try {
		const user = await requireAuth(request);
		// Parse and validate request body
		const body = await request.json();
		const validation = SaveHolidayPreferencesSchema.safeParse(body);

		if (!validation.success) {
			return badRequest(validation.error.issues);
		}

		const { accountId, preferences } = validation.data;

		// Check account access
		await requireAccountAccess(accountId, user.id);

		// Filter out wedding-related holidays to prevent them from being saved
		const validPreferences = preferences.filter((preference) => {
			const holidayType = preference.holiday.toLowerCase();
			return !holidayType.includes("wedding");
		});

		// Process preferences in a single transaction
		const results = await prisma.$transaction(async (tx) => {
			const holidayResults = [];

			for (const preference of validPreferences) {
				const { holiday: holidayType, budget, countdownTimer } = preference;

				// Find existing holiday or create new one
				let holiday = await tx.holiday.findFirst({
					where: {
						accountId,
						holidayType,
					},
				});

				if (holiday) {
					// Update existing holiday
					holiday = await tx.holiday.update({
						where: { id: holiday.id },
						data: {
							countdownTimer: countdownTimer ? new Date(countdownTimer) : null,
							updatedAt: new Date(),
						},
					});
				} else {
					// Create new holiday
					holiday = await tx.holiday.create({
						data: {
							id: uuidv4(),
							accountId,
							holidayType,
							name: holidayType,
							startDate: dateOnlyToUTC(new Date().toISOString().slice(0, 10)), // Default to today
							colorLight: "#3B82F6", // Default blue
							colorDark: "#1E40AF",
							isCustom: false,
							createdBy: user.id,
							countdownTimer: countdownTimer ? new Date(countdownTimer) : null,
						},
					});
				}

				let budgetResult = null;

				// Find existing budget or create new one if budget is provided
				if (budget !== undefined) {
					let existingBudget = await tx.budget.findFirst({
						where: {
							holidayId: holiday.id,
						},
					});

					if (existingBudget) {
						// Update existing budget
						budgetResult = await tx.budget.update({
							where: { id: existingBudget.id },
							data: {
								totalBudget: parseFloat(budget.toString()),
								remainingAmount: parseFloat(budget.toString()),
								updatedAt: new Date(),
							},
						});
					} else {
						// Create new budget
						budgetResult = await tx.budget.create({
							data: {
								id: uuidv4(),
								holidayId: holiday.id,
								name: `${holidayType} Budget`,
								totalBudget: parseFloat(budget.toString()),
								spentAmount: 0,
								remainingAmount: parseFloat(budget.toString()),
								currency: "USD",
								startDate: dateOnlyToUTC(new Date().toISOString().slice(0, 10)),
								endDate: dateOnlyToUTC(new Date().toISOString().slice(0, 10)),
								createdBy: user.id,
							},
						});
					}
				}

				holidayResults.push({
					holiday: {
						...holiday,
						startDate: toDateOnlyString(holiday.startDate),
						endDate: toDateOnlyString(holiday.endDate),
						countdownTimer: holiday.countdownTimer?.toISOString() || null,
					},
					budget: budgetResult
						? {
								...budgetResult,
								startDate: toDateOnlyString(budgetResult.startDate),
								endDate: toDateOnlyString(budgetResult.endDate),
						  }
						: null,
				});
			}

			return holidayResults;
		});

		return ok(toPlain(results));
	} catch (error) {
		console.error("Error saving holiday preferences:", error);
		return serverError("Failed to save holiday preferences");
	}
}
