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
        try {
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
              console.error('Heartbeat error:', err);
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
        } catch (streamError) {
          console.error('Stream start error:', streamError);
          controller.error(streamError);
        }
      },

      cancel(controller) {
        try {
          // Connection was cancelled/closed
          const userConnections = connections.get(userId);
          if (userConnections) {
            userConnections.delete(controller);
            if (userConnections.size === 0) {
              connections.delete(userId);
            }
          }
        } catch (cancelError) {
          console.error('Stream cancel error:', cancelError);
        }
      },
    });

    return new Response(stream, {
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('SSE endpoint error:', error);

    // Better error handling to help debug production issues
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return new Response(
      `data: ${JSON.stringify({
        type: 'error',
        message: 'Server error occurred',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
        timestamp: new Date().toISOString(),
      })}\n\n`,
      {
        status: 500,
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
}
