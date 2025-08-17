import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { requireAccountAccess } from "@/lib/rbac";
import { toPlain } from "@/lib/json";
import { ok, badRequest, serverError, notFound } from "@/lib/http";

// Validation schemas
const UpdateCountdownSchema = z.object({
	countdownTimer: z.string().datetime().nullable(), // ISO datetime string or null
});

// PUT /api/holidays/[id]/countdown - Update countdown timer for a specific holiday
export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const user = await requireAuth(request);
		const { id: holidayId } = await params;

		// Parse and validate request body
		const body = await request.json();
		const validation = UpdateCountdownSchema.safeParse(body);

		if (!validation.success) {
			return badRequest(validation.error.issues);
		}

		const { countdownTimer } = validation.data;

		// Find the holiday and check access
		const holiday = await prisma.holiday.findUnique({
			where: { id: holidayId },
			include: {
				account: true,
			},
		});

		if (!holiday) {
			return notFound("Holiday not found");
		}

		// Check account access
		await requireAccountAccess(holiday.accountId, user.id);

		// Update the countdown timer
		const updatedHoliday = await prisma.holiday.update({
			where: { id: holidayId },
			data: {
				countdownTimer: countdownTimer ? new Date(countdownTimer) : null,
				updatedAt: new Date(),
			},
			include: {
				budgets: true,
			},
		});

		// Transform to preferences format for consistency
		const result = {
			holiday: {
				...updatedHoliday,
				startDate: updatedHoliday.startDate.toISOString().slice(0, 10),
				endDate: updatedHoliday.endDate?.toISOString().slice(0, 10),
				countdownTimer: updatedHoliday.countdownTimer?.toISOString() || null,
			},
			budget: updatedHoliday.budgets[0]
				? {
						...updatedHoliday.budgets[0],
						startDate: updatedHoliday.budgets[0].startDate
							.toISOString()
							.slice(0, 10),
						endDate: updatedHoliday.budgets[0].endDate
							.toISOString()
							.slice(0, 10),
				  }
				: null,
		};

		return ok(toPlain(result));
	} catch (error) {
		console.error("Error updating countdown timer:", error);
		if (error instanceof Error) {
			return serverError(error.message);
		}
		return serverError("Failed to update countdown timer");
	}
}

// DELETE /api/holidays/[id]/countdown - Clear countdown timer for a specific holiday
export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const user = await requireAuth(request);
		const { id: holidayId } = await params;

		// Find the holiday and check access
		const holiday = await prisma.holiday.findUnique({
			where: { id: holidayId },
			include: {
				account: true,
			},
		});

		if (!holiday) {
			return notFound("Holiday not found");
		}

		// Check account access
		await requireAccountAccess(holiday.accountId, user.id);

		// Clear the countdown timer
		const updatedHoliday = await prisma.holiday.update({
			where: { id: holidayId },
			data: {
				countdownTimer: null,
				updatedAt: new Date(),
			},
			include: {
				budgets: true,
			},
		});

		// Transform to preferences format for consistency
		const result = {
			holiday: {
				...updatedHoliday,
				startDate: updatedHoliday.startDate.toISOString().slice(0, 10),
				endDate: updatedHoliday.endDate?.toISOString().slice(0, 10),
				countdownTimer: null,
			},
			budget: updatedHoliday.budgets[0]
				? {
						...updatedHoliday.budgets[0],
						startDate: updatedHoliday.budgets[0].startDate
							.toISOString()
							.slice(0, 10),
						endDate: updatedHoliday.budgets[0].endDate
							.toISOString()
							.slice(0, 10),
				  }
				: null,
		};

		return ok(toPlain(result));
	} catch (error) {
		console.error("Error clearing countdown timer:", error);
		if (error instanceof Error) {
			return serverError(error.message);
		}
		return serverError("Failed to clear countdown timer");
	}
}
