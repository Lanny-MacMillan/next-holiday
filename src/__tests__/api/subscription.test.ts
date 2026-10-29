/** @jest-environment node */
const getCurrentUser = jest.fn();
jest.mock('@/lib/auth', () => ({
  getCurrentUser: (...a: unknown[]) => getCurrentUser(...a),
  requireAuth: jest.fn(),
}));
jest.mock('@/lib/prisma', () => ({
  prisma: require('@/__tests__/support/api').prismaMock,
}));

import {
  apiRequest,
  prismaMock as db,
  resetPrismaMock,
} from '@/__tests__/support/api';
import { POST as pay } from '@/app/api/payment/route';
import { POST as upgrade } from '@/app/api/upgrade-user/route';

const me = { id: 'me-id', auth0Sub: 'auth0|me' };
const json = async (res: Response) => ({
  status: res.status,
  body: await res.json(),
});

beforeEach(() => {
  resetPrismaMock();
  getCurrentUser.mockReset().mockResolvedValue(me);
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

describe('POST /api/upgrade-user', () => {
  const post = (body: unknown) =>
    upgrade(apiRequest('/api/upgrade-user', 'POST', body));

  beforeEach(() =>
    db.user.update.mockImplementation(async ({ data }: { data: unknown }) => data),
  );

  it('moves the user to plus with a one year subscription', async () => {
    const { status, body } = await json(await post({ plan: 'plus' }));

    expect(status).toBe(200);
    expect(body.message).toBe('User successfully upgraded to plus plan');
    const { where, data } = db.user.update.mock.calls[0][0];
    expect(where).toEqual({ id: 'me-id' });
    expect(data.subscriptionPlan).toBe('plus');
    const start = new Date(data.subscriptionStartDate);
    const end = new Date(data.subscriptionEndDate);
    expect(end.getFullYear() - start.getFullYear()).toBe(1);
  });

  it('clears the subscription dates when downgrading to free', async () => {
    await post({ plan: 'free' });
    expect(db.user.update.mock.calls[0][0].data).toMatchObject({
      subscriptionPlan: 'free',
      subscriptionStartDate: null,
      subscriptionEndDate: null,
    });
  });

  it('accepts the caller’s own ids', async () => {
    expect(
      (
        await json(
          await post({ plan: 'plus', auth0Sub: 'auth0|me', userId: 'me-id' }),
        )
      ).status,
    ).toBe(200);
  });

  it.each([{ auth0Sub: 'auth0|other' }, { userId: 'other-id' }])(
    'refuses to change someone else (%j)',
    async other => {
      const { status } = await json(await post({ plan: 'plus', ...other }));
      expect(status).toBe(403);
      expect(db.user.update).not.toHaveBeenCalled();
    },
  );

  it('requires a valid plan', async () => {
    expect((await json(await post({}))).status).toBe(400);
    const { status, body } = await json(await post({ plan: 'platinum' }));
    expect(status).toBe(400);
    expect(body.error).toMatch(/Invalid plan/);
    expect(db.user.update).not.toHaveBeenCalled();
  });

  it('is 401 when signed out', async () => {
    getCurrentUser.mockResolvedValue(null);
    expect((await json(await post({ plan: 'plus' }))).status).toBe(401);
  });

  it('is 500 when the database fails', async () => {
    db.user.update.mockRejectedValue(new Error('db down'));
    expect((await json(await post({ plan: 'plus' }))).status).toBe(500);
  });
});

describe('POST /api/payment', () => {
  const post = (body: unknown) => pay(apiRequest('/api/payment', 'POST', body));
  const original = { ...process.env };
  const setEnv = (testMode?: string, nodeEnv = 'test') => {
    if (testMode === undefined) delete process.env.PAYMENT_TEST_MODE;
    else process.env.PAYMENT_TEST_MODE = testMode;
    (process.env as Record<string, string>).NODE_ENV = nodeEnv;
  };

  beforeEach(() => jest.useFakeTimers());

  afterEach(() => {
    jest.useRealTimers();
    process.env = { ...original };
  });

  const settle = async (request: Promise<Response>) => {
    await jest.advanceTimersByTimeAsync(1000);
    return json(await request);
  };

  describe('in test mode', () => {
    beforeEach(() => setEnv('true'));

    it('approves with only a name and amount, after a simulated delay', async () => {
      const pending = post({ cardholderName: 'Ada', amount: 299 });
      let done = false;
      pending.then(() => (done = true));
      await jest.advanceTimersByTimeAsync(999);
      expect(done).toBe(false);

      const { status, body } = await settle(pending);
      expect(status).toBe(200);
      expect(body).toMatchObject({ success: true, amount: 299, testMode: true });
      expect(body.paymentId).toMatch(/^test_payment_\d+$/);
    });

    it('still needs a name and an amount', async () => {
      expect((await json(await post({ amount: 299 }))).status).toBe(400);
      expect((await json(await post({ cardholderName: 'Ada' }))).status).toBe(400);
    });
  });

  it('counts development as test mode', async () => {
    setEnv(undefined, 'development');
    expect(
      (await settle(post({ cardholderName: 'Ada', amount: 1 }))).body.testMode,
    ).toBe(true);
  });

  describe('outside test mode', () => {
    beforeEach(() => setEnv('false'));

    it('demands every card field', async () => {
      const { status, body } = await json(
        await post({ cardholderName: 'Ada', amount: 299 }),
      );
      expect(status).toBe(400);
      expect(body.error).toBe('All payment fields are required');
    });

    it('is not implemented yet, so it never claims success', async () => {
      const { status, body } = await json(
        await post({
          cardNumber: '4111',
          expiryDate: '12/30',
          cvv: '123',
          cardholderName: 'Ada',
          amount: 299,
        }),
      );
      expect(status).toBe(501);
      expect(body).not.toHaveProperty('success');
    });
  });

  it('is 500 for an unreadable body', async () => {
    const res = await pay(
      new (require('next/server').NextRequest)('http://localhost/api/payment', {
        method: 'POST',
        body: '{',
      }),
    );
    expect(res.status).toBe(500);
  });
});
