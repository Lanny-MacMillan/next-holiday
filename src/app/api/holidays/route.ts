import { NextRequest } from 'next/server';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, requireAuth } from '@/lib/auth';
import { requireAccountAccess } from '@/lib/rbac';
import { toPlain } from '@/lib/json';
import { dateOnlyToUTC, toDateOnlyString } from '@/lib/dates';
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
const CreateHolidaySchema = z.object({
  accountId: z.string().min(1),
  holidayType: z.string().min(1),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD format
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(), // YYYY-MM-DD format
  colorLight: z.string().min(1),
  colorDark: z.string().min(1),
  isCustom: z.boolean().optional(),
});

const UpdateHolidaySchema = z.object({
  holidayType: z.string().min(1).optional(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  colorLight: z.string().min(1).optional(),
  colorDark: z.string().min(1).optional(),
  isCustom: z.boolean().optional(),
});

const HolidayQuerySchema = z.object({
  accountId: z.string().optional(),
  holidayType: z.string().optional(),
  q: z.string().optional(),
  sortBy: z.enum(['name', 'startDate', 'createdAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

// GET /api/holidays - List holidays
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const pagination = parsePagination(request);

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryResult = HolidayQuerySchema.safeParse({
      accountId: searchParams.get('accountId'),
      holidayType: searchParams.get('holidayType'),
      q: searchParams.get('q'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder'),
    });

    if (!queryResult.success) {
      return badRequest(queryResult.error.issues);
    }

    const { accountId, holidayType, q, sortBy, sortOrder } = queryResult.data;

    // Build where clause
    const where = {
      account: {
        members: {
          some: {
            userId: user.id,
          },
        },
      },
      ...(accountId && { accountId }),
      ...(holidayType && { holidayType }),
      ...(q && {
        OR: [
          { name: { contains: q, mode: 'insensitive' as const } },
          { description: { contains: q, mode: 'insensitive' as const } },
        ],
      }),
    };

    // Build order by clause
    const orderBy = sortBy
      ? ({ [sortBy]: sortOrder || 'asc' } as const)
      : ({ startDate: 'asc' } as const);

    // Get holidays with pagination
    const [holidays, total] = await Promise.all([
      prisma.holiday.findMany({
        where,
        orderBy,
        skip: pagination.offset,
        take: pagination.limit,
        include: {
          account: {
            select: {
              id: true,
              name: true,
            },
          },
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              tasks: true,
              gifts: true,
              cards: true,
              budgets: true,
            },
          },
        },
      }),
      prisma.holiday.count({ where }),
    ]);

    // Transform date fields to strings for API response
    const transformedHolidays = holidays.map(holiday => ({
      ...holiday,
      startDate: toDateOnlyString(holiday.startDate),
      endDate: toDateOnlyString(holiday.endDate),
    }));

    const meta = createPaginationMeta(pagination.page, pagination.pageSize, total);
    const response = createPaginatedResponse(transformedHolidays, meta);

    return ok(toPlain(response));
  } catch (error) {
    console.error('Error fetching holidays:', error);
    return serverError('Failed to fetch holidays');
  }
}

// POST /api/holidays - Create new holiday
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    // Parse and validate request body
    const body = await request.json();
    const validation = CreateHolidaySchema.safeParse(body);

    if (!validation.success) {
      return badRequest(validation.error.issues);
    }

    const { accountId, startDate, endDate, ...data } = validation.data;

    // Check account access
    await requireAccountAccess(accountId, user.id);

    // Create holiday
    const holiday = await prisma.holiday.create({
      data: {
        id: uuidv4(),
        accountId,
        startDate: dateOnlyToUTC(startDate),
        endDate: endDate ? dateOnlyToUTC(endDate) : null,
        createdBy: user.id,
        ...data,
      },
      include: {
        account: {
          select: {
            id: true,
            name: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Transform date fields to strings for API response
    const transformedHoliday = {
      ...holiday,
      startDate: toDateOnlyString(holiday.startDate),
      endDate: toDateOnlyString(holiday.endDate),
    };

    return created(toPlain(transformedHoliday));
  } catch (error) {
    console.error('Error creating holiday:', error);
    return serverError('Failed to create holiday');
  }
}
