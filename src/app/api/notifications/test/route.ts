import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('🧪 TEST ROUTE CALLED');
  return new Response(
    JSON.stringify({
      message: 'Test route working',
      timestamp: new Date().toISOString(),
      url: request.url,
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );
}
