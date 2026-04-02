// Real-time notification broadcasting utilities
import { sendNotificationToUser } from '@/lib/notifications/stream';
import { prisma } from './prisma';

/**
 * Send notification to external SSE service
 */
async function sendToExternalSSEService(userId: string, notification: any) {
  if (!process.env.SSE_SERVICE_URL || !process.env.SSE_API_SECRET) {
    console.warn(
      '⚠️ [BROADCAST] External SSE service not configured - using internal fallback',
    );
    return sendNotificationToUser(userId, notification);
  }

  try {
    const response = await fetch(`${process.env.SSE_SERVICE_URL}/api/notify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.SSE_API_SECRET}`,
      },
      body: JSON.stringify({
        userId,
        notification,
      }),
    });

    if (!response.ok) {
      console.error(
        '❌ [BROADCAST] External SSE service error:',
        response.status,
        response.statusText,
      );
      // Don't fallback to internal SSE - just fail
      // This prevents duplicate notifications
      return false;
    } else {
      return true;
    }
  } catch (error) {
    console.error('💥 [BROADCAST] External SSE service failed:', error);
    // Don't fallback to internal SSE - just fail
    // This prevents duplicate notifications
    return false;
  }
}

interface NotificationPayload {
  userId: string;
  type:
    | 'task_assigned'
    | 'gift_assigned'
    | 'card_assigned'
    | 'task_completed'
    | 'invite_received';
  title: string;
  message: string;
  entityType?: 'task' | 'gift' | 'card' | 'invite';
  entityId?: string;
  holidayId?: string;
  fromUserId?: string;
  isInvite?: boolean;
  fromUser?: { name: string; picture?: string };
  holiday?: { name: string; holidayType: string };
}

/**
 * Broadcast a notification to a specific user in real-time via SSE
 */
export async function broadcastNotification(payload: NotificationPayload) {
  try {
    // Check user preferences first
    const prefs = await prisma.notificationPreferences.findUnique({
      where: { userId: payload.userId },
    });

    // Determine if notification is allowed based on type and user preferences
    let notificationAllowed = true;
    if (prefs) {
      switch (payload.type) {
        case 'task_assigned':
        case 'gift_assigned':
        case 'card_assigned':
          notificationAllowed = prefs.assignmentNotifications;
          break;
        case 'task_completed':
          notificationAllowed = prefs.completionNotifications;
          break;
        case 'invite_received':
          notificationAllowed = prefs.inviteNotifications;
          break;
        default:
          // Allow unknown types by default for backward compatibility
          break;
      }
    }

    if (!notificationAllowed) {
      return false;
    }

    // Check holiday access authorization if this is for a holiday
    // Note: Skip access check for assignment notifications since users should receive
    // notifications for items assigned to them regardless of holiday sharing structure
    if (
      payload.holidayId &&
      payload.entityType !== 'invite' &&
      !payload.type.includes('_assigned')
    ) {
      const hasAccess = await prisma.holiday.findFirst({
        where: {
          id: payload.holidayId,
          account: {
            members: { some: { userId: payload.userId } },
          },
        },
        select: { id: true },
      });

      if (!hasAccess) {
        console.warn(
          `❌ [BROADCAST] User ${payload.userId} does not have access to holiday ${payload.holidayId}, skipping notification`,
        );
        return false;
      }
    } else if (payload.type.includes('_assigned')) {
      // Skip holiday access check for assignment notifications
    }

    // Create a unique ID that incorporates entity information to prevent conflicts
    const entityPrefix = payload.entityId
      ? `${payload.entityType}-${payload.entityId}`
      : 'notify';
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    const uniqueId = `temp-${entityPrefix}-${timestamp}-${random}`;

    // Create the notification object that matches our Notification interface
    const notification = {
      id: uniqueId,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      entityType: payload.entityType,
      entityId: payload.entityId,
      holidayId: payload.holidayId,
      fromUserId: payload.fromUserId,
      isRead: false,
      createdAt: new Date().toISOString(),
      fromUser: payload.fromUser,
      holiday: payload.holiday,
      isInvite: payload.isInvite || false,
    };

    // Validate the notification has valid data before sending
    if (!notification.title || !notification.message) {
      console.warn(
        'Skipping broadcast: notification missing title or message',
        payload,
      );
      return false;
    }

    // Send via external SSE service
    // Note: Database persistence is handled by the SSE service or calling code,
    // not in this broadcast function
    const sent = await sendToExternalSSEService(payload.userId, notification);

    return sent;
  } catch (error) {
    console.error('Error broadcasting notification:', error);
    return false;
  }
}

/**
 * Broadcast an assignment notification
 */
export async function broadcastAssignment(
  assigneeUserId: string,
  assignerName: string,
  entityType: 'task' | 'gift' | 'card',
  entityName: string,
  entityId: string,
  holidayId: string,
  holidayName: string,
) {
  return broadcastNotification({
    userId: assigneeUserId,
    type: `${entityType}_assigned` as any,
    title: `New ${entityType} assignment`,
    message: `${assignerName} assigned you "${entityName}"`,
    entityType,
    entityId,
    holidayId,
    fromUser: { name: assignerName },
    holiday: { name: holidayName, holidayType: 'unknown' },
  });
}

/**
 * Broadcast an invite notification
 */
export async function broadcastInvite(
  inviteeUserId: string,
  inviterName: string,
  holidayName: string,
  inviteId: string,
  shareId: string,
) {
  return broadcastNotification({
    userId: inviteeUserId,
    type: 'invite_received',
    title: 'Holiday Share Invitation',
    message: `${inviterName} invited you to collaborate on ${holidayName}`,
    entityType: 'invite',
    entityId: inviteId,
    holidayId: shareId,
    isInvite: true,
    fromUser: { name: inviterName },
    holiday: { name: holidayName, holidayType: 'unknown' },
  });
}

/**
 * Broadcast a completion notification
 */
export async function broadcastCompletion(
  ownerUserId: string,
  completerName: string,
  entityType: 'task' | 'gift' | 'card',
  entityName: string,
  entityId: string,
  holidayId: string,
  holidayName: string,
) {
  return broadcastNotification({
    userId: ownerUserId,
    type: 'task_completed', // Using task_completed for all completions for now
    title: `${entityType} completed`,
    message: `${completerName} completed "${entityName}"`,
    entityType,
    entityId,
    holidayId,
    fromUser: { name: completerName },
    holiday: { name: holidayName, holidayType: 'unknown' },
  });
}
