import { prisma } from './prisma';

export interface NotificationData {
  userId: string;
  fromUserId: string;
  entityType: string;
  entityId: string;
  holidayId: string;
  title: string;
  message: string;
  type?: string;
}

/**
 * Sends a notification to the SSE service for real-time delivery
 */
async function sendToSSEService(notification: any) {
  if (!process.env.SSE_SERVICE_URL || !process.env.SSE_API_SECRET) {
    console.warn(
      '[SSE] SSE service not configured - skipping real-time notification',
      {
        SSE_SERVICE_URL: !!process.env.SSE_SERVICE_URL,
        SSE_API_SECRET: !!process.env.SSE_API_SECRET,
      },
    );
    return;
  }

  try {
    const url = `${process.env.SSE_SERVICE_URL}/api/notify`;
    const payload = {
      userId: notification.userId,
      notification: {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        entityType: notification.entityType,
        entityId: notification.entityId,
        holidayId: notification.holidayId,
        fromUserId: notification.fromUserId,
        isRead: notification.isRead,
        isDismissed: notification.isDismissed,
        createdAt: notification.createdAt,
      },
    };

    console.log('📡 [SSE] Sending to SSE service:', { url, payload });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.SSE_API_SECRET}`,
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();

    if (!response.ok) {
      console.error('❌ [SSE] SSE service responded with error:', {
        status: response.status,
        statusText: response.statusText,
        responseText: responseText,
      });
    } else {
      console.error('✅ [SSE] Real-time notification sent successfully');
    }
  } catch (error) {
    console.error('💥 [SSE] Failed to send real-time notification to SSE service:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      url: process.env.SSE_SERVICE_URL,
    });
    // Notification is still saved in DB, just no real-time delivery
  }
}

/**
 * Creates an assignment notification when a task/gift/card is assigned to a user
 */
export async function createAssignmentNotification(data: NotificationData) {
  // Check user preferences first
  const prefs = await prisma.notificationPreferences.findUnique({
    where: { userId: data.userId },
  });

  // If no preferences found, create default preferences
  if (!prefs) {
    await prisma.notificationPreferences.create({
      data: {
        userId: data.userId,
        assignmentNotifications: true,
        completionNotifications: true,
        inviteNotifications: true,
        emailNotifications: false,
        digestFrequency: 'immediate',
      },
    });
  }

  // Skip if user has disabled assignment notifications
  if (prefs && !prefs.assignmentNotifications) {
    return null;
  }

  // 1. Save to database
  const dbNotification = await prisma.notification.create({
    data: {
      userId: data.userId,
      fromUserId: data.fromUserId,
      type: data.type || `${data.entityType}_assigned`,
      title: data.title,
      message: data.message,
      entityType: data.entityType,
      entityId: data.entityId,
      holidayId: data.holidayId,
    },
  });

  // Note: Real-time delivery is now handled by broadcastAssignment() in the API endpoints
  // This function only handles database persistence for backward compatibility

  return dbNotification;
}

/**
 * Creates a completion notification when an assigned task/gift/card is completed
 */
export async function createCompletionNotification(data: NotificationData) {
  // Check user preferences first
  const prefs = await prisma.notificationPreferences.findUnique({
    where: { userId: data.userId },
  });

  // Skip if user has disabled completion notifications
  if (!prefs?.completionNotifications) {
    return null;
  }

  // 1. Save to database
  const dbNotification = await prisma.notification.create({
    data: {
      userId: data.userId,
      fromUserId: data.fromUserId,
      type: `${data.entityType}_completed`,
      title: data.title,
      message: data.message,
      entityType: data.entityType,
      entityId: data.entityId,
      holidayId: data.holidayId,
    },
  });

  // Note: Real-time delivery is now handled by broadcastCompletion() in the API endpoints
  // This function only handles database persistence for backward compatibility

  return dbNotification;
}

/**
 * Creates an invite notification (bridge pattern for existing invites)
 */
export async function createInviteNotification(
  data: NotificationData & { inviteId: string },
) {
  const prefs = await prisma.notificationPreferences.findUnique({
    where: { userId: data.userId },
  });

  // Skip if user has disabled invite notifications
  if (!prefs?.inviteNotifications) {
    return null;
  }

  // 1. Save to database
  const dbNotification = await prisma.notification.create({
    data: {
      userId: data.userId,
      fromUserId: data.fromUserId,
      type: 'invite_received',
      title: data.title,
      message: data.message,
      entityType: 'invite',
      entityId: data.inviteId,
      holidayId: data.holidayId,
      inviteId: data.inviteId,
    },
  });

  // Note: Real-time delivery is now handled by broadcastInvite() in the API endpoints
  // This function only handles database persistence for backward compatibility

  return dbNotification;
}

/**
 * Utility function to get user name for notifications
 */
export async function getUserName(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  });

  return user?.name || user?.email || 'Unknown User';
}

/**
 * Utility function to get holiday name for notifications
 */
export async function getHolidayName(holidayId: string): Promise<string> {
  const holiday = await prisma.holiday.findUnique({
    where: { id: holidayId },
    select: { name: true },
  });

  return holiday?.name || 'Unknown Holiday';
}
