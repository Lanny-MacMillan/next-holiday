import { NextRequest } from 'next/server';
import { getHomeData } from '@/lib/server/homeData';
import { ok, serverError } from '@/lib/http';

export async function GET(request: NextRequest) {
  try {
    const homeData = await getHomeData(request);
    return ok(homeData);
  } catch (error) {
    console.error('Error fetching home data:', error);
    return serverError('Failed to fetch home data');
  }
}
