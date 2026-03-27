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

    console.log('📡 Creating persistent SSE stream...');

    const encoder = new TextEncoder();

    // Create a stream that stays open (not a static response)
    const stream = new ReadableStream({
      start(controller) {
        console.log('🎬 Stream started for user:', user.id);

        try {
          // Register this connection in the global connections map
          if (!connections.has(user.id)) {
            connections.set(user.id, new Set());
          }
          connections.get(user.id)!.add(controller);
          console.log('✅ Connection registered for user:', user.id);

          // Send welcome message immediately
          const welcomeMessage = {
            type: 'connection',
            message: 'Connected to notifications',
            timestamp: new Date().toISOString(),
            userId: user.id,
          };

          const welcomeData = `data: ${JSON.stringify(welcomeMessage)}\n\n`;
          controller.enqueue(encoder.encode(welcomeData));
          console.log('✅ Welcome message sent');

          // Send initial heartbeat
          const heartbeatMessage = {
            type: 'heartbeat',
            timestamp: new Date().toISOString(),
          };

          const heartbeatData = `data: ${JSON.stringify(heartbeatMessage)}\n\n`;
          controller.enqueue(encoder.encode(heartbeatData));
          console.log('✅ Initial heartbeat sent');

          // Keep connection alive with periodic heartbeats
          const heartbeatInterval = setInterval(() => {
            try {
              const heartbeat = {
                type: 'heartbeat',
                timestamp: new Date().toISOString(),
                userId: user.id,
              };

              const data = `data: ${JSON.stringify(heartbeat)}\n\n`;
              controller.enqueue(encoder.encode(data));
              console.log('💓 Heartbeat sent to user:', user.id);
            } catch (error) {
              console.error('💥 Heartbeat error:', error);
              clearInterval(heartbeatInterval);
            }
          }, 15000); // Every 15 seconds

          console.log('⏰ Heartbeat interval started - connection will stay open');

          // Shared cleanup function that can be called from multiple places
          const performCleanup = () => {
            console.log('🧹 Cleaning up for user:', user.id);
            clearInterval(heartbeatInterval);

            // Remove this connection from the global connections map
            const userConnections = connections.get(user.id);
            if (userConnections) {
              userConnections.delete(controller);
              if (userConnections.size === 0) {
                connections.delete(user.id);
                console.log('🗑️ Removed empty connection set for user:', user.id);
              } else {
                console.log(
                  '🔌 Remaining connections for user:',
                  user.id,
                  userConnections.size,
                );
              }
            }
          };

          // Store cleanup function on the controller for use in cancel method
          (controller as any).__cleanup = performCleanup;

          // Listen for connection close
          request.signal?.addEventListener('abort', performCleanup);
        } catch (error) {
          console.error('💥 Stream start error:', error);
          controller.error(error);
        }
      },

      cancel(controller) {
        console.log('❌ Stream cancelled for user:', user.id);

        // Call the shared cleanup function
        if ((controller as any).__cleanup) {
          (controller as any).__cleanup();
        }
      },
    });

    console.log('📤 Returning persistent SSE stream');

    return new Response(stream, {
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
