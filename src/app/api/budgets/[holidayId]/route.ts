import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { ok, badRequest, serverError, notFound } from "@/lib/http";

// Validation schema
const UpdateBudgetSchema = z.object({
	targetAmount: z.number().min(0),
});

// PUT /api/budgets/[holidayId] - Update budget for a specific holiday
export async function PUT(
	request: NextRequest,
	{ params }: { params: { holidayId: string } }
) {
	try {
		const user = await requireAuth(request);
		const body = await request.json();
		const validation = UpdateBudgetSchema.safeParse(body);

		if (!validation.success) {
			return badRequest(validation.error.issues);
		}

		const { targetAmount } = validation.data;
		const { holidayId } = params;

		// Find existing budget
		const existingBudget = await prisma.budget.findFirst({
			where: {
				holidayId,
			},
			include: {
				transactions: true,
			},
		});

		if (!existingBudget) {
			return notFound("Budget not found");
		}

		// Update budget
		const updatedBudget = await prisma.budget.update({
			where: {
				id: existingBudget.id,
			},
			data: {
				totalBudget: targetAmount,
				remainingAmount:
					targetAmount - parseFloat(existingBudget.spentAmount.toString()),
				updatedAt: new Date(),
			},
			include: {
				transactions: true,
			},
		});

		// Calculate spent amount from transactions
		const spentAmount = updatedBudget.transactions.reduce(
			(sum, transaction) => sum + parseFloat(transaction.amount.toString()),
			0
		);

		// Transform to match our Budget interface
		const transformedBudget = {
			holidayId: updatedBudget.holidayId,
			targetAmount: parseFloat(updatedBudget.totalBudget.toString()),
			spentAmount,
			updatedAt: updatedBudget.updatedAt.toISOString(),
		};

		return ok(transformedBudget);
	} catch (error) {
		console.error("Error updating budget:", error);
		return serverError("Failed to update budget");
	}
}
