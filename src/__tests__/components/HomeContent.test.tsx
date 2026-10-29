/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import HomeContent from '@/components/HomeContent';

let pageData: {
  isLoading: boolean;
  holidayPreferences: Array<Record<string, unknown>>;
  createLegacyStateObject: jest.Mock;
};
jest.mock('@/hooks/useHomePageData', () => ({ useHomePageData: () => pageData }));
jest.mock('@/components/common/HolidayHeader', () => ({
  __esModule: true,
  default: ({ holidayName }: { holidayName: string }) => <h1>{holidayName}</h1>,
}));
jest.mock('@/components/common/Footer', () => ({
  __esModule: true,
  default: () => <footer>footer</footer>,
}));
jest.mock('@/components/cards/HolidayCard', () => ({
  __esModule: true,
  default: (p: Record<string, unknown>) => (
    <li
      data-testid="card"
      data-id={p.id as string}
      data-holiday-id={p.holidayId as string}
      data-timer={p.countdownTimer as string}
    >
      {p.name as string}|{String(p.progress)}|{String(p.completedItems)}/
      {String(p.totalItems)}
    </li>
  ),
}));

const DAY = 86_400_000;
const inDays = (n: number) => new Date(Date.now() + n * DAY).toISOString();
const pref = (holiday: string, over: Record<string, unknown> = {}) => ({
  holiday,
  holidayId: `id-${holiday}`,
  countdownTimer: null,
  tasks: [],
  gifts: [],
  ...over,
});
const emptyState = { cards: { cards: [] } };

beforeEach(() => {
  pageData = {
    isLoading: false,
    holidayPreferences: [],
    createLegacyStateObject: jest.fn(() => emptyState),
  };
});

const mount = () => render(<HomeContent homeData={{} as never} />);
const order = () =>
  screen.getAllByTestId('card').map(c => c.getAttribute('data-id'));

describe('HomeContent', () => {
  it('shows a loading message while the data loads', () => {
    pageData.isLoading = true;
    mount();
    expect(screen.getByText('Loading your holiday data...')).toBeInTheDocument();
    expect(screen.queryByText('footer')).not.toBeInTheDocument();
  });

  it('invites a new user to pick holidays in Settings', () => {
    mount();
    expect(screen.getByText(/Welcome!/)).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Go to Settings to select holidays' }),
    ).toHaveAttribute('href', '/settings');
    expect(screen.queryByTestId('card')).not.toBeInTheDocument();
  });

  it('shows the heading and footer around the cards', () => {
    pageData.holidayPreferences = [pref('Christmas')];
    mount();
    expect(
      screen.getByRole('heading', { name: 'Next Holiday' }),
    ).toBeInTheDocument();
    expect(screen.getByText('footer')).toBeInTheDocument();
  });

  it('shows only the holidays the user selected', () => {
    pageData.holidayPreferences = [
      pref('Christmas'),
      pref("Mother's Day"),
      pref('Baby Shower'),
    ];
    mount();
    expect(order().sort()).toEqual(['baby-shower', 'christmas', 'mothers-day']);
  });

  it('ignores a selected name that matches no holiday', () => {
    pageData.holidayPreferences = [pref('Festivus')];
    mount();
    expect(screen.getByText(/Welcome!/)).toBeInTheDocument();
  });

  it('passes the holiday id and countdown to its card', () => {
    const timer = inDays(5);
    pageData.holidayPreferences = [pref('Christmas', { countdownTimer: timer })];
    mount();
    const card = screen.getByTestId('card');
    expect(card).toHaveAttribute('data-holiday-id', 'id-Christmas');
    expect(card).toHaveAttribute('data-timer', timer);
  });

  it('builds each holiday state from its own id and name', () => {
    pageData.holidayPreferences = [pref('Easter')];
    mount();
    expect(pageData.createLegacyStateObject).toHaveBeenCalledWith(
      'id-Easter',
      'Easter',
    );
  });

  describe('ordering', () => {
    it('puts the soonest countdown first and holidays without one last', () => {
      pageData.holidayPreferences = [
        pref('Christmas'),
        pref('Easter', { countdownTimer: inDays(30) }),
        pref('Halloween', { countdownTimer: inDays(2) }),
      ];
      mount();
      expect(order()).toEqual(['halloween', 'easter', 'christmas']);
    });

    it('treats a countdown that has passed as due now, ahead of the rest', () => {
      pageData.holidayPreferences = [
        pref('Easter', { countdownTimer: inDays(1) }),
        pref('Thanksgiving', { countdownTimer: inDays(-10) }),
      ];
      mount();
      expect(order()).toEqual(['thanksgiving', 'easter']);
    });
  });
});
