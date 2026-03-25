// Script to create default notification preferences for existing users
import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

async function createDefaultNotificationPreferences() {
  try {
    console.log('Creating default notification preferences for existing users...');

    // Get all users who don't have notification preferences yet
    const usersWithoutPrefs = await prisma.user.findMany({
      where: {
        notificationPrefs: null,
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    console.log(
      `Found ${usersWithoutPrefs.length} users without notification preferences`,
    );

    // Create default preferences for each user
    for (const user of usersWithoutPrefs) {
      await prisma.notificationPreferences.create({
        data: {
          userId: user.id,
          assignmentNotifications: true,
          completionNotifications: true,
          inviteNotifications: true,
          emailNotifications: false,
          digestFrequency: 'immediate',
        },
      });

      console.log(`✓ Created preferences for ${user.name || user.email || user.id}`);
    }

    console.log('✅ Default notification preferences created successfully!');
  } catch (error) {
    console.error('❌ Error creating default notification preferences:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createDefaultNotificationPreferences();
