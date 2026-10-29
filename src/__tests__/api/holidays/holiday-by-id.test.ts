/** @jest-environment node */
import {
  apiRequest,
  prismaMock as db,
  readJson,
  resetPrismaMock,
  routeParams,
} from '@/__tests__/support/api';

const requireAuth = jest.fn();
jest.mock('@/lib/auth', () => ({
  requireAuth: (...a: unknown[]) => requireAuth(...a),
  getCurrentUser: jest.fn(),
}));
jest.mock('@/lib/prisma', () => ({
  prisma: require('@/__tests__/support/api').prismaMock,
}));

import { DELETE, GET, PUT } from '@/app/api/holidays/[id]/route';
import {
  DELETE as clearCountdown,
  PUT as setCountdown,
} from '@/app/api/holidays/[id]/countdown/route';
import { POST as clearData } from '@/app/api/holidays/[id]/clear-data/route';

const ID = 'holiday-1';
const ME = 'user-me';
const ctx = routeParams({ id: ID });

const holidayRow = (over = {}) => ({
  id: ID,
  accountId: 'acct-1',
  name: 'Christmas',
  startDate: new Date('2025-12-25T00:00:00Z'),
  endDate: new Date('2025-12-26T00:00:00Z'),
  countdownTimer: null,
  budgets: [],
  ...over,
});

beforeEach(() => {
  jest.clearAllMocks();
  resetPrismaMock();
  requireAuth.mockResolvedValue({ id: ME });
  db.accountMember.findUnique.mockResolvedValue({ role: 'member' });
  db.holiday.findUnique.mockResolvedValue({
    accountId: 'acct-1',
    name: 'Christmas',
  });
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

const notAMember = () => db.accountMember.findUnique.mockResolvedValue(null);

describe('authentication', () => {
  it.each([
    ['GET', () => GET(apiRequest('/x'), ctx)],
    ['PUT', () => PUT(apiRequest('/x', 'PUT', { name: 'a' }), ctx)],
    ['DELETE', () => DELETE(apiRequest('/x', 'DELETE'), ctx)],
    [
      'countdown PUT',
      () => setCountdown(apiRequest('/x', 'PUT', { countdownTimer: null }), ctx),
    ],
    ['countdown DELETE', () => clearCountdown(apiRequest('/x', 'DELETE'), ctx)],
    ['clear-data POST', () => clearData(apiRequest('/x', 'POST'), ctx)],
  ])(
    '%s returns 500 when authentication fails (the middleware normally stops this first)',
    async (_, call) => {
      requireAuth.mockRejectedValue(new Error('Authentication required'));
      expect((await readJson(await call())).status).toBe(500);
    },
  );
});

describe('GET /holidays/[id]', () => {
  it('only finds a holiday in an account the caller belongs to', async () => {
    db.holiday.findFirst.mockResolvedValue(holidayRow({ _count: { tasks: 1 } }));
    const { status, body } = await readJson(await GET(apiRequest('/x'), ctx));

    expect(status).toBe(200);
    expect(db.holiday.findFirst.mock.calls[0][0].where).toEqual({
      id: ID,
      account: { members: { some: { userId: ME } } },
    });
    expect(body.data).toMatchObject({
      id: ID,
      startDate: '2025-12-25',
      endDate: '2025-12-26',
    });
  });

  it('answers 404 when the holiday is missing or belongs to another account', async () => {
    db.holiday.findFirst.mockResolvedValue(null);
    expect((await readJson(await GET(apiRequest('/x'), ctx))).status).toBe(404);
  });

  it('returns 500 when the database fails', async () => {
    db.holiday.findFirst.mockRejectedValue(new Error('db'));
    expect((await readJson(await GET(apiRequest('/x'), ctx))).status).toBe(500);
  });
});

describe('PUT /holidays/[id]', () => {
  const put = (body: unknown) => PUT(apiRequest('/x', 'PUT', body), ctx);

  it.each([
    [{ name: '' }],
    [{ name: 'a'.repeat(101) }],
    [{ startDate: '25/12/2025' }],
    [{ endDate: 'tomorrow' }],
    [{ isCustom: 'yes' }],
  ])('rejects an invalid body %p with 400', async body => {
    expect((await readJson(await put(body))).status).toBe(400);
    expect(db.holiday.update).not.toHaveBeenCalled();
  });

  it('answers 404 when the holiday does not exist', async () => {
    db.holiday.findUnique.mockResolvedValue(null);
    expect((await readJson(await put({ name: 'a' }))).status).toBe(404);
  });

  it('updates the holiday and returns date-only strings', async () => {
    db.holiday.update.mockResolvedValue(holidayRow({ name: 'Xmas' }));
    const { status, body } = await readJson(
      await put({ name: 'Xmas', startDate: '2025-12-24', endDate: '2025-12-27' }),
    );

    expect(status).toBe(200);
    const { where, data } = db.holiday.update.mock.calls[0][0];
    expect(where).toEqual({ id: ID });
    expect(data.name).toBe('Xmas');
    expect(data.startDate).toBeInstanceOf(Date);
    expect(data.endDate).toBeInstanceOf(Date);
    expect(body.data).toMatchObject({ name: 'Xmas', startDate: '2025-12-25' });
  });

  it('cannot clear an end date: an empty one fails validation', async () => {
    expect((await readJson(await put({ endDate: '' }))).status).toBe(400);
  });

  it('only sends the fields that were given', async () => {
    db.holiday.update.mockResolvedValue(holidayRow());
    await put({ description: 'd' });
    expect(db.holiday.update.mock.calls[0][0].data).toEqual({ description: 'd' });
  });

  it("refuses someone who is not a member of the holiday's account", async () => {
    notAMember();
    await put({ name: 'a' });
    expect(db.accountMember.findUnique).toHaveBeenCalledWith({
      where: { accountId_userId: { accountId: 'acct-1', userId: ME } },
      select: { role: true },
    });
    expect(db.holiday.update).not.toHaveBeenCalled();
  });

  // KNOWN ISSUE: a non-member gets a 500 "Failed to update holiday" rather than 403, because the
  // Forbidden response thrown by requireAccountAccess is caught by the route's catch-all.
  it.failing('answers 403 for someone who is not a member', async () => {
    notAMember();
    expect((await readJson(await put({ name: 'a' }))).status).toBe(403);
  });

  it('returns 500 when the database fails', async () => {
    db.holiday.update.mockRejectedValue(new Error('db'));
    expect((await readJson(await put({ name: 'a' }))).status).toBe(500);
  });
});

describe('DELETE /holidays/[id]', () => {
  const del = () => DELETE(apiRequest('/x', 'DELETE'), ctx);

  it('deletes the holiday for a member', async () => {
    const { status, body } = await readJson(await del());
    expect(status).toBe(200);
    expect(body.data).toEqual({ success: true });
    expect(db.holiday.delete).toHaveBeenCalledWith({ where: { id: ID } });
  });

  it('answers 404 when the holiday does not exist', async () => {
    db.holiday.findUnique.mockResolvedValue(null);
    expect((await readJson(await del())).status).toBe(404);
    expect(db.holiday.delete).not.toHaveBeenCalled();
  });

  it('does not delete for someone who is not a member', async () => {
    notAMember();
    await del();
    expect(db.holiday.delete).not.toHaveBeenCalled();
  });

  it.failing('answers 403 for someone who is not a member', async () => {
    notAMember();
    expect((await readJson(await del())).status).toBe(403);
  });

  it('returns 500 when the database fails', async () => {
    db.holiday.delete.mockRejectedValue(new Error('db'));
    expect((await readJson(await del())).status).toBe(500);
  });
});

describe('countdown', () => {
  const when = '2025-12-24T09:00:00.000Z';
  const set = (body: unknown) => setCountdown(apiRequest('/x', 'PUT', body), ctx);
  const budget = {
    id: 'b1',
    startDate: new Date('2025-11-01T00:00:00Z'),
    endDate: new Date('2025-12-31T00:00:00Z'),
  };

  it.each([[{}], [{ countdownTimer: 'soon' }], [{ countdownTimer: '2025-12-24' }]])(
    'PUT rejects the body %p with 400',
    async body => {
      expect((await readJson(await set(body))).status).toBe(400);
      expect(db.holiday.update).not.toHaveBeenCalled();
    },
  );

  it('PUT answers 404 when the holiday does not exist', async () => {
    db.holiday.findUnique.mockResolvedValue(null);
    expect((await readJson(await set({ countdownTimer: when }))).status).toBe(404);
  });

  it('PUT stores the timer and returns the holiday with its first budget', async () => {
    db.holiday.update.mockResolvedValue(
      holidayRow({ countdownTimer: new Date(when), budgets: [budget] }),
    );
    const { status, body } = await readJson(await set({ countdownTimer: when }));

    expect(status).toBe(200);
    expect(db.holiday.update.mock.calls[0][0].data.countdownTimer).toEqual(
      new Date(when),
    );
    expect(body.data.holiday).toMatchObject({
      countdownTimer: when,
      startDate: '2025-12-25',
    });
    expect(body.data.budget).toMatchObject({
      id: 'b1',
      startDate: '2025-11-01',
      endDate: '2025-12-31',
    });
  });

  it('PUT with null clears the timer, and reports no budget when there is none', async () => {
    db.holiday.update.mockResolvedValue(holidayRow());
    const { body } = await readJson(await set({ countdownTimer: null }));
    expect(db.holiday.update.mock.calls[0][0].data.countdownTimer).toBeNull();
    expect(body.data.holiday.countdownTimer).toBeNull();
    expect(body.data.budget).toBeNull();
  });

  it('DELETE clears the timer', async () => {
    db.holiday.update.mockResolvedValue(holidayRow({ budgets: [budget] }));
    const { status, body } = await readJson(
      await clearCountdown(apiRequest('/x', 'DELETE'), ctx),
    );
    expect(status).toBe(200);
    expect(db.holiday.update.mock.calls[0][0].data.countdownTimer).toBeNull();
    expect(body.data.holiday.countdownTimer).toBeNull();
    expect(body.data.budget.id).toBe('b1');
  });

  it('DELETE reports no budget when there is none', async () => {
    db.holiday.update.mockResolvedValue(holidayRow());
    expect(
      (await readJson(await clearCountdown(apiRequest('/x', 'DELETE'), ctx))).body
        .data.budget,
    ).toBeNull();
  });

  it('DELETE answers 404 when the holiday does not exist', async () => {
    db.holiday.findUnique.mockResolvedValue(null);
    expect(
      (await readJson(await clearCountdown(apiRequest('/x', 'DELETE'), ctx))).status,
    ).toBe(404);
  });

  it('changes nothing for someone who is not a member', async () => {
    notAMember();
    await set({ countdownTimer: when });
    await clearCountdown(apiRequest('/x', 'DELETE'), ctx);
    expect(db.holiday.update).not.toHaveBeenCalled();
  });

  it.failing('answers 403 for someone who is not a member', async () => {
    notAMember();
    expect((await readJson(await set({ countdownTimer: when }))).status).toBe(403);
  });

  it('returns 500 with the error message when the database fails', async () => {
    db.holiday.update.mockRejectedValue(new Error('db down'));
    const put = await readJson(await set({ countdownTimer: when }));
    const del = await readJson(
      await clearCountdown(apiRequest('/x', 'DELETE'), ctx),
    );
    expect(put.status).toBe(500);
    expect(put.body.error).toBe('db down');
    expect(del.status).toBe(500);
  });
});

describe('POST /clear-data', () => {
  const clear = () => clearData(apiRequest('/x', 'POST'), ctx);

  it('answers 404 when the holiday does not exist', async () => {
    db.holiday.findUnique.mockResolvedValue(null);
    expect((await readJson(await clear())).status).toBe(404);
    expect(db.task.deleteMany).not.toHaveBeenCalled();
  });

  it("removes the holiday's tasks, gifts, cards, guests and budgets but keeps the holiday", async () => {
    const { status, body } = await readJson(await clear());

    expect(status).toBe(200);
    expect(body.data).toEqual({
      success: true,
      message: 'Holiday data cleared successfully',
      holidayId: ID,
    });
    for (const model of ['task', 'gift', 'card', 'guestList', 'budget']) {
      expect(db[model].deleteMany).toHaveBeenCalledWith({
        where: { holidayId: ID },
      });
    }
    expect(db.holiday.delete).not.toHaveBeenCalled();
  });

  it('deletes nothing for someone who is not a member', async () => {
    notAMember();
    await clear();
    expect(db.task.deleteMany).not.toHaveBeenCalled();
    expect(db.budget.deleteMany).not.toHaveBeenCalled();
  });

  it.failing('answers 403 for someone who is not a member', async () => {
    notAMember();
    expect((await readJson(await clear())).status).toBe(403);
  });

  it('returns 500 when the database fails', async () => {
    db.$transaction.mockRejectedValueOnce(new Error('db'));
    expect((await readJson(await clear())).status).toBe(500);
  });
});
