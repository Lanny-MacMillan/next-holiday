import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, type AuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type Authenticated = { user: AuthUser; response?: undefined };
type Rejected = { user?: undefined; response: NextResponse };

/**
 * Resolve the caller from the verified token, or a ready-made 401.
 * Usage: const auth = await authenticate(request); if (auth.response) return auth.response;
 */
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

/**
 * Clients still send their own id in the body/query. That value is never
 * trusted: it must either be absent or match the authenticated user.
 */
export function claimsOtherUser(user: AuthUser, claimed?: string | null): boolean {
  return !!claimed && claimed !== user.auth0Sub && claimed !== user.id;
}

export function forbiddenResponse(message = 'Forbidden') {
  return NextResponse.json({ error: message }, { status: 403 });
}

/** True if the user owns the share or is one of its members. */
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

/** True if the invite was addressed to this user (by id or by email). */
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
