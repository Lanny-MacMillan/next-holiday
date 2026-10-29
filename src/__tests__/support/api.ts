import { NextRequest } from 'next/server';

type MockFn = jest.Mock;

const models: Record<string, Record<string, MockFn>> = {};

const modelProxy = (name: string) =>
  (models[name] ??= new Proxy(
    {},
    {
      get(target: Record<string, MockFn>, method: string) {
        return (target[method] ??= jest.fn());
      },
    },
  ) as Record<string, MockFn>);

const transaction: MockFn = jest.fn(async (arg: unknown) =>
  typeof arg === 'function'
    ? (arg as (tx: unknown) => unknown)(prismaMock)
    : Promise.all(arg as unknown[]),
);

/** Stands in for the Prisma client: any `prismaMock.<model>.<method>` is a jest.fn. */
export const prismaMock: any = new Proxy(
  {},
  {
    get(_t, prop: string) {
      if (prop === 'then') return undefined;
      if (prop === '$transaction') return transaction;
      return modelProxy(prop);
    },
  },
);

export function resetPrismaMock() {
  for (const model of Object.values(models)) {
    for (const fn of Object.values(model)) fn.mockReset();
  }
  transaction.mockClear();
}

export function apiRequest(path: string, method = 'GET', body?: unknown) {
  return new NextRequest(`http://localhost${path}`, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export const routeParams = <T extends Record<string, string>>(values: T) => ({
  params: Promise.resolve(values),
});

export async function readJson(res: {
  status: number;
  json: () => Promise<unknown>;
}) {
  return { status: res.status, body: (await res.json()) as any };
}
