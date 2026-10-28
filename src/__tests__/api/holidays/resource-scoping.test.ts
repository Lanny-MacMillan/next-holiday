/** @jest-environment node */
import { NextRequest } from 'next/server';

const user = { id: 'me-id', auth0Sub: 'auth0|me' };
const requireAuth = jest.fn();
const assertHolidayAccess = jest.fn();
jest.mock('@/lib/auth', () => ({
  requireAuth: (...a: unknown[]) => requireAuth(...a),
  assertHolidayAccess: (...a: unknown[]) => assertHolidayAccess(...a),
}));

const db = {
  gift: { findFirst: jest.fn(), update: jest.fn(), delete: jest.fn() },
  task: { findFirst: jest.fn(), update: jest.fn(), delete: jest.fn() },
  budget: { findFirst: jest.fn(), update: jest.fn() },
};
jest.mock('@/lib/prisma', () => ({ prisma: db }));
jest.mock('@/lib/notifications', () => ({
  createAssignmentNotification: jest.fn(),
  getUserName: jest.fn(),
}));
jest.mock('@/lib/realTimeNotifications', () => ({ broadcastAssignment: jest.fn() }));

import {
  DELETE as deleteGift,
  PATCH as patchGift,
} from '@/app/api/holidays/[id]/gifts/[giftId]/route';
import {
  DELETE as deleteTask,
  PATCH as patchTask,
} from '@/app/api/holidays/[id]/tasks/[taskId]/route';
import * as budgetRoute from '@/app/api/budgets/[holidayId]/route';

const req = (method: string, body?: unknown) =>
  new NextRequest('http://localhost/x', {
    method,
    body: body ? JSON.stringify(body) : undefined,
  });

const HOLIDAY = '11111111-1111-1111-1111-111111111111';

beforeEach(() => {
  jest.clearAllMocks();
  requireAuth.mockResolvedValue(user);
  assertHolidayAccess.mockResolvedValue(null); // caller owns HOLIDAY
});

describe("gifts can't be reached through someone else's id", () => {
  const params = {
    params: Promise.resolve({ id: HOLIDAY, giftId: 'victims-gift' }),
  };

  it('PATCH looks the gift up within the authorised holiday and 404s otherwise', async () => {
    db.gift.findFirst.mockResolvedValue(null); // gift belongs to another holiday
    const res = await patchGift(req('PATCH', { name: 'pwned' }), params);
    expect(res.status).toBe(404);
    expect(db.gift.findFirst).toHaveBeenCalledWith({
      where: { id: 'victims-gift', holidayId: HOLIDAY },
    });
    expect(db.gift.update).not.toHaveBeenCalled();
  });

  it('DELETE 404s and deletes nothing', async () => {
    db.gift.findFirst.mockResolvedValue(null);
    const res = await deleteGift(req('DELETE'), params);
    expect(res.status).toBe(404);
    expect(db.gift.delete).not.toHaveBeenCalled();
  });
});

describe("tasks can't be reached through someone else's id", () => {
  const params = {
    params: Promise.resolve({ id: HOLIDAY, taskId: 'victims-task' }),
  };

  it('PATCH 404s and updates nothing', async () => {
    db.task.findFirst.mockResolvedValue(null);
    const res = await patchTask(req('PATCH', { title: 'pwned' }), params);
    expect(res.status).toBe(404);
    expect(db.task.findFirst.mock.calls[0][0].where).toEqual({
      id: 'victims-task',
      holidayId: HOLIDAY,
    });
    expect(db.task.update).not.toHaveBeenCalled();
  });

  it('DELETE 404s and deletes nothing', async () => {
    db.task.findFirst.mockResolvedValue(null);
    const res = await deleteTask(req('DELETE'), params);
    expect(res.status).toBe(404);
    expect(db.task.delete).not.toHaveBeenCalled();
  });
});

describe('budget update requires access to the holiday', () => {
  const handler = Object.values(budgetRoute).find(
    fn => typeof fn === 'function',
  ) as (r: NextRequest, c: unknown) => Promise<Response>;
  const params = { params: Promise.resolve({ holidayId: 'someone-elses-holiday' }) };

  it('is refused when the caller has no access, and writes nothing', async () => {
    assertHolidayAccess.mockResolvedValue(
      new Response(JSON.stringify({ success: false, error: 'Forbidden' }), {
        status: 403,
      }),
    );
    const res = await handler(req('PUT', { targetAmount: 1 }), params);
    expect(res.status).toBe(403);
    expect(assertHolidayAccess).toHaveBeenCalledWith(
      'someone-elses-holiday',
      user.id,
    );
    expect(db.budget.update).not.toHaveBeenCalled();
  });
});
