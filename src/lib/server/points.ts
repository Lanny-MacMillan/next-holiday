import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { BADGES } from '@/config/badgeConfigs';
import {
  badgeStatuses,
  badgeStats,
  holidayComplete,
  newlyEarned,
} from '@/lib/badges';
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
    await awardBadges(change.userId, change.holidayId);
  } catch (error) {
    logger.warn('Points sync failed (completion succeeded):', error);
  }
}

async function holidayTotals(holidayId: string) {
  const [tasks, tasksDone, gifts, giftsDone, cards, cardsDone] = await Promise.all([
    prisma.task.count({ where: { holidayId } }),
    prisma.task.count({ where: { holidayId, isCompleted: true } }),
    prisma.gift.count({ where: { holidayId } }),
    prisma.gift.count({ where: { holidayId, isCompleted: true } }),
    prisma.card.count({ where: { holidayId } }),
    prisma.card.count({ where: { holidayId, isCompleted: true } }),
  ]);
  return {
    completed: tasksDone + giftsDone + cardsDone,
    total: tasks + gifts + cards,
  };
}

const userLedger = (userId: string) =>
  prisma.pointEvent.findMany({
    where: { userId },
    select: { entityType: true, reason: true, points: true, createdAt: true },
  });

// Runs after an award. Badges stay earned once given, so only new ones are written.
async function awardBadges(userId: string, holidayId: string): Promise<void> {
  try {
    const [rows, earned] = await Promise.all([
      userLedger(userId),
      prisma.userAchievement.findMany({
        where: { userId },
        select: { key: true, scope: true },
      }),
    ]);

    const heroEarned = earned.some(
      e => e.key === 'holiday_hero' && e.scope === holidayId,
    );
    const totals = heroEarned ? null : await holidayTotals(holidayId);
    const stats = badgeStats(
      rows,
      new Date(),
      !!totals && holidayComplete(totals.completed, totals.total),
    );

    const fresh = newlyEarned(stats, holidayId, earned);
    if (fresh.length === 0) return;
    await prisma.userAchievement.createMany({
      data: fresh.map(b => ({ userId, key: b.key, scope: b.scope })),
      skipDuplicates: true,
    });
  } catch (error) {
    logger.warn('Badge check failed (points awarded):', error);
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

  const [totals, ledger, achievements] = await Promise.all([
    holidayTotals(holidayId),
    userLedger(viewerId),
    prisma.userAchievement.findMany({
      where: { userId: viewerId, scope: { in: ['global', holidayId] } },
      select: { key: true, scope: true, earnedAt: true },
    }),
  ]);
  const stats = badgeStats(
    ledger,
    now,
    holidayComplete(totals.completed, totals.total),
  );

  return {
    year: year ?? null,
    shared: (holiday.shares?.members.length ?? 0) > 0,
    entries,
    me: me && { ...me, levelInfo: levelFor(me.points) },
    team: teamGoal(totals.completed, totals.total),
    badges: badgeStatuses(stats, holidayId, achievements),
  };
}

// Account-wide progress, for people whose holidays aren't shared (no leaderboard card there).
export async function getUserProgress(userId: string) {
  const now = new Date();
  const [ledger, achievements] = await Promise.all([
    userLedger(userId),
    prisma.userAchievement.findMany({
      where: { userId },
      select: { key: true, scope: true, earnedAt: true },
    }),
  ]);
  const points = ledger.reduce((sum, r) => sum + r.points, 0);
  const stats = badgeStats(ledger, now, false);
  const globalKeys = new Set(
    BADGES.filter(b => b.scope === 'global').map(b => b.key),
  );

  return {
    points,
    levelInfo: levelFor(points),
    streak: stats.streak,
    holidaysCompleted: achievements.filter(a => a.key === 'holiday_hero').length,
    badges: badgeStatuses(stats, 'global', achievements).filter(b =>
      globalKeys.has(b.key),
    ),
  };
}
