/**
 * @jest-environment jsdom
 *
 * The four pages that are not driven by a config each offer a list of suggestions on an
 * empty page and a small button afterwards, through the shared picker.
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '@/store';
import MealPlanningPage from '@/app/thanksgiving/meal-planning/page';
import PartyPlanningPage from '@/app/birthday/party-planning/page';
import CandleLightingPage from '@/app/hanukkah/candle-lighting/page';
import DailyPrinciplesPage from '@/app/kwanzaa/daily-principles/page';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));
const auth0User = { sub: 'auth0|me', id: 'u1', email: 'me@x.com', name: 'Me' };
jest.mock('@auth0/auth0-react', () => ({
  useAuth0: () => ({ user: auth0User, isAuthenticated: true, isLoading: false }),
}));

let holidayData: any;
let holidayId: string | null = 'h1';
jest.mock('@/hooks/useHolidayPageData', () => ({
  useHolidayPageData: () => ({
    holidayId,
    holidayData,
    auth0User,
    homeInitialized: true,
    holidayPreferences: [],
    homeData: null,
    mutation: null,
    isLoading: false,
    error: null,
    getProgressData: () => ({ total: 0, completed: 0, progress: 0 }),
  }),
}));
const createTask = jest.fn();
jest.mock('@/hooks/useHolidayMutations', () => ({
  useHolidayMutations: () => ({
    createTask,
    updateTask: jest.fn(),
    toggleTask: jest.fn(),
    deleteTask: jest.fn(),
    createLoading: false,
    updateLoading: false,
    deleteLoading: false,
  }),
}));

const task = (title: string, category: string) => ({
  id: title,
  title,
  category,
  priority: 'medium',
  isCompleted: false,
});

const pages = [
  {
    name: 'Thanksgiving meal planning',
    Page: MealPlanningPage,
    category: 'Meal Planning',
    count: 10,
    noun: 'meal planning tasks',
    first: 'Plan Traditional Turkey Menu',
    prompt: /Set Up Meal Planning/,
  },
  {
    name: 'Birthday party planning',
    Page: PartyPlanningPage,
    category: 'Party Planning',
    count: 8,
    noun: 'party planning tasks',
    first: 'Birthday Venue Selection',
    prompt: /Get Started with Party Planning/,
  },
  {
    name: 'Hanukkah candle lighting',
    Page: CandleLightingPage,
    category: 'Candle Lighting',
    count: 8,
    noun: 'candle nights',
    first: 'Light 1st Candle',
    prompt: /Set Up Hanukkah Candle Lighting/,
  },
  {
    name: 'Kwanzaa daily principles',
    Page: DailyPrinciplesPage,
    category: 'Daily Principles',
    count: 7,
    noun: 'Kwanzaa principles',
    first: 'Umoja (Unity)',
    prompt: /Set Up Kwanzaa Principles/,
  },
];

const mount = (Page: React.ComponentType) =>
  render(
    <Provider store={store}>
      <Page />
    </Provider>,
  );

beforeEach(() => {
  jest.clearAllMocks();
  holidayId = 'h1';
  holidayData = { tasks: [] };
  createTask.mockResolvedValue({ id: 'new' });
  global.fetch = jest.fn(async () => ({
    ok: true,
    status: 200,
    json: async () => ({ success: true, data: [] }),
  })) as unknown as typeof fetch;
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

describe.each(pages)(
  '$name suggestions',
  ({ Page, category, count, noun, first, prompt }) => {
    it('are offered on an empty page', async () => {
      mount(Page);

      expect(
        await screen.findByRole('button', { name: 'Choose suggestions' }),
      ).toBeTruthy();
      expect(screen.getByText(prompt)).toBeTruthy();
    });

    it('open a picker with every item ticked, and add them in the right category', async () => {
      mount(Page);

      fireEvent.click(
        await screen.findByRole('button', { name: 'Choose suggestions' }),
      );
      expect(screen.getByRole('dialog', { name: `Suggested ${noun}` })).toBeTruthy();
      expect(screen.getByText(`${count} of ${count} selected`)).toBeTruthy();
      fireEvent.click(screen.getByRole('button', { name: `Add ${count} selected` }));

      await waitFor(() => expect(createTask).toHaveBeenCalledTimes(count));
      for (const [call] of createTask.mock.calls) {
        expect(call.category).toBe(category);
      }
      expect(createTask.mock.calls[0][0].title).toBe(first);
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
      expect(
        screen.queryByRole('button', { name: 'Choose suggestions' }),
      ).toBeNull();
    });

    it('add only the ones picked', async () => {
      mount(Page);

      fireEvent.click(
        await screen.findByRole('button', { name: 'Choose suggestions' }),
      );
      fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
      fireEvent.click(
        screen.getByRole('checkbox', {
          name: new RegExp(first.replace(/[()]/g, '.')),
        }),
      );
      fireEvent.click(screen.getByRole('button', { name: 'Add 1 selected' }));

      await waitFor(() => expect(createTask).toHaveBeenCalledTimes(1));
      expect(createTask.mock.calls[0][0].title).toBe(first);
    });

    it('can be skipped', async () => {
      mount(Page);

      fireEvent.click(await screen.findByRole('button', { name: 'Skip' }));

      expect(
        screen.queryByRole('button', { name: 'Choose suggestions' }),
      ).toBeNull();
      expect(createTask).not.toHaveBeenCalled();
    });

    it('stay open with a message when adding fails', async () => {
      createTask.mockRejectedValue(new Error('boom'));
      mount(Page);

      fireEvent.click(
        await screen.findByRole('button', { name: 'Choose suggestions' }),
      );
      fireEvent.click(screen.getByRole('button', { name: `Add ${count} selected` }));

      expect((await screen.findByRole('alert')).textContent).toMatch(
        /Something went wrong/,
      );
      expect(screen.getByRole('dialog')).toBeTruthy();
    });

    it('add nothing while the holiday has not been found', async () => {
      holidayId = null;
      mount(Page);

      fireEvent.click(
        await screen.findByRole('button', { name: 'Choose suggestions' }),
      );
      fireEvent.click(screen.getByRole('button', { name: `Add ${count} selected` }));

      expect(await screen.findByRole('alert')).toBeTruthy();
      expect(createTask).not.toHaveBeenCalled();
    });

    it('stay as a small button for what is not on the page yet', async () => {
      holidayData = { tasks: [task(first, category)] };
      mount(Page);

      expect(
        await screen.findByRole('button', { name: `Suggestions (${count - 1})` }),
      ).toBeTruthy();
      expect(
        screen.queryByRole('button', { name: 'Choose suggestions' }),
      ).toBeNull();
    });
  },
);

describe('Kwanzaa principles dates', () => {
  it('fall on the days of the coming Kwanzaa, one after another', async () => {
    mount(DailyPrinciplesPage);

    fireEvent.click(
      await screen.findByRole('button', { name: 'Choose suggestions' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Add 7 selected' }));

    await waitFor(() => expect(createTask).toHaveBeenCalledTimes(7));
    const dates = createTask.mock.calls.map(([call]) => call.due_date as string);
    expect(dates[0]).toMatch(/^\d{4}-12-26$/);
    expect(dates[6]).toMatch(/^\d{4}-01-01$/);
    const days = dates.map(date => new Date(`${date}T00:00:00Z`).getTime());
    for (let i = 1; i < 7; i++) expect(days[i] - days[i - 1]).toBe(86_400_000);
  });
});

describe.each(pages)('$name prompt', ({ Page }) => {
  it('stays dismissed after Skip, instead of coming straight back', async () => {
    mount(Page);

    fireEvent.click(await screen.findByRole('button', { name: 'Skip' }));
    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: 'Choose suggestions' }),
      ).toBeNull(),
    );

    // give any effect a chance to bring it back
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(screen.queryByRole('button', { name: 'Choose suggestions' })).toBeNull();
  });
});
