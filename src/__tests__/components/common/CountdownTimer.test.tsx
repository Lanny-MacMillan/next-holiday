/**
 * @jest-environment jsdom
 */
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '@/store';
import { updateSettings } from '@/store/slices/themeSlice';
import { clearCountdown } from '@/store/slices/countdownSlice';
import {
  clearChristmasCountdown,
  setChristmasCountdown,
} from '@/store/slices/christmas/christmasCountdownSlice';
import CountdownTimer from '@/components/common/CountdownTimer';

const authValue = { user: { sub: 'auth0|me', email: 'me@x.com', name: 'Me' } };
jest.mock('@auth0/auth0-react', () => ({ useAuth0: () => authValue }));

jest.mock('@/components/modals/DatePickerModal', () => ({
  __esModule: true,
  default: ({
    isOpen,
    onDateSelect,
    onDelete,
    onClose,
    defaultDate,
    title,
  }: {
    isOpen: boolean;
    onDateSelect: (d: string) => void;
    onDelete?: () => void;
    onClose: () => void;
    defaultDate?: string;
    title?: string;
  }) => {
    if (!isOpen) return null;
    const h = require('react').createElement;
    return h(
      'div',
      { 'data-testid': 'picker', 'data-default': defaultDate, 'data-title': title },
      [
        h(
          'button',
          { key: 'pick', onClick: () => onDateSelect('2031-06-15T08:30') },
          'pick date',
        ),
        onDelete && h('button', { key: 'del', onClick: onDelete }, 'delete date'),
        h('button', { key: 'close', onClick: onClose }, 'close picker'),
      ],
    );
  },
}));
jest.mock('@/components/common/InviteButton', () => ({
  __esModule: true,
  default: () => null,
}));

const mockFetch = jest.fn();
const reply = (ok: boolean, body: unknown = {}) => ({
  ok,
  status: ok ? 200 : 500,
  json: async () => body,
});

const mount = (props: React.ComponentProps<typeof CountdownTimer> = {}) =>
  render(
    <Provider store={store}>
      <CountdownTimer {...props} />
    </Provider>,
  );

const STATE_KEYS: Array<[string | undefined, string]> = [
  ['Hanukkah', 'hanukkahCountdown'],
  ['Kwanzaa', 'kwanzaaCountdown'],
  ['New Year', 'newYearCountdown'],
  ["Valentine's Day", 'valentinesCountdown'],
  ['Easter', 'easterCountdown'],
  ['Halloween', 'halloweenCountdown'],
  ['Thanksgiving', 'thanksgivingCountdown'],
  ['Graduation', 'graduationCountdown'],
  ['Anniversary', 'anniversaryCountdown'],
  ['Birthday', 'birthdayCountdown'],
  ['Fourth of July', 'fourthOfJulyCountdown'],
  ["Father's Day", 'fathersDayCountdown'],
  ["Mother's Day", 'mothersDayCountdown'],
  ['Christmas', 'christmasCountdown'],
  [undefined, 'countdown'],
];
const slice = (key: string) =>
  (
    store.getState() as unknown as Record<
      string,
      { targetDate: string | null; isActive: boolean }
    >
  )[key];

const NOW = new Date(2030, 5, 1, 12, 0, 0);
const inFuture = (ms: number) => new Date(NOW.getTime() + ms).toISOString();

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = mockFetch as unknown as typeof fetch;
  jest.spyOn(console, 'error').mockImplementation(() => {});
  act(() => {
    store.dispatch(updateSettings({ displayMode: 'professional' }));
    store.dispatch(clearChristmasCountdown());
    store.dispatch(clearCountdown());
  });
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('CountdownTimer when no countdown is set', () => {
  it('offers Set Countdown for a personal occasion', () => {
    mount({ holiday: 'Birthday' });
    expect(
      screen.getByRole('button', { name: 'Set Countdown' }),
    ).toBeInTheDocument();
  });

  it('offers Enable Countdown, with the real date prefilled, for a national holiday', () => {
    jest.useFakeTimers().setSystemTime(NOW);
    mount({ holiday: 'Christmas' });
    fireEvent.click(screen.getByRole('button', { name: 'Enable Countdown' }));

    const picker = screen.getByTestId('picker');
    expect(picker).toHaveAttribute('data-title', 'Enable Countdown');
    expect(picker).toHaveAttribute('data-default', '2030-12-25T00:00');
  });

  it('opens the picker on click and closes it again', () => {
    mount({ holiday: 'Birthday' });
    expect(screen.queryByTestId('picker')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Set Countdown' }));
    expect(screen.getByTestId('picker')).toHaveAttribute(
      'data-title',
      'Set Countdown Date',
    );
    fireEvent.click(screen.getByRole('button', { name: 'close picker' }));
    expect(screen.queryByTestId('picker')).not.toBeInTheDocument();
  });

  it.each(STATE_KEYS)('saving a date for %s writes to state.%s', (holiday, key) => {
    mount({ holiday });
    fireEvent.click(screen.getByRole('button', { name: /(Set|Enable) Countdown/ }));
    fireEvent.click(screen.getByRole('button', { name: 'pick date' }));

    expect(slice(key)).toEqual({ targetDate: '2031-06-15T08:30', isActive: true });
    expect(screen.queryByTestId('picker')).not.toBeInTheDocument();
  });
});

describe('CountdownTimer with an active countdown', () => {
  let unmount: () => void;
  const start = (ms: number, holiday = 'Christmas') => {
    jest.useFakeTimers().setSystemTime(NOW);
    act(() => {
      store.dispatch(setChristmasCountdown(inFuture(ms)));
    });
    ({ unmount } = mount({ holiday }));
    act(() => {
      jest.advanceTimersByTime(1000);
    });
  };
  const DAY = 86_400_000;

  it('shows the time left, ticking every second', () => {
    start(2 * DAY + 3 * 3_600_000 + 4 * 60_000 + 6000);
    expect(screen.getByText(/2d 3h 4m 5s/)).toBeInTheDocument();
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(screen.getByText(/2d 3h 4m 4s/)).toBeInTheDocument();
  });

  it('leaves out the units that are zero', () => {
    start(3 * 3_600_000 + 6000);
    const text = screen.getByText(/3h/).textContent!;
    expect(text).toContain('3h');
    expect(text).toContain('5s');
    expect(text).not.toMatch(/\dd /);
    expect(text).not.toMatch(/\dm /);
  });

  it.each([
    ['more than a day', 3 * DAY, 'text-green-500'],
    ['under a day', 5 * 3_600_000, 'text-yellow-500'],
  ])('is coloured for %s left', (_, ms, colour) => {
    act(() => {
      store.dispatch(updateSettings({ displayMode: 'gamified' }));
    });
    start(ms);
    expect(screen.getByText(/\ds/).className).toContain(colour);
  });

  it('shows the holiday message once the date arrives', () => {
    start(3000);
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    expect(screen.getByText('Christmas is here! 🎄')).toBeInTheDocument();
  });

  it('clicking it reopens the picker with a delete option, and a new date replaces the old', () => {
    start(2 * DAY);
    fireEvent.click(screen.getByText(/\dd /));
    fireEvent.click(screen.getByRole('button', { name: 'pick date' }));
    expect(slice('christmasCountdown').targetDate).toBe('2031-06-15T08:30');
  });

  it('can delete the countdown', () => {
    start(2 * DAY);
    fireEvent.click(screen.getByText(/\dd /));
    fireEvent.click(screen.getByRole('button', { name: 'delete date' }));
    expect(slice('christmasCountdown')).toEqual({
      targetDate: null,
      isActive: false,
    });
    expect(
      screen.getByRole('button', { name: 'Enable Countdown' }),
    ).toBeInTheDocument();
  });

  it('stops ticking when it is removed from the page', () => {
    start(2 * DAY);
    const spy = jest.spyOn(global, 'clearInterval');
    unmount();
    expect(spy).toHaveBeenCalled();
  });
});

describe('CountdownTimer backed by the API', () => {
  const HOLIDAY_ID = 'h-1';
  const mountApi = (initial: string | null = null) =>
    mount({
      holiday: 'Birthday',
      holidayId: HOLIDAY_ID,
      initialCountdownTimer: initial,
    });
  const putCalls = () =>
    mockFetch.mock.calls.filter(c => (c[1] as { method: string }).method === 'PUT');

  it('shows a countdown it was given and ticks', async () => {
    mountApi(new Date(Date.now() + 3 * 86_400_000 + 5000).toISOString());
    expect(
      await screen.findByText(/3d/, undefined, { timeout: 3000 }),
    ).toBeInTheDocument();
  });

  it('saves a new date to the holiday, as an ISO timestamp', async () => {
    mockFetch.mockResolvedValue(reply(true, { success: true }));
    mountApi();
    fireEvent.click(screen.getByRole('button', { name: 'Set Countdown' }));
    fireEvent.click(screen.getByRole('button', { name: 'pick date' }));

    await waitFor(() => expect(putCalls()).toHaveLength(1));
    const [url, init] = putCalls()[0] as [string, { body: string }];
    expect(url).toBe(`/api/holidays/${HOLIDAY_ID}/countdown`);
    expect(JSON.parse(init.body)).toEqual({
      countdownTimer: new Date('2031-06-15T08:30:00').toISOString(),
    });
    await waitFor(() =>
      expect(screen.queryByTestId('picker')).not.toBeInTheDocument(),
    );
  });

  it('keeps the picker open and the old state if the save fails', async () => {
    mockFetch.mockResolvedValue(reply(false, { error: 'nope' }));
    mountApi();
    fireEvent.click(screen.getByRole('button', { name: 'Set Countdown' }));
    fireEvent.click(screen.getByRole('button', { name: 'pick date' }));

    await waitFor(() => expect(putCalls()).toHaveLength(1));
    await waitFor(() => expect(console.error).toHaveBeenCalled());
    expect(screen.getByTestId('picker')).toBeInTheDocument();
  });

  it('clears the countdown on the server', async () => {
    mockFetch.mockResolvedValue(reply(true, { success: true }));
    mountApi(new Date(Date.now() + 5 * 86_400_000).toISOString());
    fireEvent.click(await screen.findByText(/\dd/, undefined, { timeout: 3000 }));
    fireEvent.click(screen.getByRole('button', { name: 'delete date' }));

    await waitFor(() =>
      expect(
        mockFetch.mock.calls.some(
          c => (c[1] as { method: string }).method === 'DELETE',
        ),
      ).toBe(true),
    );
    expect(
      await screen.findByRole('button', { name: 'Set Countdown' }),
    ).toBeInTheDocument();
  });
});
