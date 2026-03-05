import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { DEFAULT_USER_PREFERENCES } from '@/lib/constants/userPreferences';

/**
 * GET /api/users/me/preferences
 * Get the current user's preferences
 */
export async function GET(request: NextRequest) {
  try {
    // Get auth0Sub from query parameters or headers
    const url = new URL(request.url);
    const auth0Sub =
      url.searchParams.get('auth0Sub') || request.headers.get('x-auth0-sub');

    if (!auth0Sub) {
      return Response.json({ error: 'Auth0 sub is required' }, { status: 400 });
    }

    // Find user by auth0Sub
    const currentUser = await prisma.user.findUnique({
      where: { auth0Sub },
    });

    if (!currentUser) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user preferences, create default if they don't exist
    let preferences = await prisma.userPreferences.findUnique({
      where: { userId: currentUser.id },
    });

    // If no preferences exist, create default ones
    if (!preferences) {
      console.log(
        'Creating default user preferences for existing user:',
        currentUser.id,
      );
      preferences = await prisma.userPreferences.create({
        data: {
          userId: currentUser.id,
          ...DEFAULT_USER_PREFERENCES,
        },
      });
      console.log('Default user preferences created successfully');
    }

    return Response.json(preferences);
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    return Response.json(
      { error: 'Failed to fetch user preferences' },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/users/me/preferences
 * Update the current user's preferences
 */
export async function PUT(request: NextRequest) {
  try {
    const updateData = await request.json();
    const { auth0Sub, ...preferencesData } = updateData;

    if (!auth0Sub) {
      return Response.json({ error: 'Auth0 sub is required' }, { status: 400 });
    }

    // Find user by auth0Sub
    const currentUser = await prisma.user.findUnique({
      where: { auth0Sub },
    });

    if (!currentUser) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    // Validate the update data
    const allowedFields = [
      'theme',
      'displayMode',
      'showCompletedItems',
      'showCountdown',
      'showProgressBars',
      'emailNotifications',
      'pushNotifications',
      'reminderNotifications',
      'taskDueReminders',
      'holidayCountdownAlerts',
      'timezone',
      'locale',
      'reducedMotion',
      'highContrast',
      'fontSize',
    ];

    // Filter out any fields that aren't allowed
    const filteredData = Object.keys(preferencesData)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = preferencesData[key];
        return obj;
      }, {} as any);

    // Add updatedAt timestamp
    filteredData.updatedAt = new Date();

    // Upsert preferences (create if they don't exist, update if they do)
    const updatedPreferences = await prisma.userPreferences.upsert({
      where: { userId: currentUser.id },
      update: filteredData,
      create: {
        userId: currentUser.id,
        ...DEFAULT_USER_PREFERENCES,
        ...filteredData,
      },
    });

    return Response.json(updatedPreferences);
  } catch (error) {
    console.error('Error updating user preferences:', error);
    return Response.json(
      { error: 'Failed to update user preferences' },
      { status: 500 },
    );
  }
}
