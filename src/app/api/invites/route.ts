import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  authenticate,
  claimsOtherUser,
  forbiddenResponse,
  isShareParticipant,
} from '@/lib/routeAuth';
import { broadcastInvite } from '@/lib/realTimeNotifications';

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticate(request);
    if (auth.response) return auth.response;
    const fromUser = auth.user;

    const body = await request.json();
    const { shareId, fromUserId, toUserId, toEmail, holidayKey, message } = body;

    if (!shareId || !holidayKey || (!toUserId && !toEmail)) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: shareId, holidayKey, and either toUserId or toEmail',
        },
        { status: 400 },
      );
    }

    // The sender is always the authenticated user, never a value from the body
    if (claimsOtherUser(fromUser, fromUserId)) {
      return forbiddenResponse();
    }

    // Verify share exists
    const share = await prisma.share.findUnique({
      where: { id: shareId },
    });
    if (!share) {
      return NextResponse.json({ error: 'Share not found' }, { status: 404 });
    }

    // Only the owner or a member of a share may invite others to it
    if (!(await isShareParticipant(shareId, fromUser.id))) {
      return forbiddenResponse();
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

    // Email-to-user lookup: Check if email belongs to a registered user
    let finalToUserId = toUserId;
    let finalToEmail = toEmail;
    let userLookupStatus = '';

    if (toEmail && !toUserId) {
      const existingUser = await prisma.user.findFirst({
        where: { email: toEmail },
      });

      if (existingUser) {
        // Convert email invite to user ID invite (gets real-time notifications)
        finalToUserId = existingUser.id;
        finalToEmail = undefined; // Clear email since we found the user
        userLookupStatus = 'registered_user';
      } else {
        // Keep as email invite but notify sender
        userLookupStatus = 'unregistered_email';
      }
    }

    if (finalToUserId === fromUser.id) {
      return NextResponse.json(
        { error: 'You cannot invite yourself' },
        { status: 400 },
      );
    }

    // Create invite using the internal user ID
    const invite = await prisma.invite.create({
      data: {
        shareId,
        fromUserId: fromUser.id, // Use internal user ID, not Auth0 sub
        toUserId: finalToUserId,
        toEmail: finalToEmail,
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

    // Send real-time invitation notification if inviting a registered user
    if (finalToUserId) {
      // Await the broadcast: on serverless hosts the function can be frozen once the
      // response is sent, which dropped the real-time notification. Failures are caught
      // below so they never fail invite creation.
      try {
        // Get holiday name from holidayKey (assuming it's a readable name)
        // For now, use holidayKey as the name, but this could be enhanced
        // to look up proper holiday names from a mapping or database
        const holidayName = holidayKey
          .replace('-', ' ')
          .replace(/\b\w/g, (l: string) => l.toUpperCase());

        await broadcastInvite(
          finalToUserId, // inviteeUserId
          fromUser.name || fromUser.email || 'Someone', // inviterName
          holidayName, // holidayName
          invite.id, // inviteId
          shareId, // shareId
          message, // inviteMessage
        );
      } catch (inviteError) {
        // Silently log invitation notification failures
        console.warn(
          'Invite notification failed (invite creation succeeded):',
          inviteError,
        );
      }
    } else {
      console.error('[INVITE] No finalToUserId, skipping real-time notification', {
        originalToUserId: toUserId,
        originalToEmail: toEmail,
        userLookupStatus,
      });
    }

    // Add status to response for frontend handling
    const response = {
      ...invite,
      inviteStatus: declinedInvite ? 'reinvite_after_decline' : 'new_invite',
      userLookupStatus, // Add user lookup status for frontend
      message: declinedInvite
        ? 'Reinvite sent successfully'
        : userLookupStatus === 'registered_user'
          ? `Invite sent to ${toEmail}! They'll receive real-time notifications.`
          : userLookupStatus === 'unregistered_email'
            ? `Invite sent to ${toEmail}! They'll see it when they sign up.`
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
    const auth = await authenticate(request);
    if (auth.response) return auth.response;

    const { searchParams } = new URL(request.url);
    const inbox = searchParams.get('inbox');
    const outgoing = searchParams.get('outgoing');

    // Only the caller's own invites are ever returned
    if (claimsOtherUser(auth.user, searchParams.get('userId'))) {
      return forbiddenResponse();
    }
    const userId = auth.user.auth0Sub;

    if (inbox === '1' && userId) {
      // First, try to find the user by Auth0 sub to get their internal user ID
      let internalUserId: string | null = null;
      try {
        const user = await prisma.user.findUnique({
          where: { auth0Sub: userId },
        });
        internalUserId = user?.id || null;
      } catch (error) {
        console.error(
          'Could not find user by Auth0 sub, continuing with userId search',
        );
      }

      // Search for invites by internal userId OR email
      const invites = await prisma.invite.findMany({
        where: {
          OR: [
            ...(internalUserId ? [{ toUserId: internalUserId }] : []),
            { toEmail: userId },
            ...(auth.user.verifiedEmail
              ? [{ toEmail: auth.user.verifiedEmail }]
              : []),
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
        console.error(
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
      try {
        const user = await prisma.user.findUnique({
          where: { auth0Sub: userId },
        });
        internalUserId = user?.id || null;
      } catch (error) {
        console.error(
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
            ...(auth.user.verifiedEmail
              ? [{ toEmail: auth.user.verifiedEmail }]
              : []),
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
