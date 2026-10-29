/**
 * @jest-environment jsdom
 *
 * Every page, rendered with a fully populated home store, so the code that draws
 * gifts, tasks, cards and guests runs (the empty smoke test only reaches the
 * empty states).
 */
import fs from 'fs';
import path from 'path';

process.env.RTL_SKIP_AUTO_CLEANUP = 'true';

let currentPath = '/';
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => currentPath,
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

const authUser = { sub: 'auth0|me', email: 'me@x.com', name: 'Me' };
jest.mock('@auth0/auth0-react', () => ({
  useAuth0: () => ({
    user: authUser,
    isAuthenticated: true,
    isLoading: false,
    getAccessTokenSilently: jest.fn(),
    getIdTokenClaims: jest.fn(),
    loginWithRedirect: jest.fn(),
    logout: jest.fn(),
  }),
}));

const DISPLAY_NAMES: Record<string, string> = {
  christmas: 'Christmas',
  hanukkah: 'Hanukkah',
  thanksgiving: 'Thanksgiving',
  easter: 'Easter',
  valentines: "Valentine's Day",
  birthday: 'Birthday',
  'mothers-day': "Mother's Day",
  'fathers-day': "Father's Day",
  halloween: 'Halloween',
  'new-year': 'New Year',
  kwanzaa: 'Kwanzaa',
  'fourth-of-july': 'Fourth of July',
  graduation: 'Graduation',
  'baby-shower': 'Baby Shower',
  anniversary: 'Anniversary',
};

const CATEGORIES = [
  'Tasks',
  'Events',
  'Decorations',
  'To-Do',
  'Date Ideas',
  'Trick or Treat Prep',
  'Resolutions',
  'Reservations',
  'Party Planning',
  'Meal Planning',
  'Costume Ideas',
  'Candle Lighting',
  'Games',
  'Daily Principles',
  'Cards',
];

const EXPECTED_TEXT: Record<string, string> = {
  'gift-list': 'Seeded gift one',
  'guest-list': 'Seeded guest one',
  cards: 'Seeded card one',
};

const holidayFor = (route: string, name: string) => {
  const holidayId = `h-${route}`;
  const base = { holidayId, shareId: null };
  const tasks = CATEGORIES.flatMap((category, i) => [
    {
      ...base,
      id: `t-${i}-a`,
      title: `Seeded ${category} one`,
      category,
      priority: 'high',
      isCompleted: false,
      dueDate: '2030-12-01',
      description: 'd',
      assignedTo: null,
      createdBy: 'u1',
    },
    {
      ...base,
      id: `t-${i}-b`,
      title: `Seeded ${category} two`,
      category,
      priority: 'low',
      isCompleted: true,
      dueDate: null,
      description: '',
      assignedTo: null,
      createdBy: 'u1',
    },
  ]);
  return {
    holiday: name,
    holidayId,
    budget: 500,
    countdownTimer: '2030-12-25T00:00:00',
    gifts: [
      {
        ...base,
        id: 'g1',
        name: 'Seeded gift one',
        price: 40,
        recipient: 'Grace',
        isCompleted: false,
        store: 'Shop',
        notes: 'n',
        createdBy: 'u1',
      },
      {
        ...base,
        id: 'g2',
        name: 'Seeded gift two',
        price: 120,
        recipient: 'Ada',
        isCompleted: true,
        store: '',
        notes: '',
        createdBy: 'u1',
      },
    ],
    cards: [
      {
        ...base,
        id: 'c1',
        recipient: 'Seeded card one',
        message: 'Hi',
        address: '1 Main St',
        isCompleted: false,
        createdBy: 'u1',
      },
      {
        ...base,
        id: 'c2',
        recipient: 'Seeded card two',
        message: '',
        address: '',
        isCompleted: true,
        createdBy: 'u1',
      },
    ],
    tasks,
    events: tasks.filter(t => t.category === 'Events'),
    decorations: tasks.filter(t => t.category === 'Decorations'),
    kwanzaaPrinciples: tasks.filter(t => t.category === 'Daily Principles'),
    guestLists: ['pending', 'confirmed', 'declined'].map((rsvpStatus, i) => ({
      ...base,
      id: `gl${i}`,
      contact: {
        name: `Seeded guest ${['one', 'two', 'three'][i]}`,
        email: 'a@x.com',
        phone: '555',
        streetAddress: '1 Main St',
      },
      rsvpStatus,
      numberOfGuests: i + 1,
      notes: 'n',
      isCompleted: rsvpStatus === 'confirmed',
      createdAt: '2030-01-01T00:00:00Z',
      updatedAt: '2030-01-01T00:00:00Z',
    })),
  };
};

const homeData = () => ({
  holidayPreferences: Object.entries(DISPLAY_NAMES).map(([route, name]) =>
    holidayFor(route, name),
  ),
  contacts: [
    { id: 'ct1', name: 'Grace', email: 'g@x.com' },
    { id: 'ct2', name: 'Ada', email: 'a@x.com' },
  ],
  user: {
    id: 'u1',
    auth0Sub: authUser.sub,
    email: authUser.email,
    name: authUser.name,
    subscriptionPlan: 'plus',
  },
  account: { id: 'a1', name: 'Home' },
  notificationPreferences: {
    assignmentNotifications: true,
    completionNotifications: true,
    inviteNotifications: true,
    emailNotifications: false,
  },
  needsUserSetup: false,
  needsHolidaySelection: false,
});

const APP_DIR = path.join(process.cwd(), 'src/app');
const findPages = (dir: string, found: string[] = []): string[] => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'api') findPages(full, found);
    } else if (entry.name === 'page.tsx') found.push(full);
  }
  return found.sort();
};

const holidayPages = findPages(APP_DIR)
  .map(file => ({
    route:
      '/' + path.relative(APP_DIR, path.dirname(file)).split(path.sep).join('/'),
    file,
  }))
  .filter(p => DISPLAY_NAMES[p.route.split('/')[1]]);

describe('holiday pages with data', () => {
  beforeEach(() => {
    global.fetch = jest.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      const body =
        url.includes('/api/shares') || url.includes('/api/invites')
          ? []
          : { success: true, data: [] };
      return { ok: true, status: 200, json: async () => body };
    }) as unknown as typeof fetch;
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });
  afterEach(() => jest.restoreAllMocks());

  test.each(holidayPages.map(p => [p.route, p.file]))(
    '%s renders its data',
    (route, file) => {
      currentPath = route;
      jest.resetModules();

      const { render, cleanup, act } = require('@testing-library/react');
      const { Provider } = require('react-redux');
      const { store } = require('@/store');
      const { setHomeData } = require('@/store/slices/homeSlice');
      const { setUser } = require('@/store/slices/userSlice');
      const Page = require(file).default;

      act(() => {
        store.dispatch(setHomeData(homeData()));
        store.dispatch(
          setUser({
            sub: authUser.sub,
            email: authUser.email,
            name: authUser.name,
            isInDb: true,
            subscriptionPlan: 'plus',
          }),
        );
      });

      try {
        const { container } = render(
          <Provider store={store}>
            <Page />
          </Provider>,
        );
        const kind = route.split('/')[2];
        const expected = EXPECTED_TEXT[kind];
        if (expected) expect(container.textContent).toContain(expected);
        else
          expect(container.textContent).toMatch(/Seeded|\d+\s*\/\s*\d+|complete/i);
      } finally {
        cleanup();
      }
    },
  );
});
