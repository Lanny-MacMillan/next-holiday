import { NextRequest } from 'next/server';
import {
  createPaginatedResponse,
  createPaginationMeta,
  parsePagination,
} from '@/lib/pagination';

const parse = (query = '') =>
  parsePagination(new NextRequest(`http://localhost/api/x${query}`));

describe('parsePagination', () => {
  it('defaults to the first page of 20', () => {
    expect(parse()).toEqual({ page: 1, pageSize: 20, offset: 0, limit: 20 });
  });

  it('computes the offset from the page and size', () => {
    expect(parse('?page=3&pageSize=10')).toEqual({
      page: 3,
      pageSize: 10,
      offset: 20,
      limit: 10,
    });
  });

  it('never goes below page 1 or a page size of 1', () => {
    expect(parse('?page=0&pageSize=0')).toMatchObject({ page: 1, pageSize: 1 });
    expect(parse('?page=-4&pageSize=-4')).toMatchObject({ page: 1, pageSize: 1 });
  });

  it('caps the page size at 100', () => {
    expect(parse('?pageSize=5000')).toMatchObject({ pageSize: 100, limit: 100 });
  });
});

describe('createPaginationMeta', () => {
  it('rounds the page count up', () => {
    expect(createPaginationMeta(1, 10, 25).totalPages).toBe(3);
  });

  it('knows when there is a next and previous page', () => {
    expect(createPaginationMeta(1, 10, 25)).toMatchObject({
      hasNext: true,
      hasPrev: false,
    });
    expect(createPaginationMeta(2, 10, 25)).toMatchObject({
      hasNext: true,
      hasPrev: true,
    });
    expect(createPaginationMeta(3, 10, 25)).toMatchObject({
      hasNext: false,
      hasPrev: true,
    });
  });

  it('handles an empty result', () => {
    expect(createPaginationMeta(1, 10, 0)).toMatchObject({
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
    });
  });
});

describe('createPaginatedResponse', () => {
  it('pairs the rows with their meta', () => {
    const meta = createPaginationMeta(1, 2, 2);
    expect(createPaginatedResponse(['a', 'b'], meta)).toEqual({
      data: ['a', 'b'],
      meta,
    });
  });
});
