import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('🧪 SIMPLE TEST ROUTE HIT!');
  return Response.json({
    message: 'Test route working',
    timestamp: new Date().toISOString(),
    url: request.url,
  });
}
