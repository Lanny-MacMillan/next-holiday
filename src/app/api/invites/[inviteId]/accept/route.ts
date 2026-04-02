import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';
import { requireAuth } from '@/lib/auth';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ inviteId: string }> },
) {
  try {
    // Get the currently logged-in user
    const currentUser = await requireAuth(request);
    const { inviteId } = await params;

    // Find the invite
    const invite = await prisma.invite.findUnique({
      where: { id: inviteId },
    });

    if (!invite) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
    }

    if (invite.status !== 'pending') {
      return NextResponse.json({ error: 'Invite is not pending' }, { status: 400 });
    }

    // Update invite status to accepted
    const updatedInvite = await prisma.invite.update({
      where: { id: inviteId },
      data: {
        status: 'accepted',
        respondedAt: new Date(),
      },
    });

    // Use the currently logged-in user's ID
    const actualUserId = currentUser.id;

    // Check if user is already a member
    const existingMember = await prisma.shareMember.findUnique({
      where: {
        shareId_userId: {
          shareId: invite.shareId,
          userId: actualUserId,
        },
      },
    });

    if (!existingMember) {
      // Get the share details to determine what holiday type this is
      const shareWithHoliday = await prisma.share.findUnique({
        where: { id: invite.shareId },
        include: {
          holiday: {
            select: {
              holidayType: true,
            },
          },
        },
      });

      if (!shareWithHoliday) {
        return NextResponse.json({ error: 'Share not found' }, { status: 404 });
      }

      // Find user's account to check for existing holiday of same type
      const userAccount = await prisma.account.findFirst({
        where: { ownerUserId: actualUserId },
      });

      if (userAccount) {
        // Check if user has existing holiday of same type
        const existingHoliday = await prisma.holiday.findFirst({
          where: {
            accountId: userAccount.id,
            holidayType: shareWithHoliday.holiday.holidayType,
          },
        });

        // If user has existing holiday of same type, delete it (cascade will handle related data)
        if (existingHoliday) {
          await prisma.holiday.delete({
            where: { id: existingHoliday.id },
          });
        }
      }

      // Now add user to the share
      await prisma.shareMember.create({
        data: {
          shareId: invite.shareId,
          userId: actualUserId,
          invitedBy: invite.fromUserId,
        },
      });
    }

    // Get updated share with complete data for frontend synchronization
    const share = await prisma.share.findUnique({
      where: { id: invite.shareId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                auth0Sub: true,
                name: true,
                email: true,
                picture: true,
              },
            },
          },
        },
        holiday: {
          select: {
            id: true,
            holidayType: true,
            name: true,
          },
        },
        owner: {
          select: {
            id: true,
            auth0Sub: true,
            name: true,
            email: true,
            picture: true,
          },
        },
      },
    });

    // Transform the response to match the expected frontend format
    const responseShare = share
      ? {
          ...share,
          shareId: share.id,
          holidayKey: share.holiday.holidayType
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-'),
          memberUserIds: share.members.map(m => m.user.auth0Sub),
          members: share.members.map(m => ({
            userId: m.user.auth0Sub,
            name: m.user.name,
            email: m.user.email,
            picture: m.user.picture,
            joinedAt: m.joinedAt,
          })),
        }
      : null;

    return NextResponse.json({ invite: updatedInvite, share: responseShare });
  } catch (error) {
    console.error('Error accepting invite:', error);
    return NextResponse.json({ error: 'Failed to accept invite' }, { status: 500 });
  }
}
