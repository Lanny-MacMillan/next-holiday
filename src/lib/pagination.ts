import { NextRequest } from 'next/server';

export interface PaginationParams {
  page: number;
  pageSize: number;
  offset: number;
  limit: number;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const MIN_PAGE_SIZE = 1;
const MIN_PAGE = 1;

/**
 * Parse pagination parameters from request query string
 */
export function parsePagination(request: NextRequest): PaginationParams {
  const searchParams = request.nextUrl.searchParams;

  let page = parseInt(searchParams.get('page') || '1', 10);
  let pageSize = parseInt(
    searchParams.get('pageSize') || String(DEFAULT_PAGE_SIZE),
    10,
  );

  // Enforce limits
  page = Math.max(MIN_PAGE, page);
  pageSize = Math.max(MIN_PAGE_SIZE, Math.min(MAX_PAGE_SIZE, pageSize));

  const offset = (page - 1) * pageSize;
  const limit = pageSize;

  return {
    page,
    pageSize,
    offset,
    limit,
  };
}

/**
 * Create pagination metadata
 */
export function createPaginationMeta(
  page: number,
  pageSize: number,
  total: number,
): PaginationMeta {
  const totalPages = Math.ceil(total / pageSize);

  return {
    page,
    pageSize,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

/**
 * Create a paginated response
 */
export function createPaginatedResponse<T>(
  data: T[],
  meta: PaginationMeta,
): PaginatedResponse<T> {
  return {
    data,
    meta,
  };
}

/**
 * Apply pagination to Prisma query
 */
export function applyPagination<T>(
  query: T,
  pagination: PaginationParams,
): T & { skip: number; take: number } {
  return {
    ...query,
    skip: pagination.offset,
    take: pagination.limit,
  };
}

/**
 * Get pagination info from URL search params
 */
export function getPaginationFromSearchParams(
  searchParams: URLSearchParams,
): PaginationParams {
  let page = parseInt(searchParams.get('page') || '1', 10);
  let pageSize = parseInt(
    searchParams.get('pageSize') || String(DEFAULT_PAGE_SIZE),
    10,
  );

  // Enforce limits
  page = Math.max(MIN_PAGE, page);
  pageSize = Math.max(MIN_PAGE_SIZE, Math.min(MAX_PAGE_SIZE, pageSize));

  const offset = (page - 1) * pageSize;
  const limit = pageSize;

  return {
    page,
    pageSize,
    offset,
    limit,
  };
}
