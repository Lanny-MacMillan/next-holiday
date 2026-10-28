import { fetchSseTicket } from '../sseTicket';

const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

beforeEach(() => mockFetch.mockReset());

describe('fetchSseTicket', () => {
  it('POSTs to the ticket endpoint and returns the ticket', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ ticket: 'abc' }) });
    await expect(fetchSseTicket()).resolves.toBe('abc');
    expect(mockFetch).toHaveBeenCalledWith('/api/sse-ticket', { method: 'POST' });
  });

  it('throws when the request fails', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 401 });
    await expect(fetchSseTicket()).rejects.toThrow('401');
  });
});
