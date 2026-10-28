export async function fetchSseTicket(): Promise<string> {
  const response = await fetch('/api/sse-ticket', { method: 'POST' });
  if (!response.ok) {
    throw new Error(`SSE ticket request failed: ${response.status}`);
  }
  const { ticket } = await response.json();
  return ticket;
}
