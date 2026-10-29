import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { missingEnv } from '@/lib/env';

export async function GET() {
  const missing = missingEnv();
  let database = 'ok';
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    database = 'unavailable';
  }

  const healthy = database === 'ok' && missing.length === 0;
  return NextResponse.json(
    {
      status: healthy ? 'ok' : 'degraded',
      checks: { database, config: missing.length === 0 ? 'ok' : 'incomplete' },
    },
    { status: healthy ? 200 : 503, headers: { 'Cache-Control': 'no-store' } },
  );
}
