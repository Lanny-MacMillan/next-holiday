import { prisma } from '@/lib/prisma';

/**
 * Remove the shared-holiday data (tasks, gifts, cards, guest lists, budgets)
 * that a user created or was assigned within a share. Used when a member
 * leaves or is removed. Callers must have already authorised the removal.
 */
export async function cleanupUserShareData(shareId: string, userId: string) {
  return prisma.$transaction(async tx => {
    // Clean up tasks associated with this share
    const deletedTasks = await tx.task.deleteMany({
      where: {
        shareId: shareId,
        // Only delete tasks created by this user OR assigned to this user
        OR: [{ createdBy: userId }, { assignedTo: userId }],
      },
    });

    // Clean up gifts associated with this share
    const deletedGifts = await tx.gift.deleteMany({
      where: {
        shareId: shareId,
        // Only delete gifts created by this user OR assigned to this user
        OR: [{ createdBy: userId }, { assignedTo: userId }],
      },
    });

    // Clean up cards associated with this share
    const deletedCards = await tx.card.deleteMany({
      where: {
        shareId: shareId,
        // Only delete cards created by this user OR assigned to this user
        OR: [{ createdBy: userId }, { assignedTo: userId }],
      },
    });

    // Clean up guest lists associated with this share (through holiday)
    const deletedGuestLists = await tx.guestList.deleteMany({
      where: {
        holiday: {
          shares: {
            id: shareId,
          },
        },
        createdBy: userId,
      },
    });

    // Clean up budgets associated with this share
    const deletedBudgets = await tx.budget.deleteMany({
      where: {
        holiday: {
          shares: {
            id: shareId,
          },
        },
        createdBy: userId,
      },
    });

    // Clean up budget transactions associated with this share (through budget -> holiday)
    const deletedBudgetTransactions = await tx.budgetTransaction.deleteMany({
      where: {
        budget: {
          holiday: {
            shares: {
              id: shareId,
            },
          },
          createdBy: userId,
        },
      },
    });

    return {
      deletedTasks: deletedTasks.count,
      deletedGifts: deletedGifts.count,
      deletedCards: deletedCards.count,
      deletedGuestLists: deletedGuestLists.count,
      deletedBudgets: deletedBudgets.count,
      deletedBudgetTransactions: deletedBudgetTransactions.count,
    };
  });
}
