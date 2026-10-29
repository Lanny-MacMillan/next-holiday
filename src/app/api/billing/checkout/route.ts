import { NextRequest } from 'next/server';
import { paymentsProvider } from '@/lib/payments';
import { authenticate } from '@/lib/routeAuth';
import { appOrigin, getStripe } from '@/lib/stripe';
import { badRequest, notFound, ok, routeError, serverError } from '@/lib/http';

// Starts a Stripe Checkout session for the Plus subscription and returns its URL.
export async function POST(request: NextRequest) {
  if (paymentsProvider() !== 'stripe') return notFound('Payments are not enabled');

  const auth = await authenticate(request);
  if (auth.response) return auth.response;
  const { user } = auth;

  const price = process.env.STRIPE_PRICE_ID;
  if (!price) return serverError('Payments are not configured');
  if (user.subscriptionPlan === 'plus') return badRequest('Already on Plus');

  try {
    const origin = appOrigin();
    const session = await getStripe().checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price, quantity: 1 }],
      client_reference_id: user.id,
      customer_email: user.verifiedEmail ?? undefined,
      subscription_data: { metadata: { userId: user.id } },
      success_url: `${origin}/?upgrade=success`,
      cancel_url: `${origin}/?upgrade=cancelled`,
    });
    return ok({ url: session.url });
  } catch (error) {
    return routeError(error, 'Error starting checkout:', 'Failed to start checkout');
  }
}
