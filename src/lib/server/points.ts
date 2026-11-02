import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import {
  buildLeaderboard,
  capAward,
  levelFor,
  pointsFor,
  startOfUtcDay,
  teamGoal,
  yearWindow,
  type PointEntity,
} from '@/lib/points';

interface CompletionChange {
  userId: string;
  holidayId: string;
  entityType: PointEntity;
  entityId: string;
  wasCompleted: boolean;
  isCompleted: boolean;
  priority?: 'low' | 'medium' | 'high' | null;
  dueDate?: Date | null;
}

// Called after every write that can change isCompleted. It never throws: a failed
// award must not fail the completion the user just made.
export async function syncCompletionPoints(change: CompletionChange): Promise<void> {
  try {
    if (change.isCompleted === change.wasCompleted) return;

    const { entityType, entityId } = change;
    if (!change.isCompleted) {
      await prisma.pointEvent.deleteMany({ where: { entityType, entityId } });
      return;
    }

    const now = new Date();
    const award = pointsFor({
      entityType,
      priority: change.priority,
      dueDate: change.dueDate,
      completedAt: now,
    });
    const today = await prisma.pointEvent.aggregate({
      where: { userId: change.userId, createdAt: { gte: startOfUtcDay(now) } },
      _sum: { points: true },
    });
    const capped = capAward(award, today._sum.points ?? 0);
    if (!capped) return;

    // The unique (entityType, entityId) key makes a repeat award a no-op.
    await prisma.pointEvent.upsert({
      where: { entityType_entityId: { entityType, entityId } },
      create: {
        userId: change.userId,
        holidayId: change.holidayId,
        entityType,
        entityId,
        points: capped.points,
        reason: capped.reason,
      },
      update: {},
    });
  } catch (error) {
    logger.warn('Points sync failed (completion succeeded):', error);
  }
}

export async function getLeaderboard(
  holidayId: string,
  viewerId: string,
  year?: number,
) {
  const holiday = await prisma.holiday.findUnique({
    where: { id: holidayId },
    select: {
      account: {
        select: {
          members: {
            select: {
              user: {
                select: {
                  id: true,
                  name: true,
                  picture: true,
                  preferences: { select: { showOnLeaderboard: true } },
                },
              },
            },
          },
        },
      },
      shares: {
        select: {
          owner: {
            select: {
              id: true,
              name: true,
              picture: true,
              preferences: { select: { showOnLeaderboard: true } },
            },
          },
          members: {
            select: {
              user: {
                select: {
                  id: true,
                  name: true,
                  picture: true,
                  preferences: { select: { showOnLeaderboard: true } },
                },
              },
            },
          },
        },
      },
    },
  });
  if (!holiday) return null;

  const people = [
    ...holiday.account.members.map(m => m.user),
    ...(holiday.shares ? [holiday.shares.owner] : []),
    ...(holiday.shares?.members.map(m => m.user) ?? []),
  ];
  const members = new Map<
    string,
    { userId: string; name: string | null; picture: string | null }
  >();
  for (const person of people) {
    const visible = person.preferences?.showOnLeaderboard !== false;
    if (visible || person.id === viewerId) {
      members.set(person.id, {
        userId: person.id,
        name: person.name,
        picture: person.picture,
      });
    }
  }

  const rows = await prisma.pointEvent.findMany({
    where: {
      holidayId,
      userId: { in: [...members.keys()] },
      ...(year !== undefined && { createdAt: yearWindow(year) }),
    },
    select: { userId: true, points: true, createdAt: true },
  });

  const now = new Date();
  const entries = buildLeaderboard([...members.values()], rows, viewerId, now);
  const me = entries.find(e => e.isYou) ?? null;

  const [tasks, tasksDone, gifts, giftsDone, cards, cardsDone] = await Promise.all([
    prisma.task.count({ where: { holidayId } }),
    prisma.task.count({ where: { holidayId, isCompleted: true } }),
    prisma.gift.count({ where: { holidayId } }),
    prisma.gift.count({ where: { holidayId, isCompleted: true } }),
    prisma.card.count({ where: { holidayId } }),
    prisma.card.count({ where: { holidayId, isCompleted: true } }),
  ]);

  return {
    year: year ?? null,
    entries,
    me: me && { ...me, levelInfo: levelFor(me.points) },
    team: teamGoal(tasksDone + giftsDone + cardsDone, tasks + gifts + cards),
  };
}
