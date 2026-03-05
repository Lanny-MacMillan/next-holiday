import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getCurrentUser, requireAuth } from '@/lib/auth';
import { requireAccountAccess } from '@/lib/rbac';
import {
  deleteHolidayData,
  validateHolidayDeletePermission,
} from '@/lib/server/holidays/deleteHolidayData';
import {
  ok,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  serverError,
} from '@/lib/http';

// Validation schema for the request body
const DeleteHolidaySchema = z.object({
  dryRun: z.boolean().optional().default(false),
  force: z.boolean().optional().default(false),
});

// POST /api/holidays/[id]/delete-cascade - Delete holiday with cascade
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth(request);
    const { id: holidayId } = await params;

    // Parse and validate request body
    const body = await request.json();
    const validation = DeleteHolidaySchema.safeParse(body);

    if (!validation.success) {
      return badRequest(validation.error.issues);
    }

    const { dryRun, force } = validation.data;

    // Validate user has permission to delete this holiday
    const permissionCheck = await validateHolidayDeletePermission(
      holidayId,
      user.id,
    );

    if (!permissionCheck.canDelete) {
      if (permissionCheck.error?.includes('not found')) {
        return notFound('Holiday not found');
      }
      return forbidden('Access denied');
    }

    const holiday = permissionCheck.holiday;
    if (!holiday) {
      return notFound('Holiday not found');
    }

    // Perform the cascade delete operation
    const result = await deleteHolidayData({
      accountId: holiday.accountId,
      holidayId: holidayId,
      dryRun,
      force,
    });

    // Check if there was an error in the deletion process
    if (result.error) {
      if (result.error.includes('Feature flag')) {
        return serverError('Cascade delete feature is not enabled');
      }
      if (result.error.includes('threshold')) {
        return badRequest(result.error);
      }
      return serverError(result.error);
    }

    // Return the result
    return ok({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error in cascade delete API:', error);
    return serverError('Failed to process cascade delete request');
  }
}

// GET /api/holidays/[id]/delete-cascade - Get dry run results without deletion
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth(request);
    const { id: holidayId } = await params;

    // Validate user has permission to access this holiday
    const permissionCheck = await validateHolidayDeletePermission(
      holidayId,
      user.id,
    );

    if (!permissionCheck.canDelete) {
      if (permissionCheck.error?.includes('not found')) {
        return notFound('Holiday not found');
      }
      return forbidden('Access denied');
    }

    const holiday = permissionCheck.holiday;
    if (!holiday) {
      return notFound('Holiday not found');
    }

    // Perform dry run to get counts
    const result = await deleteHolidayData({
      accountId: holiday.accountId,
      holidayId: holidayId,
      dryRun: true,
    });

    // Check if there was an error
    if (result.error) {
      if (result.error.includes('Feature flag')) {
        return serverError('Cascade delete feature is not enabled');
      }
      return serverError(result.error);
    }

    // Return the dry run results
    return ok({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error in cascade delete dry run API:', error);
    return serverError('Failed to process dry run request');
  }
}
