/** @jest-environment node */
import {
  apiRequest,
  prismaMock as db,
  readJson,
  resetPrismaMock,
} from '@/__tests__/support/api';

const requireAuth = jest.fn();
jest.mock('@/lib/auth', () => ({
  requireAuth: (...a: unknown[]) => requireAuth(...a),
  getCurrentUser: jest.fn(),
}));
const ensurePrismaConnection = jest.fn();
jest.mock('@/lib/prisma', () => ({
  prisma: require('@/__tests__/support/api').prismaMock,
  ensurePrismaConnection: (...a: unknown[]) => ensurePrismaConnection(...a),
}));

import { GET, POST } from '@/app/api/holidays/route';
import {
  GET as getPreferences,
  POST as savePreferences,
} from '@/app/api/holidays/preferences/route';

const ME = 'user-me';
const ACCOUNT = 'acct-1';

const holidayRow = (over = {}) => ({
  id: 'h1',
  accountId: ACCOUNT,
  holidayType: 'christmas',
  name: 'Christmas',
  startDate: new Date('2025-12-25T00:00:00Z'),
  endDate: null,
  countdownTimer: null,
  budgets: [],
  ...over,
});

beforeEach(() => {
  jest.clearAllMocks();
  resetPrismaMock();
  requireAuth.mockResolvedValue({ id: ME });
  ensurePrismaConnection.mockResolvedValue(true);
  db.accountMember.findUnique.mockResolvedValue({ role: 'member' });
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

const notAMember = () => db.accountMember.findUnique.mockResolvedValue(null);

describe('GET /holidays', () => {
  // Every filter is read with searchParams.get(), which gives null for a missing one, and the schema
  // does not accept null, so the request has to carry all five.
  const filters = {
    accountId: ACCOUNT,
    holidayType: 'christmas',
    q: 'x',
    sortBy: 'name',
    sortOrder: 'asc',
  };
  const list = (over: Record<string, string> = {}) =>
    GET(apiRequest(`/api/holidays?${new URLSearchParams({ ...filters, ...over })}`));

  beforeEach(() => {
    db.holiday.findMany.mockResolvedValue([holidayRow()]);
    db.holiday.count.mockResolvedValue(1);
  });

  it('returns 401 when authentication fails', async () => {
    requireAuth.mockRejectedValue(new Error('Authentication required'));
    expect((await readJson(await list())).status).toBe(401);
  });

  it('lists holidays when no filters are given', async () => {
    expect((await readJson(await GET(apiRequest('/api/holidays')))).status).toBe(
      200,
    );
  });

  it('lists only holidays in accounts the caller belongs to, with the filters applied', async () => {
    const { status, body } = await readJson(await list());

    expect(status).toBe(200);
    const args = db.holiday.findMany.mock.calls[0][0];
    expect(args.where.account).toEqual({ members: { some: { userId: ME } } });
    expect(args.where.accountId).toBe(ACCOUNT);
    expect(args.where.holidayType).toBe('christmas');
    expect(args.where.OR).toHaveLength(2);
    expect(db.holiday.count).toHaveBeenCalledWith({ where: args.where });
    expect(JSON.stringify(body.data)).toContain('2025-12-25');
  });

  it('sorts as asked', async () => {
    await list({ sortBy: 'startDate', sortOrder: 'desc' });
    expect(db.holiday.findMany.mock.calls[0][0].orderBy).toEqual({
      startDate: 'desc',
    });
  });

  it('rejects an unknown sort field with 400', async () => {
    expect((await readJson(await list({ sortBy: 'password' }))).status).toBe(400);
    expect(db.holiday.findMany).not.toHaveBeenCalled();
  });

  it('pages the results', async () => {
    await list({ page: '3', pageSize: '10' });
    const args = db.holiday.findMany.mock.calls[0][0];
    expect(args.skip).toBe(20);
    expect(args.take).toBe(10);
  });

  it('returns 500 when the database fails', async () => {
    db.holiday.findMany.mockRejectedValue(new Error('db'));
    expect((await readJson(await list())).status).toBe(500);
  });
});

describe('POST /holidays', () => {
  const valid = {
    accountId: ACCOUNT,
    holidayType: 'custom',
    name: 'Birthday',
    startDate: '2025-06-01',
    colorLight: '#fff',
    colorDark: '#000',
  };
  const post = (body: unknown) => POST(apiRequest('/api/holidays', 'POST', body));

  it('returns 401 when authentication fails', async () => {
    requireAuth.mockRejectedValue(new Error('Authentication required'));
    expect((await readJson(await post(valid))).status).toBe(401);
  });

  it.each([
    [{}],
    [{ ...valid, name: '' }],
    [{ ...valid, name: 'a'.repeat(101) }],
    [{ ...valid, startDate: '06/01/2025' }],
    [{ ...valid, endDate: 'later' }],
    [{ ...valid, colorLight: undefined }],
  ])('rejects an invalid body %p with 400', async body => {
    expect((await readJson(await post(body))).status).toBe(400);
    expect(db.holiday.create).not.toHaveBeenCalled();
  });

  it('creates the holiday owned by the caller and returns date-only strings', async () => {
    db.holiday.create.mockResolvedValue(
      holidayRow({
        startDate: new Date('2025-06-01T00:00:00Z'),
        endDate: new Date('2025-06-02T00:00:00Z'),
      }),
    );
    const { status, body } = await readJson(
      await post({ ...valid, endDate: '2025-06-02', isCustom: true }),
    );

    expect(status).toBe(201);
    const { data } = db.holiday.create.mock.calls[0][0];
    expect(data).toMatchObject({
      accountId: ACCOUNT,
      holidayType: 'custom',
      name: 'Birthday',
      createdBy: ME,
      isCustom: true,
    });
    expect(data.id).toEqual(expect.any(String));
    expect(data.startDate).toEqual(new Date('2025-06-01T00:00:00Z'));
    expect(data.endDate).toEqual(new Date('2025-06-02T00:00:00Z'));
    expect(body.data).toMatchObject({
      startDate: '2025-06-01',
      endDate: '2025-06-02',
    });
  });

  it('leaves the end date empty when none is given', async () => {
    db.holiday.create.mockResolvedValue(holidayRow());
    await post(valid);
    expect(db.holiday.create.mock.calls[0][0].data.endDate).toBeNull();
  });

  it('checks the caller belongs to the account', async () => {
    db.holiday.create.mockResolvedValue(holidayRow());
    await post(valid);
    expect(db.accountMember.findUnique).toHaveBeenCalledWith({
      where: { accountId_userId: { accountId: ACCOUNT, userId: ME } },
      select: { role: true },
    });
  });

  it('creates nothing in an account the caller does not belong to', async () => {
    notAMember();
    await post(valid);
    expect(db.holiday.create).not.toHaveBeenCalled();
  });

  it('answers 403 for a non-member', async () => {
    notAMember();
    expect((await readJson(await post(valid))).status).toBe(403);
  });

  it('returns 500 when the database fails', async () => {
    db.holiday.create.mockRejectedValue(new Error('db'));
    expect((await readJson(await post(valid))).status).toBe(500);
  });
});

describe('GET /holidays/preferences', () => {
  const get = (query = `?accountId=${ACCOUNT}`) =>
    getPreferences(apiRequest(`/api/holidays/preferences${query}`));

  it('returns 401 when authentication fails', async () => {
    requireAuth.mockRejectedValue(new Error('Authentication required'));
    expect((await readJson(await get())).status).toBe(401);
  });

  it('needs an accountId', async () => {
    const { status, body } = await readJson(await get(''));
    expect(status).toBe(400);
    expect(body.error).toBe('accountId is required');
  });

  it("lists the account's holidays as preferences, with the first budget and the timer", async () => {
    db.holiday.findMany.mockResolvedValue([
      holidayRow({
        budgets: [{ totalBudget: '250.50' }],
        countdownTimer: new Date('2025-12-24T09:00:00Z'),
      }),
      holidayRow({ id: 'h2', holidayType: 'easter' }),
    ]);
    const { status, body } = await readJson(await get());

    expect(status).toBe(200);
    expect(db.holiday.findMany).toHaveBeenCalledWith({
      where: { accountId: ACCOUNT },
      include: { budgets: true },
      orderBy: { holidayType: 'asc' },
    });
    expect(body.data).toEqual([
      {
        holiday: 'christmas',
        holidayId: 'h1',
        budget: 250.5,
        countdownTimer: '2025-12-24T09:00:00.000Z',
      },
      { holiday: 'easter', holidayId: 'h2' },
    ]);
  });

  it('lists nothing for an account the caller does not belong to', async () => {
    notAMember();
    await get();
    expect(db.holiday.findMany).not.toHaveBeenCalled();
  });

  it('answers 403 for a non-member', async () => {
    notAMember();
    expect((await readJson(await get())).status).toBe(403);
  });

  it('returns 500 when the database fails', async () => {
    db.holiday.findMany.mockRejectedValue(new Error('db'));
    expect((await readJson(await get())).status).toBe(500);
  });
});

describe('POST /holidays/preferences', () => {
  const save = (body: unknown) =>
    savePreferences(apiRequest('/api/holidays/preferences', 'POST', body));
  const when = '2025-12-24T09:00:00.000Z';

  beforeEach(() => {
    db.holiday.findMany.mockResolvedValue([]);
    db.holiday.create.mockImplementation(async ({ data }: any) => ({
      ...holidayRow(),
      ...data,
    }));
    db.holiday.update.mockImplementation(async ({ data }: any) => ({
      ...holidayRow(),
      ...data,
    }));
    db.budget.findFirst.mockResolvedValue(null);
    db.budget.create.mockImplementation(async ({ data }: any) => ({ ...data }));
    db.budget.update.mockImplementation(async ({ data }: any) => ({
      ...data,
      startDate: new Date('2025-01-01T00:00:00Z'),
      endDate: new Date('2025-01-01T00:00:00Z'),
    }));
  });

  it.each([
    [{}],
    [{ accountId: ACCOUNT }],
    [{ accountId: ACCOUNT, preferences: [{ holiday: '' }] }],
    [{ accountId: ACCOUNT, preferences: [{ holiday: 'x', budget: -1 }] }],
    [
      {
        accountId: ACCOUNT,
        preferences: [{ holiday: 'x', countdownTimer: 'soon' }],
      },
    ],
  ])('rejects an invalid body %p with 400', async body => {
    expect((await readJson(await save(body))).status).toBe(400);
    expect(db.holiday.findMany).not.toHaveBeenCalled();
  });

  it('reports an authentication failure with a refresh hint', async () => {
    requireAuth.mockRejectedValue(new Error('Authentication required'));
    const { status, body } = await readJson(
      await save({ accountId: ACCOUNT, preferences: [] }),
    );
    expect(status).toBe(500);
    expect(body.error).toBe(
      'Authentication required. Please refresh the page and try again.',
    );
  });

  it('changes nothing for an account the caller does not belong to', async () => {
    notAMember();
    await save({ accountId: ACCOUNT, preferences: [{ holiday: 'christmas' }] });
    expect(db.holiday.findMany).not.toHaveBeenCalled();
    expect(db.holiday.delete).not.toHaveBeenCalled();
  });

  it('answers 403 for a non-member', async () => {
    notAMember();
    expect(
      (await readJson(await save({ accountId: ACCOUNT, preferences: [] }))).status,
    ).toBe(403);
  });

  it('answers 500 when the database connection is down', async () => {
    ensurePrismaConnection.mockResolvedValue(false);
    const { status, body } = await readJson(
      await save({ accountId: ACCOUNT, preferences: [] }),
    );
    expect(status).toBe(500);
    expect(body.error).toBe(
      'Database connection error. Please try again in a moment.',
    );
    expect(db.holiday.findMany).not.toHaveBeenCalled();
  });

  it('creates a holiday with defaults, a budget and the timer for a new selection', async () => {
    const { status, body } = await readJson(
      await save({
        accountId: ACCOUNT,
        preferences: [{ holiday: 'christmas', budget: 300, countdownTimer: when }],
      }),
    );

    expect(status).toBe(200);
    expect(db.holiday.create.mock.calls[0][0].data).toMatchObject({
      accountId: ACCOUNT,
      holidayType: 'christmas',
      name: 'christmas',
      colorLight: '#3B82F6',
      colorDark: '#1E40AF',
      isCustom: false,
      createdBy: ME,
      countdownTimer: new Date(when),
    });
    expect(db.budget.create.mock.calls[0][0].data).toMatchObject({
      name: 'christmas Budget',
      totalBudget: 300,
      spentAmount: 0,
      remainingAmount: 300,
      currency: 'USD',
      createdBy: ME,
    });
    expect(body.data).toHaveLength(1);
    expect(body.data[0].holiday.countdownTimer).toBe(when);
    expect(body.data[0].budget.totalBudget).toBe(300);
  });

  it('updates the timer of a holiday that already exists, without creating another', async () => {
    db.holiday.findFirst.mockResolvedValue(holidayRow());
    await save({
      accountId: ACCOUNT,
      preferences: [{ holiday: 'christmas', countdownTimer: when, budget: 0 }],
    });

    expect(db.holiday.create).not.toHaveBeenCalled();
    expect(db.holiday.update.mock.calls[0][0].where).toEqual({ id: 'h1' });
    expect(db.holiday.update.mock.calls[0][0].data.countdownTimer).toEqual(
      new Date(when),
    );
  });

  it('clears the timer when none is sent', async () => {
    db.holiday.findFirst.mockResolvedValue(
      holidayRow({ countdownTimer: new Date(when) }),
    );
    await save({
      accountId: ACCOUNT,
      preferences: [{ holiday: 'christmas', budget: 1 }],
    });
    expect(db.holiday.update.mock.calls[0][0].data.countdownTimer).toBeNull();
  });

  it('updates an existing budget in place', async () => {
    db.holiday.findFirst.mockResolvedValue(holidayRow());
    db.budget.findFirst.mockResolvedValue({ id: 'b1' });
    await save({
      accountId: ACCOUNT,
      preferences: [{ holiday: 'christmas', budget: 80 }],
    });

    expect(db.budget.create).not.toHaveBeenCalled();
    expect(db.budget.update.mock.calls[0][0].where).toEqual({ id: 'b1' });
    expect(db.budget.update.mock.calls[0][0].data).toMatchObject({
      totalBudget: 80,
      remainingAmount: 80,
    });
  });

  it('removes the budget when none is sent', async () => {
    db.holiday.findFirst.mockResolvedValue(holidayRow());
    db.budget.findFirst.mockResolvedValue({ id: 'b1' });
    const { body } = await readJson(
      await save({ accountId: ACCOUNT, preferences: [{ holiday: 'christmas' }] }),
    );

    expect(db.budget.delete).toHaveBeenCalledWith({ where: { id: 'b1' } });
    expect(body.data[0].budget).toBeNull();
  });

  it('has nothing to remove when there is no budget and none is sent', async () => {
    db.holiday.findFirst.mockResolvedValue(holidayRow());
    await save({ accountId: ACCOUNT, preferences: [{ holiday: 'christmas' }] });
    expect(db.budget.delete).not.toHaveBeenCalled();
  });

  it('deletes holidays that are no longer selected', async () => {
    db.holiday.findMany.mockResolvedValue([
      holidayRow({ id: 'keep', holidayType: 'christmas' }),
      holidayRow({ id: 'drop', holidayType: 'easter' }),
    ]);
    await save({ accountId: ACCOUNT, preferences: [{ holiday: 'christmas' }] });

    expect(db.holiday.delete).toHaveBeenCalledTimes(1);
    expect(db.holiday.delete).toHaveBeenCalledWith({ where: { id: 'drop' } });
  });

  it('ignores wedding holidays', async () => {
    const { body } = await readJson(
      await save({
        accountId: ACCOUNT,
        preferences: [{ holiday: 'Wedding Day' }, { holiday: 'christmas' }],
      }),
    );
    expect(body.data).toHaveLength(1);
    expect(db.holiday.create.mock.calls[0][0].data.holidayType).toBe('christmas');
  });

  it('processes a repeated holiday once, preferring the entry that has a budget', async () => {
    const { body } = await readJson(
      await save({
        accountId: ACCOUNT,
        preferences: [
          { holiday: 'christmas' },
          { holiday: 'christmas', budget: 50 },
          { holiday: 'christmas', budget: 70 },
        ],
      }),
    );
    expect(body.data).toHaveLength(1);
    expect(db.budget.create.mock.calls[0][0].data.totalBudget).toBe(50);
  });

  it('keeps the first of repeated holidays when none has a budget', async () => {
    await save({
      accountId: ACCOUNT,
      preferences: [
        { holiday: 'easter', countdownTimer: when },
        { holiday: 'easter' },
      ],
    });
    expect(db.holiday.create).toHaveBeenCalledTimes(1);
    expect(db.holiday.create.mock.calls[0][0].data.countdownTimer).toEqual(
      new Date(when),
    );
  });

  it('runs the changes in a transaction with a long timeout', async () => {
    await save({ accountId: ACCOUNT, preferences: [{ holiday: 'christmas' }] });
    expect(db.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      timeout: 30000,
      maxWait: 35000,
      isolationLevel: 'ReadCommitted',
    });
  });

  it.each([
    [
      'a transaction failure',
      new Error('Transaction already closed'),
      'Database transaction error. Please try again. If the issue persists, try refreshing the page.',
    ],
    ['any other error', new Error('boom'), 'boom'],
  ])('reports %s', async (_, error, message) => {
    db.holiday.findMany.mockRejectedValue(error);
    const { status, body } = await readJson(
      await save({ accountId: ACCOUNT, preferences: [] }),
    );
    expect(status).toBe(500);
    expect(body.error).toBe(message);
  });

  it('uses a generic message for a non-Error failure', async () => {
    db.holiday.findMany.mockRejectedValue('nope');
    const { body } = await readJson(
      await save({ accountId: ACCOUNT, preferences: [] }),
    );
    expect(body.error).toBe('Failed to save holiday preferences');
  });
});
