import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth, assertHolidayAccess } from '@/lib/auth';
import { created, badRequest, serverError, ok } from '@/lib/http';
import { createAssignmentNotification, getUserName } from '@/lib/notifications';
import {
  broadcastAssignment,
  broadcastCompletion,
  broadcastNotification,
} from '@/lib/realTimeNotifications';

const createBodySchema = z.object({
  recipient: z.string().min(1),
  message: z.string().min(1),
  address: z.string().nullable().optional(),
  contact_id: z.string().uuid().nullable().optional(),
  assigned_to: z.string().uuid().nullable().optional(), // NEW
});

const updateBodySchema = z.object({
  id: z.string().uuid(),
  action: z.enum(['update', 'toggle', 'delete']),
  recipient: z.string().min(1),
  message: z.string().min(1),
  address: z.string().nullable().optional(),
  isCompleted: z.boolean().optional(),
  assigned_to: z.string().uuid().nullable().optional(), // NEW
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;
    const forbidden = await assertHolidayAccess(id, user.id);
    if (forbidden) return forbidden;

    const json = await request.json();
    const parsed = createBodySchema.safeParse(json);
    if (!parsed.success) {
      return badRequest(parsed.error.issues);
    }

    // Fetch holiday name for better notifications
    const holiday = await prisma.holiday.findUnique({
      where: { id },
      select: { name: true },
    });
    const holidayName = holiday?.name || 'Holiday';

    const data = parsed.data;
    const card = await prisma.card.create({
      data: {
        holidayId: id,
        recipient: data.recipient,
        message: data.message,
        address: data.address ?? null,
        contactId: data.contact_id ?? null,
        assignedTo: data.assigned_to, // NEW
        createdBy: user.id,
      },
    });

    // Create assignment notification if assigned to someone other than creator
    if (data.assigned_to && data.assigned_to !== user.id) {
      try {
        const assignerName = await getUserName(user.id);

        // Database notification (existing system) - this is the primary system
        await createAssignmentNotification({
          userId: data.assigned_to,
          fromUserId: user.id,
          entityType: 'card',
          entityId: card.id,
          holidayId: id,
          title: 'Card Assignment',
          message: `${assignerName} assigned you a card for ${card.recipient}`,
        });

        // Real-time notification (enhancement layer) - completely isolated
        // This will NEVER affect the main API operation
        setTimeout(async () => {
          try {
            await broadcastAssignment(
              data.assigned_to!, // assigneeUserId - we know it's not null from the if condition
              assignerName, // assignerName
              'card', // entityType
              `Card for ${card.recipient}`, // entityName
              card.id, // entityId
              id, // holidayId
              holidayName, // holidayName
            );
          } catch (broadcastError) {
            // Silently log broadcast failures - they never affect the API
            console.warn(
              'Real-time notification broadcast failed (card assignment succeeded):',
              broadcastError,
            );
          }
        }, 0); // Run in next tick to completely isolate from main operation
      } catch (notificationError) {
        // CRITICAL: Even if database notification fails, card creation still succeeds
        // This maintains backward compatibility with existing behavior
        console.error(
          'Notification system failed (card assignment succeeded):',
          notificationError,
        );
        // Note: The card was still created successfully
      }
    }

    return created(card, {
      'Cache-Control': 'private, max-age=5, stale-while-revalidate=60',
    });
  } catch (error) {
    console.error('Error creating card:', error);
    return serverError('Failed to create card');
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;
    const forbidden = await assertHolidayAccess(id, user.id);
    if (forbidden) return forbidden;

    const json = await request.json();

    const parsed = updateBodySchema.safeParse(json);
    if (!parsed.success) {
      return badRequest(parsed.error.issues);
    }

    const data = parsed.data;

    // Handle different actions
    if (data.action === 'delete') {
      // Delete the card
      await prisma.card.delete({
        where: {
          id: data.id,
        },
      });
      return ok({ success: true });
    } else if (data.action === 'update' || data.action === 'toggle') {
      // Update the card
      const updateData: any = {
        recipient: data.recipient,
        message: data.message,
        address: data.address ?? null,
      };

      // Only update isCompleted if it's provided
      if (data.isCompleted !== undefined) {
        updateData.isCompleted = data.isCompleted;
      }

      // Handle assigned_to field
      if (data.assigned_to !== undefined) {
        updateData.assignedTo =
          data.assigned_to && data.assigned_to !== '' ? data.assigned_to : null;
      }

      // First check if the card exists
      const existingCard = await prisma.card.findUnique({
        where: { id: data.id },
      });

      if (!existingCard) {
        return badRequest('Card not found');
      }

      const card = await prisma.card.update({
        where: {
          id: data.id,
        },
        data: updateData,
      });

      return ok(card, {
        'Cache-Control': 'private, max-age=5, stale-while-revalidate=60',
      });
    }

    return badRequest('Invalid action');
  } catch (error) {
    console.error('Error updating card:', error);
    return serverError('Failed to update card');
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;
    const forbidden = await assertHolidayAccess(id, user.id);
    if (forbidden) return forbidden;

    // Get cardId from query params
    const { searchParams } = new URL(request.url);
    const cardId = searchParams.get('cardId');

    if (!cardId) {
      return badRequest('Card ID is required');
    }

    // Check if card exists
    const existingCard = await prisma.card.findUnique({
      where: { id: cardId },
    });

    if (!existingCard) {
      return badRequest('Card not found');
    }

    // Delete the card
    await prisma.card.delete({
      where: {
        id: cardId,
      },
    });

    return ok({ success: true });
  } catch (error) {
    console.error('Error deleting card:', error);
    return serverError('Failed to delete card');
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;
    const forbidden = await assertHolidayAccess(id, user.id);
    if (forbidden) return forbidden;

    const cards = await prisma.card.findMany({
      where: {
        holidayId: id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return ok(cards, {
      'Cache-Control': 'private, max-age=5, stale-while-revalidate=60',
    });
  } catch (error) {
    console.error('Error fetching cards:', error);
    return serverError('Failed to fetch cards');
  }
}
