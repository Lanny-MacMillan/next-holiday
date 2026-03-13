import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { ok, badRequest, serverError } from '@/lib/http';

/**
 * GET /api/notifications
 * Retrieves notifications for the authenticated user
 * Supports query params: ?unread=true
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unread') === 'true';

    // Get regular notifications
    const notifications = await prisma.notification.findMany({
      where: {
        userId: user.id,
        ...(unreadOnly && { isRead: false }),
        isDismissed: false, // Don't show dismissed notifications
      },
      orderBy: { createdAt: 'desc' },
      include: {
        fromUser: {
          select: {
            id: true,
            name: true,
            picture: true,
            email: true,
          },
        },
        holiday: {
          select: {
            id: true,
            name: true,
            holidayType: true,
          },
        },
      },
      take: 50, // Limit to recent 50 notifications
    });

    // Get invite notifications (bridge pattern)
    const inviteNotifications = await prisma.invite.findMany({
      where: {
        OR: [{ toUserId: user.id }, { toEmail: user.email }],
        status: 'pending',
      },
      include: {
        fromUser: {
          select: {
            id: true,
            name: true,
            picture: true,
            email: true,
          },
        },
        share: {
          include: {
            holiday: {
              select: {
                id: true,
                name: true,
                holidayType: true,
              },
            },
          },
        },
      },
    });

    // Transform invites to notification format (bridge pattern)
    const transformedInvites = inviteNotifications.map(invite => ({
      id: `invite-${invite.id}`,
      type: 'invite_received',
      title: 'Holiday Share Invitation',
      message: `${invite.fromUser?.name || invite.fromUser?.email} invited you to collaborate on ${invite.share.holiday.name}`,
      entityType: 'invite',
      entityId: invite.id,
      holidayId: invite.share.holidayId,
      fromUserId: invite.fromUserId,
      isRead: false,
      isDismissed: false,
      createdAt: invite.createdAt,
      fromUser: invite.fromUser,
      holiday: invite.share.holiday,
      isInvite: true, // Special flag for UI handling
    }));

    // Combine and sort all notifications
    const allNotifications = [
      ...notifications.map(n => ({ ...n, isInvite: false })),
      ...transformedInvites,
    ].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return ok(allNotifications);
  } catch (err) {
    console.error('Error fetching notifications:', err);
    return serverError('Failed to fetch notifications');
  }
}

/**
 * PATCH /api/notifications
 * Mark notifications as read or dismissed
 * Body: { notificationIds: string[], action: 'read' | 'dismiss' }
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();
    const { notificationIds, action } = body;

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return badRequest('Invalid notificationIds array');
    }

    if (!action || !['read', 'dismiss'].includes(action)) {
      return badRequest('Action must be "read" or "dismiss"');
    }

    // Handle invite notifications separately (they're not in the notifications table)
    const inviteIds = notificationIds
      .filter(id => id.startsWith('invite-'))
      .map(id => id.replace('invite-', ''));

    const regularNotificationIds = notificationIds.filter(
      id => !id.startsWith('invite-'),
    );

    // Update regular notifications
    if (regularNotificationIds.length > 0) {
      const updateData =
        action === 'read'
          ? { isRead: true, readAt: new Date() }
          : { isDismissed: true, dismissedAt: new Date() };

      await prisma.notification.updateMany({
        where: {
          id: { in: regularNotificationIds },
          userId: user.id, // Security: only update user's own notifications
        },
        data: updateData,
      });
    }

    // Handle invite notifications (bridge pattern)
    if (inviteIds.length > 0 && action === 'dismiss') {
      // For invites, we could mark them as dismissed in a separate field
      // or handle differently based on business logic
      // For now, we'll just return success since invites are managed elsewhere
    }

    return ok({
      success: true,
      updated: regularNotificationIds.length,
      invitesHandled: inviteIds.length,
    });
  } catch (err) {
    console.error('Error updating notifications:', err);
    return serverError('Failed to update notifications');
  }
}

/**
 * DELETE /api/notifications
 * Delete old dismissed notifications (cleanup)
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    // Delete notifications older than 90 days that are dismissed
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const deleted = await prisma.notification.deleteMany({
      where: {
        userId: user.id,
        isDismissed: true,
        dismissedAt: {
          lt: ninetyDaysAgo,
        },
      },
    });

    return ok({
      success: true,
      deletedCount: deleted.count,
    });
  } catch (err) {
    console.error('Error deleting old notifications:', err);
    return serverError('Failed to delete old notifications');
  }
}
