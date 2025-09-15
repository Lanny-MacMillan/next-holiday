import { prisma } from "@/lib/prisma";

export interface DeleteHolidayDataParams {
	accountId: string;
	holidayId: string;
	dryRun?: boolean;
	force?: boolean;
}

export interface DeleteHolidayDataResult {
	dryRun: boolean;
	totals: Record<string, number>;
	startedAt: string;
	finishedAt: string;
	holidayName?: string;
	error?: string;
}

/**
 * Safely deletes a holiday and all its associated data with tenant scoping.
 * Uses database-level CASCADE constraints for efficient deletion.
 *
 * @param params - Delete parameters including accountId, holidayId, and options
 * @returns Promise with deletion results and counts
 */
export async function deleteHolidayData(
	params: DeleteHolidayDataParams
): Promise<DeleteHolidayDataResult> {
	const { accountId, holidayId, dryRun = false, force = false } = params;

	const startedAt = new Date().toISOString();

	try {
		// Feature flag check
		if (!process.env.DELETE_HOLIDAY_CASCADE_ENABLED) {
			throw new Error("Feature flag DELETE_HOLIDAY_CASCADE_ENABLED is not set");
		}

		// Required parameter validation
		if (!accountId || !holidayId) {
			throw new Error("accountId and holidayId are required");
		}

		// Verify holiday exists and belongs to the account (tenant scoping)
		const holiday = await prisma.holiday.findFirst({
			where: {
				id: holidayId,
				accountId: accountId,
			},
			select: {
				id: true,
				name: true,
				accountId: true,
			},
		});

		if (!holiday) {
			throw new Error("Holiday not found or access denied");
		}

		// Count all dependent records for dryRun or threshold checking
		const totals = await countHolidayDependentRecords(holidayId, accountId);

		// Check row threshold unless force is enabled
		const totalRows = Object.values(totals).reduce(
			(sum, count) => sum + count,
			0
		);
		const THRESHOLD = Number(process.env.DELETE_HOLIDAY_ROW_THRESHOLD ?? 50000);

		if (totalRows > THRESHOLD && !force) {
			throw new Error(
				`Delete would affect ${totalRows} rows (> ${THRESHOLD}). Re-run with force=true if intended.`
			);
		}

		// If dryRun, return counts without deletion
		if (dryRun) {
			return {
				dryRun: true,
				totals,
				startedAt,
				finishedAt: new Date().toISOString(),
				holidayName: holiday.name,
			};
		}

		// Perform the actual deletion
		// Since all FKs have ON DELETE CASCADE, we only need to delete the holiday
		// The database will automatically cascade to all dependent tables
		await prisma.holiday.delete({
			where: {
				id: holidayId,
				// Additional tenant scoping for extra safety
				accountId: accountId,
			},
		});

		return {
			dryRun: false,
			totals,
			startedAt,
			finishedAt: new Date().toISOString(),
			holidayName: holiday.name,
		};
	} catch (error) {
		console.error("Error in deleteHolidayData:", error);

		return {
			dryRun,
			totals: {},
			startedAt,
			finishedAt: new Date().toISOString(),
			error: error instanceof Error ? error.message : "Unknown error occurred",
		};
	}
}

/**
 * Counts all records that would be affected by deleting a holiday.
 * This is used for dryRun functionality and threshold checking.
 */
async function countHolidayDependentRecords(
	holidayId: string,
	accountId: string
): Promise<Record<string, number>> {
	const totals: Record<string, number> = {};

	try {
		// Count records in each dependent table
		// Note: We use Promise.all for parallel execution for better performance

		const [
			holidayCount,
			taskCount,
			giftCount,
			cardCount,
			budgetCount,
			shareCount,
			kwanzaaPrincipleCount,
			guestListCount,
		] = await Promise.all([
			// Holiday itself
			prisma.holiday.count({
				where: { id: holidayId, accountId },
			}),

			// Direct dependents
			prisma.task.count({
				where: { holidayId },
			}),

			prisma.gift.count({
				where: { holidayId },
			}),

			prisma.card.count({
				where: { holidayId },
			}),

			prisma.budget.count({
				where: { holidayId },
			}),

			prisma.share.count({
				where: { holidayId },
			}),

			prisma.kwanzaaPrinciple.count({
				where: { holidayId },
			}),

			prisma.guestList.count({
				where: { holidayId },
			}),
		]);

		// Count indirect dependents (through other tables)
		const [
			taskAssigneeCount,
			budgetTransactionCount,
			shareMemberCount,
			inviteCount,
		] = await Promise.all([
			// TaskAssignees (through tasks)
			prisma.taskAssignee.count({
				where: {
					task: {
						holidayId,
					},
				},
			}),

			// BudgetTransactions (through budgets)
			prisma.budgetTransaction.count({
				where: {
					budget: {
						holidayId,
					},
				},
			}),

			// ShareMembers (through shares)
			prisma.shareMember.count({
				where: {
					share: {
						holidayId,
					},
				},
			}),

			// Invites (through shares)
			prisma.invite.count({
				where: {
					share: {
						holidayId,
					},
				},
			}),
		]);

		// Compile totals
		totals.Holiday = holidayCount;
		totals.Task = taskCount;
		totals.TaskAssignee = taskAssigneeCount;
		totals.Gift = giftCount;
		totals.Card = cardCount;
		totals.Budget = budgetCount;
		totals.BudgetTransaction = budgetTransactionCount;
		totals.Share = shareCount;
		totals.ShareMember = shareMemberCount;
		totals.Invite = inviteCount;
		totals.KwanzaaPrinciple = kwanzaaPrincipleCount;
		totals.GuestList = guestListCount;

		return totals;
	} catch (error) {
		console.error("Error counting dependent records:", error);
		throw new Error("Failed to count dependent records");
	}
}

/**
 * Validates that a user has permission to delete a holiday.
 * This is a separate function that can be used by API routes for authorization.
 */
export async function validateHolidayDeletePermission(
	holidayId: string,
	userId: string
): Promise<{ canDelete: boolean; holiday?: any; error?: string }> {
	try {
		// Find the holiday and verify user has access through account membership
		const holiday = await prisma.holiday.findFirst({
			where: {
				id: holidayId,
				account: {
					OR: [
						{ ownerUserId: userId },
						{
							members: {
								some: {
									userId: userId,
								},
							},
						},
					],
				},
			},
			include: {
				account: {
					select: {
						id: true,
						name: true,
						ownerUserId: true,
					},
				},
			},
		});

		if (!holiday) {
			return {
				canDelete: false,
				error: "Holiday not found or access denied",
			};
		}

		return {
			canDelete: true,
			holiday,
		};
	} catch (error) {
		console.error("Error validating holiday delete permission:", error);
		return {
			canDelete: false,
			error: "Failed to validate permissions",
		};
	}
}
