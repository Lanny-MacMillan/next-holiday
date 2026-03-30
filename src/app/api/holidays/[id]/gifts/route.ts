import { NextRequest } from 'next/server';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
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

// Base schema without contact_id
const baseSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  price: z.number().min(0).optional(),
  actual_price: z.number().min(0).optional(),
  store: z.string().nullable().optional(),
  product_link: z
    .union([z.string().url(), z.string().length(0), z.null(), z.undefined()])
    .optional(),
  notes: z.string().nullable().optional(),
  assigned_to: z.string().uuid().nullable().optional().or(z.literal('')), // Allow empty string
});

// Schema for flexible contact creation (like guest lists)
const giftWithFlexibleContactSchema = baseSchema.extend({
  contact_id: z.string().uuid().nullable().optional(),
  // Fields for creating new contacts when contact_id not provided
  recipient_name: z.string().nullable().optional(),
  recipient_email: z
    .union([z.string().email(), z.string().length(0), z.null(), z.undefined()])
    .optional(),
  recipient_phone: z.string().nullable().optional(),
  recipient_address: z.string().nullable().optional(),
});

// Schema for holidays that don't require contact_id (like Thanksgiving)
const giftWithoutContactSchema = baseSchema.extend({
  contact_id: z.string().uuid().nullable().optional(),
  // For Thanksgiving, only name is required
  name: z.string().min(1, 'Shopping Item Name is required'),
  description: z.string().nullable().optional(),
  price: z.number().min(0).optional(),
  actual_price: z.number().min(0).optional(),
  store: z.string().nullable().optional(),
  product_link: z
    .union([z.string().url(), z.string().length(0), z.null(), z.undefined()])
    .optional(),
  notes: z.string().nullable().optional(),
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

    // Get holiday information to determine validation schema
    const holiday = await prisma.holiday.findUnique({
      where: { id },
      select: { name: true },
    });

    if (!holiday) {
      return badRequest('Holiday not found');
    }

    const holidayName = holiday.name || 'Holiday';

    const json = await request.json();

    // Use different schema based on holiday
    let parsed;
    if (holiday.name === 'Thanksgiving') {
      parsed = giftWithoutContactSchema.safeParse(json);
    } else {
      // Use flexible contact schema for other holidays (supports creating new contacts)
      parsed = giftWithFlexibleContactSchema.safeParse(json);
    }

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

    // Handle contact creation/lookup for flexible schemas
    let contactId = data.contact_id;
    if (holiday.name !== 'Thanksgiving' && !contactId) {
      // Type assertion for flexible contact data
      const flexibleData = data as any;

      if (flexibleData.recipient_name && flexibleData.recipient_name.trim()) {
        // Get user's account
        const account = await prisma.account.findFirst({
          where: {
            members: {
              some: {
                userId: user.id,
              },
            },
          },
          select: { id: true },
        });

        if (!account) {
          return serverError('User account not found');
        }

        // Find or create contact like guest API does
        let contact = null;
        if (
          flexibleData.recipient_email &&
          typeof flexibleData.recipient_email === 'string' &&
          flexibleData.recipient_email.trim()
        ) {
          // Try to find existing contact with same email
          contact = await prisma.contact.findFirst({
            where: {
              accountId: account.id,
              email: flexibleData.recipient_email.trim(),
            },
          });
        }

        if (!contact) {
          // Create new contact
          contact = await prisma.contact.create({
            data: {
              id: uuidv4(),
              accountId: account.id,
              name: flexibleData.recipient_name.trim(),
              email:
                flexibleData.recipient_email &&
                typeof flexibleData.recipient_email === 'string' &&
                flexibleData.recipient_email.trim()
                  ? flexibleData.recipient_email.trim()
                  : null,
              phone:
                flexibleData.recipient_phone &&
                typeof flexibleData.recipient_phone === 'string' &&
                flexibleData.recipient_phone.trim()
                  ? flexibleData.recipient_phone.trim()
                  : null,
              streetAddress:
                flexibleData.recipient_address &&
                typeof flexibleData.recipient_address === 'string' &&
                flexibleData.recipient_address.trim()
                  ? flexibleData.recipient_address.trim()
                  : null,
              createdBy: user.id,
            },
          });
        } else {
          // Update existing contact if needed
          contact = await prisma.contact.update({
            where: { id: contact.id },
            data: {
              name: flexibleData.recipient_name.trim(),
              phone:
                flexibleData.recipient_phone &&
                typeof flexibleData.recipient_phone === 'string' &&
                flexibleData.recipient_phone.trim()
                  ? flexibleData.recipient_phone.trim()
                  : contact.phone,
              streetAddress:
                flexibleData.recipient_address &&
                typeof flexibleData.recipient_address === 'string' &&
                flexibleData.recipient_address.trim()
                  ? flexibleData.recipient_address.trim()
                  : contact.streetAddress,
              updatedAt: new Date(),
            },
          });
        }

        contactId = contact.id;
      }
    }

    // Debug logging for assignment field
    console.log('🔍 Gift creation debug:');
    console.log('  Raw assigned_to from request:', data.assigned_to);
    console.log('  Parsed data keys:', Object.keys(data));
    console.log('  assigned_to type:', typeof data.assigned_to);
    console.log('  Final contactId:', contactId);

    const gift = await prisma.gift.create({
      data: {
        holidayId: id,
        name: data.name,
        description: data.description ?? null,
        price: data.price ?? 0,
        actualPrice: data.actual_price ?? null,
        store: data.store ?? null,
        productLink:
          data.product_link && data.product_link.length > 0
            ? data.product_link
            : null,
        notes: data.notes ?? null,
        contactId: contactId, // Use resolved contactId
        assignedTo:
          data.assigned_to && data.assigned_to !== '' ? data.assigned_to : null, // Handle empty string
        createdBy: user.id,
      },
      include: {
        contact: true,
        assignedUser: true, // Include assigned user data
      },
    });

    // Transform gift to match the expected UI interface (same as GET endpoint)
    const transformedGift = {
      id: gift.id,
      holidayId: gift.holidayId,
      contactId: gift.contactId,
      name: gift.name,
      description: gift.description,
      price: Number(gift.price),
      actualPrice: gift.actualPrice ? Number(gift.actualPrice) : null,
      store: gift.store,
      productLink: gift.productLink,
      notes: gift.notes,
      recipient: gift.contact?.name || 'Unknown', // ✅ This is the key fix!
      isCompleted: gift.isCompleted,
      completedDate: gift.completedDate?.toISOString() || null,
      assignedTo: gift.assignedTo,
      assignedToName: gift.assignedUser?.name || null,
      createdBy: gift.createdBy,
      shareId: gift.shareId,
      createdAt: gift.createdAt.toISOString(),
      updatedAt: gift.updatedAt.toISOString(),
    };

    // Debug logging for created gift
    console.log('🎁 Gift created:');
    console.log('  Gift ID:', gift.id);
    console.log('  assignedTo field in DB:', gift.assignedTo);
    console.log('  Original assigned_to:', data.assigned_to);
    console.log('  Contact name:', gift.contact?.name);
    console.log('  Transformed recipient:', transformedGift.recipient);

    // Create assignment notification if assigned to someone other than creator
    if (data.assigned_to && data.assigned_to !== user.id) {
      try {
        const assignerName = await getUserName(user.id);

        // Database notification (existing system) - this is the primary system
        await createAssignmentNotification({
          userId: data.assigned_to,
          fromUserId: user.id,
          entityType: 'gift',
          entityId: gift.id,
          holidayId: id,
          title: 'Gift Assignment',
          message: `${assignerName} assigned you a gift: ${gift.name}`,
        });

        // Real-time notification (enhancement layer) - completely isolated
        // This will NEVER affect the main API operation
        setTimeout(async () => {
          try {
            await broadcastAssignment(
              data.assigned_to!, // assigneeUserId - we know it's not null from the if condition
              assignerName, // assignerName
              'gift', // entityType
              gift.name, // entityName
              gift.id, // entityId
              id, // holidayId
              holidayName, // holidayName
            );
          } catch (broadcastError) {
            // Silently log broadcast failures - they never affect the API
            console.warn(
              'Real-time notification broadcast failed (gift assignment succeeded):',
              broadcastError,
            );
          }
        }, 0); // Run in next tick to completely isolate from main operation
      } catch (notificationError) {
        // CRITICAL: Even if database notification fails, gift creation still succeeds
        // This maintains backward compatibility with existing behavior
        console.error(
          'Notification system failed (gift assignment succeeded):',
          notificationError,
        );
        // Note: The gift was still created successfully
      }
    }

    return created(transformedGift, {
      'Cache-Control': 'private, max-age=5, stale-while-revalidate=60',
    });
  } catch (error) {
    console.error('Error creating gift:', error);
    return serverError('Failed to create gift');
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

    const gifts = await prisma.gift.findMany({
      where: {
        holidayId: id,
      },
      include: {
        contact: true,
        assignedUser: true, // Include assigned user data
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform gifts to match the expected UI interface
    const transformedGifts = gifts.map(gift => ({
      id: gift.id,
      name: gift.name,
      description: gift.description,
      price: Number(gift.price),
      recipient: gift.contact?.name || 'Unknown',
      isCompleted: gift.isCompleted,
      completedDate: gift.completedDate?.toISOString(),
      store: gift.store,
      productLink: gift.productLink,
      notes: gift.notes,
      assignedTo: gift.assignedTo, // Include UUID
      assignedToName: gift.assignedUser?.name || null, // Include name for display
      shareId: gift.shareId,
      createdAt: gift.createdAt.toISOString(),
      updatedAt: gift.updatedAt.toISOString(),
    }));

    return ok(transformedGifts, {
      'Cache-Control': 'private, max-age=5, stale-while-revalidate=60',
    });
  } catch (error) {
    console.error('Error fetching gifts:', error);
    return serverError('Failed to fetch gifts');
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
    const { giftId, isCompleted } = json;

    if (typeof giftId !== 'string' || typeof isCompleted !== 'boolean') {
      return badRequest('Invalid request body');
    }

    // Get existing gift before update for completion notification
    const existingGift = await prisma.gift.findUnique({
      where: { id: giftId, holidayId: id },
      select: {
        isCompleted: true,
        assignedTo: true,
        createdBy: true,
        name: true,
      },
    });

    if (!existingGift) {
      return badRequest('Gift not found');
    }

    const updatedGift = await prisma.gift.update({
      where: {
        id: giftId,
        holidayId: id,
      },
      data: {
        isCompleted,
        completedDate: isCompleted ? new Date() : null,
      },
      include: {
        contact: true,
        assignedUser: true, // Include assigned user data
      },
    });

    // Transform gift to match the expected UI interface (same as POST and PATCH methods)
    const transformedGift = {
      id: updatedGift.id,
      holidayId: updatedGift.holidayId,
      contactId: updatedGift.contactId,
      name: updatedGift.name,
      description: updatedGift.description,
      price: Number(updatedGift.price),
      actualPrice: updatedGift.actualPrice ? Number(updatedGift.actualPrice) : null,
      store: updatedGift.store,
      productLink: updatedGift.productLink,
      notes: updatedGift.notes,
      recipient: updatedGift.contact?.name || 'Unknown', // ✅ This is the key fix!
      isCompleted: updatedGift.isCompleted,
      completedDate: updatedGift.completedDate?.toISOString() || null,
      assignedTo: updatedGift.assignedTo,
      assignedToName: updatedGift.assignedUser?.name || null,
      createdBy: updatedGift.createdBy,
      shareId: updatedGift.shareId,
      createdAt: updatedGift.createdAt.toISOString(),
      updatedAt: updatedGift.updatedAt.toISOString(),
    };

    // Send completion notification if gift was just completed
    if (isCompleted && !existingGift.isCompleted && existingGift.assignedTo) {
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
          const assignerUserId = existingGift.createdBy; // Original creator/assigner

          // Notify the original assigner if it's someone else
          if (assignerUserId && assignerUserId !== user.id) {
            await broadcastCompletion(
              assignerUserId, // ownerUserId (who assigned it)
              completerName, // completerName (who finished it)
              'gift', // entityType
              existingGift.name, // entityName
              giftId, // entityId
              id, // holidayId
              holidayName, // holidayName
            );
          }
        } catch (completionError) {
          // Silently log completion notification failures
          console.warn(
            'Completion notification failed (gift completion succeeded):',
            completionError,
          );
        }
      }, 0); // Run in next tick
    }

    // Transform the response to match UI expectations (using the complete transformedGift from above)
    return ok(transformedGift, {
      'Cache-Control': 'private, max-age=5, stale-while-revalidate=60',
    });
  } catch (error) {
    console.error('Error updating gift:', error);
    return serverError('Failed to update gift');
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;
    const forbidden = await assertHolidayAccess(id, user.id);
    if (forbidden) return forbidden;

    // Get holiday information to determine validation schema
    const holiday = await prisma.holiday.findUnique({
      where: { id },
      select: { name: true },
    });

    if (!holiday) {
      return badRequest('Holiday not found');
    }

    const json = await request.json();
    const { giftId, ...updateData } = json;

    if (!giftId) {
      return badRequest('giftId is required');
    }

    // Validate update data based on holiday
    let parsed;
    if (holiday.name === 'Thanksgiving') {
      parsed = giftWithoutContactSchema.safeParse(updateData);
    } else {
      parsed = giftWithFlexibleContactSchema.safeParse(updateData);
    }

    if (!parsed.success) {
      return badRequest(parsed.error.issues);
    }

    // Get existing gift for assignment change notifications
    const existingGift = await prisma.gift.findUnique({
      where: { id: giftId, holidayId: id },
      select: {
        assignedTo: true,
        name: true,
      },
    });

    if (!existingGift) {
      return badRequest('Gift not found');
    }

    // Build update data
    const updateGiftData: any = {
      name: updateData.name,
      description: updateData.description ?? null,
      price: updateData.price ?? 0,
      store: updateData.store ?? null,
      productLink:
        updateData.product_link && updateData.product_link.length > 0
          ? updateData.product_link
          : null,
      notes: updateData.notes ?? null,
      contactId: updateData.contact_id,
    };

    // Handle assignment changes if provided
    if (updateData.assigned_to !== undefined) {
      updateGiftData.assignedTo =
        updateData.assigned_to && updateData.assigned_to !== ''
          ? updateData.assigned_to
          : null;
    }

    // Update the gift with contact data included (same as POST method)
    const updatedGift = await prisma.gift.update({
      where: {
        id: giftId,
        holidayId: id,
      },
      data: updateGiftData,
      include: {
        contact: true,
        assignedUser: true, // Include assigned user data
      },
    });

    // Transform gift to match the expected UI interface (same as POST method)
    const transformedGift = {
      id: updatedGift.id,
      holidayId: updatedGift.holidayId,
      contactId: updatedGift.contactId,
      name: updatedGift.name,
      description: updatedGift.description,
      price: Number(updatedGift.price),
      actualPrice: updatedGift.actualPrice ? Number(updatedGift.actualPrice) : null,
      store: updatedGift.store,
      productLink: updatedGift.productLink,
      notes: updatedGift.notes,
      recipient: updatedGift.contact?.name || 'Unknown', // ✅ This is the key fix!
      isCompleted: updatedGift.isCompleted,
      completedDate: updatedGift.completedDate?.toISOString() || null,
      assignedTo: updatedGift.assignedTo,
      assignedToName: updatedGift.assignedUser?.name || null,
      createdBy: updatedGift.createdBy,
      shareId: updatedGift.shareId,
      createdAt: updatedGift.createdAt.toISOString(),
      updatedAt: updatedGift.updatedAt.toISOString(),
    };

    // Handle assignment change notifications
    if (
      updateData.assigned_to !== undefined &&
      existingGift.assignedTo !== updateGiftData.assignedTo
    ) {
      // Run assignment notifications asynchronously to never block the API response
      setTimeout(async () => {
        try {
          // Get holiday name and assigner name for notifications
          const [holidayName, assignerName] = await Promise.all([
            prisma.holiday
              .findUnique({
                where: { id },
                select: { name: true },
              })
              .then(h => h?.name || 'Holiday'),
            getUserName(user.id),
          ]);

          if (updateGiftData.assignedTo && updateGiftData.assignedTo !== user.id) {
            // New assignment or reassignment
            await broadcastAssignment(
              updateGiftData.assignedTo,
              assignerName,
              'gift',
              existingGift.name,
              giftId,
              id,
              holidayName,
            );
          } else if (
            existingGift.assignedTo &&
            existingGift.assignedTo !== user.id
          ) {
            // Assignment removed - notify the previous assignee
            await broadcastNotification({
              userId: existingGift.assignedTo,
              type: 'gift_assigned', // Using same type but with unassignment message
              title: 'Gift Unassigned',
              message: `${assignerName} removed your assignment from "${existingGift.name}"`,
              entityType: 'gift',
              entityId: giftId,
              holidayId: id,
              fromUserId: user.id,
              fromUser: { name: assignerName },
              holiday: { name: holidayName, holidayType: 'unknown' },
            });
          }
        } catch (assignmentError) {
          // Silently log assignment notification failures
          console.warn(
            'Assignment change notification failed (gift update succeeded):',
            assignmentError,
          );
        }
      }, 0); // Run in next tick
    }

    return ok(transformedGift, {
      'Cache-Control': 'private, max-age=5, stale-while-revalidate=60',
    });
  } catch (error) {
    console.error('Error updating gift:', error);
    return serverError('Failed to update gift');
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

    const { searchParams } = new URL(request.url);
    const giftId = searchParams.get('giftId');

    if (!giftId) {
      return badRequest('giftId parameter is required');
    }

    // Delete the gift
    await prisma.gift.delete({
      where: {
        id: giftId,
        holidayId: id,
      },
    });

    return ok(
      { success: true },
      {
        'Cache-Control': 'private, max-age=5, stale-while-revalidate=60',
      },
    );
  } catch (error) {
    console.error('Error deleting gift:', error);
    return serverError('Failed to delete gift');
  }
}
