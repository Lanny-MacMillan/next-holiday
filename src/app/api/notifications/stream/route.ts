import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { connections } from '@/lib/notifications/stream';

// Log immediately when this file is loaded
console.log('🔥 SSE ROUTE FILE LOADED - Module import successful');

export async function GET(request: NextRequest) {
  // Log immediately when function is called - before any try/catch
  console.log('🎯 SSE GET FUNCTION CALLED - Before try/catch');

  // Wrap everything in try-catch to catch ANY errors
  try {
    const requestUrl = request.url;
    const timestamp = new Date().toISOString();

    // Log the very start - this will help us see if we even get to this point
    console.log(`🚀 SSE ROUTE ENTRY POINT - ${timestamp}`);
    console.log(`📍 URL: ${requestUrl}`);
    console.log(`🌍 NODE_ENV: ${process.env.NODE_ENV}`);

    // Helper function to send debug logs to both server console and client
    const debugLog = (message: string, data?: any) => {
      const logEntry = { message, data, timestamp: new Date().toISOString() };
      console.log(`[${logEntry.timestamp}] ${message}`, data || '');
      return logEntry;
    };

    const logs: any[] = [];
    logs.push(debugLog('🚀 SSE Stream Request Initiated', { url: requestUrl }));

    try {
      logs.push(debugLog('🔐 Starting authentication process...'));

      // Try to authenticate user (more lenient for SSE)
      const user = await getCurrentUser(request);

      logs.push(
        debugLog(
          '👤 Authentication result',
          user
            ? { status: 'SUCCESS', userId: user.id, email: user.email }
            : { status: 'FAILED' },
        ),
      );

      if (!user) {
        logs.push(debugLog('❌ No user found - returning 401'));

        // Send all debug logs before returning error
        return new Response(
          `data: ${JSON.stringify({
            type: 'debug_logs',
            logs: logs,
            timestamp,
          })}\n\ndata: ${JSON.stringify({
            type: 'error',
            message: 'Authentication required. Please log in and refresh the page.',
            timestamp,
            debug: {
              url: requestUrl,
              hasTestUser: requestUrl.includes('testUser'),
            },
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
      logs.push(
        debugLog('✅ Authentication successful - proceeding with user ID', {
          userId,
        }),
      );

      // Set up SSE headers
      const responseHeaders = {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
      };

      logs.push(debugLog('📡 Creating ReadableStream for SSE...'));

      // Create readable stream for SSE
      const stream = new ReadableStream({
        start(controller) {
          try {
            // Send all debug logs first
            controller.enqueue(
              `data: ${JSON.stringify({
                type: 'debug_logs',
                logs: logs,
                timestamp: new Date().toISOString(),
              })}\n\n`,
            );

            debugLog('🔔 SSE connection established for user', { userId });
            debugLog('🗺️ Current connections map size', { size: connections.size });

            // Store this connection for the user
            if (!connections.has(userId)) {
              connections.set(userId, new Set());
              debugLog('🆕 Created new connection set for user', { userId });
            }

            const userConnections = connections.get(userId)!;
            userConnections.add(controller);
            debugLog('🔗 Added controller to user connections', {
              userId,
              totalConnections: userConnections.size,
            });

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

            debugLog('📨 Sending welcome message', welcomeMessage);
            controller.enqueue(`data: ${JSON.stringify(welcomeMessage)}\n\n`);
            debugLog('✅ Welcome message sent successfully');

            // Send heartbeat every 30 seconds to keep connection alive
            const heartbeat = setInterval(() => {
              try {
                const heartbeatMsg = {
                  type: 'heartbeat',
                  timestamp: new Date().toISOString(),
                  userId: userId,
                };
                debugLog('💓 Sending heartbeat for user', { userId });
                controller.enqueue(`data: ${JSON.stringify(heartbeatMsg)}\n\n`);
              } catch (err) {
                console.error(`❌ Heartbeat error for user ${userId}:`, err);
                clearInterval(heartbeat);
              }
            }, 30000);

            debugLog('⏰ Heartbeat interval started for user', { userId });

            // Cleanup on connection close
            const cleanup = () => {
              console.log(
                `[${new Date().toISOString()}] 🧹 Cleaning up connection for user: ${userId}`,
              );
              clearInterval(heartbeat);
              const userConnections = connections.get(userId);
              if (userConnections) {
                userConnections.delete(controller);
                console.log(
                  `[${new Date().toISOString()}] 🗑️ Removed controller. Remaining connections for user: ${userConnections.size}`,
                );
                if (userConnections.size === 0) {
                  connections.delete(userId);
                  console.log(
                    `[${new Date().toISOString()}] 🗑️ Deleted empty connection set for user: ${userId}`,
                  );
                }
              }
              console.log(
                `[${new Date().toISOString()}] 🔔 SSE connection closed for user: ${userId}`,
              );
            };

            // Handle connection close
            console.log(
              `[${timestamp}] 👂 Adding abort event listener for user: ${userId}`,
            );
            request.signal?.addEventListener('abort', cleanup);
          } catch (streamError) {
            console.error(
              `[${timestamp}] 💥 Stream start error for user ${userId}:`,
              streamError,
            );
            console.error(
              `[${timestamp}] 💥 Stream error stack:`,
              streamError instanceof Error ? streamError.stack : 'No stack trace',
            );
            controller.error(streamError);
          }
        },

        cancel(controller) {
          try {
            console.log(
              `[${new Date().toISOString()}] ❌ Stream cancelled for user: ${userId}`,
            );
            // Connection was cancelled/closed
            const userConnections = connections.get(userId);
            if (userConnections) {
              userConnections.delete(controller);
              if (userConnections.size === 0) {
                connections.delete(userId);
              }
            }
          } catch (cancelError) {
            console.error(
              `[${new Date().toISOString()}] 💥 Stream cancel error for user ${userId}:`,
              cancelError,
            );
          }
        },
      });

      console.log(`[${timestamp}] 📤 Returning stream response for user: ${userId}`);
      return new Response(stream, {
        headers: responseHeaders,
      });
    } catch (error) {
      const errorTimestamp = new Date().toISOString();
      console.error(`[${errorTimestamp}] 💥💥 CRITICAL SSE ENDPOINT ERROR 💥💥`);
      console.error(`[${errorTimestamp}] 🔍 Error:`, error);

      // Send debug logs and error info through SSE stream so it shows up in browser console
      return new Response(
        `data: ${JSON.stringify({
          type: 'debug_logs',
          logs: logs || [],
          timestamp: errorTimestamp,
        })}\n\ndata: ${JSON.stringify({
          type: 'error',
          message: 'Server error occurred in notifications stream',
          timestamp: errorTimestamp,
          error: {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            url: requestUrl,
          },
          errorId: Math.random().toString(36).substring(7),
        })}`,
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
  } catch (topLevelError) {
    // This catches ANY error that happens before we can even set up proper error handling
    const errorTimestamp = new Date().toISOString();
    console.error(`💥💥 TOP-LEVEL SSE ROUTE ERROR - ${errorTimestamp}`);
    console.error(`🔍 Error:`, topLevelError);
    console.error(`🔍 Error Type:`, topLevelError?.constructor?.name);
    console.error(
      `🔍 Error Message:`,
      topLevelError instanceof Error ? topLevelError.message : topLevelError,
    );
    console.error(
      `🔍 Stack:`,
      topLevelError instanceof Error ? topLevelError.stack : 'No stack',
    );

    // Return basic error response
    return new Response(
      `data: ${JSON.stringify({
        type: 'error',
        message: 'Critical server error in SSE route',
        timestamp: errorTimestamp,
        error: {
          message:
            topLevelError instanceof Error ? topLevelError.message : 'Unknown error',
          type: topLevelError?.constructor?.name || 'Unknown',
        },
      })}`,
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
