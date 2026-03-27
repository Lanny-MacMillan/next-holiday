import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { connections } from '@/lib/notifications/stream';

export async function GET(request: NextRequest) {
  try {
    // Try to authenticate user (more lenient for SSE)
    const user = await getCurrentUser(request);

    if (!user) {
      // Return 401 with proper SSE headers for debugging
      return new Response(
        `data: ${JSON.stringify({
          type: 'error',
          message: 'Authentication required. Please log in and refresh the page.',
        })}\n\n`,
        {
          status: 401,
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Cache-Control',
          },
        },
      );
    }

    const userId = user.id;

    // Set up SSE headers
    const responseHeaders = {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    };

    // Create readable stream for SSE
    const stream = new ReadableStream({
      start(controller) {
        console.log(`🔔 SSE connection established for user: ${userId}`);

        // Store this connection for the user
        if (!connections.has(userId)) {
          connections.set(userId, new Set());
        }
        connections.get(userId)!.add(controller);

        // Send initial connection confirmation
        const welcomeMessage = {
          type: 'connection',
          message: 'Connected to notification stream',
          timestamp: new Date().toISOString(),
        };

        controller.enqueue(`data: ${JSON.stringify(welcomeMessage)}\n\n`);

        // Send heartbeat every 30 seconds to keep connection alive
        const heartbeat = setInterval(() => {
          try {
            controller.enqueue(
              `data: ${JSON.stringify({ type: 'heartbeat', timestamp: new Date().toISOString() })}\n\n`,
            );
          } catch (err) {
            clearInterval(heartbeat);
          }
        }, 30000);

        // Cleanup on connection close
        const cleanup = () => {
          clearInterval(heartbeat);
          const userConnections = connections.get(userId);
          if (userConnections) {
            userConnections.delete(controller);
            if (userConnections.size === 0) {
              connections.delete(userId);
            }
          }
          console.log(`🔔 SSE connection closed for user: ${userId}`);
        };

        // Handle connection close
        request.signal?.addEventListener('abort', cleanup);
      },

      cancel(controller) {
        // Connection was cancelled/closed
        const userConnections = connections.get(userId);
        if (userConnections) {
          userConnections.delete(controller);
          if (userConnections.size === 0) {
            connections.delete(userId);
          }
        }
      },
    });

    return new Response(stream, {
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('SSE endpoint error:', error);
    return new Response('Authentication failed', { status: 401 });
  }
}
