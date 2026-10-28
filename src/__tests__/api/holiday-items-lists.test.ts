/** @jest-environment node */
const getCurrentUser = jest.fn();
jest.mock('@/lib/auth', () => ({
  getCurrentUser: (...a: unknown[]) => getCurrentUser(...a),
  requireAuth: jest.fn(),
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
import { GET as getCards } from '@/app/api/cards/route';
import { GET as getGifts } from '@/app/api/gifts/route';
import { GET as getTasks } from '@/app/api/tasks/route';

const lists = [
  { path: 'tasks', model: 'task', handler: getTasks },
  { path: 'gifts', model: 'gift', handler: getGifts },
  { path: 'cards', model: 'card', handler: getCards },
] as const;

beforeEach(() => {
  resetPrismaMock();
  getCurrentUser
    .mockReset()
    .mockResolvedValue({ id: 'me-id', auth0Sub: 'auth0|me' });
  db.user.findUnique.mockResolvedValue({ id: 'db-me' });
  db.account.findFirst.mockResolvedValue({ id: 'acc1' });
  db.holiday.findMany.mockResolvedValue([{ id: 'h1' }, { id: 'h2' }]);
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

describe.each(lists)('GET /api/$path', ({ path, model, handler }) => {
  const get = async () => readJson(await handler(apiRequest(`/api/${path}`)));

  it("returns the newest items across the user's account holidays", async () => {
    db[model].findMany.mockResolvedValue([{ id: 'x1' }]);
    const { status, body } = await get();

    expect(status).toBe(200);
    expect(body).toEqual({ success: true, data: [{ id: 'x1' }] });
    expect(db.user.findUnique).toHaveBeenCalledWith({
      where: { auth0Sub: 'auth0|me' },
    });
    expect(db.account.findFirst.mock.calls[0][0].where).toEqual({
      members: { some: { userId: 'db-me' } },
    });
    expect(db.holiday.findMany).toHaveBeenCalledWith({
      where: { accountId: 'acc1' },
    });
    expect(db[model].findMany).toHaveBeenCalledWith({
      where: { holidayId: { in: ['h1', 'h2'] } },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('is 401 when signed out', async () => {
    getCurrentUser.mockResolvedValue(null);
    expect((await get()).status).toBe(401);
    expect(db.user.findUnique).not.toHaveBeenCalled();
  });

  it('is 404 when the user row is missing', async () => {
    db.user.findUnique.mockResolvedValue(null);
    expect((await get()).body.error).toBe('User not found');
  });

  it('is 404 when the user has no account', async () => {
    db.account.findFirst.mockResolvedValue(null);
    const { status, body } = await get();
    expect(status).toBe(404);
    expect(body.error).toBe('Account not found');
  });

  it('is 500 when the database fails', async () => {
    db[model].findMany.mockRejectedValue(new Error('db down'));
    expect((await get()).status).toBe(500);
  });
});
