/** @jest-environment node */
const authenticate = jest.fn();
jest.mock('@/lib/routeAuth', () => ({
  authenticate: (...a: unknown[]) => authenticate(...a),
}));

const stripe = {
  checkout: { sessions: { create: jest.fn() } },
  subscriptions: { search: jest.fn() },
  billingPortal: { sessions: { create: jest.fn() } },
};
jest.mock('@/lib/stripe', () => ({
  getStripe: () => stripe,
  appOrigin: () => 'https://app.test',
}));

import { NextResponse } from 'next/server';
import { apiRequest } from '@/__tests__/support/api';
import { POST as checkout } from '@/app/api/billing/checkout/route';
import { POST as portal } from '@/app/api/billing/portal/route';

const user = {
  id: 'u1',
  auth0Sub: 'auth0|u1',
  verifiedEmail: 'me@x.com',
  subscriptionPlan: 'free',
};
const env = { ...process.env };
const json = async (res: Response) => ({
  status: res.status,
  body: await res.json(),
});

beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  Object.values(stripe).forEach(group =>
    Object.values(group).forEach(
      (g: any) => g.create?.mockReset?.() ?? g.search?.mockReset?.(),
    ),
  );
  stripe.checkout.sessions.create.mockReset();
  stripe.subscriptions.search.mockReset();
  stripe.billingPortal.sessions.create.mockReset();
  authenticate.mockReset().mockResolvedValue({ user });
  process.env.NEXT_PUBLIC_PAYMENTS_PROVIDER = 'stripe';
  process.env.STRIPE_PRICE_ID = 'price_plus';
});
afterEach(() => {
  process.env = { ...env };
  jest.restoreAllMocks();
});

describe.each([
  ['checkout', checkout],
  ['portal', portal],
])('POST /api/billing/%s', (_, handler) => {
  const call = () => handler(apiRequest('/api/billing/x', 'POST'));

  it('does not exist while payments are the free demo', async () => {
    process.env.NEXT_PUBLIC_PAYMENTS_PROVIDER = 'free';
    expect((await json(await call())).status).toBe(404);
    expect(authenticate).not.toHaveBeenCalled();
  });

  it('needs a signed-in user', async () => {
    authenticate.mockResolvedValue({
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    });
    expect((await json(await call())).status).toBe(401);
  });
});

describe('POST /api/billing/checkout', () => {
  const call = () => checkout(apiRequest('/api/billing/checkout', 'POST'));

  it('starts a subscription checkout for the signed-in user and returns its url', async () => {
    stripe.checkout.sessions.create.mockResolvedValue({
      url: 'https://stripe.test/c',
    });
    const { status, body } = await json(await call());

    expect(status).toBe(200);
    expect(body.data).toEqual({ url: 'https://stripe.test/c' });
    expect(stripe.checkout.sessions.create).toHaveBeenCalledWith({
      mode: 'subscription',
      line_items: [{ price: 'price_plus', quantity: 1 }],
      client_reference_id: 'u1',
      customer_email: 'me@x.com',
      subscription_data: { metadata: { userId: 'u1' } },
      success_url: 'https://app.test/?upgrade=success',
      cancel_url: 'https://app.test/?upgrade=cancelled',
    });
  });

  it('takes the user id from the verified session, never from the request', async () => {
    stripe.checkout.sessions.create.mockResolvedValue({ url: 'u' });
    await checkout(
      apiRequest('/api/billing/checkout', 'POST', { userId: 'victim' }),
    );
    expect(
      stripe.checkout.sessions.create.mock.calls[0][0].client_reference_id,
    ).toBe('u1');
  });

  it('refuses someone already on Plus', async () => {
    authenticate.mockResolvedValue({ user: { ...user, subscriptionPlan: 'plus' } });
    expect((await json(await call())).status).toBe(400);
    expect(stripe.checkout.sessions.create).not.toHaveBeenCalled();
  });

  it('says so when no price is configured', async () => {
    delete process.env.STRIPE_PRICE_ID;
    expect((await json(await call())).status).toBe(500);
  });

  it('answers 500 when Stripe fails', async () => {
    stripe.checkout.sessions.create.mockRejectedValue(new Error('stripe down'));
    expect((await json(await call())).status).toBe(500);
  });
});

describe('POST /api/billing/portal', () => {
  const call = () => portal(apiRequest('/api/billing/portal', 'POST'));

  it("finds the user's active subscription and opens the billing portal for its customer", async () => {
    stripe.subscriptions.search.mockResolvedValue({ data: [{ customer: 'cus_1' }] });
    stripe.billingPortal.sessions.create.mockResolvedValue({
      url: 'https://stripe.test/p',
    });
    const { status, body } = await json(await call());

    expect(status).toBe(200);
    expect(body.data).toEqual({ url: 'https://stripe.test/p' });
    expect(stripe.subscriptions.search.mock.calls[0][0].query).toBe(
      "metadata['userId']:'u1' AND status:'active'",
    );
    expect(stripe.billingPortal.sessions.create).toHaveBeenCalledWith({
      customer: 'cus_1',
      return_url: 'https://app.test',
    });
  });

  it('accepts an expanded customer object', async () => {
    stripe.subscriptions.search.mockResolvedValue({
      data: [{ customer: { id: 'cus_2' } }],
    });
    stripe.billingPortal.sessions.create.mockResolvedValue({ url: 'p' });
    await call();
    expect(stripe.billingPortal.sessions.create.mock.calls[0][0].customer).toBe(
      'cus_2',
    );
  });

  it('answers 404 when there is no active subscription', async () => {
    stripe.subscriptions.search.mockResolvedValue({ data: [] });
    expect((await json(await call())).status).toBe(404);
    expect(stripe.billingPortal.sessions.create).not.toHaveBeenCalled();
  });

  it('answers 500 when Stripe fails', async () => {
    stripe.subscriptions.search.mockRejectedValue(new Error('stripe down'));
    expect((await json(await call())).status).toBe(500);
  });
});
