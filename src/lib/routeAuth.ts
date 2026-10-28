import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, getVerifiedClaims, type AuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type Authenticated = { user: AuthUser; response?: undefined };
type Rejected = { user?: undefined; response: NextResponse };

export async function authenticate(
  request: NextRequest,
): Promise<Authenticated | Rejected> {
  const user = await getCurrentUser(request);
  if (!user) {
    return {
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }
  return { user };
}

export async function authenticateClaims(request: NextRequest) {
  const claims = await getVerifiedClaims(request);
  if (!claims) {
    return {
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    } as const;
  }
  return { claims } as const;
}

// Clients still send their own id; it is only accepted if it matches the session.
export function claimsOtherUser(user: AuthUser, claimed?: string | null): boolean {
  return !!claimed && claimed !== user.auth0Sub && claimed !== user.id;
}

export function forbiddenResponse(message = 'Forbidden') {
  return NextResponse.json({ error: message }, { status: 403 });
}

export async function isShareParticipant(
  shareId: string,
  userId: string,
): Promise<boolean> {
  const share = await prisma.share.findUnique({
    where: { id: shareId },
    select: {
      ownerUserId: true,
      members: { where: { userId }, select: { userId: true } },
    },
  });
  return !!share && (share.ownerUserId === userId || share.members.length > 0);
}

export function isInviteRecipient(
  invite: { toUserId: string | null; toEmail: string | null },
  user: AuthUser,
): boolean {
  if (invite.toUserId && invite.toUserId === user.id) return true;
  return (
    !!invite.toEmail &&
    !!user.email &&
    invite.toEmail.toLowerCase() === user.email.toLowerCase()
  );
}
