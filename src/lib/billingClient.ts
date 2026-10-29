// Asks the server for a Stripe-hosted page (checkout or billing portal) and goes there.
export async function goToStripe(
  path: '/api/billing/checkout' | '/api/billing/portal',
  navigate = (url: string) => window.location.assign(url),
) {
  const response = await fetch(path, { method: 'POST' });
  const result = await response.json().catch(() => null);
  if (!response.ok || !result?.data?.url) {
    throw new Error(result?.error ?? 'Could not reach the payment page');
  }
  navigate(result.data.url);
}
