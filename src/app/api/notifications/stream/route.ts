import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

// Store active connections for each user
const connections = new Map<string, Set<ReadableStreamDefaultController>>();

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

// Utility function to send notification to specific user
export function sendNotificationToUser(userId: string, notification: any) {
  const userConnections = connections.get(userId);

  if (!userConnections || userConnections.size === 0) {
    console.log(`No active SSE connections for user: ${userId}`);
    return false;
  }

  const message = `data: ${JSON.stringify(notification)}\n\n`;
  let successCount = 0;

  // Send to all active connections for this user (multiple tabs/windows)
  userConnections.forEach(controller => {
    try {
      controller.enqueue(message);
      successCount++;
    } catch (error) {
      console.error('Failed to send SSE message:', error);
      // Remove dead connection
      userConnections.delete(controller);
    }
  });

  // Clean up if no connections left
  if (userConnections.size === 0) {
    connections.delete(userId);
  }

  console.log(
    `📡 Sent notification to ${successCount} connections for user: ${userId}`,
  );
  return successCount > 0;
}

// Utility function to get connection count (for debugging)
export function getConnectionStats() {
  const stats = {
    totalUsers: connections.size,
    totalConnections: Array.from(connections.values()).reduce(
      (sum, conns) => sum + conns.size,
      0,
    ),
    userConnections: Object.fromEntries(
      Array.from(connections.entries()).map(([userId, conns]) => [
        userId,
        conns.size,
      ]),
    ),
  };

  return stats;
}
