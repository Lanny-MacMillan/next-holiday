import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';

// Log immediately when this file is loaded
console.log('🔥 SSE ROUTE FILE LOADED - Module import successful');

export async function GET(request: NextRequest) {
  // Log immediately when function is called - before any try/catch
  console.log('🎯 SSE GET FUNCTION CALLED - Before try/catch');
  console.log('🌍 Request URL:', request.url);
  console.log('🔍 Request method:', request.method);
  console.log('🔍 Request headers:', Object.fromEntries(request.headers.entries()));

  try {
    console.log('⚡ Starting authentication...');

    // Use requireAuth like other routes
    const user = await requireAuth(request);
    console.log('✅ Authentication successful:', {
      userId: user.id,
      email: user.email,
    });

    // For now, return a simple JSON response instead of SSE to test routing
    return Response.json({
      message: 'SSE route working!',
      userId: user.id,
      timestamp: new Date().toISOString(),
      debug: {
        url: request.url,
        method: request.method,
      },
    });
  } catch (error) {
    console.error('❌ SSE route error:', error);
    return Response.json(
      {
        error: 'SSE route error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
