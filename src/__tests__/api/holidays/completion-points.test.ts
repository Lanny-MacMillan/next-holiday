/** @jest-environment node */
import {
  apiRequest,
  prismaMock as db,
  readJson,
  resetPrismaMock,
  routeParams,
} from '@/__tests__/support/api';

const requireAuth = jest.fn();
jest.mock('@/lib/auth', () => ({
  requireAuth: (...a: unknown[]) => requireAuth(...a),
  assertHolidayAccess: jest.fn().mockResolvedValue(null),
}));
jest.mock('@/lib/prisma', () => ({
  prisma: require('@/__tests__/support/api').prismaMock,
}));
jest.mock('@/lib/notifications', () => ({ getUserName: jest.fn() }));
jest.mock('@/lib/realTimeNotifications', () => ({
  broadcastAssignment: jest.fn(),
  broadcastCompletion: jest.fn(),
  broadcastNotification: jest.fn(),
}));
jest.mock('@/lib/assigneeValidation', () => ({
  validateAssigneeAccess: jest.fn().mockResolvedValue({ valid: true }),
}));
const syncCompletionPoints = jest.fn();
jest.mock('@/lib/server/points', () => ({
  syncCompletionPoints: (...a: unknown[]) => syncCompletionPoints(...a),
}));

import * as tasks from '@/app/api/holidays/[id]/tasks/route';
import * as task from '@/app/api/holidays/[id]/tasks/[taskId]/route';
import * as gifts from '@/app/api/holidays/[id]/gifts/route';
import * as gift from '@/app/api/holidays/[id]/gifts/[giftId]/route';
import * as cards from '@/app/api/holidays/[id]/cards/route';

const H = 'holiday-1';
const ME = '11111111-1111-4111-8111-111111111111';
const ID = '33333333-3333-4333-8333-333333333333';
const due = new Date('2026-12-24');

const giftRow = (isCompleted: boolean) => ({
  id: ID,
  holidayId: H,
  price: 10,
  actualPrice: null,
  contact: null,
  assignedUser: null,
  isCompleted,
  completedDate: null,
  createdAt: new Date(),
  updatedAt: new Date(),
});

beforeEach(() => {
  jest.clearAllMocks();
  resetPrismaMock();
  requireAuth.mockResolvedValue({ id: ME });
});

describe('completing an item reports the change to the points ledger', () => {
  it('task PUT', async () => {
    db.task.findUnique.mockResolvedValue({
      isCompleted: false,
      assignedTo: null,
      createdBy: ME,
      title: 't',
      priority: 'high',
      dueDate: due,
    });
    db.task.update.mockResolvedValue({
      isCompleted: true,
      priority: 'high',
      dueDate: due,
    });

    const res = await tasks.PUT(
      apiRequest('/x', 'PUT', { taskId: ID, isCompleted: true }),
      routeParams({ id: H }),
    );

    expect((await readJson(res)).status).toBe(200);
    expect(syncCompletionPoints).toHaveBeenCalledWith({
      userId: ME,
      holidayId: H,
      entityType: 'task',
      entityId: ID,
      wasCompleted: false,
      isCompleted: true,
      priority: 'high',
      dueDate: due,
    });
  });

  it('task PATCH on the collection', async () => {
    db.task.findUnique.mockResolvedValue({
      assignedTo: null,
      title: 't',
      createdBy: ME,
      isCompleted: true,
    });
    db.task.update.mockResolvedValue({
      isCompleted: false,
      priority: 'low',
      dueDate: null,
      assignedTo: null,
    });

    await tasks.PATCH(
      apiRequest('/x', 'PATCH', { taskId: ID, isCompleted: false }),
      routeParams({ id: H }),
    );

    expect(syncCompletionPoints).toHaveBeenCalledWith(
      expect.objectContaining({
        entityType: 'task',
        entityId: ID,
        wasCompleted: true,
        isCompleted: false,
      }),
    );
  });

  it('task PATCH by id', async () => {
    db.task.findFirst.mockResolvedValue({
      id: ID,
      title: 't',
      assignedTo: null,
      createdBy: ME,
      isCompleted: false,
    });
    db.task.update.mockResolvedValue({
      isCompleted: true,
      priority: 'medium',
      dueDate: null,
    });

    await task.PATCH(
      apiRequest('/x', 'PATCH', { isCompleted: true }),
      routeParams({ id: H, taskId: ID }),
    );

    expect(syncCompletionPoints).toHaveBeenCalledWith(
      expect.objectContaining({
        holidayId: H,
        entityType: 'task',
        entityId: ID,
        wasCompleted: false,
        isCompleted: true,
        priority: 'medium',
      }),
    );
  });

  it('gift PUT', async () => {
    db.gift.findUnique.mockResolvedValue({
      isCompleted: false,
      assignedTo: null,
      createdBy: ME,
      name: 'g',
    });
    db.gift.update.mockResolvedValue(giftRow(true));

    await gifts.PUT(
      apiRequest('/x', 'PUT', { giftId: ID, isCompleted: true }),
      routeParams({ id: H }),
    );

    expect(syncCompletionPoints).toHaveBeenCalledWith({
      userId: ME,
      holidayId: H,
      entityType: 'gift',
      entityId: ID,
      wasCompleted: false,
      isCompleted: true,
    });
  });

  it('gift PATCH by id', async () => {
    db.gift.findFirst.mockResolvedValue({ id: ID, isCompleted: false });
    db.gift.update.mockResolvedValue(giftRow(true));

    await gift.PATCH(
      apiRequest('/x', 'PATCH', { isCompleted: true }),
      routeParams({ id: H, giftId: ID }),
    );

    expect(syncCompletionPoints).toHaveBeenCalledWith(
      expect.objectContaining({
        entityType: 'gift',
        entityId: ID,
        wasCompleted: false,
        isCompleted: true,
      }),
    );
  });

  it('card PUT completion toggle', async () => {
    db.card.findUnique.mockResolvedValue({
      isCompleted: false,
      assignedTo: null,
      createdBy: ME,
      recipient: 'r',
    });
    db.card.update.mockResolvedValue({
      isCompleted: true,
      contact: null,
      recipient: 'r',
    });

    await cards.PUT(
      apiRequest('/x', 'PUT', { cardId: ID, isCompleted: true }),
      routeParams({ id: H }),
    );

    expect(syncCompletionPoints).toHaveBeenCalledWith({
      userId: ME,
      holidayId: H,
      entityType: 'card',
      entityId: ID,
      wasCompleted: false,
      isCompleted: true,
    });
  });

  it('card PUT with the action format', async () => {
    db.card.findUnique.mockResolvedValue({
      isCompleted: true,
      assignedTo: null,
      createdBy: ME,
      recipient: 'r',
    });
    db.card.update.mockResolvedValue({
      isCompleted: false,
      contact: null,
      recipient: 'r',
    });

    await cards.PUT(
      apiRequest('/x', 'PUT', {
        id: ID,
        action: 'toggle',
        recipient: 'r',
        message: 'm',
        isCompleted: false,
      }),
      routeParams({ id: H }),
    );

    expect(syncCompletionPoints).toHaveBeenCalledWith(
      expect.objectContaining({
        entityType: 'card',
        entityId: ID,
        wasCompleted: true,
        isCompleted: false,
      }),
    );
  });
});
