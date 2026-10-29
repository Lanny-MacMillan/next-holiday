import Stripe from 'stripe';

let client: Stripe | null = null;

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
  return (client ??= new Stripe(key));
}

// Where Stripe sends people back to; the app's own origin.
export function appOrigin() {
  return new URL(
    process.env.NEXT_PUBLIC_AUTH0_CALLBACK_URL ?? 'http://localhost:3000',
  ).origin;
}
