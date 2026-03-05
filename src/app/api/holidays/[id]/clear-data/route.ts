import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { requireAccountAccess } from '@/lib/rbac';
import { ok, notFound, serverError } from '@/lib/http';

// POST /api/holidays/[id]/clear-data - Clear all data from holiday without deleting the holiday itself
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;

    // Get existing holiday to check account access
    const existingHoliday = await prisma.holiday.findUnique({
      where: { id },
      select: { accountId: true, name: true },
    });

    if (!existingHoliday) {
      return notFound('Holiday not found');
    }

    // Check account access
    await requireAccountAccess(existingHoliday.accountId, user.id);

    // Clear all associated data (but keep the holiday record)
    await prisma.$transaction([
      // Delete tasks
      prisma.task.deleteMany({
        where: { holidayId: id },
      }),
      // Delete gifts
      prisma.gift.deleteMany({
        where: { holidayId: id },
      }),
      // Delete cards
      prisma.card.deleteMany({
        where: { holidayId: id },
      }),
      // Delete guest lists
      prisma.guestList.deleteMany({
        where: { holidayId: id },
      }),
      // Delete budgets (if any)
      prisma.budget.deleteMany({
        where: { holidayId: id },
      }),
    ]);

    return ok({
      success: true,
      message: 'Holiday data cleared successfully',
      holidayId: id,
    });
  } catch (error) {
    console.error('Error clearing holiday data:', error);
    return serverError('Failed to clear holiday data');
  }
}
