/** @jest-environment node */
jest.mock('@/lib/prisma', () => ({
  prisma: require('@/__tests__/support/api').prismaMock,
}));

import { prismaMock as db, resetPrismaMock } from '@/__tests__/support/api';
import {
  broadcastAssignment,
  broadcastCompletion,
  broadcastInvite,
  broadcastNotification,
} from '@/lib/realTimeNotifications';
import { connections } from '@/lib/notifications/stream';

const mockFetch = jest.fn();
const env = { ...process.env };

const base = {
  userId: 'u1',
  type: 'task_completed' as const,
  title: 'Done',
  message: 'Ann finished it',
};

const sent = () => JSON.parse(mockFetch.mock.calls[0][1].body);

beforeEach(() => {
  resetPrismaMock();
  mockFetch.mockReset().mockResolvedValue({ ok: true });
  global.fetch = mockFetch as unknown as typeof fetch;
  process.env.SSE_SERVICE_URL = 'https://sse.test';
  process.env.SSE_API_SECRET = 'secret';
  db.notificationPreferences.findUnique.mockResolvedValue(null);
  db.holiday.findFirst.mockResolvedValue({ id: 'h1' });
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  process.env = { ...env };
  connections.clear();
  jest.restoreAllMocks();
});

describe('broadcastNotification', () => {
  it('posts the notification to the SSE service with the shared secret', async () => {
    expect(
      await broadcastNotification({ ...base, entityType: 'task', entityId: 't1' }),
    ).toBe(true);

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe('https://sse.test/api/notify');
    expect(init.headers.Authorization).toBe('Bearer secret');
    expect(sent()).toMatchObject({
      userId: 'u1',
      notification: {
        type: 'task_completed',
        title: 'Done',
        isRead: false,
        isInvite: false,
      },
    });
    expect(sent().notification.id).toMatch(/^temp-task-t1-\d+-/);
  });

  it('uses a generic id when there is no entity', async () => {
    await broadcastNotification(base);
    expect(sent().notification.id).toMatch(/^temp-notify-/);
  });

  it.each([
    ['task_assigned', 'assignmentNotifications'],
    ['gift_assigned', 'assignmentNotifications'],
    ['card_assigned', 'assignmentNotifications'],
    ['task_completed', 'completionNotifications'],
    ['invite_received', 'inviteNotifications'],
  ] as const)('does not send %s when %s is off', async (type, flag) => {
    db.notificationPreferences.findUnique.mockResolvedValue({
      assignmentNotifications: true,
      completionNotifications: true,
      inviteNotifications: true,
      [flag]: false,
    });
    expect(await broadcastNotification({ ...base, type })).toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('sends when the matching preference is on', async () => {
    db.notificationPreferences.findUnique.mockResolvedValue({
      completionNotifications: true,
    });
    expect(await broadcastNotification(base)).toBe(true);
  });

  describe('holiday access', () => {
    const forHoliday = { ...base, holidayId: 'h1', entityType: 'task' as const };

    it('checks the recipient belongs to the holiday’s account', async () => {
      await broadcastNotification(forHoliday);
      expect(db.holiday.findFirst.mock.calls[0][0].where).toEqual({
        id: 'h1',
        account: { members: { some: { userId: 'u1' } } },
      });
    });

    it('drops the notification when they have no access', async () => {
      db.holiday.findFirst.mockResolvedValue(null);
      expect(await broadcastNotification(forHoliday)).toBe(false);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('skips the check for assignments and for invites', async () => {
      db.holiday.findFirst.mockResolvedValue(null);
      expect(
        await broadcastNotification({ ...forHoliday, type: 'task_assigned' }),
      ).toBe(true);
      expect(
        await broadcastNotification({
          ...forHoliday,
          type: 'invite_received',
          entityType: 'invite',
        }),
      ).toBe(true);
      expect(db.holiday.findFirst).not.toHaveBeenCalled();
    });
  });

  it('refuses a notification without a title or message', async () => {
    expect(await broadcastNotification({ ...base, title: '' })).toBe(false);
    expect(await broadcastNotification({ ...base, message: '' })).toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('reports failure, without a fallback, when the SSE service errors', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500, statusText: 'Boom' });
    expect(await broadcastNotification(base)).toBe(false);
  });

  it('reports failure when the request throws', async () => {
    mockFetch.mockRejectedValue(new Error('network'));
    expect(await broadcastNotification(base)).toBe(false);
  });

  it('reports failure when the preference lookup throws', async () => {
    db.notificationPreferences.findUnique.mockRejectedValue(new Error('db down'));
    expect(await broadcastNotification(base)).toBe(false);
  });

  describe('when the SSE service is not configured', () => {
    beforeEach(() => delete process.env.SSE_SERVICE_URL);

    it('falls back to open in-process streams', async () => {
      const enqueue = jest.fn();
      connections.set('u1', new Set([{ enqueue } as never]));

      expect(await broadcastNotification(base)).toBe(true);
      expect(mockFetch).not.toHaveBeenCalled();
      const text = new TextDecoder().decode(enqueue.mock.calls[0][0]);
      expect(text).toMatch(/^data: .*"title":"Done".*\n\n$/);
    });

    it('returns false when nobody is connected', async () => {
      expect(await broadcastNotification(base)).toBe(false);
    });

    it('drops a dead connection and reports failure', async () => {
      const dead = {
        enqueue: () => {
          throw new Error('closed');
        },
      };
      connections.set('u1', new Set([dead as never]));

      expect(await broadcastNotification(base)).toBe(false);
      expect(connections.has('u1')).toBe(false);
    });
  });
});

describe('broadcast helpers', () => {
  it('broadcastAssignment tells the assignee who assigned what', async () => {
    await broadcastAssignment('u2', 'Ann', 'gift', 'Scarf', 'g1', 'h1', 'Christmas');
    expect(sent()).toMatchObject({
      userId: 'u2',
      notification: {
        type: 'gift_assigned',
        title: 'New gift assignment',
        message: 'Ann assigned you "Scarf"',
        entityType: 'gift',
        entityId: 'g1',
        fromUser: { name: 'Ann' },
      },
    });
  });

  it('broadcastCompletion tells the owner what was finished', async () => {
    await broadcastCompletion('u3', 'Bob', 'task', 'Wrap', 't1', 'h1', 'Christmas');
    expect(sent().notification).toMatchObject({
      type: 'task_completed',
      title: 'task completed',
      message: 'Bob completed "Wrap"',
    });
  });

  it('broadcastInvite marks the notification as an invite with its message', async () => {
    await broadcastInvite('u4', 'Cy', 'Easter', 'inv1', 'share1', 'join us');
    expect(sent().notification).toMatchObject({
      type: 'invite_received',
      isInvite: true,
      entityType: 'invite',
      entityId: 'inv1',
      holidayId: 'share1',
      inviteMessage: 'join us',
      message: 'Cy invited you to collaborate on Easter',
    });
  });
});
