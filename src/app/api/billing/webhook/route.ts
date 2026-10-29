import { NextRequest, NextResponse } from 'next/server';
import { paymentsProvider } from '@/lib/payments';
import { getStripe } from '@/lib/stripe';
import { activatePlus, deactivatePlus } from '@/lib/server/billing';
import { badRequest, notFound, serverError } from '@/lib/http';

// Stripe calls this, not a signed-in user: the signature is what authenticates it.
export async function POST(request: NextRequest) {
  if (paymentsProvider() !== 'stripe') return notFound('Payments are not enabled');

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return serverError('Payments are not configured');

  const signature = request.headers.get('stripe-signature');
  if (!signature) return badRequest('Missing signature');

  let event;
  try {
    event = getStripe().webhooks.constructEvent(
      await request.text(),
      signature,
      secret,
    );
  } catch {
    return badRequest('Invalid signature');
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const paid = ['paid', 'no_payment_required'].includes(session.payment_status);
      if (paid && session.client_reference_id) {
        await activatePlus(session.client_reference_id);
      }
    } else if (event.type === 'customer.subscription.deleted') {
      const userId = event.data.object.metadata?.userId;
      if (userId) await deactivatePlus(userId);
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    // A 500 makes Stripe retry later.
    console.error('Error handling Stripe webhook:', error);
    return serverError('Failed to process event');
  }
}
