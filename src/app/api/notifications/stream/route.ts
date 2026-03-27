import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { connections } from '@/lib/notifications/stream';

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

    const userId = user.id;

    console.log('📡 Creating proper streaming SSE response...');

    // Create readable stream that stays open
    const stream = new ReadableStream({
      start(controller) {
        console.log('🎬 ReadableStream start() - keeping connection open');

        try {
          console.log('🔔 SSE connection established for user:', userId);

          // Store this connection for the user
          if (!connections.has(userId)) {
            connections.set(userId, new Set());
            console.log('🆕 Created new connection set for user:', userId);
          }

          const userConnections = connections.get(userId)!;
          userConnections.add(controller);
          console.log(
            '🔗 Added controller to user connections. Total:',
            userConnections.size,
          );

          // Send initial connection confirmation
          const welcomeMessage = {
            type: 'connection',
            message: 'Connected to notification stream',
            timestamp: new Date().toISOString(),
            userId: userId,
            debug: {
              environment: process.env.NODE_ENV || 'unknown',
              connectionId: Math.random().toString(36).substring(7),
            },
          };

          console.log('📨 Sending welcome message');
          const encoder = new TextEncoder();
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(welcomeMessage)}\n\n`),
          );
          console.log('✅ Welcome message sent - connection staying open');

          // Send heartbeat every 30 seconds to keep connection alive
          const heartbeat = setInterval(() => {
            try {
              const heartbeatMsg = {
                type: 'heartbeat',
                timestamp: new Date().toISOString(),
                userId: userId,
              };
              console.log('💓 Sending heartbeat for user:', userId);
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify(heartbeatMsg)}\n\n`),
              );
            } catch (err) {
              console.error(`❌ Heartbeat error for user ${userId}:`, err);
              clearInterval(heartbeat);
            }
          }, 30000);

          console.log('⏰ Heartbeat interval started - connection will stay alive');

          // Cleanup on connection close
          const cleanup = () => {
            console.log(`🧹 Cleaning up connection for user: ${userId}`);
            clearInterval(heartbeat);
            const userConnections = connections.get(userId);
            if (userConnections) {
              userConnections.delete(controller);
              console.log(
                `🗑️ Removed controller. Remaining connections: ${userConnections.size}`,
              );
              if (userConnections.size === 0) {
                connections.delete(userId);
                console.log(`🗑️ Deleted empty connection set for user: ${userId}`);
              }
            }
          };

          // Handle connection close
          request.signal?.addEventListener('abort', cleanup);
        } catch (streamError) {
          console.error(`💥 Stream start error:`, streamError);
          controller.error(streamError);
        }
      },

      cancel() {
        console.log(`❌ Stream cancelled for user: ${userId}`);
        const userConnections = connections.get(userId);
        if (userConnections) {
          userConnections.clear();
          connections.delete(userId);
        }
      },
    });

    console.log(`📤 Returning streaming response for user: ${userId}`);
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
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
