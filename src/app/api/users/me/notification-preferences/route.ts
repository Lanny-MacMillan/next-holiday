import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

const DEFAULT_NOTIFICATION_PREFERENCES = {
  assignmentNotifications: true,
  completionNotifications: true,
  inviteNotifications: true,
  emailNotifications: false,
  digestFrequency: 'immediate',
};

/**
 * GET /api/users/me/notification-preferences
 * Get the current user's notification preferences
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    // Get notification preferences, create default if they don't exist
    let preferences = await prisma.notificationPreferences.findUnique({
      where: { userId: user.id },
    });

    // If no preferences exist, create default ones
    if (!preferences) {
      preferences = await prisma.notificationPreferences.create({
        data: {
          userId: user.id,
          ...DEFAULT_NOTIFICATION_PREFERENCES,
        },
      });
    }

    return Response.json(preferences);
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    return Response.json(
      { error: 'Failed to fetch notification preferences' },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/users/me/notification-preferences
 * Update the current user's notification preferences
 */
export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const updateData = await request.json();

    // Validate the update data
    const allowedFields = [
      'assignmentNotifications',
      'completionNotifications',
      'inviteNotifications',
      'emailNotifications',
      'digestFrequency',
    ];

    // Filter out any fields that aren't allowed
    const filteredData = Object.keys(updateData)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = updateData[key];
        return obj;
      }, {} as any);

    // Add updatedAt timestamp
    filteredData.updatedAt = new Date();

    // Upsert preferences (create if they don't exist, update if they do)
    const updatedPreferences = await prisma.notificationPreferences.upsert({
      where: { userId: user.id },
      update: filteredData,
      create: {
        userId: user.id,
        ...DEFAULT_NOTIFICATION_PREFERENCES,
        ...filteredData,
      },
    });

    return Response.json(updatedPreferences);
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return Response.json(
      { error: 'Failed to update notification preferences' },
      { status: 500 },
    );
  }
}
