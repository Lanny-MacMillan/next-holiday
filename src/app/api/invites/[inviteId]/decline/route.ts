import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ inviteId: string }> },
) {
  try {
    const { inviteId } = await params;

    // Find the invite
    const invite = await prisma.invite.findUnique({
      where: { id: inviteId },
      include: {
        share: {
          include: {
            members: true,
            invites: true,
          },
        },
      },
    });

    if (!invite) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
    }

    if (invite.status !== 'pending') {
      return NextResponse.json({ error: 'Invite is not pending' }, { status: 400 });
    }

    // Update invite status to declined
    const updatedInvite = await prisma.invite.update({
      where: { id: inviteId },
      data: {
        status: 'declined',
        respondedAt: new Date(),
      },
    });

    // Check if this share should be cleaned up
    if (invite.share) {
      // Get all remaining pending invites for this share (excluding the one we just declined)
      const remainingPendingInvites = invite.share.invites.filter(
        inv => inv.id !== inviteId && inv.status === 'pending',
      );

      // If there are no more pending invites and only one member (the owner), delete the share
      if (remainingPendingInvites.length === 0 && invite.share.members.length <= 1) {
        // Delete the share (cascade delete will handle invites and members)
        await prisma.share.delete({
          where: { id: invite.share.id },
        });
      }
    }

    return NextResponse.json(updatedInvite);
  } catch (error) {
    console.error('Error declining invite:', error);
    return NextResponse.json({ error: 'Failed to decline invite' }, { status: 500 });
  }
}
