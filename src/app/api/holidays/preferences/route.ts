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
	preferences: z.array(HolidayPreferenceSchema),
});

// GET /api/holidays/preferences - Get holiday preferences for an account
export async function GET(request: NextRequest) {
	try {
		const user = await requireAuth(request);
		const { searchParams } = new URL(request.url);
		const accountId = searchParams.get("accountId");

		if (!accountId) {
			return badRequest("accountId is required");
		}

		// Check account access
		await requireAccountAccess(accountId, user.id);

		// Get current holidays with budgets for this account
		const holidays = await prisma.holiday.findMany({
			where: { accountId },
			include: {
				budgets: true,
			},
			orderBy: {
				holidayType: "asc",
			},
		});

		// Transform to preferences format
		const preferences = holidays.map((holiday) => ({
			holiday: holiday.holidayType,
			holidayId: holiday.id,
			budget: holiday.budgets[0]?.totalBudget
				? parseFloat(holiday.budgets[0].totalBudget.toString())
				: undefined,
			countdownTimer: holiday.countdownTimer?.toISOString(),
		}));

		return ok(toPlain(preferences));
	} catch (error) {
		console.error("Error fetching holiday preferences:", error);
		return serverError("Failed to fetch holiday preferences");
	}
}

// POST /api/holidays/preferences - Save holiday preferences
export async function POST(request: NextRequest) {
	try {
		const user = await requireAuth(request);
		// Parse and validate request body
		const body = await request.json();
		console.log("Received body:", JSON.stringify(body, null, 2));
		const validation = SaveHolidayPreferencesSchema.safeParse(body);

		if (!validation.success) {
			console.log("Validation failed:", validation.error.issues);
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

		// Process preferences in a single transaction with increased timeout
		const results = await prisma.$transaction(
			async (tx) => {
				// Get current holidays for this account with budgets in one query
				const currentHolidays = await tx.holiday.findMany({
					where: { accountId },
					include: {
						budgets: true,
					},
				});

				// Create maps for efficient lookup
				const currentHolidayMap = new Map(
					currentHolidays.map((h) => [h.holidayType, h])
				);
				const newHolidayTypes = new Set(validPreferences.map((p) => p.holiday));

				// Find holidays to remove (in current but not in new preferences)
				const holidaysToRemove = currentHolidays.filter(
					(h) => !newHolidayTypes.has(h.holidayType)
				);

				// Batch delete holidays that are no longer selected
				if (holidaysToRemove.length > 0) {
					await tx.holiday.deleteMany({
						where: {
							id: {
								in: holidaysToRemove.map((h) => h.id),
							},
						},
					});
				}

				const holidayResults = [];

				// Process each preference
				for (const preference of validPreferences) {
					const { holiday: holidayType, budget, countdownTimer } = preference;

					// Check if holiday already exists
					let holiday = currentHolidayMap.get(holidayType);

					if (holiday) {
						// Update existing holiday
						holiday = await tx.holiday.update({
							where: { id: holiday.id },
							data: {
								countdownTimer: countdownTimer
									? new Date(countdownTimer)
									: null,
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
								countdownTimer: countdownTimer
									? new Date(countdownTimer)
									: null,
							},
						});
					}

					let budgetResult = null;

					// Handle budget operations
					if (budget !== undefined) {
						// Check if budget already exists from the initial query
						const existingBudget = holiday.budgets?.[0];

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
									startDate: dateOnlyToUTC(
										new Date().toISOString().slice(0, 10)
									),
									endDate: dateOnlyToUTC(new Date().toISOString().slice(0, 10)),
									createdBy: user.id,
								},
							});
						}
					} else {
						// If no budget is provided, remove any existing budget for this holiday
						const existingBudget = holiday.budgets?.[0];
						if (existingBudget) {
							await tx.budget.delete({
								where: { id: existingBudget.id },
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
			},
			{
				maxWait: 10000, // 10 seconds
				timeout: 30000, // 30 seconds
			}
		);

		return ok(toPlain(results));
	} catch (error) {
		console.error("Error saving holiday preferences:", error);
		if (error instanceof Error) {
			return serverError(error.message);
		}
		return serverError("Failed to save holiday preferences");
	}
}
