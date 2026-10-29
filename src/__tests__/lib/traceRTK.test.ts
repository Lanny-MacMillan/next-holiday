/** @jest-environment jsdom */
import { createTracedBaseQuery, isRTKTracingEnabled } from '@/lib/traceRTK';

const env = process.env as Record<string, string | undefined>;

beforeEach(() => {
  jest.spyOn(console, 'info').mockImplementation(() => {});
  delete env.NEXT_PUBLIC_TRACE;
  window.history.pushState({}, '', '/');
});
afterEach(() => jest.restoreAllMocks());

describe('createTracedBaseQuery', () => {
  const api = {} as never;
  const run = async (args: Record<string, unknown>) => {
    const base = jest.fn().mockResolvedValue({ data: 'ok' });
    const result = await createTracedBaseQuery(base as never)(
      args as never,
      api,
      {},
    );
    return {
      base,
      result,
      line: (console.info as jest.Mock).mock.calls[0]?.[0] as string,
    };
  };

  it('hands the request to the wrapped query and returns its result unchanged', async () => {
    const args = { url: '/api/holidays/h-1/gifts' };
    const { base, result } = await run(args);
    expect(base).toHaveBeenCalledWith(args, api, {});
    expect(result).toEqual({ data: 'ok' });
  });

  it.each([
    ['gifts', 'getGifts'],
    ['guest-lists', 'getGuestList'],
    ['tasks', 'getTasks'],
    ['cards', 'getCards'],
    ['home', 'home'],
  ])('names a call to .../%s as %s', async (last, name) => {
    const { line } = await run({ url: `/api/holidays/h-1/${last}`, method: 'POST' });
    expect(line).toMatch(
      new RegExp(
        `^\\[rtk\\] ${name} \\| POST /api/holidays/h-1/${last} \\| cache: ${name}:`,
      ),
    );
  });

  it('defaults to GET and to "unknown" without a url', async () => {
    const { line } = await run({});
    expect(line).toMatch(/^\[rtk\] unknown \| GET {2}\| cache: unknown:/);
  });

  it('builds the cache key from the params or body', async () => {
    const withParams = await run({ url: '/api/x', params: { a: 1 } });
    const encoded = btoa(JSON.stringify({ a: 1 })).slice(0, 12);
    expect(withParams.line).toContain(`cache: x:${encoded}`);
  });

  it('falls back to the key names when the args cannot be serialised', async () => {
    const circular: Record<string, unknown> = { id: 1 };
    circular.self = circular;
    const { line } = await run({ url: '/api/x', body: circular });
    expect(line).toContain('cache: x:id,self');
  });
});

describe('isRTKTracingEnabled', () => {
  it('is on by default', () => {
    expect(isRTKTracingEnabled()).toBe(true);
  });

  it('is off when NEXT_PUBLIC_TRACE is 0', () => {
    env.NEXT_PUBLIC_TRACE = '0';
    expect(isRTKTracingEnabled()).toBe(false);
  });

  it('is off when the page has ?trace=0', () => {
    window.history.pushState({}, '', '/?trace=0');
    expect(isRTKTracingEnabled()).toBe(false);
  });
});
