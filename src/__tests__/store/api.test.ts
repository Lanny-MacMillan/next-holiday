/**
 * @jest-environment jsdom
 */
import 'whatwg-fetch';
import { configureStore } from '@reduxjs/toolkit';
import { api } from '@/store/api';
import homeReducer from '@/store/slices/homeSlice';

const mockFetch = jest.fn();
const makeStore = () =>
  configureStore({
    reducer: { [api.reducerPath]: api.reducer, home: homeReducer },
    middleware: getDefault => getDefault().concat(api.middleware),
  });

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
const urlOf = (r: Request) => new URL(r.url, 'http://localhost');
const sent = () => mockFetch.mock.calls.map(([req]) => req as Request);

const auth0User = { sub: 'auth0|me', email: 'me@x.com', name: 'Me', picture: 'p' };
// every endpoint takes some subset of these
const everything = {
  holidayId: 'h1',
  taskId: 't1',
  giftId: 'g1',
  cardId: 'c1',
  guestId: 'u1',
  payload: { name: 'x' },
  updates: { name: 'x' },
  isCompleted: true,
  auth0User,
};

type Endpoint = {
  initiate: (arg: unknown) => unknown;
  select?: unknown;
};
const endpoints = Object.entries(
  api.endpoints as unknown as Record<string, Endpoint>,
);

beforeEach(() => {
  mockFetch.mockReset();
  global.fetch = mockFetch as unknown as typeof fetch;
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

describe('every endpoint', () => {
  it.each(endpoints.map(([name]) => name))(
    '%s sends one authenticated request under /api',
    async name => {
      mockFetch.mockImplementation(async () => json({ success: true, data: [] }));
      const store = makeStore();
      await store.dispatch(
        (api.endpoints as never as Record<string, Endpoint>)[name].initiate(
          everything,
        ) as never,
      );

      expect(sent()).toHaveLength(1);
      const request = sent()[0];
      expect(urlOf(request).pathname.startsWith('/api/')).toBe(true);
      expect(JSON.parse(request.headers.get('x-test-user')!)).toEqual(auth0User);
    },
  );

  it('are all covered by the table above', () => {
    expect(endpoints.length).toBeGreaterThan(50);
  });
});

describe('request shape', () => {
  const run = async (name: string, arg: object = everything) => {
    mockFetch.mockImplementation(async () => json({ success: true, data: [] }));
    await makeStore().dispatch(
      (api.endpoints as never as Record<string, Endpoint>)[name].initiate(
        arg,
      ) as never,
    );
    return sent().at(-1)!;
  };
  const path = (r: Request) => urlOf(r).pathname + urlOf(r).search;

  it('queries are GETs for the holiday', async () => {
    const request = await run('getGifts');
    expect(request.method).toBe('GET');
    expect(path(request)).toBe('/api/holidays/h1/gifts');
  });

  it('cross-holiday queries hit the top-level collection', async () => {
    expect(path(await run('getAllGifts'))).toBe('/api/gifts');
    expect(path(await run('getAllCards'))).toBe('/api/cards');
  });

  it('create posts the payload', async () => {
    const request = await run('createTask');
    expect(request.method).toBe('POST');
    expect(path(request)).toBe('/api/holidays/h1/tasks');
    expect(await request.json()).toEqual({ name: 'x' });
  });

  it('update patches the item', async () => {
    const request = await run('updateTask');
    expect(request.method).toBe('PATCH');
    expect(path(request)).toBe('/api/holidays/h1/tasks/t1');
  });

  it('delete names the item in the query string', async () => {
    const request = await run('deleteTask');
    expect(request.method).toBe('DELETE');
    expect(path(request)).toBe('/api/holidays/h1/tasks?taskId=t1');
  });

  it('sends no test-user header without a user', async () => {
    const request = await run('getGifts', { holidayId: 'h1' });
    expect(request.headers.get('x-test-user')).toBeNull();
  });
});

describe('response handling', () => {
  const data = async (name: string, body: unknown, arg: object = everything) => {
    mockFetch.mockImplementation(async () => json(body));
    const result = await makeStore().dispatch(
      (api.endpoints as never as Record<string, Endpoint>)[name].initiate(
        arg,
      ) as never,
    );
    return result as { data?: unknown; error?: unknown };
  };

  it('queries unwrap the data envelope', async () => {
    expect(
      (await data('getGifts', { success: true, data: [{ id: 'g' }] })).data,
    ).toEqual([{ id: 'g' }]);
  });

  it('queries return an empty list when the envelope has no data', async () => {
    expect((await data('getGifts', { success: true })).data).toEqual([]);
  });

  it('surfaces a failed request as an error', async () => {
    mockFetch.mockImplementation(async () => json({ error: 'nope' }, 500));
    const result = (await makeStore().dispatch(
      (api.endpoints as never as Record<string, Endpoint>).getGifts.initiate(
        everything,
      ) as never,
    )) as { error?: { status: number } };
    expect(result.error?.status).toBe(500);
  });
});
