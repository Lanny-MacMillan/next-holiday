/** @jest-environment node */
const queryRaw = jest.fn();
jest.mock('@/lib/prisma', () => ({
  prisma: { $queryRaw: (...a: unknown[]) => queryRaw(...a) },
}));

import { GET } from '@/app/api/health/route';

const env = { ...process.env };
beforeEach(() => {
  queryRaw.mockReset().mockResolvedValue([{ 1: 1 }]);
  Object.assign(process.env, {
    DATABASE_URL: 'mysql://x',
    NEXT_PUBLIC_AUTH0_DOMAIN: 'd.auth0.com',
    NEXT_PUBLIC_AUTH0_CLIENT_ID: 'id',
  });
});
afterEach(() => {
  for (const key of Object.keys(process.env)) delete process.env[key];
  Object.assign(process.env, env);
});

describe('GET /api/health', () => {
  it('is 200 when the database answers and the config is complete', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      status: 'ok',
      checks: { database: 'ok', config: 'ok' },
    });
    expect(res.headers.get('Cache-Control')).toBe('no-store');
  });

  it('is 503 when the database does not answer', async () => {
    queryRaw.mockRejectedValue(new Error('down'));
    const res = await GET();
    expect(res.status).toBe(503);
    expect((await res.json()).checks.database).toBe('unavailable');
  });

  it('is 503 when required config is missing, without saying which', async () => {
    delete process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID;
    const res = await GET();
    const body = await res.json();
    expect(res.status).toBe(503);
    expect(body.checks.config).toBe('incomplete');
    expect(JSON.stringify(body)).not.toContain('CLIENT_ID');
  });
});
