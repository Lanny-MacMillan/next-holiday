export type PaymentsProvider = 'free' | 'stripe';

// 'free' keeps upgrades free and labelled as a demo; 'stripe' charges through Stripe Checkout.
// The default argument is a literal env read so Next inlines it into the browser bundle too.
export function paymentsProvider(
  value = process.env.NEXT_PUBLIC_PAYMENTS_PROVIDER,
): PaymentsProvider {
  return value === 'stripe' ? 'stripe' : 'free';
}
