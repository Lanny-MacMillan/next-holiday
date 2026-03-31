import { NextRequest } from 'next/server';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '@/lib/prisma';
import { requireAuth, assertHolidayAccess } from '@/lib/auth';
import { created, badRequest, serverError, ok } from '@/lib/http';

// Schema for new guest information
const newGuestSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  rsvpStatus: z.enum(['pending', 'confirmed', 'declined', 'maybe']).optional(),
  numberOfGuests: z.number().min(1).optional(),
  dietaryRestrictions: z.string().optional().or(z.literal('')),
  bringingDish: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  isCompleted: z.boolean().optional(),
});

// Schema for existing contact
const existingContactSchema = z.object({
  contact_id: z.string().uuid(),
  rsvpStatus: z.enum(['pending', 'confirmed', 'declined', 'maybe']).optional(),
  numberOfGuests: z.number().min(1).optional(),
  dietaryRestrictions: z.string().optional().or(z.literal('')),
  bringingDish: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  isCompleted: z.boolean().optional(),
});

// Union schema for both cases
const bodySchema = z.union([newGuestSchema, existingContactSchema]);

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
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return badRequest(parsed.error.issues);
    }

    const data = parsed.data;

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
      return badRequest([
        {
          code: 'custom',
          path: ['account'],
          message: 'No account access',
        },
      ]);
    }

    let contact;

    // Check if this is an existing contact or new guest
    if ('contact_id' in data) {
      // Existing contact case
      contact = await prisma.contact.findUnique({
        where: { id: data.contact_id },
      });

      if (!contact) {
        return badRequest([
          {
            code: 'custom',
            path: ['contact_id'],
            message: 'Contact not found',
          },
        ]);
      }

      // Verify the contact belongs to the user's account
      if (contact.accountId !== account.id) {
        return badRequest([
          {
            code: 'custom',
            path: ['contact_id'],
            message: 'Contact access denied',
          },
        ]);
      }
    } else {
      // New guest case - find or create contact
      if (data.email && data.email.trim()) {
        // Try to find existing contact with same email
        contact = await prisma.contact.findFirst({
          where: {
            accountId: account.id,
            email: data.email.trim(),
          },
        });

        if (contact) {
          // If the existing contact has the same name, reuse it
          if (contact.name.trim().toLowerCase() === data.name.trim().toLowerCase()) {
            // Contact with same name and email already exists - use it
            // We'll create/update the guest list entry below
          } else {
            // Different person has this email - return error
            return badRequest([
              {
                code: 'custom',
                path: ['email'],
                message: `Email "${data.email}" is already tied to another contact: "${contact.name}"`,
              },
            ]);
          }
        }
      }

      // Create new contact only if one wasn't found
      if (!contact) {
        contact = await prisma.contact.create({
          data: {
            id: uuidv4(),
            accountId: account.id,
            name: data.name,
            email: data.email || null,
            phone: data.phone || null,
            streetAddress: data.address || null,
            createdBy: user.id,
          },
        });
      }
    }

    // Create or update guest list entry
    const guestList = await prisma.guestList.upsert({
      where: {
        holidayId_contactId: {
          holidayId: id,
          contactId: contact.id,
        },
      },
      update: {
        rsvpStatus: data.rsvpStatus ?? null,
        notes: data.notes ?? null,
      },
      create: {
        holidayId: id,
        contactId: contact.id,
        rsvpStatus: data.rsvpStatus ?? null,
        notes: data.notes ?? null,
        createdBy: user.id,
      },
    });

    // Return the guest list with contact information
    const result = await prisma.guestList.findUnique({
      where: { id: guestList.id },
      include: { contact: true },
    });

    return created(result, {
      'Cache-Control': 'private, max-age=5, stale-while-revalidate=60',
    });
  } catch (error) {
    console.error('Error creating/updating guest list:', error);
    return serverError('Failed to create/update guest list');
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
    const { guestId, isCompleted } = json;

    if (!guestId || typeof isCompleted !== 'boolean') {
      return badRequest([
        {
          code: 'custom',
          path: ['body'],
          message: 'Invalid request body',
        },
      ]);
    }

    // Get current guest list entry to check current RSVP status
    const currentGuestList = await prisma.guestList.findUnique({
      where: { id: guestId },
    });

    if (!currentGuestList) {
      return badRequest([
        {
          code: 'custom',
          path: ['guestId'],
          message: 'Guest not found',
        },
      ]);
    }

    // Toggle RSVP status: if currently confirmed, set to pending; if pending, set to confirmed
    const newRsvpStatus =
      currentGuestList.rsvpStatus === 'confirmed' ? 'pending' : 'confirmed';

    // Update the guest list entry
    const guestList = await prisma.guestList.update({
      where: { id: guestId },
      data: {
        rsvpStatus: newRsvpStatus,
      },
      include: { contact: true },
    });

    return ok(guestList);
  } catch (error) {
    console.error('Error updating guest list:', error);
    return serverError('Failed to update guest list');
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

    const json = await request.json();
    const { guestId, ...updateData } = json;

    if (!guestId) {
      return badRequest([
        {
          code: 'custom',
          path: ['guestId'],
          message: 'Guest ID is required',
        },
      ]);
    }

    // Update the guest list entry
    const guestList = await prisma.guestList.update({
      where: { id: guestId },
      data: {
        rsvpStatus: updateData.rsvpStatus ?? undefined,
        notes: updateData.notes ?? undefined,
      },
      include: { contact: true },
    });

    // If contact information is being updated, update the contact too
    if (
      updateData.name ||
      updateData.email ||
      updateData.phone ||
      updateData.address
    ) {
      await prisma.contact.update({
        where: { id: guestList.contactId },
        data: {
          name: updateData.name ?? undefined,
          email: updateData.email ?? undefined,
          phone: updateData.phone ?? undefined,
          streetAddress: updateData.address ?? undefined,
          updatedAt: new Date(),
        },
      });

      // Fetch updated result
      const updatedResult = await prisma.guestList.findUnique({
        where: { id: guestId },
        include: { contact: true },
      });

      return ok(updatedResult);
    }

    return ok(guestList);
  } catch (error) {
    console.error('Error updating guest list:', error);
    return serverError('Failed to update guest list');
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
    const guestId = searchParams.get('guestId');

    if (!guestId) {
      return badRequest([
        {
          code: 'custom',
          path: ['guestId'],
          message: 'Guest ID is required',
        },
      ]);
    }

    // Delete the guest list entry
    await prisma.guestList.delete({
      where: { id: guestId },
    });

    return ok({ success: true });
  } catch (error) {
    console.error('Error deleting guest list:', error);
    return serverError('Failed to delete guest list');
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

    const guestList = await prisma.guestList.findMany({
      where: {
        holidayId: id,
      },
      include: {
        contact: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return ok(guestList, {
      'Cache-Control': 'private, max-age=5, stale-while-revalidate=60',
    });
  } catch (error) {
    console.error('Error fetching guest list:', error);
    return serverError('Failed to fetch guest list');
  }
}
