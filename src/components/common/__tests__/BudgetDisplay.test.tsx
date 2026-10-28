import React from 'react';
import { render, renderHook, screen } from '@testing-library/react';
import { BudgetDisplay, useBudgetInfo } from '../BudgetDisplay';

// ---- Controllable fake Redux state; useAppSelector just runs the selector on it
let state: any;
jest.mock('@/store/hooks', () => ({
  useAppSelector: (selector: (s: any) => unknown) => selector(state),
}));

jest.mock('@auth0/auth0-react', () => ({
  useAuth0: () => ({ user: { sub: 'auth0|me' } }),
}));

let subscription = { isUserPlusMember: true, hasSubscription: true };
jest.mock('@/hooks/useSubscription', () => ({
  useSubscription: () => subscription,
}));

let dbBudget: { targetAmount: number } | null = null;
jest.mock('@/hooks/useHolidayBudget', () => ({
  useHolidayBudget: () => ({ budget: dbBudget, loading: false, error: null }),
}));

const HOLIDAY_ID = 'christmas-123';

const makeState = (
  pref: Record<string, unknown> | null,
  overrides: { displayMode?: string; userDisplayMode?: string } = {},
) => ({
  theme: { settings: { displayMode: overrides.displayMode ?? 'professional' } },
  userPreferences: {
    preferences: overrides.userDisplayMode
      ? { displayMode: overrides.userDisplayMode }
      : null,
  },
  home: {
    initialized: true,
    data: { holidayPreferences: pref ? [{ holidayId: HOLIDAY_ID, ...pref }] : [] },
  },
});

beforeEach(() => {
  subscription = { isUserPlusMember: true, hasSubscription: true };
  dbBudget = null;
  state = makeState({ holiday: 'Christmas', budget: 500, gifts: [] });
});

describe('useBudgetInfo', () => {
  const info = (holiday?: string, holidayId: string | undefined = HOLIDAY_ID) =>
    renderHook(() => useBudgetInfo(holiday, holidayId)).result.current;

  describe('spent vs planned', () => {
    it('counts only completed gifts as spent, and all priced gifts as planned', () => {
      state = makeState({
        budget: 500,
        gifts: [
          { price: 100, isCompleted: true },
          { price: 50, isCompleted: false },
          { price: 25, isCompleted: true },
        ],
      });
      const r = info();
      expect(r.totalSpent).toBe(125);
      expect(r.totalPlanned).toBe(175);
      expect(r.remaining).toBe(375);
    });

    it('parses string prices and treats junk prices as 0', () => {
      state = makeState({
        budget: 100,
        gifts: [
          { price: '19.99', isCompleted: true },
          { price: 'abc', isCompleted: true },
        ],
      });
      expect(info().totalSpent).toBeCloseTo(19.99);
    });

    it('returns no gifts until home data is initialized', () => {
      state = makeState({ budget: 500, gifts: [{ price: 10, isCompleted: true }] });
      state.home.initialized = false;
      expect(info().totalSpent).toBe(0);
    });
  });

  describe('budget limit priority', () => {
    it('prefers the budget on the home holiday preference', () => {
      dbBudget = { targetAmount: 999 };
      state = makeState({ budget: 500, gifts: [] });
      expect(info().budgetLimit).toBe(500);
    });

    it('falls back to the DB budget when the preference has none', () => {
      dbBudget = { targetAmount: 300 };
      state = makeState({ gifts: [] });
      expect(info().budgetLimit).toBe(300);
    });

    it('falls back to 100 when a holidayId is known but no budget exists anywhere', () => {
      state = makeState({ gifts: [] });
      expect(info().budgetLimit).toBe(100);
    });

    it('has no budget for a legacy holiday name that has no preference', () => {
      state = makeState(null);
      const { result } = renderHook(() => useBudgetInfo('Christmas', undefined));
      expect(result.current.budgetLimit).toBe(0);
    });
  });

  describe('status thresholds', () => {
    const at = (spent: number) => {
      state = makeState({
        budget: 100,
        gifts: [{ price: spent, isCompleted: true }],
      });
      return info();
    };

    it.each([
      [0, 'Plenty of budget left', 'bg-green-500'],
      [50, 'Plenty of budget left', 'bg-green-500'],
      [51, 'Budget getting tight', 'bg-yellow-500'],
      [75, 'Budget getting tight', 'bg-yellow-500'],
      [76, 'Almost out of budget', 'bg-red-500'],
      [100, 'Almost out of budget', 'bg-red-500'],
      [101, 'Over budget!', 'bg-red-700'],
    ])('at %i%% used: "%s" (%s)', (spent, text, bar) => {
      const r = at(spent);
      expect(r.statusText).toBe(text);
      expect(r.progressBarColor).toBe(bar);
    });

    it('computes percentage and a negative remaining when over budget', () => {
      const r = at(150);
      expect(r.percentageUsed).toBe(150);
      expect(r.remaining).toBe(-50);
    });
  });
});

describe('<BudgetDisplay />', () => {
  const renderIt = (
    props: Partial<React.ComponentProps<typeof BudgetDisplay>> = {},
  ) =>
    render(<BudgetDisplay holiday="Christmas" holidayId={HOLIDAY_ID} {...props} />);

  beforeEach(() => {
    state = makeState({
      holiday: 'Christmas',
      budget: 500,
      gifts: [{ price: 150, isCompleted: true }],
    });
  });

  it('renders the figures in the professional design', () => {
    renderIt();
    expect(screen.getByText('Christmas Budget')).toBeInTheDocument();
    expect(screen.getByText('$150.00')).toBeInTheDocument(); // spent
    expect(screen.getByText('$350.00')).toBeInTheDocument(); // remaining
    expect(screen.getByText('Budget: $500.00')).toBeInTheDocument();
    expect(screen.getByText('30.0% used')).toBeInTheDocument();
    expect(screen.getByText('Plenty of budget left')).toBeInTheDocument();
  });

  it('uses a generic title when no holiday name is given', () => {
    renderIt({ holiday: undefined });
    expect(screen.getByText('Gift Budget')).toBeInTheDocument();
  });

  it('renders nothing for users without a Plus subscription', () => {
    subscription = { isUserPlusMember: false, hasSubscription: false };
    const { container } = renderIt();
    expect(container).toBeEmptyDOMElement();
  });

  it('requires both a subscription and Plus membership', () => {
    subscription = { isUserPlusMember: true, hasSubscription: false };
    expect(renderIt().container).toBeEmptyDOMElement();
  });

  it('renders nothing when there is no budget to show', () => {
    state = makeState(null);
    const { container } = renderIt({ holidayId: undefined });
    expect(container).toBeEmptyDOMElement();
  });

  it('shows a negative remaining amount and "Over budget!" when overspent', () => {
    state = makeState({ budget: 100, gifts: [{ price: 150, isCompleted: true }] });
    renderIt();
    expect(screen.getByText('Over budget!')).toBeInTheDocument();
    expect(screen.getByText('$-50.00')).toBeInTheDocument();
  });

  it('caps the progress bar at 100% width when overspent', () => {
    state = makeState({ budget: 100, gifts: [{ price: 150, isCompleted: true }] });
    const { container } = renderIt();
    const bar = container.querySelector('.bg-red-700') as HTMLElement;
    expect(bar.style.width).toBe('100%');
  });

  describe('display mode', () => {
    it('uses the playful design when the theme setting is gamified', () => {
      state = makeState(
        { budget: 500, gifts: [{ price: 150, isCompleted: true }] },
        { displayMode: 'gamified' },
      );
      renderIt({ holidayColor: 'bg-red-500' });
      // Gamified layout is the one with white-on-colour text and a decorative overlay
      expect(screen.getByText('Christmas Budget')).toHaveClass('text-white');
    });

    it('uses the playful design when the user preference is gamified', () => {
      state = makeState(
        { budget: 500, gifts: [{ price: 150, isCompleted: true }] },
        { userDisplayMode: 'gamified' },
      );
      renderIt();
      expect(screen.getByText('Christmas Budget')).toHaveClass('text-white');
    });

    it('uses the clean design otherwise', () => {
      renderIt();
      expect(screen.getByText('Christmas Budget')).toHaveClass('text-gray-900');
    });
  });
});
