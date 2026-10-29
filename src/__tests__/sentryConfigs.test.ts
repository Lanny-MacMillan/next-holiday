const init = jest.fn();
const captureRouterTransitionStart = jest.fn();
jest.mock('@sentry/nextjs', () => ({
  init: (...a: unknown[]) => init(...a),
  captureRouterTransitionStart: (...a: unknown[]) =>
    captureRouterTransitionStart(...a),
}));

beforeEach(() => {
  init.mockClear();
  jest.resetModules();
});

describe.each([
  ['the server', '@/sentry.server.config'],
  ['the edge runtime', '@/sentry.edge.config'],
  ['the browser', '@/instrumentation-client'],
])('Sentry on %s', (_, path) => {
  it('starts with the shared options', async () => {
    await import(path);
    expect(init).toHaveBeenCalledTimes(1);
    const options = init.mock.calls[0][0];
    expect(options.sendDefaultPii).toBe(false);
    const scrubbed = options.beforeSend({
      request: { headers: { Authorization: 'Bearer x' } },
    });
    expect(scrubbed.request.headers).toEqual({});
    expect(options.tracesSampleRate).toBe(0);
  });
});

it('the browser hands route changes to Sentry', async () => {
  const client = await import('@/instrumentation-client');
  client.onRouterTransitionStart('/christmas', 'push');
  expect(captureRouterTransitionStart).toHaveBeenCalledWith('/christmas', 'push');
});
