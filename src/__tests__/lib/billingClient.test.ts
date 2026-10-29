import { goToStripe } from '@/lib/billingClient';

const mockFetch = jest.fn();
beforeEach(() => {
  mockFetch.mockReset();
  global.fetch = mockFetch as unknown as typeof fetch;
});

describe('goToStripe', () => {
  it('posts to the endpoint and goes to the url it is given', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: { url: 'https://checkout.stripe.test/s1' } }),
    });
    const navigate = jest.fn();

    await goToStripe('/api/billing/checkout', navigate);

    expect(mockFetch).toHaveBeenCalledWith('/api/billing/checkout', {
      method: 'POST',
    });
    expect(navigate).toHaveBeenCalledWith('https://checkout.stripe.test/s1');
  });

  it("throws the server's message and does not navigate when it refuses", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Already on Plus' }),
    });
    const navigate = jest.fn();

    await expect(goToStripe('/api/billing/portal', navigate)).rejects.toThrow(
      'Already on Plus',
    );
    expect(navigate).not.toHaveBeenCalled();
  });

  it('throws a plain message when the response is not usable', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => {
        throw new Error('not json');
      },
    });
    await expect(goToStripe('/api/billing/checkout', jest.fn())).rejects.toThrow(
      'Could not reach the payment page',
    );
  });

  it("reports 'downgraded' and does not navigate when the server changed the plan itself", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: { downgraded: true } }),
    });
    const navigate = jest.fn();

    await expect(goToStripe('/api/billing/portal', navigate)).resolves.toBe(
      'downgraded',
    );
    expect(navigate).not.toHaveBeenCalled();
  });
});
