import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import {
  requireAccountAccess,
  requireAccountOwner,
  requireAccountAdmin,
} from '@/lib/rbac';
import {
  ok,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  serverError,
} from '@/lib/http';

// Validation schemas
const UpdateAccountSchema = z.object({
  name: z.string().min(1).max(100).optional(),
});

const AccountIdSchema = z.object({
  id: z.string().uuid(),
});

// GET /api/accounts/[id] - Get single account
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;

    // Validate account ID
    const idValidation = AccountIdSchema.safeParse({ id });
    if (!idValidation.success) {
      return badRequest(idValidation.error.issues);
    }

    // Check user has access to this account
    await requireAccountAccess(id, user.id);

    // Get account with details
    const account = await prisma.account.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        holidays: {
          select: {
            id: true,
            name: true,
            holidayType: true,
            startDate: true,
            endDate: true,
          },
          orderBy: { startDate: 'asc' },
        },
        contacts: {
          select: {
            id: true,
            name: true,
            email: true,
            relationship: true,
          },
          orderBy: { name: 'asc' },
        },
        _count: {
          select: {
            holidays: true,
            contacts: true,
            members: true,
          },
        },
      },
    });

    if (!account) {
      return notFound('Account not found');
    }

    return ok(account);
  } catch (error) {
    if (error instanceof Error && error.message.includes('Access denied')) {
      return forbidden(error.message);
    }
    console.error('Error fetching account:', error);
    return serverError('Failed to fetch account');
  }
}

// PUT /api/accounts/[id] - Update account
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;

    // Validate account ID
    const idValidation = AccountIdSchema.safeParse({ id });
    if (!idValidation.success) {
      return badRequest(idValidation.error.issues);
    }

    // Check user is admin or owner
    await requireAccountAdmin(id, user.id);

    // Parse and validate request body
    const body = await request.json();
    const validation = UpdateAccountSchema.safeParse(body);

    if (!validation.success) {
      return badRequest(validation.error.issues);
    }

    const updateData = validation.data;

    // Update account
    const account = await prisma.account.update({
      where: { id },
      data: updateData,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return ok(account);
  } catch (error) {
    if (error instanceof Error && error.message.includes('Access denied')) {
      return forbidden(error.message);
    }
    if (
      error instanceof Error &&
      error.message.includes('Record to update not found')
    ) {
      return notFound('Account not found');
    }
    console.error('Error updating account:', error);
    return serverError('Failed to update account');
  }
}

// DELETE /api/accounts/[id] - Delete account
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;

    // Validate account ID
    const idValidation = AccountIdSchema.safeParse({ id });
    if (!idValidation.success) {
      return badRequest(idValidation.error.issues);
    }

    // Check user is owner (only owners can delete accounts)
    await requireAccountOwner(id, user.id);

    // Delete account (cascade will handle related records)
    await prisma.account.delete({
      where: { id },
    });

    return ok({ message: 'Account deleted successfully' });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Access denied')) {
      return forbidden(error.message);
    }
    if (
      error instanceof Error &&
      error.message.includes('Record to delete does not exist')
    ) {
      return notFound('Account not found');
    }
    console.error('Error deleting account:', error);
    return serverError('Failed to delete account');
  }
}
