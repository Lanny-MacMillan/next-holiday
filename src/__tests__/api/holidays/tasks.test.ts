/** @jest-environment node */
import {
  apiRequest,
  prismaMock as db,
  readJson,
  resetPrismaMock,
  routeParams,
} from '@/__tests__/support/api';

const requireAuth = jest.fn();
const assertHolidayAccess = jest.fn();
jest.mock('@/lib/auth', () => ({
  requireAuth: (...a: unknown[]) => requireAuth(...a),
  assertHolidayAccess: (...a: unknown[]) => assertHolidayAccess(...a),
}));
jest.mock('@/lib/prisma', () => ({
  prisma: require('@/__tests__/support/api').prismaMock,
}));

const getUserName = jest.fn();
jest.mock('@/lib/notifications', () => ({
  createAssignmentNotification: jest.fn(),
  getUserName: (...a: unknown[]) => getUserName(...a),
}));
const broadcastAssignment = jest.fn();
const broadcastCompletion = jest.fn();
const broadcastNotification = jest.fn();
jest.mock('@/lib/realTimeNotifications', () => ({
  broadcastAssignment: (...a: unknown[]) => broadcastAssignment(...a),
  broadcastCompletion: (...a: unknown[]) => broadcastCompletion(...a),
  broadcastNotification: (...a: unknown[]) => broadcastNotification(...a),
}));
const validateAssigneeAccess = jest.fn();
jest.mock('@/lib/assigneeValidation', () => ({
  validateAssigneeAccess: (...a: unknown[]) => validateAssigneeAccess(...a),
}));

import { DELETE, GET, PATCH, POST, PUT } from '@/app/api/holidays/[id]/tasks/route';

const HOLIDAY = 'holiday-1';
const ME = '11111111-1111-4111-8111-111111111111';
const OTHER = '22222222-2222-4222-8222-222222222222';
const TASK = '33333333-3333-4333-8333-333333333333';
const ctx = routeParams({ id: HOLIDAY });
const flush = () => new Promise(resolve => setTimeout(resolve, 10));

const forbiddenResponse = () =>
  new Response(JSON.stringify({ success: false, error: 'Forbidden' }), {
    status: 403,
  });
const task = (over = {}) => ({
  id: TASK,
  holidayId: HOLIDAY,
  title: 'Wrap',
  isCompleted: false,
  assignedTo: null,
  ...over,
});
const found = (over = {}) => ({
  isCompleted: false,
  assignedTo: OTHER,
  createdBy: OTHER,
  title: 'Wrap',
  ...over,
});

beforeEach(() => {
  jest.clearAllMocks();
  resetPrismaMock();
  requireAuth.mockResolvedValue({ id: ME });
  assertHolidayAccess.mockResolvedValue(null);
  getUserName.mockResolvedValue('Me');
  validateAssigneeAccess.mockResolvedValue({ valid: true });
  db.holiday.findUnique.mockResolvedValue({ name: 'Christmas' });
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

describe.each([
  ['POST', () => POST(apiRequest('/x', 'POST', { title: 'a' }), ctx)],
  ['GET', () => GET(apiRequest('/x'), ctx)],
  [
    'PUT',
    () => PUT(apiRequest('/x', 'PUT', { taskId: TASK, isCompleted: true }), ctx),
  ],
  [
    'PATCH',
    () => PATCH(apiRequest('/x', 'PATCH', { taskId: TASK, title: 'a' }), ctx),
  ],
  ['DELETE', () => DELETE(apiRequest(`/x?taskId=${TASK}`, 'DELETE'), ctx)],
])('%s access control', (_, call) => {
  it('refuses a caller with no access to the holiday', async () => {
    assertHolidayAccess.mockResolvedValue(forbiddenResponse());
    expect((await readJson(await call())).status).toBe(403);
    expect(assertHolidayAccess).toHaveBeenCalledWith(HOLIDAY, ME);
    expect(db.task.create).not.toHaveBeenCalled();
    expect(db.task.update).not.toHaveBeenCalled();
    expect(db.task.delete).not.toHaveBeenCalled();
  });

  it('returns 401 when authentication fails', async () => {
    requireAuth.mockRejectedValue(new Error('Authentication required'));
    expect((await readJson(await call())).status).toBe(401);
  });
});

describe('POST /tasks', () => {
  const post = (body: unknown) => POST(apiRequest('/x', 'POST', body), ctx);

  it.each([
    [{}],
    [{ title: '' }],
    [{ title: 'a', priority: 'urgent' }],
    [{ title: 'a', assigned_to: 'not-a-uuid' }],
  ])('rejects an invalid body %p with 400', async body => {
    expect((await readJson(await post(body))).status).toBe(400);
    expect(db.task.create).not.toHaveBeenCalled();
  });

  it('creates a medium-priority task in this holiday, owned by the caller', async () => {
    db.task.create.mockResolvedValue(task());
    const { status, body } = await readJson(await post({ title: 'Wrap' }));

    expect(status).toBe(201);
    expect(db.task.create).toHaveBeenCalledWith({
      data: {
        holidayId: HOLIDAY,
        title: 'Wrap',
        description: null,
        priority: 'medium',
        category: null,
        dueDate: null,
        assignedTo: null,
        createdBy: ME,
      },
    });
    expect(body.data.data.id).toBe(TASK);
  });

  it('stores the given fields and turns the due date into a Date', async () => {
    db.task.create.mockResolvedValue(task());
    await post({
      title: 'a',
      description: 'd',
      priority: 'high',
      category: 'Gifts',
      due_date: '2025-12-20',
    });
    const { data } = db.task.create.mock.calls[0][0];
    expect(data).toMatchObject({
      description: 'd',
      priority: 'high',
      category: 'Gifts',
    });
    expect(data.dueDate).toEqual(new Date('2025-12-20'));
  });

  it('refuses an assignee without access', async () => {
    validateAssigneeAccess.mockResolvedValue({ valid: false, error: 'No access' });
    const { status, body } = await readJson(
      await post({ title: 'a', assigned_to: OTHER }),
    );
    expect(status).toBe(400);
    expect(body.error).toBe('No access');
    expect(validateAssigneeAccess).toHaveBeenCalledWith(OTHER, HOLIDAY);
    expect(db.task.create).not.toHaveBeenCalled();
  });

  it('falls back to a generic message when the validator gives none', async () => {
    validateAssigneeAccess.mockResolvedValue({ valid: false });
    expect(
      (await readJson(await post({ title: 'a', assigned_to: OTHER }))).body.error,
    ).toBe('Invalid assignee');
  });

  it('notifies someone else who is assigned the task', async () => {
    db.task.create.mockResolvedValue(task({ assignedTo: OTHER }));
    await post({ title: 'Wrap', assigned_to: OTHER });
    await flush();
    expect(broadcastAssignment).toHaveBeenCalledWith(
      OTHER,
      'Me',
      'task',
      'Wrap',
      TASK,
      HOLIDAY,
      'Christmas',
    );
  });

  it('uses a generic holiday name when the holiday is missing', async () => {
    db.holiday.findUnique.mockResolvedValue(null);
    db.task.create.mockResolvedValue(task({ assignedTo: OTHER }));
    await post({ title: 'Wrap', assigned_to: OTHER });
    await flush();
    expect(broadcastAssignment.mock.calls[0][6]).toBe('Holiday');
  });

  it('does not validate or notify when assigning to yourself', async () => {
    db.task.create.mockResolvedValue(task({ assignedTo: ME }));
    await post({ title: 'a', assigned_to: ME });
    await flush();
    expect(validateAssigneeAccess).not.toHaveBeenCalled();
    expect(broadcastAssignment).not.toHaveBeenCalled();
  });

  it('still succeeds when the broadcast or the name lookup fails', async () => {
    db.task.create.mockResolvedValue(task({ assignedTo: OTHER }));
    broadcastAssignment.mockRejectedValue(new Error('sse down'));
    expect(
      (await readJson(await post({ title: 'a', assigned_to: OTHER }))).status,
    ).toBe(201);
    await flush();

    getUserName.mockRejectedValue(new Error('db'));
    expect(
      (await readJson(await post({ title: 'a', assigned_to: OTHER }))).status,
    ).toBe(201);
  });

  it('returns 500 when the database fails', async () => {
    db.task.create.mockRejectedValue(new Error('db'));
    expect((await readJson(await post({ title: 'a' }))).status).toBe(500);
  });
});

describe('GET /tasks', () => {
  it("lists the holiday's tasks newest first", async () => {
    db.task.findMany.mockResolvedValue([task()]);
    const { status, body } = await readJson(await GET(apiRequest('/x'), ctx));
    expect(status).toBe(200);
    expect(body.data).toEqual([task()]);
    expect(db.task.findMany).toHaveBeenCalledWith({
      where: { holidayId: HOLIDAY },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('returns 500 when the database fails', async () => {
    db.task.findMany.mockRejectedValue(new Error('db'));
    expect((await readJson(await GET(apiRequest('/x'), ctx))).status).toBe(500);
  });
});

describe('PUT /tasks, completion toggle', () => {
  const put = (body: unknown) => PUT(apiRequest('/x', 'PUT', body), ctx);

  it.each([
    [{}],
    [{ taskId: TASK }],
    [{ isCompleted: true }],
    [{ taskId: TASK, isCompleted: 'yes' }],
  ])('rejects the body %p with 400', async body => {
    expect((await readJson(await put(body))).status).toBe(400);
    expect(db.task.update).not.toHaveBeenCalled();
  });

  it('answers 400 when the task is not in this holiday', async () => {
    db.task.findUnique.mockResolvedValue(null);
    const { status, body } = await readJson(
      await put({ taskId: TASK, isCompleted: true }),
    );
    expect(status).toBe(400);
    expect(body.error).toBe('Task not found');
    expect(db.task.findUnique.mock.calls[0][0].where).toEqual({
      id: TASK,
      holidayId: HOLIDAY,
    });
  });

  it("completes the task with today's local date, scoped to the holiday", async () => {
    db.task.findUnique.mockResolvedValue(found());
    db.task.update.mockResolvedValue(task({ isCompleted: true }));
    const { status } = await readJson(
      await put({ taskId: TASK, isCompleted: true }),
    );

    expect(status).toBe(200);
    const { where, data } = db.task.update.mock.calls[0][0];
    expect(where).toEqual({ id: TASK, holidayId: HOLIDAY });
    const now = new Date();
    expect(data.isCompleted).toBe(true);
    expect(data.completedDate).toEqual(
      new Date(now.getFullYear(), now.getMonth(), now.getDate()),
    );
  });

  it('clears the date when unmarking', async () => {
    db.task.findUnique.mockResolvedValue(found({ isCompleted: true }));
    db.task.update.mockResolvedValue(task());
    await put({ taskId: TASK, isCompleted: false });
    expect(db.task.update.mock.calls[0][0].data).toEqual({
      isCompleted: false,
      completedDate: null,
    });
  });

  it('tells whoever created an assigned task when it is completed', async () => {
    db.task.findUnique.mockResolvedValue(found());
    db.task.update.mockResolvedValue(task({ isCompleted: true }));
    await put({ taskId: TASK, isCompleted: true });
    await flush();
    expect(broadcastCompletion).toHaveBeenCalledWith(
      OTHER,
      'Me',
      'task',
      'Wrap',
      TASK,
      HOLIDAY,
      'Christmas',
    );
  });

  it.each([
    ['it was already completed', found({ isCompleted: true })],
    ['it has no assignee', found({ assignedTo: null })],
    ['the caller created it', found({ createdBy: ME })],
  ])('sends no completion notification when %s', async (_, row) => {
    db.task.findUnique.mockResolvedValue(row);
    db.task.update.mockResolvedValue(task({ isCompleted: true }));
    await put({ taskId: TASK, isCompleted: true });
    await flush();
    expect(broadcastCompletion).not.toHaveBeenCalled();
  });

  it('still succeeds when the notification fails', async () => {
    db.task.findUnique.mockResolvedValue(found());
    db.task.update.mockResolvedValue(task({ isCompleted: true }));
    broadcastCompletion.mockRejectedValue(new Error('sse down'));
    expect(
      (await readJson(await put({ taskId: TASK, isCompleted: true }))).status,
    ).toBe(200);
    await flush();
  });

  it('returns 500 when the database fails', async () => {
    db.task.findUnique.mockRejectedValue(new Error('db'));
    expect(
      (await readJson(await put({ taskId: TASK, isCompleted: true }))).status,
    ).toBe(500);
  });
});

describe('PATCH /tasks', () => {
  const patch = (body: Record<string, unknown>) =>
    PATCH(apiRequest('/x', 'PATCH', { taskId: TASK, ...body }), ctx);

  it('needs a taskId', async () => {
    const { status, body } = await readJson(
      await PATCH(apiRequest('/x', 'PATCH', { title: 'a' }), ctx),
    );
    expect(status).toBe(400);
    expect(body.error).toBe('taskId is required');
  });

  it('answers 400 when the task is not in this holiday', async () => {
    db.task.findUnique.mockResolvedValue(null);
    const { status, body } = await readJson(await patch({ title: 'a' }));
    expect(status).toBe(400);
    expect(body.error).toBe('Task not found');
    expect(db.task.findUnique.mock.calls[0][0].where).toEqual({
      id: TASK,
      holidayId: HOLIDAY,
    });
  });

  it('writes only the allowed fields, scoped to the holiday', async () => {
    db.task.findUnique.mockResolvedValue(found({ assignedTo: null }));
    db.task.update.mockResolvedValue(task({ title: 'New' }));
    const { status, body } = await readJson(
      await patch({
        title: 'New',
        priority: 'low',
        category: 'c',
        description: 'd',
        createdBy: OTHER,
        holidayId: 'other',
      }),
    );

    expect(status).toBe(200);
    const { where, data } = db.task.update.mock.calls[0][0];
    expect(where).toEqual({ id: TASK, holidayId: HOLIDAY });
    expect(data).toEqual({
      title: 'New',
      priority: 'low',
      category: 'c',
      description: 'd',
    });
    expect(body.data.data.title).toBe('New');
  });

  it.each([['due_date'], ['dueDate']])(
    'accepts %s and stores a Date',
    async field => {
      db.task.findUnique.mockResolvedValue(found({ assignedTo: null }));
      db.task.update.mockResolvedValue(task());
      await patch({ [field]: '2025-12-24' });
      expect(db.task.update.mock.calls[0][0].data.dueDate).toEqual(
        new Date('2025-12-24'),
      );
    },
  );

  it('records the completion date when completing and clears it when reopening', async () => {
    db.task.findUnique.mockResolvedValue(found({ assignedTo: null }));
    db.task.update.mockResolvedValue(task());
    await patch({ isCompleted: true });
    expect(db.task.update.mock.calls[0][0].data.completedDate).toBeInstanceOf(Date);

    db.task.findUnique.mockResolvedValue(
      found({ assignedTo: null, isCompleted: true }),
    );
    await patch({ isCompleted: false });
    expect(db.task.update.mock.calls[1][0].data).toEqual({
      isCompleted: false,
      completedDate: null,
    });
  });

  it('notifies the creator when an assigned task is completed', async () => {
    db.task.findUnique.mockResolvedValue(found());
    db.task.update.mockResolvedValue(task({ isCompleted: true, assignedTo: OTHER }));
    await patch({ isCompleted: true });
    await flush();
    expect(broadcastCompletion).toHaveBeenCalledWith(
      OTHER,
      'Me',
      'task',
      'Wrap',
      TASK,
      HOLIDAY,
      'Christmas',
    );
  });

  it('does not notify on completion when the caller created it or it has no assignee', async () => {
    db.task.findUnique.mockResolvedValue(found({ createdBy: ME }));
    db.task.update.mockResolvedValue(task({ isCompleted: true, assignedTo: OTHER }));
    await patch({ isCompleted: true });
    db.task.findUnique.mockResolvedValue(found());
    db.task.update.mockResolvedValue(task({ isCompleted: true, assignedTo: null }));
    await patch({ isCompleted: true });
    await flush();
    expect(broadcastCompletion).not.toHaveBeenCalled();
  });

  it('notifies a newly assigned user, under either field name', async () => {
    db.task.findUnique.mockResolvedValue(found({ assignedTo: null }));
    db.task.update.mockResolvedValue(task());
    await patch({ assigned_to: OTHER });
    await patch({ assignedTo: OTHER });
    await flush();
    expect(broadcastAssignment).toHaveBeenCalledTimes(2);
    expect(broadcastAssignment).toHaveBeenCalledWith(
      OTHER,
      'Me',
      'task',
      'Wrap',
      TASK,
      HOLIDAY,
      'Christmas',
    );
  });

  it('tells the previous assignee when the assignment is removed', async () => {
    db.task.findUnique.mockResolvedValue(found());
    db.task.update.mockResolvedValue(task());
    await patch({ assigned_to: null });
    await flush();
    expect(broadcastAssignment).not.toHaveBeenCalled();
    expect(broadcastNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: OTHER,
        title: 'Task Unassigned',
        entityId: TASK,
        fromUserId: ME,
      }),
    );
  });

  it('sends nothing when the assignee did not change or you unassign yourself', async () => {
    db.task.findUnique.mockResolvedValue(found());
    db.task.update.mockResolvedValue(task());
    await patch({ assigned_to: OTHER });
    db.task.findUnique.mockResolvedValue(found({ assignedTo: ME }));
    await patch({ assigned_to: null });
    await flush();
    expect(broadcastAssignment).not.toHaveBeenCalled();
    expect(broadcastNotification).not.toHaveBeenCalled();
  });

  it('still succeeds when notifications fail', async () => {
    db.task.findUnique.mockResolvedValue(found({ assignedTo: null }));
    db.task.update.mockResolvedValue(task({ isCompleted: true, assignedTo: OTHER }));
    broadcastAssignment.mockRejectedValue(new Error('sse down'));
    broadcastCompletion.mockRejectedValue(new Error('sse down'));
    expect(
      (await readJson(await patch({ assigned_to: OTHER, isCompleted: true })))
        .status,
    ).toBe(200);
    await flush();
  });

  it('refuses an assignee without access, as creating does', async () => {
    validateAssigneeAccess.mockResolvedValue({ valid: false, error: 'No access' });
    db.task.findUnique.mockResolvedValue(found({ assignedTo: null }));
    db.task.update.mockResolvedValue(task());
    expect((await readJson(await patch({ assigned_to: OTHER }))).status).toBe(400);
  });

  it('returns 500 when the database fails', async () => {
    db.task.findUnique.mockRejectedValue(new Error('db'));
    expect((await readJson(await patch({ title: 'a' }))).status).toBe(500);
  });
});

describe('DELETE /tasks', () => {
  it('needs a taskId', async () => {
    const { status, body } = await readJson(
      await DELETE(apiRequest('/x', 'DELETE'), ctx),
    );
    expect(status).toBe(400);
    expect(body.error).toBe('taskId is required');
  });

  it('deletes the task scoped to the holiday', async () => {
    const { status, body } = await readJson(
      await DELETE(apiRequest(`/x?taskId=${TASK}`, 'DELETE'), ctx),
    );
    expect(status).toBe(200);
    expect(body.data).toEqual({ success: true });
    expect(db.task.delete).toHaveBeenCalledWith({
      where: { id: TASK, holidayId: HOLIDAY },
    });
  });

  it('returns 500 when the database fails (including a task from another holiday)', async () => {
    db.task.delete.mockRejectedValue(new Error('Record not found'));
    expect(
      (await readJson(await DELETE(apiRequest(`/x?taskId=${TASK}`, 'DELETE'), ctx)))
        .status,
    ).toBe(500);
  });
});
