/** @jest-environment node */
jest.mock('@/lib/prisma', () => ({
  prisma: require('@/__tests__/support/api').prismaMock,
}));

import { prismaMock as db, resetPrismaMock } from '@/__tests__/support/api';
import { createAssignmentNotification, getUserName } from '@/lib/notifications';

const data = {
  userId: 'u1',
  fromUserId: 'u2',
  entityType: 'task',
  entityId: 't1',
  holidayId: 'h1',
  title: 'New task',
  message: 'Do it',
};

beforeEach(() => {
  resetPrismaMock();
  db.notification.create.mockResolvedValue({ id: 'n1' });
});

describe('createAssignmentNotification', () => {
  it('saves a notification typed after the entity', async () => {
    db.notificationPreferences.findUnique.mockResolvedValue({
      assignmentNotifications: true,
    });

    expect(await createAssignmentNotification(data)).toEqual({ id: 'n1' });
    expect(db.notification.create.mock.calls[0][0].data).toEqual({
      userId: 'u1',
      fromUserId: 'u2',
      type: 'task_assigned',
      title: 'New task',
      message: 'Do it',
      entityType: 'task',
      entityId: 't1',
      holidayId: 'h1',
    });
    expect(db.notificationPreferences.create).not.toHaveBeenCalled();
  });

  it('prefers an explicit type', async () => {
    db.notificationPreferences.findUnique.mockResolvedValue({
      assignmentNotifications: true,
    });
    await createAssignmentNotification({ ...data, type: 'custom' });
    expect(db.notification.create.mock.calls[0][0].data.type).toBe('custom');
  });

  it('creates default preferences and still notifies a user with none', async () => {
    db.notificationPreferences.findUnique.mockResolvedValue(null);

    expect(await createAssignmentNotification(data)).toEqual({ id: 'n1' });
    expect(db.notificationPreferences.create.mock.calls[0][0].data).toMatchObject({
      userId: 'u1',
      assignmentNotifications: true,
      digestFrequency: 'immediate',
    });
  });

  it('saves nothing when the user turned assignment notifications off', async () => {
    db.notificationPreferences.findUnique.mockResolvedValue({
      assignmentNotifications: false,
    });

    expect(await createAssignmentNotification(data)).toBeNull();
    expect(db.notification.create).not.toHaveBeenCalled();
  });
});

describe('getUserName', () => {
  it.each([
    [{ name: 'Ann', email: 'a@x.com' }, 'Ann'],
    [{ name: '', email: 'a@x.com' }, 'a@x.com'],
    [null, 'Unknown User'],
  ])('given %j returns %s', async (user, expected) => {
    db.user.findUnique.mockResolvedValue(user);
    expect(await getUserName('u1')).toBe(expected);
  });
});
