/**
 * @jest-environment jsdom
 */
import { act, renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '@/store';
import { clearUser, setUser } from '@/store/slices/userSlice';
import { useSubscription } from '../useSubscription';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <Provider store={store}>{children}</Provider>
);
const signIn = (plan?: string, extra: Record<string, unknown> = {}) =>
  act(() => {
    store.dispatch(
      setUser({
        id: 'u1',
        sub: 'auth0|me',
        email: 'me@x.com',
        name: 'Me',
        isInDb: true,
        subscriptionPlan: plan,
        ...extra,
      } as never),
    );
  });

beforeEach(() => {
  act(() => {
    store.dispatch(clearUser());
  });
});

describe('useSubscription', () => {
  it('treats a signed-out visitor as a free member with no subscription', () => {
    const { result } = renderHook(() => useSubscription(), { wrapper });
    expect(result.current).toMatchObject({
      user: null,
      subscriptionPlan: 'free',
      isUserPlusMember: false,
      isFreeMember: true,
      hasSubscription: false,
    });
  });

  it('recognises a Plus member and exposes their dates', () => {
    signIn('plus', {
      subscriptionStartDate: '2030-01-01',
      subscriptionEndDate: '2031-01-01',
    });
    const { result } = renderHook(() => useSubscription(), { wrapper });
    expect(result.current).toMatchObject({
      subscriptionPlan: 'plus',
      isUserPlusMember: true,
      isFreeMember: false,
      hasSubscription: true,
      subscriptionData: {
        plan: 'plus',
        startDate: '2030-01-01',
        endDate: '2031-01-01',
      },
    });
  });

  it('counts an explicit free plan as a subscription record', () => {
    signIn('free');
    const { result } = renderHook(() => useSubscription(), { wrapper });
    expect(result.current).toMatchObject({
      isFreeMember: true,
      isUserPlusMember: false,
      hasSubscription: true,
    });
  });

  it('defaults to free for a user with no plan stored', () => {
    signIn(undefined);
    const { result } = renderHook(() => useSubscription(), { wrapper });
    expect(result.current).toMatchObject({
      subscriptionPlan: 'free',
      hasSubscription: false,
    });
  });

  it('updates when the plan changes', () => {
    signIn('free');
    const { result } = renderHook(() => useSubscription(), { wrapper });
    expect(result.current.isUserPlusMember).toBe(false);
    signIn('plus');
    expect(result.current.isUserPlusMember).toBe(true);
  });

  it('reports the loading and initialised flags', () => {
    const { result } = renderHook(() => useSubscription(), { wrapper });
    expect(typeof result.current.loading).toBe('boolean');
    expect(result.current.initialized).toBe(true);
  });
});
