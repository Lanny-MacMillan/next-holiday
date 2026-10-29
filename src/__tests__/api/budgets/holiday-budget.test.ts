/** @jest-environment node */
const requireAuth = jest.fn();
const assertHolidayAccess = jest.fn();
jest.mock('@/lib/auth', () => ({
  requireAuth: (...a: unknown[]) => requireAuth(...a),
  assertHolidayAccess: (...a: unknown[]) => assertHolidayAccess(...a),
}));
jest.mock('@/lib/prisma', () => ({
  prisma: require('@/__tests__/support/api').prismaMock,
}));

import { NextResponse } from 'next/server';
import {
  apiRequest,
  prismaMock as db,
  readJson,
  resetPrismaMock,
} from '@/__tests__/support/api';
import { PUT } from '@/app/api/budgets/[holidayId]/route';

const me = { id: 'me-id', auth0Sub: 'auth0|me' };
const money = (n: number) => ({ toString: () => String(n) });

const put = async (body: unknown, holidayId = 'h1') =>
  readJson(
    await PUT(apiRequest(`/api/budgets/${holidayId}`, 'PUT', body), {
      params: Promise.resolve({ holidayId }),
    }),
  );

beforeEach(() => {
  resetPrismaMock();
  requireAuth.mockReset().mockResolvedValue(me);
  assertHolidayAccess.mockReset().mockResolvedValue(null);
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

describe('PUT /api/budgets/[holidayId]', () => {
  it('needs a signed-in user', async () => {
    requireAuth.mockRejectedValue(new Error('Authentication required'));

    expect((await put({ targetAmount: 100 })).status).toBe(401);
  });

  it.each([
    ['a negative amount', { targetAmount: -1 }],
    ['an amount that is not a number', { targetAmount: 'lots' }],
    ['no amount', {}],
  ])('refuses %s', async (_label, body) => {
    const { status } = await put(body);

    expect(status).toBe(400);
    expect(db.budget.update).not.toHaveBeenCalled();
  });

  it("refuses a holiday that is not the caller's", async () => {
    assertHolidayAccess.mockResolvedValue(
      NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    );

    expect((await put({ targetAmount: 100 })).status).toBe(403);
    expect(db.budget.findFirst).not.toHaveBeenCalled();
  });

  it('answers 404 when the holiday has no budget yet', async () => {
    db.budget.findFirst.mockResolvedValue(null);

    expect((await put({ targetAmount: 100 })).status).toBe(404);
    expect(db.budget.update).not.toHaveBeenCalled();
  });

  it('sets the new total, keeps what was already spent, and reports spend from transactions', async () => {
    db.budget.findFirst.mockResolvedValue({
      id: 'b1',
      spentAmount: money(40),
      transactions: [],
    });
    db.budget.update.mockResolvedValue({
      holidayId: 'h1',
      totalBudget: money(250),
      updatedAt: new Date('2030-01-01T00:00:00Z'),
      transactions: [{ amount: money(30) }, { amount: money(15.5) }],
    });

    const { status, body } = await put({ targetAmount: 250 });

    expect(status).toBe(200);
    expect(db.budget.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { holidayId: 'h1' } }),
    );
    const { where, data } = db.budget.update.mock.calls[0][0];
    expect(where).toEqual({ id: 'b1' });
    expect(data.totalBudget).toBe(250);
    expect(data.remainingAmount).toBe(210);
    expect(body.data).toEqual({
      holidayId: 'h1',
      targetAmount: 250,
      spentAmount: 45.5,
      updatedAt: '2030-01-01T00:00:00.000Z',
    });
  });

  it('answers 500 when saving fails', async () => {
    db.budget.findFirst.mockRejectedValue(new Error('db down'));

    expect((await put({ targetAmount: 100 })).status).toBe(500);
  });
});
