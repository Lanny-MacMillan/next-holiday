import { NextRequest } from 'next/server';
import { paymentsProvider } from '@/lib/payments';
import { authenticate } from '@/lib/routeAuth';
import { appOrigin, getStripe } from '@/lib/stripe';
import { notFound, ok, routeError } from '@/lib/http';
import { deactivatePlus } from '@/lib/server/billing';

// Search results can trail a new subscription by a minute, so only a longer-standing
// Plus with no subscription is treated as a demo upgrade.
const DEMO_PLUS_MIN_AGE_MS = 10 * 60 * 1000;

// Sends a subscriber to Stripe's billing portal, where they can cancel or update payment.
// Plus from the free demo has no subscription, so it is downgraded here instead.
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
    if (!customer) {
      const since = auth.user.subscriptionStartDate?.getTime() ?? 0;
      if (
        auth.user.subscriptionPlan === 'plus' &&
        Date.now() - since > DEMO_PLUS_MIN_AGE_MS
      ) {
        await deactivatePlus(auth.user.id);
        return ok({ downgraded: true });
      }
      return notFound('No active subscription');
    }

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
