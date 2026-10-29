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
 * Utility function to get user name for notifications
 */
export async function getUserName(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  });

  return user?.name || user?.email || 'Unknown User';
}
