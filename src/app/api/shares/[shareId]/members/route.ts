import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ shareId: string }> },
) {
  try {
    const { shareId } = await params;
    const body = await request.json();
    const { userId: userIdParam } = body;

    if (!userIdParam) {
      return NextResponse.json(
        { error: 'Missing required field: userId' },
        { status: 400 },
      );
    }

    // Convert Auth0 sub to internal user ID
    const userToAdd = await prisma.user.findUnique({
      where: { auth0Sub: userIdParam },
    });

    if (!userToAdd) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = userToAdd.id;

    // Find the share
    const share = await prisma.share.findUnique({
      where: { id: shareId },
    });

    if (!share) {
      return NextResponse.json({ error: 'Share not found' }, { status: 404 });
    }

    // Check if user is already a member
    const existingMember = await prisma.shareMember.findUnique({
      where: {
        shareId_userId: {
          shareId,
          userId,
        },
      },
    });

    if (existingMember) {
      return NextResponse.json(share);
    }

    // Add user to share members
    await prisma.shareMember.create({
      data: {
        shareId,
        userId,
      },
    });

    // IMPORTANT: Ensure the holiday owner is also a member
    // This fixes the bug where shares don't include the original holiday owner
    const shareWithHoliday = await prisma.share.findUnique({
      where: { id: shareId },
      include: {
        holiday: {
          include: {
            account: true,
          },
        },
        members: true,
      },
    });

    if (shareWithHoliday) {
      const holidayOwnerUserId = shareWithHoliday.holiday.account.ownerUserId;
      const ownerIsMember = shareWithHoliday.members.some(
        member => member.userId === holidayOwnerUserId,
      );

      if (!ownerIsMember) {
        console.log(
          `🔧 Adding holiday owner ${holidayOwnerUserId} to share ${shareId}`,
        );
        try {
          await prisma.shareMember.create({
            data: {
              shareId,
              userId: holidayOwnerUserId,
            },
          });
        } catch (error: any) {
          // Ignore if already exists due to race condition
          if (error.code !== 'P2002') {
            console.error('Error adding holiday owner to share:', error);
          }
        }
      }
    }

    // Get updated share with members
    const updatedShare = await prisma.share.findUnique({
      where: { id: shareId },
      include: { members: true },
    });

    return NextResponse.json(updatedShare);
  } catch (error) {
    console.error('Error adding member to share:', error);
    return NextResponse.json(
      { error: 'Failed to add member to share' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ shareId: string }> },
) {
  try {
    const { shareId } = await params;
    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get('userId');

    if (!userIdParam) {
      return NextResponse.json(
        { error: 'Missing required parameter: userId' },
        { status: 400 },
      );
    }

    // Convert Auth0 sub to internal user ID
    const userToRemove = await prisma.user.findUnique({
      where: { auth0Sub: userIdParam },
    });

    if (!userToRemove) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = userToRemove.id;

    // Find the share with owner info
    const share = await prisma.share.findUnique({
      where: { id: shareId },
      include: {
        members: true,
        owner: {
          select: {
            id: true,
            auth0Sub: true,
            email: true,
          },
        },
        holiday: {
          include: {
            account: true,
          },
        },
      },
    });

    if (!share) {
      return NextResponse.json({ error: 'Share not found' }, { status: 404 });
    }

    // Check if user is a member of this share
    const memberToRemove = await prisma.shareMember.findUnique({
      where: {
        shareId_userId: {
          shareId,
          userId,
        },
      },
    });

    if (!memberToRemove) {
      return NextResponse.json(
        { error: 'User is not a member of this share' },
        { status: 404 },
      );
    }

    // Prevent removing the share owner (they must stay as a member)
    // The share owner is different from the holiday owner
    if (userId === share.ownerUserId) {
      return NextResponse.json(
        { error: 'Cannot remove the share owner from the share' },
        { status: 403 },
      );
    }

    // Remove the member
    await prisma.shareMember.delete({
      where: {
        shareId_userId: {
          shareId,
          userId,
        },
      },
    });

    // Get updated share with members
    const updatedShare = await prisma.share.findUnique({
      where: { id: shareId },
      include: { members: true },
    });

    // If there's only one member left (the owner), delete all pending invites
    // to clean up the share state
    if (updatedShare && updatedShare.members.length === 1) {
      await prisma.invite.deleteMany({
        where: {
          shareId: shareId,
          status: 'pending',
        },
      });
    }

    return NextResponse.json(updatedShare);
  } catch (error) {
    console.error('Error removing member from share:', error);
    return NextResponse.json(
      { error: 'Failed to remove member from share' },
      { status: 500 },
    );
  }
}
