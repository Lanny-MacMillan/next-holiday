import { NextRequest } from 'next/server';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { toPlain } from '@/lib/json';
import {
  ok,
  created,
  badRequest,
  unauthorized,
  forbidden,
  serverError,
} from '@/lib/http';

// Validation schemas
const CreateContactSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().min(1).max(20),
  streetAddress: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  state: z.string().optional().or(z.literal('')),
  zipCode: z.string().optional().or(z.literal('')),
  relationship: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
});

const UpdateContactSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().min(1).max(20).optional(),
  streetAddress: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  state: z.string().optional().or(z.literal('')),
  zipCode: z.string().optional().or(z.literal('')),
  relationship: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
});

// GET /api/contacts - List current user's contacts
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
      return forbidden('No account access');
    }

    // Get contacts for this account
    const contacts = await prisma.contact.findMany({
      where: {
        accountId: account.id,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return ok(toPlain(contacts));
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return unauthorized('Authentication required');
    }
    console.error('Error fetching contacts:', error);
    return serverError('Failed to fetch contacts');
  }
}

// POST /api/contacts - Create/update contact (idempotent upsert by email if provided)
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();

    // Validate request body
    const validationResult = CreateContactSchema.safeParse(body);
    if (!validationResult.success) {
      return badRequest(validationResult.error.issues);
    }

    const contactData = validationResult.data;

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
      return forbidden('No account access');
    }

    let contact;

    // If email is provided, try to upsert by email
    if (contactData.email && contactData.email.trim()) {
      // First try to find existing contact with same email
      const existingContact = await prisma.contact.findFirst({
        where: {
          accountId: account.id,
          email: contactData.email.trim(),
        },
      });

      if (existingContact) {
        // Update existing contact
        contact = await prisma.contact.update({
          where: { id: existingContact.id },
          data: {
            name: contactData.name,
            phone: contactData.phone,
            streetAddress: contactData.streetAddress || null,
            city: contactData.city || null,
            state: contactData.state || null,
            postalCode: contactData.zipCode || null,
            relationship: contactData.relationship || null,
            notes: contactData.notes || null,
            updatedAt: new Date(),
          },
        });
      } else {
        // Create new contact
        contact = await prisma.contact.create({
          data: {
            id: uuidv4(),
            accountId: account.id,
            name: contactData.name,
            email: contactData.email.trim(),
            phone: contactData.phone,
            streetAddress: contactData.streetAddress || null,
            city: contactData.city || null,
            state: contactData.state || null,
            postalCode: contactData.zipCode || null,
            relationship: contactData.relationship || null,
            notes: contactData.notes || null,
            createdBy: user.id,
          },
        });
      }
    } else {
      // Create new contact without email
      contact = await prisma.contact.create({
        data: {
          id: uuidv4(),
          accountId: account.id,
          name: contactData.name,
          phone: contactData.phone,
          streetAddress: contactData.streetAddress || null,
          city: contactData.city || null,
          state: contactData.state || null,
          postalCode: contactData.zipCode || null,
          relationship: contactData.relationship || null,
          notes: contactData.notes || null,
          createdBy: user.id,
        },
      });
    }

    return created(toPlain(contact));
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return unauthorized('Authentication required');
    }
    console.error('Error creating contact:', error);
    return serverError('Failed to create contact');
  }
}
