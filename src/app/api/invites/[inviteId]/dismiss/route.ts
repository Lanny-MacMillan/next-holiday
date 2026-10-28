import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticate, forbiddenResponse } from '@/lib/routeAuth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ inviteId: string }> },
) {
  try {
    const auth = await authenticate(request);
    if (auth.response) return auth.response;

    const { inviteId } = await params;

    // Find the invite
    const invite = await prisma.invite.findUnique({
      where: { id: inviteId },
    });

    if (!invite) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
    }

    // Only the sender may dismiss their own invite
    if (invite.fromUserId !== auth.user.id) {
      return forbiddenResponse();
    }

    // Update invite to mark as dismissed by sender
    const updatedInvite = await prisma.invite.update({
      where: { id: inviteId },
      data: {
        senderDismissedAt: new Date(),
      },
    });

    return NextResponse.json(updatedInvite);
  } catch (error) {
    console.error('Error dismissing invite:', error);
    return NextResponse.json({ error: 'Failed to dismiss invite' }, { status: 500 });
  }
}
