import { NextRequest } from 'next/server';
import { requireAuth, assertHolidayAccess } from '@/lib/auth';
import { ok, badRequest, notFound, routeError } from '@/lib/http';
import { getLeaderboard } from '@/lib/server/points';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;
    const forbidden = await assertHolidayAccess(id, user.id);
    if (forbidden) return forbidden;

    const yearParam = request.nextUrl.searchParams.get('year');
    const year = yearParam === null ? undefined : Number(yearParam);
    if (
      year !== undefined &&
      (!Number.isInteger(year) || year < 2000 || year > 2100)
    ) {
      return badRequest('year must be a four-digit year');
    }

    const board = await getLeaderboard(id, user.id, year);
    if (!board) return notFound('Holiday not found');
    return ok(board, { 'Cache-Control': 'private, no-store' });
  } catch (error) {
    return routeError(
      error,
      'Error loading leaderboard:',
      'Failed to load leaderboard',
    );
  }
}
