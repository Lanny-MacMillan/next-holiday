/** @jest-environment node */
const constructEvent = jest.fn();
jest.mock('@/lib/stripe', () => ({
  getStripe: () => ({ webhooks: { constructEvent } }),
}));
const activatePlus = jest.fn();
const deactivatePlus = jest.fn();
jest.mock('@/lib/server/billing', () => ({
  activatePlus: (...a: unknown[]) => activatePlus(...a),
  deactivatePlus: (...a: unknown[]) => deactivatePlus(...a),
}));

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/billing/webhook/route';

const env = { ...process.env };
const send = (headers: Record<string, string> = { 'stripe-signature': 'sig' }) =>
  POST(
    new NextRequest('http://localhost/api/billing/webhook', {
      method: 'POST',
      body: '{"raw":true}',
      headers,
    }),
  );
const event = (type: string, object: Record<string, unknown>) => ({
  type,
  data: { object },
});

beforeEach(() => {
  constructEvent.mockReset();
  activatePlus.mockReset().mockResolvedValue(undefined);
  deactivatePlus.mockReset().mockResolvedValue(undefined);
  jest.spyOn(console, 'error').mockImplementation(() => {});
  process.env.NEXT_PUBLIC_PAYMENTS_PROVIDER = 'stripe';
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
});
afterEach(() => {
  process.env = { ...env };
  jest.restoreAllMocks();
});

describe('POST /api/billing/webhook', () => {
  it('does not exist while payments are the free demo', async () => {
    process.env.NEXT_PUBLIC_PAYMENTS_PROVIDER = 'free';
    expect((await send()).status).toBe(404);
  });

  it('says so when the webhook secret is not configured', async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;
    expect((await send()).status).toBe(500);
  });

  it('rejects a call with no signature', async () => {
    expect((await send({})).status).toBe(400);
    expect(constructEvent).not.toHaveBeenCalled();
  });

  it('rejects a call whose signature does not verify, and changes nothing', async () => {
    constructEvent.mockImplementation(() => {
      throw new Error('bad signature');
    });
    expect((await send()).status).toBe(400);
    expect(activatePlus).not.toHaveBeenCalled();
    expect(deactivatePlus).not.toHaveBeenCalled();
  });

  it('verifies the raw body against the secret', async () => {
    constructEvent.mockReturnValue(event('invoice.paid', {}));
    await send();
    expect(constructEvent).toHaveBeenCalledWith('{"raw":true}', 'sig', 'whsec_test');
  });

  it('upgrades the user named on a paid checkout', async () => {
    constructEvent.mockReturnValue(
      event('checkout.session.completed', {
        payment_status: 'paid',
        client_reference_id: 'u1',
      }),
    );
    const res = await send();
    expect(res.status).toBe(200);
    expect(activatePlus).toHaveBeenCalledWith('u1');
  });

  it.each([
    ['unpaid', { payment_status: 'unpaid', client_reference_id: 'u1' }],
    ['with no user on it', { payment_status: 'paid', client_reference_id: null }],
  ])('does not upgrade for a checkout that is %s', async (_, session) => {
    constructEvent.mockReturnValue(event('checkout.session.completed', session));
    expect((await send()).status).toBe(200);
    expect(activatePlus).not.toHaveBeenCalled();
  });

  it('downgrades the user when their subscription ends', async () => {
    constructEvent.mockReturnValue(
      event('customer.subscription.deleted', { metadata: { userId: 'u1' } }),
    );
    expect((await send()).status).toBe(200);
    expect(deactivatePlus).toHaveBeenCalledWith('u1');
  });

  it('ignores a deleted subscription that does not name a user', async () => {
    constructEvent.mockReturnValue(
      event('customer.subscription.deleted', { metadata: {} }),
    );
    expect((await send()).status).toBe(200);
    expect(deactivatePlus).not.toHaveBeenCalled();
  });

  it('acknowledges events it does not handle', async () => {
    constructEvent.mockReturnValue(event('charge.refunded', {}));
    const res = await send();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ received: true });
  });

  it('answers 500 so Stripe retries when saving fails', async () => {
    constructEvent.mockReturnValue(
      event('checkout.session.completed', {
        payment_status: 'paid',
        client_reference_id: 'u1',
      }),
    );
    activatePlus.mockRejectedValue(new Error('db'));
    expect((await send()).status).toBe(500);
  });
});
