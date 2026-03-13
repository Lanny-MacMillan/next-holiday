import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth, assertHolidayAccess } from '@/lib/auth';
import { created, badRequest, serverError, ok } from '@/lib/http';
import { createAssignmentNotification, getUserName } from '@/lib/notifications';

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
        await createAssignmentNotification({
          userId: data.assigned_to,
          fromUserId: user.id,
          entityType: 'card',
          entityId: card.id,
          holidayId: id,
          title: 'Card Assignment',
          message: `${assignerName} assigned you a card for ${card.recipient}`,
        });
      } catch (notificationError) {
        // Log notification error but don't fail the card creation
        console.error(
          'Failed to create assignment notification:',
          notificationError,
        );
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
