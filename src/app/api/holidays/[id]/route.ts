import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, requireAuth } from '@/lib/auth';
import { requireAccountAccess } from '@/lib/rbac';
import { toPlain } from '@/lib/json';
import { dateOnlyToUTC, toDateOnlyString } from '@/lib/dates';
import {
  ok,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  serverError,
} from '@/lib/http';

// Validation schemas
const UpdateHolidaySchema = z.object({
  holidayType: z.string().min(1).optional(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  colorLight: z.string().min(1).optional(),
  colorDark: z.string().min(1).optional(),
  isCustom: z.boolean().optional(),
});

// GET /api/holidays/[id] - Get specific holiday
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;

    // Get holiday with account access check
    const holiday = await prisma.holiday.findFirst({
      where: {
        id,
        account: {
          members: {
            some: {
              userId: user.id,
            },
          },
        },
      },
      include: {
        account: {
          select: {
            id: true,
            name: true,
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
            tasks: true,
            gifts: true,
            cards: true,
            budgets: true,
          },
        },
      },
    });

    if (!holiday) {
      return notFound('Holiday not found');
    }

    // Transform date fields to strings for API response
    const transformedHoliday = {
      ...holiday,
      startDate: toDateOnlyString(holiday.startDate),
      endDate: toDateOnlyString(holiday.endDate),
    };

    return ok(toPlain(transformedHoliday));
  } catch (error) {
    console.error('Error fetching holiday:', error);
    return serverError('Failed to fetch holiday');
  }
}

// PUT /api/holidays/[id] - Update holiday
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;

    // Parse and validate request body
    const body = await request.json();
    const validation = UpdateHolidaySchema.safeParse(body);

    if (!validation.success) {
      return badRequest(validation.error.issues);
    }

    // Get existing holiday to check account access
    const existingHoliday = await prisma.holiday.findUnique({
      where: { id },
      select: { accountId: true },
    });

    if (!existingHoliday) {
      return notFound('Holiday not found');
    }

    // Check account access
    await requireAccountAccess(existingHoliday.accountId, user.id);

    // Prepare update data
    const { startDate, endDate, ...data } = validation.data;
    const updateData: any = { ...data };

    if (startDate) {
      updateData.startDate = dateOnlyToUTC(startDate);
    }
    if (endDate !== undefined) {
      updateData.endDate = endDate ? dateOnlyToUTC(endDate) : null;
    }

    // Update holiday
    const holiday = await prisma.holiday.update({
      where: { id },
      data: updateData,
      include: {
        account: {
          select: {
            id: true,
            name: true,
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
    const transformedHoliday = {
      ...holiday,
      startDate: toDateOnlyString(holiday.startDate),
      endDate: toDateOnlyString(holiday.endDate),
    };

    return ok(toPlain(transformedHoliday));
  } catch (error) {
    console.error('Error updating holiday:', error);
    return serverError('Failed to update holiday');
  }
}

// DELETE /api/holidays/[id] - Delete holiday
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;

    // Get existing holiday to check account access
    const existingHoliday = await prisma.holiday.findUnique({
      where: { id },
      select: { accountId: true },
    });

    if (!existingHoliday) {
      return notFound('Holiday not found');
    }

    // Check account access
    await requireAccountAccess(existingHoliday.accountId, user.id);

    // Delete holiday
    await prisma.holiday.delete({
      where: { id },
    });

    return ok({ success: true });
  } catch (error) {
    console.error('Error deleting holiday:', error);
    return serverError('Failed to delete holiday');
  }
}
