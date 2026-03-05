import { z } from 'zod';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string | z.ZodIssue[];
}

export interface PaginatedApiResponse<T = unknown> extends ApiResponse<T[]> {
  meta?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ErrorResponse {
  success: false;
  error: string | z.ZodIssue[];
}

export interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
}

// Zod schemas for common API patterns
export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export const IdParamSchema = z.object({
  id: z.string().uuid(),
});

export const AccountIdParamSchema = z.object({
  accountId: z.string().uuid(),
});

export const HolidayIdParamSchema = z.object({
  holidayId: z.string().uuid(),
});

// Common query parameter schemas
export const SearchQuerySchema = z.object({
  q: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const FilterQuerySchema = z.object({
  status: z.string().optional(),
  category: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});
