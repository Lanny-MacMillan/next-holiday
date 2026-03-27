import { NextRequest } from 'next/server';
import {
  sendNotificationToUser,
  getConnectionStats,
} from '@/lib/notifications/stream';

export async function GET(request: NextRequest) {
  console.log('🧪 TEST ROUTE CALLED');
  const stats = getConnectionStats();
  return new Response(
    JSON.stringify({
      message: 'Test route working',
      timestamp: new Date().toISOString(),
      url: request.url,
      connectionStats: stats,
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );
}

export async function POST(request: NextRequest) {
  try {
    const { userId, title, message } = await request.json();

    if (!userId || !title || !message) {
      return Response.json(
        { error: 'Missing required fields: userId, title, message' },
        { status: 400 },
      );
    }

    // Get current connection stats before sending
    const statsBefore = getConnectionStats();

    // Create a test notification
    const testNotification = {
      id: `test-${Date.now()}`,
      type: 'test',
      title,
      message,
      entityType: 'test',
      entityId: `test-${Date.now()}`,
      fromUserId: 'system',
      isRead: false,
      createdAt: new Date().toISOString(),
      isInvite: false,
    };

    // Send the notification
    const sent = sendNotificationToUser(userId, testNotification);

    return Response.json({
      success: true,
      sent,
      notification: testNotification,
      connectionStats: statsBefore,
      message: sent
        ? `Test notification sent to user ${userId}`
        : `No active connections for user ${userId}`,
    });
  } catch (error) {
    console.error('Test notification error:', error);
    return Response.json(
      {
        error: 'Test notification error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
