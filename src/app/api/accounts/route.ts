import { NextRequest } from 'next/server';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, requireAuth } from '@/lib/auth';
import { requireAccountAccess } from '@/lib/rbac';
import {
  parsePagination,
  createPaginationMeta,
  createPaginatedResponse,
} from '@/lib/pagination';
import {
  ok,
  created,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  serverError,
} from '@/lib/http';

// Validation schemas
const CreateAccountSchema = z.object({
  name: z.string().min(1).max(100),
});

const UpdateAccountSchema = z.object({
  name: z.string().min(1).max(100).optional(),
});

const AccountQuerySchema = z.object({
  q: z.string().optional(),
  sortBy: z.enum(['name', 'createdAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

// GET /api/accounts - List user's accounts
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const pagination = parsePagination(request);

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryResult = AccountQuerySchema.safeParse({
      q: searchParams.get('q'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder'),
    });

    if (!queryResult.success) {
      return badRequest(queryResult.error.issues);
    }

    const { q, sortBy, sortOrder } = queryResult.data;

    // Build where clause
    const where = {
      members: {
        some: {
          userId: user.id,
        },
      },
      ...(q && {
        name: {
          contains: q,
          mode: 'insensitive' as const,
        },
      }),
    };

    // Build order by clause
    const orderBy = sortBy
      ? ({ [sortBy]: sortOrder || 'asc' } as const)
      : ({ createdAt: 'desc' } as const);

    // Get accounts with pagination
    const [accounts, total] = await Promise.all([
      prisma.account.findMany({
        where,
        orderBy,
        skip: pagination.offset,
        take: pagination.limit,
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
          _count: {
            select: {
              holidays: true,
              contacts: true,
            },
          },
        },
      }),
      prisma.account.count({ where }),
    ]);

    const meta = createPaginationMeta(pagination.page, pagination.pageSize, total);
    const response = createPaginatedResponse(accounts, meta);

    return ok(response);
  } catch (error) {
    console.error('Error fetching accounts:', error);
    return serverError('Failed to fetch accounts');
  }
}

// POST /api/accounts - Create new account
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    // Parse and validate request body
    const body = await request.json();
    const validation = CreateAccountSchema.safeParse(body);

    if (!validation.success) {
      return badRequest(validation.error.issues);
    }

    const { name } = validation.data;

    // Create account with user as owner
    const account = await prisma.account.create({
      data: {
        id: uuidv4(),
        name,
        ownerUserId: user.id,
        members: {
          create: {
            userId: user.id,
            role: 'owner',
          },
        },
      },
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

    return created(account);
  } catch (error) {
    console.error('Error creating account:', error);
    return serverError('Failed to create account');
  }
}
