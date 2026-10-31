/**
 * @jest-environment jsdom
 */
import { renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useSharedHoliday } from '@/hooks/useSharedHoliday';

let pageData: any;
jest.mock('@/hooks/useHolidayPageData', () => ({
  useHolidayPageData: () => pageData,
}));
let prefs: Record<string, any>;
jest.mock('@/store/selectors/home', () => ({
  selectHolidayPrefById: (_state: unknown, id: string) => prefs[id],
}));

const me = { sub: 'auth0|me', id: 'u1', name: 'Me', email: 'me@x.com' };

const render = (shares: any[]) => {
  const store = configureStore({ reducer: { shares: () => ({ shares }) } });
  return renderHook(() => useSharedHoliday('birthday'), {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    ),
  }).result.current;
};

beforeEach(() => {
  pageData = {
    holidayId: 'mine',
    holidayData: { id: 'mine-data' },
    auth0User: me,
    homeInitialized: true,
  };
  prefs = { mine: { id: 'mine-pref' }, theirs: { id: 'their-pref' } };
});

describe('useSharedHoliday', () => {
  it('uses the holiday the page resolved when nothing is shared', () => {
    const result = render([]);

    expect(result.holidayId).toBe('mine');
    expect(result.holidayData).toEqual({ id: 'mine-pref' });
    expect(result.homeInitialized).toBe(true);
  });

  it("uses the owner's holiday when it is shared with the user", () => {
    const result = render([
      { holidayKey: 'birthday', holidayId: 'theirs', members: [] },
    ]);

    expect(result.holidayId).toBe('theirs');
    expect(result.holidayData).toEqual({ id: 'their-pref' });
  });

  it('ignores a share for a different holiday', () => {
    const result = render([
      { holidayKey: 'christmas', holidayId: 'theirs', members: [] },
    ]);

    expect(result.holidayId).toBe('mine');
  });

  it('falls back to the page data when the store has nothing for that holiday', () => {
    prefs = {};
    const result = render([]);

    expect(result.holidayData).toEqual({ id: 'mine-data' });
  });

  it('does not look for a share until the page has found its holiday', () => {
    pageData.holidayId = null;
    const result = render([
      { holidayKey: 'birthday', holidayId: 'theirs', members: [] },
    ]);

    expect(result.holidayId).toBeNull();
  });

  it('lists the current user first, as the owner, then the other members', () => {
    const result = render([
      {
        holidayKey: 'birthday',
        holidayId: 'mine',
        members: [
          { userId: 'auth0|other', name: 'Other' },
          { userId: 'auth0|me', name: 'Me (share)', uuid: 'u1' },
        ],
      },
    ]);

    expect(result.shareMembers.map((m: any) => [m.userId, m.role ?? null])).toEqual([
      ['auth0|me', 'owner'],
      ['auth0|other', null],
    ]);
    expect(result.shareMembers[1].uuid).toBe('auth0|other');
  });

  it('adds the current user as owner when the share does not list them', () => {
    const result = render([]);

    expect(result.shareMembers).toEqual([
      {
        userId: 'auth0|me',
        uuid: 'u1',
        name: 'Me',
        email: 'me@x.com',
        role: 'owner',
      },
    ]);
  });

  it('falls back to "Me" and an empty email for a user without a profile', () => {
    pageData.auth0User = { sub: 'auth0|me' };
    const result = render([]);

    expect(result.shareMembers[0]).toMatchObject({
      name: 'Me',
      email: '',
      uuid: '',
    });
  });

  it('returns the share members unchanged when nobody is signed in', () => {
    pageData.auth0User = undefined;
    const result = render([
      { holidayKey: 'birthday', holidayId: 'mine', members: [{ userId: 'x' }] },
    ]);

    expect(result.shareMembers).toEqual([{ userId: 'x' }]);
  });
});
