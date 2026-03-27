import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

// Log immediately when this file is loaded
console.log('🔥 SSE ROUTE FILE LOADED - Module import successful');

export async function GET(request: NextRequest) {
  // Log immediately when function is called - before any try/catch
  console.log('🎯 SSE GET FUNCTION CALLED - Before try/catch');
  console.log('🌍 Request URL:', request.url);

  try {
    console.log('⚡ Starting authentication...');

    // Get auth0Sub from query parameters (same pattern as /api/users/me)
    const url = new URL(request.url);
    const auth0SubParam = url.searchParams.get('auth0Sub');

    console.log('🔑 Auth0Sub param:', auth0SubParam ? 'FOUND' : 'NOT FOUND');

    if (!auth0SubParam) {
      console.error('❌ No auth0Sub parameter provided');
      return Response.json({ error: 'Auth0 sub is required' }, { status: 400 });
    }

    // Find user by auth0Sub (same pattern as /api/users/me)
    const user = await prisma.user.findUnique({
      where: { auth0Sub: auth0SubParam },
      select: {
        id: true,
        auth0Sub: true,
        email: true,
        name: true,
        picture: true,
        subscriptionPlan: true,
        subscriptionStartDate: true,
        subscriptionEndDate: true,
        createdAt: true,
      },
    });

    console.log(
      '✅ User lookup result:',
      user ? `Found user ${user.id}` : 'User not found',
    );

    if (!user) {
      console.error('❌ User not found for auth0Sub:', auth0SubParam);
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('✅ Authentication successful:', {
      userId: user.id,
      email: user.email,
    });

    // SIMPLEST POSSIBLE SSE RESPONSE - no streaming, just static content
    const welcomeMessage = {
      type: 'connection',
      message: 'Connected to notifications',
      timestamp: new Date().toISOString(),
      userId: user.id,
    };

    const sseResponse = `data: ${JSON.stringify(welcomeMessage)} \n data: {"type":"heartbeat","timestamp":"${new Date().toISOString()}"}\n`;

    console.log('📤 Returning simple SSE response');

    return new Response(sseResponse, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*',
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
