/** @jest-environment node */
type Middleware = (
  params: any,
  next: (p: any) => Promise<unknown>,
) => Promise<unknown>;

const load = () => {
  let mod!: typeof import('@/lib/tracePrisma');
  jest.isolateModules(() => {
    mod = require('@/lib/tracePrisma');
  });
  return mod;
};

const fakeClient = () => {
  const client = { $use: jest.fn() };
  return client as unknown as import('@prisma/client').PrismaClient & typeof client;
};
const installed = (client: ReturnType<typeof fakeClient>): Middleware =>
  client.$use.mock.calls[0][0];

const env = process.env as Record<string, string | undefined>;
const original = { ...env };

beforeEach(() => {
  jest.spyOn(console, 'info').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
  delete env.NEXT_PUBLIC_TRACE;
});
afterEach(() => {
  jest.restoreAllMocks();
  Object.assign(env, original);
});

describe('installPrismaTracer', () => {
  it('registers a middleware once, however often it is called', () => {
    const { installPrismaTracer } = load();
    const client = fakeClient();
    installPrismaTracer(client);
    installPrismaTracer(client);
    expect(client.$use).toHaveBeenCalledTimes(1);
  });

  it('does nothing when tracing is switched off', () => {
    env.NEXT_PUBLIC_TRACE = '0';
    const client = fakeClient();
    load().installPrismaTracer(client);
    expect(client.$use).not.toHaveBeenCalled();
  });

  it('does nothing in production', () => {
    env.NODE_ENV = 'production';
    const client = fakeClient();
    load().installPrismaTracer(client);
    expect(client.$use).not.toHaveBeenCalled();
  });

  it('warns and skips a client without middleware support', () => {
    const client = {} as never;
    load().installPrismaTracer(client);
    expect(console.warn).toHaveBeenCalledWith(
      "[trace] Prisma client doesn't support middleware, skipping Prisma tracer",
    );
  });

  describe('the middleware', () => {
    const run = async (params: unknown, next: (p: any) => Promise<unknown>) => {
      const client = fakeClient();
      load().installPrismaTracer(client);
      return installed(client)(params, next);
    };
    const logged = () =>
      (console.info as jest.Mock).mock.calls
        .map(c => c[0])
        .filter(m => m.startsWith('[prisma]'));

    it('passes the result through and logs the model, action and where keys', async () => {
      const next = jest.fn().mockResolvedValue({ id: 1 });
      const params = {
        model: 'Gift',
        action: 'findMany',
        args: {
          where: {
            holidayId: 'h-1',
            count: 3,
            id: { in: ['a', 'b'] },
            name: { contains: 'x' },
            nested: { equals: 1 },
            skipped: null,
          },
        },
      };
      await expect(run(params, next)).resolves.toEqual({ id: 1 });
      expect(next).toHaveBeenCalledWith(params);
      expect(logged()).toHaveLength(1);
      expect(logged()[0]).toMatch(
        /^\[prisma\] Gift\.findMany \| where: holidayId:h-1, count:3, id:in\[2\], name:contains, nested:object/,
      );
    });

    it('also lists a top-level id and ids', async () => {
      await run(
        { model: 'Task', action: 'delete', args: { id: 't-1', ids: [1, 2, 3] } },
        async () => null,
      );
      expect(logged()[0]).toContain('where: id:t-1, ids:3');
    });

    it('logs just the model and action when there is no where clause, and unknown for no model', async () => {
      await run({ action: 'queryRaw' }, async () => null);
      expect(logged()[0]).toMatch(/^\[prisma\] unknown\.queryRaw(?! \| where)/);
    });

    it('logs and rethrows a failed query', async () => {
      const boom = new Error('boom');
      await expect(
        run({ model: 'Card', action: 'update', args: {} }, async () =>
          Promise.reject(boom),
        ),
      ).rejects.toBe(boom);
      expect(console.error).toHaveBeenCalledWith(
        '[prisma] Error in Card.update:',
        boom,
      );
      expect(logged()).toHaveLength(1);
    });
  });
});
