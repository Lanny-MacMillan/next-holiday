import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { ok, routeError } from '@/lib/http';
import { getUserProgress } from '@/lib/server/points';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    return ok(await getUserProgress(user.id), {
      'Cache-Control': 'private, no-store',
    });
  } catch (error) {
    return routeError(error, 'Error loading progress:', 'Failed to load progress');
  }
}
