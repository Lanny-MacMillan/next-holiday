import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { authenticateClaims } from '@/lib/routeAuth';

const TICKET_TTL_SECONDS = 60;
const SSE_TICKET_AUDIENCE = 'sse-stream';

export async function POST(request: NextRequest) {
  const secret = process.env.SSE_API_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'SSE is not configured' }, { status: 503 });
  }

  const auth = await authenticateClaims(request);
  if (auth.response) return auth.response;

  const ticket = await new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(auth.claims.sub)
    .setAudience(SSE_TICKET_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${TICKET_TTL_SECONDS}s`)
    .sign(new TextEncoder().encode(secret));

  return NextResponse.json({ ticket, expiresIn: TICKET_TTL_SECONDS });
}
