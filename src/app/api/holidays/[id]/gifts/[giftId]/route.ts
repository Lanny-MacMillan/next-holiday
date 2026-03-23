import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth, assertHolidayAccess } from '@/lib/auth';
import { ok, badRequest, serverError, notFound } from '@/lib/http';

const updateGiftSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  price: z.number().min(0).optional(),
  actual_price: z.number().min(0).optional(),
  store: z.string().nullable().optional(),
  product_link: z
    .union([z.string().url(), z.string().length(0), z.null(), z.undefined()])
    .optional(),
  notes: z.string().nullable().optional(),
  contact_id: z.string().uuid().nullable().optional(),
  assigned_to: z.string().uuid().nullable().optional().or(z.literal('')), // Allow empty string
  isCompleted: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; giftId: string }> },
) {
  try {
    const user = await requireAuth(request);
    const { id: holidayId, giftId } = await params;
    const forbidden = await assertHolidayAccess(holidayId, user.id);
    if (forbidden) return forbidden;

    const json = await request.json();
    const parsed = updateGiftSchema.safeParse(json);
    if (!parsed.success) {
      return badRequest(parsed.error.issues);
    }

    const data = parsed.data;

    // Check if gift exists
    const existingGift = await prisma.gift.findUnique({
      where: { id: giftId },
    });

    if (!existingGift) {
      return notFound('Gift not found');
    }

    // Update the gift
    const updatedGift = await prisma.gift.update({
      where: { id: giftId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.actual_price !== undefined && { actualPrice: data.actual_price }),
        ...(data.store !== undefined && { store: data.store }),
        ...(data.product_link !== undefined && { productLink: data.product_link }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.contact_id !== undefined && { contactId: data.contact_id }),
        ...(data.assigned_to !== undefined && {
          assignedTo:
            data.assigned_to && data.assigned_to !== '' ? data.assigned_to : null,
        }),
        ...(data.isCompleted !== undefined && { isCompleted: data.isCompleted }),
      },
    });

    return ok(updatedGift, {
      'Cache-Control': 'private, max-age=5, stale-while-revalidate=60',
    });
  } catch (error) {
    console.error('Error updating gift:', error);
    return serverError('Failed to update gift');
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; giftId: string }> },
) {
  try {
    const user = await requireAuth(request);
    const { id: holidayId, giftId } = await params;
    const forbidden = await assertHolidayAccess(holidayId, user.id);
    if (forbidden) return forbidden;

    // Check if gift exists
    const existingGift = await prisma.gift.findUnique({
      where: { id: giftId },
    });

    if (!existingGift) {
      return notFound('Gift not found');
    }

    // Delete the gift
    await prisma.gift.delete({
      where: { id: giftId },
    });

    return ok({ message: 'Gift deleted successfully' });
  } catch (error) {
    console.error('Error deleting gift:', error);
    return serverError('Failed to delete gift');
  }
}
