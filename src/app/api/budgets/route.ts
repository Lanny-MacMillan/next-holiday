import { NextRequest } from "next/server";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireAuth } from "@/lib/auth";
import { requireAccountAccess } from "@/lib/rbac";
import { toPlain } from "@/lib/json";
import { dateOnlyToUTC, toDateOnlyString } from "@/lib/dates";
import { ok, created, badRequest, notFound, serverError } from "@/lib/http";

// Validation schemas
const CreateBudgetSchema = z.object({
	holidayId: z.string().min(1),
	name: z.string().min(1).max(100),
	totalBudget: z.string().regex(/^\d+(\.\d{1,2})?$/), // Decimal string
	currency: z.string().min(1).max(10),
	startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD format
	endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD format
});

// Validation schema
const FetchBudgetsSchema = z.object({
	holidayIds: z.array(z.string().min(1)),
});

// GET /api/budgets - List budgets
export async function GET(request: NextRequest) {
	try {
		const user = await requireAuth(request);

		// Get budgets with account access check
		const budgets = await prisma.budget.findMany({
			where: {
				holiday: {
					account: {
						members: {
							some: {
								userId: user.id,
							},
						},
					},
				},
			},
			include: {
				holiday: {
					select: {
						id: true,
						name: true,
						holidayType: true,
					},
				},
				creator: {
					select: {
						id: true,
						name: true,
						email: true,
					},
				},
				_count: {
					select: {
						transactions: true,
					},
				},
			},
			orderBy: { createdAt: "desc" },
		});

		// Transform date fields to strings for API response
		const transformedBudgets = budgets.map((budget) => ({
			...budget,
			startDate: toDateOnlyString(budget.startDate),
			endDate: toDateOnlyString(budget.endDate),
		}));

		return ok(toPlain(transformedBudgets));
	} catch (error) {
		console.error("Error fetching budgets:", error);
		return serverError("Failed to fetch budgets");
	}
}

// POST /api/budgets - Handle both creating and fetching budgets
export async function POST(request: NextRequest) {
	try {
		const user = await requireAuth(request);
		const body = await request.json();

		// Check if this is a fetch request (has holidayIds array)
		if (body.holidayIds && Array.isArray(body.holidayIds)) {
			// This is a fetch request
			const validation = FetchBudgetsSchema.safeParse(body);

			if (!validation.success) {
				return badRequest(validation.error.issues);
			}

			const { holidayIds } = validation.data;

			// Fetch budgets with transactions for spent amount calculation
			const budgets = await prisma.budget.findMany({
				where: {
					holidayId: {
						in: holidayIds,
					},
				},
				include: {
					transactions: true,
				},
			});

			// Transform to match our Budget interface
			const transformedBudgets = budgets.map((budget) => {
				// Calculate spent amount from transactions
				const spentAmount = budget.transactions.reduce(
					(sum, transaction) => sum + parseFloat(transaction.amount.toString()),
					0
				);

				return {
					holidayId: budget.holidayId,
					targetAmount: parseFloat(budget.totalBudget.toString()),
					spentAmount,
					updatedAt: budget.updatedAt.toISOString(),
				};
			});

			return ok(transformedBudgets);
		} else {
			// This is a create request
			const validation = CreateBudgetSchema.safeParse(body);

			if (!validation.success) {
				return badRequest(validation.error.issues);
			}

			const { holidayId, totalBudget, startDate, endDate, ...data } =
				validation.data;

			// Get holiday to check account access
			const holiday = await prisma.holiday.findUnique({
				where: { id: holidayId },
				select: { accountId: true },
			});

			if (!holiday) {
				return notFound("Holiday not found");
			}

			// Check account access
			await requireAccountAccess(holiday.accountId, user.id);

			// Create budget
			const budget = await prisma.budget.create({
				data: {
					id: uuidv4(),
					holidayId,
					totalBudget: parseFloat(totalBudget),
					spentAmount: 0,
					remainingAmount: parseFloat(totalBudget),
					startDate: dateOnlyToUTC(startDate),
					endDate: dateOnlyToUTC(endDate),
					createdBy: user.id,
					...data,
				},
				include: {
					holiday: {
						select: {
							id: true,
							name: true,
							holidayType: true,
						},
					},
					creator: {
						select: {
							id: true,
							name: true,
							email: true,
						},
					},
				},
			});

			// Transform date fields to strings for API response
			const transformedBudget = {
				...budget,
				startDate: toDateOnlyString(budget.startDate),
				endDate: toDateOnlyString(budget.endDate),
			};

			return created(toPlain(transformedBudget));
		}
	} catch (error) {
		console.error("Error in budgets API:", error);
		return serverError("Failed to process budget request");
	}
}
