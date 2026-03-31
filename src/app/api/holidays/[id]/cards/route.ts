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
import { validateAssigneeAccess } from '@/lib/assigneeValidation';

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

// Simple schema for completion toggling (like gifts)
const toggleCompletionSchema = z.object({
  cardId: z.string().uuid(),
  isCompleted: z.boolean(),
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

    const data = parsed.data;

    // Validate assignee access if assigning to someone
    if (data.assigned_to && data.assigned_to !== user.id) {
      const assigneeValidation = await validateAssigneeAccess(data.assigned_to, id);
      if (!assigneeValidation.valid) {
        return badRequest(assigneeValidation.error || 'Invalid assignee');
      }
    }

    // Fetch holiday name for better notifications
    const holiday = await prisma.holiday.findUnique({
      where: { id },
      select: { name: true },
    });
    const holidayName = holiday?.name || 'Holiday';

    // SAME PATTERN AS GIFTS: Create with contact include and data transformation
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
      include: {
        contact: true,
        assignedUser: true,
      },
    });

    //  Transform data for UI (like gifts)
    const transformedCard = {
      ...card,
      recipient: card.contact?.name || card.recipient,
    };

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

    // Return in same format as gifts API
    return created(
      { data: transformedCard },
      {
        'Cache-Control': 'private, max-age=5, stale-while-revalidate=60',
      },
    );
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

    //  Try simple completion toggle format first (like gifts)
    const simpleToggleParsed = toggleCompletionSchema.safeParse(json);
    if (simpleToggleParsed.success) {
      // Handle simple completion toggle
      const { cardId, isCompleted } = simpleToggleParsed.data;

      const existingCard = await prisma.card.findUnique({
        where: { id: cardId },
        select: {
          isCompleted: true,
          assignedTo: true,
          createdBy: true,
          recipient: true,
        },
      });

      if (!existingCard) {
        return badRequest('Card not found');
      }

      //  Update with contact include and data transformation
      const card = await prisma.card.update({
        where: { id: cardId },
        data: {
          isCompleted,
          sentDate: isCompleted ? new Date() : null, //  Use sentDate instead of completedDate
        },
        include: {
          contact: true,
          assignedUser: true,
        },
      });

      //  Transform data for UI (like gifts)
      const transformedCard = {
        ...card,
        recipient: card.contact?.name || card.recipient,
      };

      // Handle completion notifications (existing logic)
      if (isCompleted && !existingCard.isCompleted && existingCard.assignedTo) {
        setTimeout(async () => {
          try {
            const [holiday, completerName] = await Promise.all([
              prisma.holiday.findUnique({ where: { id }, select: { name: true } }),
              getUserName(user.id),
            ]);

            const holidayName = holiday?.name || 'Holiday';
            const assignerUserId = existingCard.createdBy;

            if (assignerUserId && assignerUserId !== user.id) {
              await broadcastCompletion(
                assignerUserId,
                completerName,
                'card',
                `Card for ${existingCard.recipient}`,
                cardId,
                id,
                holidayName,
              );
            }
          } catch (error) {
            console.warn(
              'Completion notification failed (card completion succeeded):',
              error,
            );
          }
        }, 0);
      }

      //  Return in same format as gifts API
      return ok(
        { data: transformedCard },
        {
          'Cache-Control': 'private, max-age=5, stale-while-revalidate=60',
        },
      );
    }

    //  Fall back to complex action-based format
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
      // First check if the card exists and get current state for completion notifications
      const existingCard = await prisma.card.findUnique({
        where: { id: data.id },
        select: {
          isCompleted: true,
          assignedTo: true,
          createdBy: true,
          recipient: true,
        },
      });

      if (!existingCard) {
        return badRequest('Card not found');
      }

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

      // SAME PATTERN AS GIFTS: Update with contact include and data transformation
      const card = await prisma.card.update({
        where: {
          id: data.id,
        },
        data: updateData,
        include: {
          contact: true,
          assignedUser: true,
        },
      });

      //  Transform data for UI (like gifts)
      const transformedCard = {
        ...card,
        recipient: card.contact?.name || card.recipient,
      };

      // Handle assignment change notifications
      if (
        data.assigned_to !== undefined &&
        existingCard.assignedTo !== updateData.assignedTo
      ) {
        // Run assignment notifications asynchronously to never block the API response
        setTimeout(async () => {
          try {
            // Get holiday name and assigner name for notifications
            const [holiday, assignerName] = await Promise.all([
              prisma.holiday.findUnique({
                where: { id },
                select: { name: true },
              }),
              getUserName(user.id),
            ]);

            const holidayName = holiday?.name || 'Holiday';

            if (updateData.assignedTo && updateData.assignedTo !== user.id) {
              // New assignment or reassignment
              await broadcastAssignment(
                updateData.assignedTo,
                assignerName,
                'card',
                `Card for ${existingCard.recipient}`,
                data.id,
                id,
                holidayName,
              );
            } else if (
              existingCard.assignedTo &&
              existingCard.assignedTo !== user.id
            ) {
              // Assignment removed - notify the previous assignee
              await broadcastNotification({
                userId: existingCard.assignedTo,
                type: 'card_assigned', // Using same type but with unassignment message
                title: 'Card Unassigned',
                message: `${assignerName} removed your assignment from "Card for ${existingCard.recipient}"`,
                entityType: 'card',
                entityId: data.id,
                holidayId: id,
                fromUserId: user.id,
                fromUser: { name: assignerName },
                holiday: { name: holidayName, holidayType: 'unknown' },
              });
            }
          } catch (assignmentError) {
            // Silently log assignment notification failures
            console.warn(
              'Assignment change notification failed (card update succeeded):',
              assignmentError,
            );
          }
        }, 0); // Run in next tick
      }

      // Send completion notification if card was just completed
      if (
        data.isCompleted !== undefined &&
        data.isCompleted &&
        !existingCard.isCompleted &&
        existingCard.assignedTo
      ) {
        // Run completion notifications asynchronously to never block the API response
        setTimeout(async () => {
          try {
            // Get holiday name and user names for notification
            const [holiday, completerName] = await Promise.all([
              prisma.holiday.findUnique({
                where: { id },
                select: { name: true },
              }),
              getUserName(user.id),
            ]);

            const holidayName = holiday?.name || 'Holiday';
            const assignerUserId = existingCard.createdBy; // Original creator/assigner

            // Notify the original assigner if it's someone else
            if (assignerUserId && assignerUserId !== user.id) {
              await broadcastCompletion(
                assignerUserId, // ownerUserId (who assigned it)
                completerName, // completerName (who finished it)
                'card', // entityType
                `Card for ${existingCard.recipient}`, // entityName
                data.id, // entityId
                id, // holidayId
                holidayName, // holidayName
              );
            }
          } catch (completionError) {
            // Silently log completion notification failures
            console.warn(
              'Completion notification failed (card completion succeeded):',
              completionError,
            );
          }
        }, 0); // Run in next tick
      }

      //  Return in same format as gifts API
      return ok(
        { data: transformedCard },
        {
          'Cache-Control': 'private, max-age=5, stale-while-revalidate=60',
        },
      );
    }

    return badRequest('Invalid action');
  } catch (error) {
    console.error('Error updating card:', error);
    return serverError('Failed to update card');
  }
}

const editBodySchema = z.object({
  cardId: z.string().uuid(),
  recipient: z.string().min(1).optional(),
  message: z.string().min(1).optional(),
  address: z.string().nullable().optional(),
  contact_id: z.string().uuid().nullable().optional(),
  assigned_to: z.string().uuid().nullable().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;
    const forbidden = await assertHolidayAccess(id, user.id);
    if (forbidden) return forbidden;

    const json = await request.json();
    const parsed = editBodySchema.safeParse(json);
    if (!parsed.success) {
      return badRequest(parsed.error.issues);
    }

    const data = parsed.data;

    // Validate assignee access if assigning to someone
    if (data.assigned_to && data.assigned_to !== user.id) {
      const assigneeValidation = await validateAssigneeAccess(data.assigned_to, id);
      if (!assigneeValidation.valid) {
        return badRequest(assigneeValidation.error || 'Invalid assignee');
      }
    }

    // Check if card exists
    const existingCard = await prisma.card.findUnique({
      where: { id: data.cardId },
      select: {
        assignedTo: true,
        createdBy: true,
        recipient: true,
      },
    });

    if (!existingCard) {
      return badRequest('Card not found');
    }

    // Build update data only for provided fields
    const updateData: any = {};
    if (data.recipient !== undefined) updateData.recipient = data.recipient;
    if (data.message !== undefined) updateData.message = data.message;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.contact_id !== undefined) updateData.contactId = data.contact_id;

    // Handle assigned_to field
    if (data.assigned_to !== undefined) {
      updateData.assignedTo =
        data.assigned_to && data.assigned_to !== '' ? data.assigned_to : null;
    }

    // SAME PATTERN AS GIFTS: Update with contact include and data transformation
    const card = await prisma.card.update({
      where: { id: data.cardId },
      data: updateData,
      include: {
        contact: true,
        assignedUser: true,
      },
    });

    // Transform data for UI (like gifts)
    const transformedCard = {
      ...card,
      recipient: card.contact?.name || card.recipient,
    };

    // Handle assignment change notifications (async)
    if (
      data.assigned_to !== undefined &&
      existingCard.assignedTo !== updateData.assignedTo
    ) {
      setTimeout(async () => {
        try {
          const [holiday, assignerName] = await Promise.all([
            prisma.holiday.findUnique({ where: { id }, select: { name: true } }),
            getUserName(user.id),
          ]);

          const holidayName = holiday?.name || 'Holiday';

          if (updateData.assignedTo && updateData.assignedTo !== user.id) {
            await broadcastAssignment(
              updateData.assignedTo,
              assignerName,
              'card',
              `Card for ${existingCard.recipient}`,
              data.cardId,
              id,
              holidayName,
            );
          }
        } catch (error) {
          console.warn(
            'Assignment notification failed (card edit succeeded):',
            error,
          );
        }
      }, 0);
    }

    //  Return in same format as gifts API
    return ok(
      { data: transformedCard },
      {
        'Cache-Control': 'private, max-age=5, stale-while-revalidate=60',
      },
    );
  } catch (error) {
    console.error('Error editing card:', error);
    return serverError('Failed to edit card');
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
