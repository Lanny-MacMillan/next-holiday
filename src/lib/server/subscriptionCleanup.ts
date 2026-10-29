import { prisma } from '@/lib/prisma';

// When a user stops being on Plus they leave the holidays they were invited to,
// and the people they shared with are removed (their own data stays).
export async function cleanupSharesOnDowngrade(userId: string) {
  const cleanup = {
    sharesLeft: 0,
    membersRemoved: 0,
    errors: [] as string[],
  };

  // 1. Find all shares where user is a member but NOT the owner
  const memberShares = await prisma.share.findMany({
    where: {
      members: {
        some: {
          userId: userId,
        },
      },
      ownerUserId: {
        not: userId,
      },
    },
    include: {
      members: true,
      holiday: true,
    },
  });

  // Remove user from shares they don't own (leave shares)
  for (const share of memberShares) {
    try {
      await prisma.shareMember.delete({
        where: {
          shareId_userId: {
            shareId: share.id,
            userId: userId,
          },
        },
      });
      cleanup.sharesLeft++;
    } catch (error: any) {
      console.error(`❌ Failed to leave share ${share.id}:`, error);
      cleanup.errors.push(
        `Failed to leave share for ${share.holiday.holidayType}: ${error.message}`,
      );
    }
  }

  // 2. Find all shares where user IS the owner
  const ownedShares = await prisma.share.findMany({
    where: {
      ownerUserId: userId,
    },
    include: {
      members: true,
      holiday: true,
    },
  });

  // Remove all other members from shares user owns (keep user's data)
  for (const share of ownedShares) {
    // Get all members except the owner
    const membersToRemove = share.members.filter(member => member.userId !== userId);

    for (const member of membersToRemove) {
      try {
        await prisma.shareMember.delete({
          where: {
            shareId_userId: {
              shareId: share.id,
              userId: member.userId,
            },
          },
        });
        cleanup.membersRemoved++;
      } catch (error: any) {
        console.error(`❌ Failed to remove member from share ${share.id}:`, error);
        cleanup.errors.push(
          `Failed to remove member from ${share.holiday.holidayType}: ${error.message}`,
        );
      }
    }

    // Also delete any pending invites for this share since user can't share anymore
    try {
      const deletedInvites = await prisma.invite.deleteMany({
        where: {
          shareId: share.id,
          status: 'pending',
        },
      });
    } catch (error: any) {
      console.error(
        `❌ Failed to delete pending invites for share ${share.id}:`,
        error,
      );
      cleanup.errors.push(
        `Failed to clean up invites for ${share.holiday.holidayType}: ${error.message}`,
      );
    }
  }

  return {
    sharesLeft: cleanup.sharesLeft,
    membersRemoved: cleanup.membersRemoved,
    ownedSharesProcessed: ownedShares.length,
    errors: cleanup.errors,
  };
}
