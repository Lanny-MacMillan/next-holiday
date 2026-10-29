/**
 * @jest-environment jsdom
 *
 * Every page under src/app should render for a signed-in user with an empty
 * store. Pages are found on disk, so new and deleted pages are picked up.
 */
import fs from 'fs';
import path from 'path';

// Testing Library is re-required per page, so its auto-cleanup hooks can't be used.
process.env.RTL_SKIP_AUTO_CLEANUP = 'true';

let currentPath = '/';
let fetchCalls = 0;
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

jest.mock('@auth0/auth0-react', () => ({
  useAuth0: () => ({
    user: { sub: 'auth0|123', email: 'test@example.com', name: 'Test User' },
    isAuthenticated: true,
    isLoading: false,
    getAccessTokenSilently: jest.fn(),
    getIdTokenClaims: jest.fn(),
    loginWithRedirect: jest.fn(),
    logout: jest.fn(),
  }),
}));

const APP_DIR = path.join(process.cwd(), 'src/app');

function findPages(dir: string, found: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'api') findPages(full, found);
    } else if (entry.name === 'page.tsx') {
      found.push(full);
    }
  }
  return found.sort();
}

const pages = findPages(APP_DIR).map(file => ({
  route: '/' + path.relative(APP_DIR, path.dirname(file)).split(path.sep).join('/'),
  file,
}));

describe('page smoke tests', () => {
  beforeEach(() => {
    fetchCalls = 0;
    global.fetch = jest.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (++fetchCalls > 200) throw new Error(`runaway fetch loop: ${url}`);
      const body =
        url.includes('/api/shares') || url.includes('/api/invites')
          ? []
          : url.includes('/api/')
            ? { success: true, data: [] }
            : {};
      return { ok: true, status: 200, json: async () => body };
    }) as unknown as typeof fetch;
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('discovers the app pages', () => {
    expect(pages.length).toBeGreaterThan(50);
  });

  test.each(pages.map(p => [p.route === '/.' ? '/' : p.route, p.file]))(
    '%s renders',
    (route, file) => {
      currentPath = route;

      // Fresh modules per page: sharing one store across pages hung the run.
      jest.resetModules();

      const { render, cleanup } = require('@testing-library/react');
      const { Provider } = require('react-redux');
      const { store } = require('@/store');
      const Page = require(file).default;

      try {
        const { container } = render(
          <Provider store={store}>
            <Page />
          </Provider>,
        );
        expect(container.innerHTML.length).toBeGreaterThan(0);
      } finally {
        cleanup();
      }
    },
  );
});
