import { paymentsProvider } from '@/lib/payments';

describe('paymentsProvider', () => {
  it('is the free demo unless Stripe is asked for', () => {
    expect(paymentsProvider(undefined)).toBe('free');
    expect(paymentsProvider('')).toBe('free');
    expect(paymentsProvider('paypal')).toBe('free');
  });

  it('is Stripe only for the exact value', () => {
    expect(paymentsProvider('stripe')).toBe('stripe');
    expect(paymentsProvider('Stripe')).toBe('free');
  });

  it('reads the environment when no value is given', () => {
    const original = process.env.NEXT_PUBLIC_PAYMENTS_PROVIDER;
    process.env.NEXT_PUBLIC_PAYMENTS_PROVIDER = 'stripe';
    expect(paymentsProvider()).toBe('stripe');
    if (original === undefined) delete process.env.NEXT_PUBLIC_PAYMENTS_PROVIDER;
    else process.env.NEXT_PUBLIC_PAYMENTS_PROVIDER = original;
  });
});
