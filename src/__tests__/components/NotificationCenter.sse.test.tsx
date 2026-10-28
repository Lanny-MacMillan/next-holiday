/**
 * @jest-environment jsdom
 */
import { act, render, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from '@/store';
import NotificationCenter from '@/components/common/NotificationCenter';

// Auth0 returns a stable user object; a new one per render would re-run the effect
const authValue = {
  user: { sub: 'auth0|me', email: 'me@x.com', name: 'Me' },
  isAuthenticated: true,
  isLoading: false,
};
jest.mock('@auth0/auth0-react', () => ({ useAuth0: () => authValue }));

class FakeEventSource {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSED = 2;
  static instances: FakeEventSource[] = [];
  readyState = FakeEventSource.CONNECTING;
  onopen: (() => void) | null = null;
  onmessage: ((e: { data: string }) => void) | null = null;
  onerror: ((e: unknown) => void) | null = null;
  close = jest.fn();
  constructor(public url: string) {
    FakeEventSource.instances.push(this);
  }
}

const mockFetch = jest.fn();
const streamUrl = (i: number) => new URL(FakeEventSource.instances[i].url);

const respond = (ticketResponses: Array<{ ok: boolean; ticket?: string }>) => {
  const queue = [...ticketResponses];
  mockFetch.mockImplementation(async (url: string) => {
    if (url === '/api/sse-ticket') {
      const next = queue.shift() ?? { ok: false };
      return {
        ok: next.ok,
        status: next.ok ? 200 : 503,
        json: async () => ({ ticket: next.ticket }),
      };
    }
    return {
      ok: true,
      status: 200,
      json: async () => ({ success: true, data: [] }),
    };
  });
};

const mount = () =>
  render(
    <Provider store={store}>
      <NotificationCenter />
    </Provider>,
  );

beforeEach(() => {
  jest.clearAllMocks();
  FakeEventSource.instances = [];
  global.EventSource = FakeEventSource as unknown as typeof EventSource;
  global.fetch = mockFetch as unknown as typeof fetch;
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'group').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('NotificationCenter SSE connection', () => {
  it('asks for a ticket and opens the stream with it', async () => {
    respond([{ ok: true, ticket: 'T1' }]);
    mount();

    await waitFor(() => expect(FakeEventSource.instances).toHaveLength(1));
    expect(mockFetch).toHaveBeenCalledWith('/api/sse-ticket', { method: 'POST' });
    expect(streamUrl(0).pathname).toBe('/stream');
    expect(streamUrl(0).searchParams.get('ticket')).toBe('T1');
  });

  it('falls back to polling when a ticket cannot be obtained', async () => {
    respond([{ ok: false }]);
    mount();

    await waitFor(() => {
      const urls = mockFetch.mock.calls.map(c => String(c[0]));
      expect(urls.some(u => u.startsWith('/api/notifications'))).toBe(true);
    });
    expect(FakeEventSource.instances).toHaveLength(0);
  });

  it('does not open a stream if it unmounts while waiting for the ticket', async () => {
    let release!: (v: unknown) => void;
    mockFetch.mockImplementation(
      () =>
        new Promise(resolve => {
          release = resolve;
        }),
    );
    const { unmount } = mount();
    unmount();

    await act(async () => {
      release({ ok: true, status: 200, json: async () => ({ ticket: 'late' }) });
    });
    expect(FakeEventSource.instances).toHaveLength(0);
  });

  it('gets a fresh ticket for each reconnect', async () => {
    respond([
      { ok: true, ticket: 'T1' },
      { ok: true, ticket: 'T2' },
    ]);
    mount();
    await waitFor(() => expect(FakeEventSource.instances).toHaveLength(1));

    act(() => {
      FakeEventSource.instances[0].onerror?.({});
    });

    await waitFor(() => expect(FakeEventSource.instances.length).toBeGreaterThan(1));
    expect(streamUrl(1).searchParams.get('ticket')).toBe('T2');
  });
});
