import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { ok, serverError } from '@/lib/http';
import { v4 as uuidv4 } from 'uuid';

// GET /api/test/budget - Create a test Christmas holiday with budget
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    // Find user's account
    const account = await prisma.account.findFirst({
      where: {
        members: {
          some: {
            userId: user.id,
          },
        },
      },
    });

    if (!account) {
      return serverError('No account found for user');
    }

    // Check if Christmas holiday already exists
    let christmasHoliday = await prisma.holiday.findFirst({
      where: {
        accountId: account.id,
        holidayType: 'Christmas',
      },
    });

    if (!christmasHoliday) {
      // Create Christmas holiday
      christmasHoliday = await prisma.holiday.create({
        data: {
          id: uuidv4(),
          accountId: account.id,
          holidayType: 'Christmas',
          name: 'Christmas',
          startDate: new Date('2024-12-25'),
          colorLight: '#dc2626',
          colorDark: '#991b1b',
          isCustom: false,
          createdBy: user.id,
        },
      });
    }

    // Check if budget already exists
    let budget = await prisma.budget.findFirst({
      where: {
        holidayId: christmasHoliday.id,
      },
    });

    if (!budget) {
      // Create budget
      budget = await prisma.budget.create({
        data: {
          id: uuidv4(),
          holidayId: christmasHoliday.id,
          name: 'Christmas Budget',
          totalBudget: 500.0,
          spentAmount: 150.0,
          remainingAmount: 350.0,
          currency: 'USD',
          startDate: new Date('2024-12-01'),
          endDate: new Date('2024-12-25'),
          createdBy: user.id,
        },
      });
    }

    return ok({
      message: 'Test Christmas holiday and budget created',
      holiday: christmasHoliday,
      budget: budget,
    });
  } catch (error) {
    console.error('Error creating test budget:', error);
    return serverError('Failed to create test budget');
  }
}
