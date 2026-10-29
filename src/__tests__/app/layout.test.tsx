/** @jest-environment node */
import { renderToStaticMarkup } from 'react-dom/server';

jest.mock('next/font/google', () => ({ Inter: () => ({ className: 'inter' }) }));
jest.mock('@/app/globals.css', () => ({}), { virtual: true });
jest.mock('@/store/provider', () => ({
  ReduxProvider: ({ children }: any) => children,
}));
jest.mock('@/components/auth/Auth0Provider', () => ({
  __esModule: true,
  default: ({ children }: any) => children,
}));
jest.mock('@/components/AppContent', () => ({
  __esModule: true,
  default: ({ children }: any) => children,
}));

import RootLayout from '@/app/layout';

const env = { ...process.env };
const render = () =>
  renderToStaticMarkup(
    <RootLayout>
      <p>page</p>
    </RootLayout>,
  );

beforeEach(() => jest.spyOn(console, 'log').mockImplementation(() => {}));
afterEach(() => {
  process.env = { ...env };
  jest.restoreAllMocks();
});

describe('RootLayout', () => {
  it('adds the Umami script when its URL is set', () => {
    process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL = 'https://umami.test/script.js';
    process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID = 'site-1';

    const html = render();
    expect(html).toContain('src="https://umami.test/script.js"');
    expect(html).toContain('data-website-id="site-1"');
  });

  it('leaves the script out, instead of an empty src, when no URL is set', () => {
    delete process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL;

    expect(render()).not.toContain('<script');
  });

  it('renders the page inside the layout', () => {
    expect(render()).toContain('<p>page</p>');
  });
});
