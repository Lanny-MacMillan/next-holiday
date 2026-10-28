import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { POST, GET } from '@/app/api/holidays/[id]/delete-cascade/route';

// Mock the auth and server functions
jest.mock('@/lib/auth', () => ({
  requireAuth: jest.fn(),
}));

jest.mock('@/lib/rbac', () => ({
  requireAccountAccess: jest.fn(),
}));

jest.mock('@/lib/server/holidays/deleteHolidayData', () => ({
  deleteHolidayData: jest.fn(),
  validateHolidayDeletePermission: jest.fn(),
}));

import { requireAuth } from '@/lib/auth';
import {
  deleteHolidayData,
  validateHolidayDeletePermission,
} from '@/lib/server/holidays/deleteHolidayData';

const mockRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>;
const mockDeleteHolidayData = deleteHolidayData as jest.MockedFunction<
  typeof deleteHolidayData
>;
const mockValidateHolidayDeletePermission =
  validateHolidayDeletePermission as jest.MockedFunction<
    typeof validateHolidayDeletePermission
  >;

describe('/api/holidays/[id]/delete-cascade', () => {
  const mockUser = { id: 'user-123', email: 'test@example.com' };
  const mockHolidayId = 'holiday-456';
  const mockAccountId = 'account-789';
  const mockHoliday = {
    id: mockHolidayId,
    name: 'Test Holiday',
    accountId: mockAccountId,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAuth.mockResolvedValue(mockUser as any);
  });

  describe('POST /api/holidays/[id]/delete-cascade', () => {
    it('should return 400 for invalid request body', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/holidays/123/delete-cascade',
        {
          method: 'POST',
          body: JSON.stringify({ dryRun: 'not-a-boolean' }),
        },
      );

      const response = await POST(request, {
        params: Promise.resolve({ id: mockHolidayId }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data).toHaveProperty('error');
    });

    it('ignores unknown body keys (schema is not strict) and uses the defaults', async () => {
      mockValidateHolidayDeletePermission.mockResolvedValue({
        canDelete: true,
        holiday: mockHoliday,
      });
      mockDeleteHolidayData.mockResolvedValue({
        dryRun: false,
        totals: {},
        startedAt: '',
        finishedAt: '',
      });

      const request = new NextRequest(
        'http://localhost:3000/api/holidays/123/delete-cascade',
        { method: 'POST', body: JSON.stringify({ invalid: 'data' }) },
      );
      const response = await POST(request, {
        params: Promise.resolve({ id: mockHolidayId }),
      });

      expect(response.status).toBe(200);
      expect(mockDeleteHolidayData).toHaveBeenCalledWith({
        accountId: mockAccountId,
        holidayId: mockHolidayId,
        dryRun: false,
        force: false,
      });
    });

    it('should return 404 when holiday is not found', async () => {
      mockValidateHolidayDeletePermission.mockResolvedValue({
        canDelete: false,
        error: 'Holiday not found',
      });

      const request = new NextRequest(
        'http://localhost:3000/api/holidays/123/delete-cascade',
        {
          method: 'POST',
          body: JSON.stringify({ dryRun: false, force: false }),
        },
      );

      const response = await POST(request, {
        params: Promise.resolve({ id: mockHolidayId }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Holiday not found');
    });

    it('should return 403 when user lacks permission', async () => {
      mockValidateHolidayDeletePermission.mockResolvedValue({
        canDelete: false,
        error: 'Access denied',
      });

      const request = new NextRequest(
        'http://localhost:3000/api/holidays/123/delete-cascade',
        {
          method: 'POST',
          body: JSON.stringify({ dryRun: false, force: false }),
        },
      );

      const response = await POST(request, {
        params: Promise.resolve({ id: mockHolidayId }),
      });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Access denied');
    });

    it('should return 500 when feature flag is not enabled', async () => {
      mockValidateHolidayDeletePermission.mockResolvedValue({
        canDelete: true,
        holiday: mockHoliday,
      });

      mockDeleteHolidayData.mockResolvedValue({
        dryRun: false,
        totals: {},
        startedAt: new Date().toISOString(),
        finishedAt: new Date().toISOString(),
        error: 'Feature flag DELETE_HOLIDAY_CASCADE_ENABLED is not set',
      });

      const request = new NextRequest(
        'http://localhost:3000/api/holidays/123/delete-cascade',
        {
          method: 'POST',
          body: JSON.stringify({ dryRun: false, force: false }),
        },
      );

      const response = await POST(request, {
        params: Promise.resolve({ id: mockHolidayId }),
      });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Cascade delete feature is not enabled');
    });

    it('returns 400 with the explanation when the row limit is exceeded', async () => {
      mockValidateHolidayDeletePermission.mockResolvedValue({
        canDelete: true,
        holiday: mockHoliday,
      });

      mockDeleteHolidayData.mockResolvedValue({
        dryRun: false,
        totals: { Task: 1000, Gift: 1000 },
        startedAt: new Date().toISOString(),
        finishedAt: new Date().toISOString(),
        error:
          'Delete would affect 2000 rows (> 1000). Re-run with force=true if intended.',
        code: 'LIMIT_EXCEEDED',
      });

      const request = new NextRequest(
        'http://localhost:3000/api/holidays/123/delete-cascade',
        {
          method: 'POST',
          body: JSON.stringify({ dryRun: false, force: false }),
        },
      );

      const response = await POST(request, {
        params: Promise.resolve({ id: mockHolidayId }),
      });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('force=true');
    });

    it('still returns 500 for other deletion errors', async () => {
      mockValidateHolidayDeletePermission.mockResolvedValue({
        canDelete: true,
        holiday: mockHoliday,
      });

      mockDeleteHolidayData.mockResolvedValue({
        dryRun: false,
        totals: {},
        startedAt: '',
        finishedAt: '',
        error: 'connection reset',
      });

      const request = new NextRequest(
        'http://localhost:3000/api/holidays/123/delete-cascade',
        { method: 'POST', body: JSON.stringify({}) },
      );
      const response = await POST(request, {
        params: Promise.resolve({ id: mockHolidayId }),
      });

      expect(response.status).toBe(500);
      expect((await response.json()).error).toBe('connection reset');
    });

    it('should successfully delete holiday when all conditions are met', async () => {
      mockValidateHolidayDeletePermission.mockResolvedValue({
        canDelete: true,
        holiday: mockHoliday,
      });

      const mockResult = {
        dryRun: false,
        totals: { Holiday: 1, Task: 5, Gift: 3 },
        startedAt: new Date().toISOString(),
        finishedAt: new Date().toISOString(),
        holidayName: 'Test Holiday',
      };

      mockDeleteHolidayData.mockResolvedValue(mockResult);

      const request = new NextRequest(
        'http://localhost:3000/api/holidays/123/delete-cascade',
        {
          method: 'POST',
          body: JSON.stringify({ dryRun: false, force: false }),
        },
      );

      const response = await POST(request, {
        params: Promise.resolve({ id: mockHolidayId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.dryRun).toBe(false);
      expect(data.data.totals).toEqual({ Holiday: 1, Task: 5, Gift: 3 });
      expect(data.data.holidayName).toBe('Test Holiday');

      expect(mockDeleteHolidayData).toHaveBeenCalledWith({
        accountId: mockAccountId,
        holidayId: mockHolidayId,
        dryRun: false,
        force: false,
      });
    });

    it('should handle dry run requests correctly', async () => {
      mockValidateHolidayDeletePermission.mockResolvedValue({
        canDelete: true,
        holiday: mockHoliday,
      });

      const mockResult = {
        dryRun: true,
        totals: { Holiday: 1, Task: 5, Gift: 3 },
        startedAt: new Date().toISOString(),
        finishedAt: new Date().toISOString(),
        holidayName: 'Test Holiday',
      };

      mockDeleteHolidayData.mockResolvedValue(mockResult);

      const request = new NextRequest(
        'http://localhost:3000/api/holidays/123/delete-cascade',
        {
          method: 'POST',
          body: JSON.stringify({ dryRun: true, force: false }),
        },
      );

      const response = await POST(request, {
        params: Promise.resolve({ id: mockHolidayId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.dryRun).toBe(true);

      expect(mockDeleteHolidayData).toHaveBeenCalledWith({
        accountId: mockAccountId,
        holidayId: mockHolidayId,
        dryRun: true,
        force: false,
      });
    });
  });

  describe('GET /api/holidays/[id]/delete-cascade', () => {
    it('should return 404 when holiday is not found', async () => {
      mockValidateHolidayDeletePermission.mockResolvedValue({
        canDelete: false,
        error: 'Holiday not found',
      });

      const request = new NextRequest(
        'http://localhost:3000/api/holidays/123/delete-cascade',
        {
          method: 'GET',
        },
      );

      const response = await GET(request, {
        params: Promise.resolve({ id: mockHolidayId }),
      });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Holiday not found');
    });

    it('should return 403 when user lacks permission', async () => {
      mockValidateHolidayDeletePermission.mockResolvedValue({
        canDelete: false,
        error: 'Access denied',
      });

      const request = new NextRequest(
        'http://localhost:3000/api/holidays/123/delete-cascade',
        {
          method: 'GET',
        },
      );

      const response = await GET(request, {
        params: Promise.resolve({ id: mockHolidayId }),
      });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Access denied');
    });

    it('should return dry run results successfully', async () => {
      mockValidateHolidayDeletePermission.mockResolvedValue({
        canDelete: true,
        holiday: mockHoliday,
      });

      const mockResult = {
        dryRun: true,
        totals: { Holiday: 1, Task: 5, Gift: 3 },
        startedAt: new Date().toISOString(),
        finishedAt: new Date().toISOString(),
        holidayName: 'Test Holiday',
      };

      mockDeleteHolidayData.mockResolvedValue(mockResult);

      const request = new NextRequest(
        'http://localhost:3000/api/holidays/123/delete-cascade',
        {
          method: 'GET',
        },
      );

      const response = await GET(request, {
        params: Promise.resolve({ id: mockHolidayId }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.dryRun).toBe(true);
      expect(data.data.totals).toEqual({ Holiday: 1, Task: 5, Gift: 3 });
      expect(data.data.holidayName).toBe('Test Holiday');

      expect(mockDeleteHolidayData).toHaveBeenCalledWith({
        accountId: mockAccountId,
        holidayId: mockHolidayId,
        dryRun: true,
      });
    });

    it('returns 400 for a dry run when the row limit is exceeded', async () => {
      mockValidateHolidayDeletePermission.mockResolvedValue({
        canDelete: true,
        holiday: mockHoliday,
      });

      mockDeleteHolidayData.mockResolvedValue({
        dryRun: true,
        totals: {},
        startedAt: '',
        finishedAt: '',
        error:
          'Delete would affect 2000 rows (> 1000). Re-run with force=true if intended.',
        code: 'LIMIT_EXCEEDED',
      });

      const request = new NextRequest(
        'http://localhost:3000/api/holidays/123/delete-cascade',
        { method: 'GET' },
      );
      const response = await GET(request, {
        params: Promise.resolve({ id: mockHolidayId }),
      });

      expect(response.status).toBe(400);
      expect((await response.json()).error).toContain('force=true');
    });

    it('should return 500 when feature flag is not enabled', async () => {
      mockValidateHolidayDeletePermission.mockResolvedValue({
        canDelete: true,
        holiday: mockHoliday,
      });

      mockDeleteHolidayData.mockResolvedValue({
        dryRun: true,
        totals: {},
        startedAt: new Date().toISOString(),
        finishedAt: new Date().toISOString(),
        error: 'Feature flag DELETE_HOLIDAY_CASCADE_ENABLED is not set',
      });

      const request = new NextRequest(
        'http://localhost:3000/api/holidays/123/delete-cascade',
        {
          method: 'GET',
        },
      );

      const response = await GET(request, {
        params: Promise.resolve({ id: mockHolidayId }),
      });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Cascade delete feature is not enabled');
    });
  });
});
