import { NextRequest } from 'next/server';
import { getConnectionStats } from '@/lib/notifications/stream';

export async function GET(request: NextRequest) {
  try {
    const stats = getConnectionStats();

    return Response.json({
      success: true,
      timestamp: new Date().toISOString(),
      connectionStats: stats,
      message: `${stats.totalConnections} active connections across ${stats.totalUsers} users`,
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return Response.json(
      {
        success: false,
        error: 'Debug endpoint error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
