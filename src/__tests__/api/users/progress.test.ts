/** @jest-environment node */
import { apiRequest, readJson } from '@/__tests__/support/api';

const requireAuth = jest.fn();
jest.mock('@/lib/auth', () => ({
  requireAuth: (...a: unknown[]) => requireAuth(...a),
}));
const getUserProgress = jest.fn();
jest.mock('@/lib/server/points', () => ({
  getUserProgress: (...a: unknown[]) => getUserProgress(...a),
}));

import { GET } from '@/app/api/users/me/progress/route';

beforeEach(() => {
  jest.clearAllMocks();
  requireAuth.mockResolvedValue({ id: 'me' });
  getUserProgress.mockResolvedValue({ points: 0, badges: [] });
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

describe('GET /users/me/progress', () => {
  it('returns 401 when unauthenticated', async () => {
    requireAuth.mockRejectedValue(new Error('Authentication required'));
    expect((await readJson(await GET(apiRequest('/x')))).status).toBe(401);
    expect(getUserProgress).not.toHaveBeenCalled();
  });

  it('always reads the verified user, whatever the query says', async () => {
    const response = await GET(apiRequest('/x?userId=someone-else'));
    expect((await readJson(response)).status).toBe(200);
    expect(getUserProgress).toHaveBeenCalledWith('me');
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
  });
});
