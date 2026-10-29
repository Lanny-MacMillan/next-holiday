import { NextRequest } from 'next/server';
import { paymentsProvider } from '@/lib/payments';
import { authenticate } from '@/lib/routeAuth';
import { appOrigin, getStripe } from '@/lib/stripe';
import { notFound, ok, routeError } from '@/lib/http';

// Sends a subscriber to Stripe's billing portal, where they can cancel or update payment.
export async function POST(request: NextRequest) {
  if (paymentsProvider() !== 'stripe') return notFound('Payments are not enabled');

  const auth = await authenticate(request);
  if (auth.response) return auth.response;

  try {
    const stripe = getStripe();
    // The subscription carries the user id as metadata, so no customer id is stored in our database.
    const found = await stripe.subscriptions.search({
      query: `metadata['userId']:'${auth.user.id}' AND status:'active'`,
      limit: 1,
    });
    const customer = found.data[0]?.customer;
    if (!customer) return notFound('No active subscription');

    const session = await stripe.billingPortal.sessions.create({
      customer: typeof customer === 'string' ? customer : customer.id,
      return_url: appOrigin(),
    });
    return ok({ url: session.url });
  } catch (error) {
    return routeError(
      error,
      'Error opening billing portal:',
      'Failed to open billing',
    );
  }
}
