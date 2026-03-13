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

  return prisma.notification.create({
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

  return prisma.notification.create({
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

  return prisma.notification.create({
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
