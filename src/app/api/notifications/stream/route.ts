import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { connections } from '@/lib/notifications/stream';

// Log immediately when this file is loaded
console.log('🔥 SSE ROUTE FILE LOADED - Module import successful');

export async function GET(request: NextRequest) {
  // Log immediately when function is called - before any try/catch
  console.log('🎯 SSE GET FUNCTION CALLED - Before try/catch');
  console.log('🌍 Request URL:', request.url);
  console.log('🔍 Request method:', request.method);

  try {
    console.log('⚡ Starting authentication...');

    // Use requireAuth like other routes
    const user = await requireAuth(request);
    console.log('✅ Authentication successful:', {
      userId: user.id,
      email: user.email,
    });

    const userId = user.id;

    // Set up SSE headers
    const responseHeaders = {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    };

    console.log('📡 Creating ReadableStream for SSE...');

    // Create readable stream for SSE
    const stream = new ReadableStream({
      start(controller) {
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

          console.log('📨 Sending welcome message:', welcomeMessage);
          controller.enqueue(`data: ${JSON.stringify(welcomeMessage)}\n\n`);
          console.log('✅ Welcome message sent successfully');

          // Send heartbeat every 30 seconds to keep connection alive
          const heartbeat = setInterval(() => {
            try {
              const heartbeatMsg = {
                type: 'heartbeat',
                timestamp: new Date().toISOString(),
                userId: userId,
              };
              console.log('💓 Sending heartbeat for user:', userId);
              controller.enqueue(`data: ${JSON.stringify(heartbeatMsg)}\n\n`);
            } catch (err) {
              console.error(`❌ Heartbeat error for user ${userId}:`, err);
              clearInterval(heartbeat);
            }
          }, 30000);

          console.log('⏰ Heartbeat interval started for user:', userId);

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
            console.log(`🔔 SSE connection closed for user: ${userId}`);
          };

          // Handle connection close
          console.log(`👂 Adding abort event listener for user: ${userId}`);
          request.signal?.addEventListener('abort', cleanup);
        } catch (streamError) {
          console.error(`💥 Stream start error for user ${userId}:`, streamError);
          console.error(
            `💥 Stream error stack:`,
            streamError instanceof Error ? streamError.stack : 'No stack trace',
          );
          controller.error(streamError);
        }
      },

      cancel(controller) {
        try {
          console.log(`❌ Stream cancelled for user: ${userId}`);
          const userConnections = connections.get(userId);
          if (userConnections) {
            userConnections.delete(controller);
            if (userConnections.size === 0) {
              connections.delete(userId);
            }
          }
        } catch (cancelError) {
          console.error(`💥 Stream cancel error for user ${userId}:`, cancelError);
        }
      },
    });

    console.log(`📤 Returning stream response for user: ${userId}`);
    return new Response(stream, {
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('❌ SSE route error:', error);

    // Return error as SSE stream so EventSource can handle it
    const errorStream = new ReadableStream({
      start(controller) {
        const errorMessage = {
          type: 'error',
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        };
        controller.enqueue(`data: ${JSON.stringify(errorMessage)}\n\n`);
        controller.close();
      },
    });

    return new Response(errorStream, {
      status: 500,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
      },
    });
  }
}
