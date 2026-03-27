import { prisma } from './prisma';

/**
 * Validates that a user exists and has access to a holiday
 */
export async function validateAssigneeAccess(
  userId: string,
  holidayId: string,
): Promise<{
  valid: boolean;
  error?: string;
  user?: { id: string; name: string | null; email: string | null };
}> {
  try {
    // Check if user exists and has access to this holiday
    // Access can be through:
    // 1. Account membership (user is account member and holiday belongs to that account)
    // 2. Holiday sharing (user is a share member of the holiday)
    // 3. Owner of the shared holiday
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        OR: [
          // Access through account membership
          {
            accountMembers: {
              some: {
                account: {
                  holidays: {
                    some: { id: holidayId },
                  },
                },
              },
            },
          },
          // Access through holiday sharing
          {
            shareMemberships: {
              some: {
                share: {
                  holidayId: holidayId,
                },
              },
            },
          },
          // Owner of the shared holiday
          {
            ownedShares: {
              some: {
                holidayId: holidayId,
              },
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (!user) {
      return {
        valid: false,
        error:
          'Assigned user does not exist or does not have access to this holiday',
      };
    }

    return {
      valid: true,
      user,
    };
  } catch (error) {
    console.error('💥 validateAssigneeAccess error:', error);
    return {
      valid: false,
      error: 'Failed to validate user access',
    };
  }
}

/**
 * Validates multiple assignees at once (for bulk operations)
 */
export async function validateMultipleAssigneeAccess(
  userIds: string[],
  holidayId: string,
): Promise<{
  valid: boolean;
  invalidUsers: string[];
  error?: string;
}> {
  try {
    const validUsers = await prisma.user.findMany({
      where: {
        id: { in: userIds },
        OR: [
          // Access through account membership
          {
            accountMembers: {
              some: {
                account: {
                  holidays: {
                    some: { id: holidayId },
                  },
                },
              },
            },
          },
          // Access through holiday sharing
          {
            shareMemberships: {
              some: {
                share: {
                  holidayId: holidayId,
                },
              },
            },
          },
          // Owner of the shared holiday
          {
            ownedShares: {
              some: {
                holidayId: holidayId,
              },
            },
          },
        ],
      },
      select: { id: true },
    });

    const validUserIds = validUsers.map(u => u.id);
    const invalidUsers = userIds.filter(id => !validUserIds.includes(id));

    if (invalidUsers.length > 0) {
      return {
        valid: false,
        invalidUsers,
        error: `Some assigned users do not exist or do not have access to this holiday: ${invalidUsers.join(', ')}`,
      };
    }

    return {
      valid: true,
      invalidUsers: [],
    };
  } catch (error) {
    console.error('Error validating multiple assignee access:', error);
    return {
      valid: false,
      invalidUsers: userIds,
      error: 'Failed to validate user access',
    };
  }
}
