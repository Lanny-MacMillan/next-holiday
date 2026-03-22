import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shareId, fromUserId, toUserId, toEmail, holidayKey, message } = body;

    if (!shareId || !fromUserId || !holidayKey || (!toUserId && !toEmail)) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: shareId, fromUserId, holidayKey, and either toUserId or toEmail',
        },
        { status: 400 },
      );
    }

    // Look up the actual user ID from the Auth0 sub
    const fromUser = await prisma.user.findUnique({
      where: { auth0Sub: fromUserId },
    });

    if (!fromUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify share exists
    const share = await prisma.share.findUnique({
      where: { id: shareId },
    });
    if (!share) {
      return NextResponse.json({ error: 'Share not found' }, { status: 404 });
    }

    // Check for existing pending invite to prevent duplicates
    const existingInvite = await prisma.invite.findFirst({
      where: {
        shareId,
        OR: [{ toUserId }, { toEmail }],
        status: 'pending',
      },
    });

    if (existingInvite) {
      return NextResponse.json(
        {
          error: 'A pending invite already exists for this user',
          inviteStatus: 'duplicate_pending',
        },
        { status: 409 },
      );
    }

    // Check if trying to invite someone who already declined (allow re-invite)
    const declinedInvite = await prisma.invite.findFirst({
      where: {
        shareId,
        OR: [{ toUserId }, { toEmail }],
        status: 'declined',
      },
    });

    // Create invite using the internal user ID
    const invite = await prisma.invite.create({
      data: {
        shareId,
        fromUserId: fromUser.id, // Use internal user ID, not Auth0 sub
        toUserId,
        toEmail,
        holidayKey,
        message,
        status: 'pending',
      },
      include: {
        fromUser: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    // Add status to response for frontend handling
    const response = {
      ...invite,
      inviteStatus: declinedInvite ? 'reinvite_after_decline' : 'new_invite',
      message: declinedInvite
        ? 'Reinvite sent successfully'
        : 'Invite sent successfully',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error creating invite:', error);
    return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const inbox = searchParams.get('inbox');
    const outgoing = searchParams.get('outgoing');
    const userId = searchParams.get('userId');

    if (inbox === '1' && userId) {
      // First, try to find the user by Auth0 sub to get their internal user ID
      let internalUserId: string | null = null;
      let userEmail: string | null = null;
      try {
        const user = await prisma.user.findUnique({
          where: { auth0Sub: userId },
        });
        internalUserId = user?.id || null;
        userEmail = user?.email || null;
      } catch (error) {
        console.log(
          'Could not find user by Auth0 sub, continuing with userId search',
        );
      }

      // Search for invites by internal userId OR email
      const invites = await prisma.invite.findMany({
        where: {
          OR: [
            ...(internalUserId ? [{ toUserId: internalUserId }] : []),
            { toEmail: userId },
            ...(userEmail ? [{ toEmail: userEmail }] : []),
          ],
          status: 'pending',
        },
        include: {
          fromUser: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });
      return NextResponse.json(invites);
    }

    if (outgoing === '1' && userId) {
      // First, try to find the user by Auth0 sub to get their internal user ID
      let internalUserId: string | null = null;
      try {
        const user = await prisma.user.findUnique({
          where: { auth0Sub: userId },
        });
        internalUserId = user?.id || null;
      } catch (error) {
        console.log(
          'Could not find user by Auth0 sub, continuing with userId search',
        );
      }

      if (!internalUserId) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // Search for outgoing invites by internal userId (exclude dismissed ones)
      const invites = await prisma.invite.findMany({
        where: {
          fromUserId: internalUserId,
          senderDismissedAt: null, // Only get non-dismissed invites
        },
        include: {
          fromUser: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });
      return NextResponse.json(invites);
    }

    if (userId) {
      // First, try to find the user by Auth0 sub to get their internal user ID
      let internalUserId: string | null = null;
      let userEmail: string | null = null;
      try {
        const user = await prisma.user.findUnique({
          where: { auth0Sub: userId },
        });
        internalUserId = user?.id || null;
        userEmail = user?.email || null;
      } catch (error) {
        console.log(
          'Could not find user by Auth0 sub, continuing with userId search',
        );
      }

      // Search for invites by internal userId OR email
      const invites = await prisma.invite.findMany({
        where: {
          OR: [
            ...(internalUserId ? [{ fromUserId: internalUserId }] : []),
            ...(internalUserId ? [{ toUserId: internalUserId }] : []),
            { toEmail: userId },
            ...(userEmail ? [{ toEmail: userEmail }] : []),
          ],
        },
        include: {
          fromUser: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });
      return NextResponse.json(invites);
    }

    return NextResponse.json({ error: 'Missing query parameters' }, { status: 400 });
  } catch (error) {
    console.error('Error fetching invites:', error);
    return NextResponse.json({ error: 'Failed to fetch invites' }, { status: 500 });
  }
}
