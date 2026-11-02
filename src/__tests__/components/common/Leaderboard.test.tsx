/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import Leaderboard from '@/components/common/Leaderboard';

let result: { data?: any };
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

beforeEach(() => {
  jest.clearAllMocks();
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

  it('shows only level, progress and team progress when the user is alone', () => {
    const me = entry({ isYou: true, streak: 3 });
    result = { data: { entries: [me], me: { ...me, levelInfo }, team } };
    render(<Leaderboard holidayId="h1" holidayName="Easter" />);

    expect(
      screen.getByRole('heading', { name: 'Your Easter points' }),
    ).toBeInTheDocument();
    expect(screen.getByText('3-day streak')).toBeInTheDocument();
    expect(screen.getByText('Level 1')).toBeInTheDocument();
    expect(screen.getByText(/30 pts, 20 to level 2/)).toBeInTheDocument();
    expect(
      screen.getByRole('progressbar', { name: 'Progress to next level' }),
    ).toHaveAttribute('aria-valuenow', '60');
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(
      screen.getByText('Team progress: 2 of 4 items done (50%).'),
    ).toBeInTheDocument();
  });

  it('ranks everyone on a shared holiday and marks the viewer', () => {
    const me = entry({ userId: 'me', name: 'Me', rank: 2, points: 10, isYou: true });
    result = {
      data: {
        entries: [entry({ name: null, points: 40 }), me],
        me: { ...me, levelInfo },
        team: { ...team, reached: true },
      },
    };
    render(<Leaderboard holidayId="h1" holidayName="Easter" />);

    expect(
      screen.getByRole('heading', { name: 'Easter leaderboard' }),
    ).toBeInTheDocument();
    const rows = screen.getAllByRole('listitem');
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent('Member');
    expect(rows[0]).toHaveTextContent('40 pts');
    expect(rows[1]).toHaveTextContent('Me (you)');
    expect(screen.getByText('Everything for Easter is done.')).toBeInTheDocument();
  });
});
