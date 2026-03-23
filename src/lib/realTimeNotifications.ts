// Real-time notification broadcasting utilities
import { sendNotificationToUser } from '@/app/api/notifications/stream/route';

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

    // Send via SSE to user's active connections
    const sent = sendNotificationToUser(payload.userId, notification);

    if (sent) {
      console.log(
        `✅ Real-time notification sent to user ${payload.userId}: ${payload.title}`,
      );
    } else {
      console.log(
        `⚠️ No active connections for user ${payload.userId}, notification stored in DB only`,
      );
    }

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
