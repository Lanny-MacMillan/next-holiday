/** @jest-environment node */
import { apiRequest, readJson, routeParams } from '@/__tests__/support/api';

const requireAuth = jest.fn();
const assertHolidayAccess = jest.fn();
jest.mock('@/lib/auth', () => ({
  requireAuth: (...a: unknown[]) => requireAuth(...a),
  assertHolidayAccess: (...a: unknown[]) => assertHolidayAccess(...a),
}));
const getLeaderboard = jest.fn();
jest.mock('@/lib/server/points', () => ({
  getLeaderboard: (...a: unknown[]) => getLeaderboard(...a),
}));

import { GET } from '@/app/api/holidays/[id]/leaderboard/route';

const ctx = routeParams({ id: 'holiday-1' });
const get = (query = '') => GET(apiRequest(`/x${query}`), ctx);

beforeEach(() => {
  jest.clearAllMocks();
  requireAuth.mockResolvedValue({ id: 'me' });
  assertHolidayAccess.mockResolvedValue(null);
  getLeaderboard.mockResolvedValue({ entries: [], team: {}, me: null, year: null });
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

describe('GET /holidays/[id]/leaderboard', () => {
  it('returns 401 when unauthenticated', async () => {
    requireAuth.mockRejectedValue(new Error('Authentication required'));
    expect((await readJson(await get())).status).toBe(401);
    expect(getLeaderboard).not.toHaveBeenCalled();
  });

  it('refuses a user who has no access to the holiday', async () => {
    assertHolidayAccess.mockResolvedValue(
      new Response(JSON.stringify({ success: false, error: 'Forbidden' }), {
        status: 403,
      }),
    );
    expect((await readJson(await get())).status).toBe(403);
    expect(assertHolidayAccess).toHaveBeenCalledWith('holiday-1', 'me');
    expect(getLeaderboard).not.toHaveBeenCalled();
  });

  it('acts as the verified user and ignores any user id in the query', async () => {
    const { status } = await readJson(await get('?userId=someone-else'));
    expect(status).toBe(200);
    expect(getLeaderboard).toHaveBeenCalledWith('holiday-1', 'me', undefined);
  });

  it('passes a valid year through', async () => {
    await get('?year=2026');
    expect(getLeaderboard).toHaveBeenCalledWith('holiday-1', 'me', 2026);
  });

  it.each(['abc', '1999', '2101', '20.5'])(
    'rejects year=%s with 400',
    async year => {
      expect((await readJson(await get(`?year=${year}`))).status).toBe(400);
      expect(getLeaderboard).not.toHaveBeenCalled();
    },
  );

  it('returns 404 for a holiday that does not exist', async () => {
    getLeaderboard.mockResolvedValue(null);
    expect((await readJson(await get())).status).toBe(404);
  });

  it('is never cached', async () => {
    expect((await get()).headers.get('Cache-Control')).toBe('private, no-store');
  });
});
