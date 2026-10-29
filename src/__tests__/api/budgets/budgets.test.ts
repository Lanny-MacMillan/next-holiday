/** @jest-environment node */
const requireAuth = jest.fn();
jest.mock('@/lib/auth', () => ({
  requireAuth: (...a: unknown[]) => requireAuth(...a),
  getCurrentUser: jest.fn(),
}));
jest.mock('@/lib/prisma', () => ({
  prisma: require('@/__tests__/support/api').prismaMock,
}));

import {
  apiRequest,
  prismaMock as db,
  readJson,
  resetPrismaMock,
} from '@/__tests__/support/api';
import { GET as listBudgets, POST as postBudgets } from '@/app/api/budgets/route';
import {
  GET as listTransactions,
  POST as postTransaction,
} from '@/app/api/budget-transactions/route';

const me = { id: 'me-id', auth0Sub: 'auth0|me', name: 'Me', email: 'me@x.com' };
const withRole = (role: string | null) =>
  db.accountMember.findUnique.mockResolvedValue(role ? { role } : null);
const money = (n: number) => ({
  toString: () => String(n),
  plus: (x: number) => money(n + x),
  minus: (x: { toString(): string }) => money(n - Number(x.toString())),
});

beforeEach(() => {
  resetPrismaMock();
  requireAuth.mockReset().mockResolvedValue(me);
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

describe('GET /api/budgets', () => {
  it('lists budgets from accounts the user belongs to, with dates as plain strings', async () => {
    db.budget.findMany.mockResolvedValue([
      {
        id: 'b1',
        startDate: new Date('2025-12-01T00:00:00Z'),
        endDate: new Date('2025-12-31T00:00:00Z'),
      },
    ]);
    const { status, body } = await readJson(
      await listBudgets(apiRequest('/api/budgets')),
    );

    expect(status).toBe(200);
    expect(db.budget.findMany.mock.calls[0][0].where).toEqual({
      holiday: { account: { members: { some: { userId: 'me-id' } } } },
    });
    expect(body.data[0]).toMatchObject({
      id: 'b1',
      startDate: '2025-12-01',
      endDate: '2025-12-31',
    });
  });

  it('returns 500 when the database fails', async () => {
    db.budget.findMany.mockRejectedValue(new Error('db down'));
    expect(
      (await readJson(await listBudgets(apiRequest('/api/budgets')))).status,
    ).toBe(500);
  });
});

describe('POST /api/budgets (fetch by holiday ids)', () => {
  const fetchBy = (holidayIds: string[]) =>
    postBudgets(apiRequest('/api/budgets', 'POST', { holidayIds }));

  it('totals the transactions into a spent amount per holiday', async () => {
    db.budget.findMany.mockResolvedValue([
      {
        holidayId: 'h1',
        totalBudget: money(500),
        updatedAt: new Date('2025-01-02T03:04:05Z'),
        transactions: [{ amount: money(20.5) }, { amount: money(30) }],
      },
    ]);
    const { status, body } = await readJson(await fetchBy(['h1']));

    expect(status).toBe(200);
    expect(body.data).toEqual([
      {
        holidayId: 'h1',
        targetAmount: 500,
        spentAmount: 50.5,
        updatedAt: '2025-01-02T03:04:05.000Z',
      },
    ]);
  });

  it('rejects empty ids', async () => {
    expect((await readJson(await fetchBy(['']))).status).toBe(400);
  });

  it('only looks in accounts the caller belongs to', async () => {
    db.budget.findMany.mockResolvedValue([]);
    await fetchBy(['someone-elses-holiday']);
    expect(JSON.stringify(db.budget.findMany.mock.calls[0][0].where)).toContain(
      'me-id',
    );
  });
});

describe('POST /api/budgets (create)', () => {
  const valid = {
    holidayId: 'h1',
    name: 'Gifts',
    totalBudget: '250.50',
    currency: 'USD',
    startDate: '2025-12-01',
    endDate: '2025-12-31',
  };
  const create = (body: unknown = valid) =>
    postBudgets(apiRequest('/api/budgets', 'POST', body));

  beforeEach(() => {
    db.holiday.findUnique.mockResolvedValue({ accountId: 'acc1' });
    withRole('member');
    db.budget.create.mockImplementation(
      async ({ data }: { data: Record<string, unknown> }) => ({
        ...data,
        startDate: data.startDate,
        endDate: data.endDate,
      }),
    );
  });

  it('creates a budget with nothing spent yet', async () => {
    const { status, body } = await readJson(await create());

    expect(status).toBe(201);
    expect(db.budget.create.mock.calls[0][0].data).toMatchObject({
      holidayId: 'h1',
      name: 'Gifts',
      currency: 'USD',
      totalBudget: 250.5,
      spentAmount: 0,
      remainingAmount: 250.5,
      createdBy: 'me-id',
    });
    expect(body.data).toMatchObject({
      startDate: '2025-12-01',
      endDate: '2025-12-31',
    });
  });

  it.each([
    ['a missing name', { name: undefined }],
    ['a non-decimal amount', { totalBudget: 'lots' }],
    ['three decimal places', { totalBudget: '1.234' }],
    ['a badly formatted date', { startDate: '12/01/2025' }],
  ])('rejects %s', async (_label, patch) => {
    expect((await readJson(await create({ ...valid, ...patch }))).status).toBe(400);
    expect(db.budget.create).not.toHaveBeenCalled();
  });

  it('returns 404 for an unknown holiday', async () => {
    db.holiday.findUnique.mockResolvedValue(null);
    expect((await readJson(await create())).status).toBe(404);
    expect(db.budget.create).not.toHaveBeenCalled();
  });

  it('does not create a budget for someone outside the account', async () => {
    withRole(null);
    await create();
    expect(db.budget.create).not.toHaveBeenCalled();
  });

  it('returns 403 for someone outside the account', async () => {
    withRole(null);
    expect((await readJson(await create())).status).toBe(403);
  });
});

describe('GET /api/budget-transactions', () => {
  it('lists transactions in the caller’s accounts with plain date strings', async () => {
    db.budgetTransaction.findMany.mockResolvedValue([
      { id: 't1', transactionDate: new Date('2025-12-05T00:00:00Z') },
    ]);
    const { status, body } = await readJson(
      await listTransactions(apiRequest('/api/budget-transactions')),
    );

    expect(status).toBe(200);
    expect(
      JSON.stringify(db.budgetTransaction.findMany.mock.calls[0][0].where),
    ).toContain('me-id');
    expect(body.data).toEqual([{ id: 't1', transactionDate: '2025-12-05' }]);
  });

  it('returns 500 when the database fails', async () => {
    db.budgetTransaction.findMany.mockRejectedValue(new Error('db down'));
    expect(
      (
        await readJson(
          await listTransactions(apiRequest('/api/budget-transactions')),
        )
      ).status,
    ).toBe(500);
  });
});

describe('POST /api/budget-transactions', () => {
  const valid = {
    budgetId: 'b1',
    name: 'Wrapping paper',
    amount: '12.50',
    category: 'supplies',
    transactionDate: '2025-12-05',
  };
  const create = (body: unknown = valid) =>
    postTransaction(apiRequest('/api/budget-transactions', 'POST', body));

  beforeEach(() => {
    db.budget.findUnique.mockResolvedValue({
      holiday: { accountId: 'acc1' },
      spentAmount: money(100),
      totalBudget: money(500),
    });
    withRole('member');
    db.budgetTransaction.create.mockImplementation(
      async ({ data }: { data: Record<string, unknown> }) => ({ ...data }),
    );
    db.budget.update.mockResolvedValue({});
  });

  it('records the transaction and moves the budget totals together', async () => {
    const { status, body } = await readJson(await create());

    expect(status).toBe(201);
    expect(body.data).toMatchObject({
      budgetId: 'b1',
      amount: 12.5,
      createdBy: 'me-id',
      isExpense: true,
      transactionDate: '2025-12-05',
    });
    const update = db.budget.update.mock.calls[0][0];
    expect(update.where).toEqual({ id: 'b1' });
    expect(Number(update.data.spentAmount.toString())).toBe(112.5);
    expect(Number(update.data.remainingAmount.toString())).toBe(387.5);
  });

  it('rejects a bad amount or a missing category', async () => {
    expect((await readJson(await create({ ...valid, amount: '-5' }))).status).toBe(
      400,
    );
    expect((await readJson(await create({ ...valid, category: '' }))).status).toBe(
      400,
    );
    expect(db.budgetTransaction.create).not.toHaveBeenCalled();
  });

  it('returns 404 for an unknown budget', async () => {
    db.budget.findUnique.mockResolvedValue(null);
    expect((await readJson(await create())).status).toBe(404);
  });

  it('writes nothing for someone outside the account', async () => {
    withRole(null);
    await create();
    expect(db.budgetTransaction.create).not.toHaveBeenCalled();
    expect(db.budget.update).not.toHaveBeenCalled();
  });

  it('returns 403 for someone outside the account', async () => {
    withRole(null);
    expect((await readJson(await create())).status).toBe(403);
  });
});
