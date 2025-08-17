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
const CreateBudgetTransactionSchema = z.object({
	budgetId: z.string().min(1),
	name: z.string().min(1).max(100),
	description: z.string().optional(),
	amount: z.string().regex(/^\d+(\.\d{1,2})?$/), // Decimal string
	category: z.string().min(1).max(50),
	transactionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD format
	isExpense: z.boolean().default(true),
});

// GET /api/budget-transactions - List budget transactions
export async function GET(request: NextRequest) {
	try {
		const user = await requireAuth(request);

		// Get budget transactions with account access check
		const transactions = await prisma.budgetTransaction.findMany({
			where: {
				budget: {
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
			},
			include: {
				budget: {
					select: {
						id: true,
						name: true,
						currency: true,
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
			orderBy: { transactionDate: "desc" },
		});

		// Transform date fields to strings for API response
		const transformedTransactions = transactions.map((transaction) => ({
			...transaction,
			transactionDate: toDateOnlyString(transaction.transactionDate),
		}));

		return ok(toPlain(transformedTransactions));
	} catch (error) {
		console.error("Error fetching budget transactions:", error);
		return serverError("Failed to fetch budget transactions");
	}
}

// POST /api/budget-transactions - Create new budget transaction
export async function POST(request: NextRequest) {
	try {
		const user = await requireAuth(request);

		// Parse and validate request body
		const body = await request.json();
		const validation = CreateBudgetTransactionSchema.safeParse(body);

		if (!validation.success) {
			return badRequest(validation.error.issues);
		}

		const { budgetId, amount, transactionDate, ...data } = validation.data;

		// Get budget to check account access
		const budget = await prisma.budget.findUnique({
			where: { id: budgetId },
			select: {
				holiday: {
					select: {
						accountId: true,
					},
				},
				spentAmount: true,
				totalBudget: true,
			},
		});

		if (!budget) {
			return notFound("Budget not found");
		}

		// Check account access
		await requireAccountAccess(budget.holiday.accountId, user.id);

		// Calculate new spent amount
		const amountValue = parseFloat(amount);
		const newSpentAmount = budget.spentAmount.plus(amountValue);
		const newRemainingAmount = budget.totalBudget.minus(newSpentAmount);

		// Create transaction and update budget in a transaction
		const [transaction] = await prisma.$transaction([
			prisma.budgetTransaction.create({
				data: {
					id: uuidv4(),
					budgetId,
					amount: amountValue,
					transactionDate: dateOnlyToUTC(transactionDate),
					createdBy: user.id,
					...data,
				},
				include: {
					budget: {
						select: {
							id: true,
							name: true,
							currency: true,
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
			}),
			prisma.budget.update({
				where: { id: budgetId },
				data: {
					spentAmount: newSpentAmount,
					remainingAmount: newRemainingAmount,
				},
			}),
		]);

		// Transform date fields to strings for API response
		const transformedTransaction = {
			...transaction,
			transactionDate: toDateOnlyString(transaction.transactionDate),
		};

		return created(toPlain(transformedTransaction));
	} catch (error) {
		console.error("Error creating budget transaction:", error);
		return serverError("Failed to create budget transaction");
	}
}
