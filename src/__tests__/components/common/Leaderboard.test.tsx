/**
 * @jest-environment jsdom
 */
import { render as rtlRender, fireEvent, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import leaderboardUiReducer from '@/store/slices/leaderboardUiSlice';
import Leaderboard from '@/components/common/Leaderboard';
import BadgeIcon from '@/components/common/BadgeIcon';

let result: { data?: any };
let store: ReturnType<typeof makeStore>;
const makeStore = (collapsed = false) =>
  configureStore({
    reducer: { leaderboardUi: leaderboardUiReducer },
    preloadedState: { leaderboardUi: { collapsed } },
  });
const render = (ui: React.ReactElement) =>
  rtlRender(<Provider store={store}>{ui}</Provider>);
const query = jest.fn();
jest.mock('@/store/api', () => ({
  useGetLeaderboardQuery: (...args: unknown[]) => {
    query(...args);
    return result;
  },
}));

const entry = (over: object) => ({
  userId: 'u1',
  name: 'Ada',
  picture: null,
  rank: 1,
  points: 30,
  level: 1,
  streak: 0,
  isYou: false,
  ...over,
});
const levelInfo = {
  level: 1,
  pointsIntoLevel: 30,
  pointsForNext: 50,
  progress: 0.6,
};
const team = { completed: 2, total: 4, percent: 50, reached: false };
const badge = (over: object) => ({
  key: 'first_step',
  name: 'First Step',
  description: 'Complete your first item',
  earned: false,
  earnedAt: null,
  current: 0,
  target: 1,
  ...over,
});
const data = (over: object = {}) => {
  const me = entry({ userId: 'me', name: 'Me', rank: 2, points: 10, isYou: true });
  return {
    shared: true,
    year: null,
    entries: [entry({ name: null, points: 40 }), me],
    me: { ...me, levelInfo },
    team,
    badges: [],
    ...over,
  };
};

beforeEach(() => {
  jest.clearAllMocks();
  store = makeStore();
  result = {};
});

describe('Leaderboard', () => {
  it('shows nothing until data arrives', () => {
    const { container } = render(
      <Leaderboard holidayId="h1" holidayName="Easter" />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('skips the request without a holiday', () => {
    render(<Leaderboard holidayId={null} holidayName="Easter" />);
    expect(query).toHaveBeenCalledWith({ holidayId: '' }, { skip: true });
  });

  it('is hidden on a holiday that is not shared', () => {
    result = { data: data({ shared: false }) };
    const { container } = render(
      <Leaderboard holidayId="h1" holidayName="Easter" />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('shows only your own level when everyone else on the share has opted out', () => {
    const me = entry({ isYou: true, streak: 3 });
    result = { data: data({ entries: [me], me: { ...me, levelInfo } }) };
    render(<Leaderboard holidayId="h1" holidayName="Easter" />);

    expect(
      screen.getByRole('heading', { name: /Your Easter points/ }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Level 1, 30 pts, 3-day streak/)).toBeInTheDocument();
    expect(screen.getByText('20 pts to level 2')).toBeInTheDocument();
    expect(
      screen.getByRole('progressbar', { name: 'Progress to next level' }),
    ).toHaveAttribute('aria-valuenow', '60');
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('ranks everyone on a shared holiday and marks the viewer', () => {
    result = { data: data({ team: { ...team, reached: true } }) };
    render(<Leaderboard holidayId="h1" holidayName="Easter" />);

    expect(
      screen.getByRole('heading', { name: /Easter leaderboard/ }),
    ).toBeInTheDocument();
    const rows = screen.getAllByRole('listitem');
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent('Member');
    expect(rows[0]).toHaveTextContent('40 pts');
    expect(rows[1]).toHaveTextContent('Me (you)');
    expect(screen.getByText('Everything for Easter is done.')).toBeInTheDocument();
  });

  it('shows team progress while items remain', () => {
    result = { data: data() };
    render(<Leaderboard holidayId="h1" holidayName="Easter" />);
    expect(
      screen.getByText('Team progress: 2 of 4 items done (50%).'),
    ).toBeInTheDocument();
  });

  describe('collapsing', () => {
    const header = () => screen.getByRole('button', { name: /Easter leaderboard/ });

    it('starts open and keeps a one-line summary when closed', () => {
      result = { data: data() };
      render(<Leaderboard holidayId="h1" holidayName="Easter" />);

      expect(header()).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByRole('list')).toBeVisible();

      fireEvent.click(header());

      expect(header()).toHaveAttribute('aria-expanded', 'false');
      expect(screen.getByText('Level 1, 10 pts')).toBeVisible();
      expect(screen.queryByRole('list')).not.toBeInTheDocument();
      expect(store.getState().leaderboardUi.collapsed).toBe(true);

      fireEvent.click(header());
      expect(header()).toHaveAttribute('aria-expanded', 'true');
      expect(store.getState().leaderboardUi.collapsed).toBe(false);
    });

    it('opens closed when the saved preference says so', () => {
      store = makeStore(true);
      result = { data: data() };
      render(<Leaderboard holidayId="h1" holidayName="Easter" />);
      expect(header()).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('badges', () => {
    const justNow = new Date().toISOString();
    const longAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();

    it('lists earned and locked badges with progress', () => {
      result = {
        data: data({
          badges: [
            badge({ earned: true, earnedAt: longAgo, current: 1 }),
            badge({
              key: 'gift_guru',
              name: 'Gift Guru',
              description: 'Complete 10 gifts',
              current: 4,
              target: 10,
            }),
          ],
        }),
      };
      render(<Leaderboard holidayId="h1" holidayName="Easter" />);

      expect(
        screen.getByRole('heading', { name: 'Badges (1 of 2)' }),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Complete your first item (earned)'),
      ).toBeInTheDocument();
      expect(screen.getByText('Complete 10 gifts (4/10)')).toBeInTheDocument();
      expect(screen.queryByText('New')).not.toBeInTheDocument();
    });

    it('marks a badge earned in the last two days as new', () => {
      result = {
        data: data({ badges: [badge({ earned: true, earnedAt: justNow })] }),
      };
      render(<Leaderboard holidayId="h1" holidayName="Easter" />);
      expect(screen.getByText('New')).toBeInTheDocument();
    });

    it('leaves the badges section out when there are none', () => {
      result = { data: data() };
      render(<Leaderboard holidayId="h1" holidayName="Easter" />);
      expect(
        screen.queryByRole('heading', { name: /Badges/ }),
      ).not.toBeInTheDocument();
    });
  });
});

describe('BadgeIcon', () => {
  it('draws a glyph for every badge and falls back for an unknown key', () => {
    const { container, rerender } = render(
      <BadgeIcon badgeKey="gift_guru" earned />,
    );
    const known = container.querySelector('path')!.getAttribute('d');
    expect(known).toBeTruthy();

    rerender(<BadgeIcon badgeKey="not_a_badge" earned={false} />);
    expect(container.querySelector('path')!.getAttribute('d')).toBeTruthy();
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true');
  });
});
