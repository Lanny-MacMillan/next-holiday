import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

/**
 * POST /api/shares/[shareId]/cleanup-user-data
 * Clean up all shared holiday data for a user who left or was removed from a share
 * This includes tasks, gifts, cards, and any other data associated with the shareId
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ shareId: string }> },
) {
  try {
    const { shareId } = await params;
    const body = await request.json();
    const { userId: userIdParam } = body;

    if (!userIdParam) {
      return NextResponse.json(
        { error: 'Missing required field: userId' },
        { status: 400 },
      );
    }

    // Convert Auth0 sub to internal user ID
    const user = await prisma.user.findUnique({
      where: { auth0Sub: userIdParam },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = user.id;

    // Verify the share exists
    const share = await prisma.share.findUnique({
      where: { id: shareId },
      include: {
        holiday: {
          select: {
            holidayType: true,
            name: true,
          },
        },
      },
    });

    if (!share) {
      return NextResponse.json({ error: 'Share not found' }, { status: 404 });
    }

    // Clean up all shared data for this user in a transaction
    const cleanupResults = await prisma.$transaction(async tx => {
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

    return NextResponse.json({
      success: true,
      message: `Cleaned up shared holiday data for user`,
      shareId,
      holidayType: share.holiday.holidayType,
      holidayName: share.holiday.name,
      cleanup: cleanupResults,
    });
  } catch (error) {
    console.error('Error cleaning up user share data:', error);
    return NextResponse.json(
      { error: 'Failed to clean up user share data' },
      { status: 500 },
    );
  }
}
