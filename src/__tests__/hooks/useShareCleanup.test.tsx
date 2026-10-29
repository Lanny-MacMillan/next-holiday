import { renderHook } from '@testing-library/react';
import { useShareCleanup } from '@/hooks/useShareCleanup';

const dispatch = jest.fn();
jest.mock('@/store/hooks', () => ({ useAppDispatch: () => dispatch }));
jest.mock('@/store/slices/homeSlice', () => ({
  refreshHomeData: (user: unknown) => ({ type: 'home/refresh', user }),
}));
jest.mock('@/store/slices/sharesSlice', () => ({
  fetchShares: (sub: string) => ({ type: 'shares/fetch', sub }),
}));

const user = { sub: 'auth0|me' };
const succeeds = () => ({ unwrap: () => Promise.resolve() });

beforeEach(() => {
  dispatch.mockReset().mockImplementation(succeeds);
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

describe('useShareCleanup', () => {
  describe('after leaving a share', () => {
    it('reloads the home data and then the shares', async () => {
      const { result } = renderHook(() => useShareCleanup());

      await result.current.cleanupAfterLeaveShare(user);

      expect(dispatch.mock.calls.map(c => c[0])).toEqual([
        { type: 'home/refresh', user },
        { type: 'shares/fetch', sub: 'auth0|me' },
      ]);
    });

    it('does nothing without a signed-in user', async () => {
      const { result } = renderHook(() => useShareCleanup());

      await result.current.cleanupAfterLeaveShare(null);

      expect(dispatch).not.toHaveBeenCalled();
    });

    it('logs and carries on when a reload fails', async () => {
      dispatch.mockImplementation(() => ({
        unwrap: () => Promise.reject(new Error('x')),
      }));
      const { result } = renderHook(() => useShareCleanup());

      await expect(
        result.current.cleanupAfterLeaveShare(user),
      ).resolves.toBeUndefined();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('after a member is removed', () => {
    it('reloads only the shares', async () => {
      const { result } = renderHook(() => useShareCleanup());

      await result.current.cleanupAfterRemoveMember(user);

      expect(dispatch.mock.calls.map(c => c[0])).toEqual([
        { type: 'shares/fetch', sub: 'auth0|me' },
      ]);
    });

    it('does nothing without a signed-in user', async () => {
      const { result } = renderHook(() => useShareCleanup());

      await result.current.cleanupAfterRemoveMember(undefined);

      expect(dispatch).not.toHaveBeenCalled();
    });

    it('logs and carries on when the reload fails', async () => {
      dispatch.mockImplementation(() => ({
        unwrap: () => Promise.reject(new Error('x')),
      }));
      const { result } = renderHook(() => useShareCleanup());

      await expect(
        result.current.cleanupAfterRemoveMember(user),
      ).resolves.toBeUndefined();
      expect(console.error).toHaveBeenCalled();
    });
  });
});
