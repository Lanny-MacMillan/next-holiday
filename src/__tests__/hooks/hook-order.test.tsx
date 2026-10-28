/**
 * @jest-environment jsdom
 */
import { act, render, renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { store } from '@/store';
import { clearHomeData, setHomeData } from '@/store/slices/homeSlice';
import budgetsReducer from '@/store/slices/budgetsSlice';
import { useHolidayBudget } from '@/hooks/useHolidayBudget';
import GiftListCard from '@/components/cards/gift/GiftListCard';
import BabyShowerGuestListPage from '@/app/baby-shower/guest-list/page';
import BirthdayTasksPage from '@/app/birthday/tasks/page';

let currentPath = '/';
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() }),
  usePathname: () => currentPath,
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

jest.mock('@auth0/auth0-react', () => ({
  useAuth0: () => ({
    user: { sub: 'auth0|123', email: 'test@example.com', name: 'Test User' },
    isAuthenticated: true,
    isLoading: false,
  }),
}));

const homeData = (holiday: string, holidayId: string, extra = {}) =>
  ({
    holidayPreferences: [{ holiday, holidayId, budget: 100, ...extra }],
    contacts: [],
    user: null,
    account: null,
    needsUserSetup: false,
    needsHolidaySelection: false,
  }) as never;

beforeEach(() => {
  store.dispatch(clearHomeData());
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => [],
  }) as unknown as typeof fetch;
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('useHolidayBudget', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={configureStore({ reducer: { budgets: budgetsReducer } })}>
      {children}
    </Provider>
  );

  it('reports a missing holidayId without reading the store', () => {
    const { result } = renderHook(() => useHolidayBudget({}), { wrapper });
    expect(result.current).toEqual({
      budget: null,
      loading: false,
      error: 'holidayId is required',
    });
  });

  it('survives holidayId arriving after the first render', () => {
    const { result, rerender } = renderHook(
      ({ holidayId }: { holidayId?: string }) => useHolidayBudget({ holidayId }),
      { wrapper, initialProps: {} as { holidayId?: string } },
    );
    expect(result.current.error).toBe('holidayId is required');

    rerender({ holidayId: 'christmas-1' });
    expect(result.current.error).not.toBe('holidayId is required');
    expect(result.current.budget).toBeNull();
  });

  it('survives holidayId going away', () => {
    const { result, rerender } = renderHook(
      ({ holidayId }: { holidayId?: string }) => useHolidayBudget({ holidayId }),
      {
        wrapper,
        initialProps: { holidayId: 'christmas-1' } as { holidayId?: string },
      },
    );
    rerender({});
    expect(result.current.error).toBe('holidayId is required');
  });
});

describe('GiftListCard', () => {
  const budget = { spent: 10, total: 100 };
  const giftList = { totalItems: 4, completedItems: 1 };

  const renderCard = (props: Record<string, unknown>) =>
    render(
      <Provider store={store}>
        <GiftListCard holiday="Christmas" holidayId="christmas-1" {...props} />
      </Provider>,
    );

  it('re-renders when the budget and gift list props arrive after the first render', () => {
    const { rerender, container } = renderCard({});
    expect(() =>
      rerender(
        <Provider store={store}>
          <GiftListCard
            holiday="Christmas"
            holidayId="christmas-1"
            budget={budget}
            giftList={giftList}
          />
        </Provider>,
      ),
    ).not.toThrow();
    expect(container.textContent).toContain('Christmas');
  });

  it('renders with no holiday at all', () => {
    const { container } = render(
      <Provider store={store}>
        <GiftListCard budget={budget} giftList={giftList} />
      </Provider>,
    );
    expect(container).not.toBeEmptyDOMElement();
  });

  it('does not request gifts when the props already supply the data', () => {
    renderCard({ budget, giftList });
    const urls = (global.fetch as jest.Mock).mock.calls.map(c => String(c[0]));
    expect(urls.filter(u => u.includes('/gifts'))).toEqual([]);
  });

  it('re-renders when the budget and gift list props go away', () => {
    const { rerender } = renderCard({ budget, giftList });
    expect(() =>
      rerender(
        <Provider store={store}>
          <GiftListCard holiday="Christmas" holidayId="christmas-1" />
        </Provider>,
      ),
    ).not.toThrow();
  });
});

describe('page data arriving after the first render', () => {
  const mount = (Page: React.ComponentType) =>
    render(
      <Provider store={store}>
        <Page />
      </Provider>,
    );

  it('baby shower guest list: loading state then loaded', () => {
    currentPath = '/baby-shower/guest-list';
    const { container } = mount(BabyShowerGuestListPage);
    expect(container.textContent).toContain('Loading guests');

    expect(() => {
      act(() => {
        store.dispatch(
          setHomeData(homeData('Baby Shower', 'baby-1', { guestLists: [] })),
        );
      });
    }).not.toThrow();
    expect(container.textContent).not.toContain('Loading guests');
  });

  it('birthday tasks: no home data, then tasks arrive', () => {
    currentPath = '/birthday/tasks';
    mount(BirthdayTasksPage);

    expect(() => {
      act(() => {
        store.dispatch(
          setHomeData(
            homeData('Birthday', 'birthday-1', {
              tasks: [
                {
                  id: 't1',
                  title: 'Buy cake',
                  category: 'Tasks',
                  isCompleted: false,
                },
              ],
            }),
          ),
        );
      });
    }).not.toThrow();
  });
});
