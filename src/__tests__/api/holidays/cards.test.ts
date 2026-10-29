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

import { DELETE, GET, PATCH, POST, PUT } from '@/app/api/holidays/[id]/cards/route';

const HOLIDAY = 'holiday-1';
const ME = '11111111-1111-4111-8111-111111111111';
const OTHER = '22222222-2222-4222-8222-222222222222';
const CARD = '33333333-3333-4333-8333-333333333333';
const CONTACT = '44444444-4444-4444-8444-444444444444';
const ctx = routeParams({ id: HOLIDAY });
const flush = () => new Promise(resolve => setTimeout(resolve, 10));

const forbiddenResponse = () =>
  new Response(JSON.stringify({ success: false, error: 'Forbidden' }), {
    status: 403,
  });
const card = (over = {}) => ({
  id: CARD,
  holidayId: HOLIDAY,
  recipient: 'Grace',
  message: 'Happy holidays',
  isCompleted: false,
  contact: null,
  assignedUser: null,
  ...over,
});
const existing = (over = {}) => ({
  isCompleted: false,
  assignedTo: null,
  createdBy: OTHER,
  recipient: 'Grace',
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

describe('POST /cards', () => {
  const post = (body: unknown) => POST(apiRequest('/x', 'POST', body), ctx);

  it('refuses a caller with no access to the holiday', async () => {
    assertHolidayAccess.mockResolvedValue(forbiddenResponse());
    expect(
      (await readJson(await post({ recipient: 'G', message: 'm' }))).status,
    ).toBe(403);
    expect(db.card.create).not.toHaveBeenCalled();
    expect(assertHolidayAccess).toHaveBeenCalledWith(HOLIDAY, ME);
  });

  it('returns 401 when authentication fails', async () => {
    requireAuth.mockRejectedValue(new Error('Authentication required'));
    expect(
      (await readJson(await post({ recipient: 'G', message: 'm' }))).status,
    ).toBe(401);
  });

  it.each([
    [{ message: 'm' }],
    [{ recipient: '', message: 'm' }],
    [{ recipient: 'G', message: 'm', contact_id: 'not-a-uuid' }],
    [{ recipient: 'G', message: 'm', assigned_to: 'not-a-uuid' }],
  ])('rejects an invalid body %p with 400', async body => {
    expect((await readJson(await post(body))).status).toBe(400);
    expect(db.card.create).not.toHaveBeenCalled();
  });

  it('creates the card in this holiday, owned by the caller', async () => {
    db.card.create.mockResolvedValue(card());
    const { status, body } = await readJson(
      await post({
        recipient: 'Grace',
        message: 'Happy holidays',
        address: '1 Main St',
      }),
    );

    expect(status).toBe(201);
    expect(db.card.create).toHaveBeenCalledWith({
      data: {
        holidayId: HOLIDAY,
        recipient: 'Grace',
        message: 'Happy holidays',
        address: '1 Main St',
        contactId: null,
        assignedTo: undefined,
        createdBy: ME,
      },
      include: { contact: true, assignedUser: true },
    });
    expect(body.data.data.recipient).toBe('Grace');
  });

  it("shows the linked contact's name as the recipient", async () => {
    db.card.create.mockResolvedValue(card({ contact: { name: 'Grace Hopper' } }));
    const { body } = await readJson(
      await post({ recipient: 'g', message: 'm', contact_id: CONTACT }),
    );
    expect(body.data.data.recipient).toBe('Grace Hopper');
    expect(db.card.create.mock.calls[0][0].data.contactId).toBe(CONTACT);
  });

  it('checks the assignee has access, and refuses one who does not', async () => {
    validateAssigneeAccess.mockResolvedValue({ valid: false, error: 'No access' });
    const { status, body } = await readJson(
      await post({ recipient: 'G', message: 'm', assigned_to: OTHER }),
    );
    expect(status).toBe(400);
    expect(body.error).toBe('No access');
    expect(validateAssigneeAccess).toHaveBeenCalledWith(OTHER, HOLIDAY);
    expect(db.card.create).not.toHaveBeenCalled();
  });

  it('notifies the assignee when assigning to someone else', async () => {
    db.card.create.mockResolvedValue(card({ assignedTo: OTHER }));
    await post({ recipient: 'Grace', message: 'm', assigned_to: OTHER });
    await flush();

    expect(broadcastAssignment).toHaveBeenCalledWith(
      OTHER,
      'Me',
      'card',
      'Card for Grace',
      CARD,
      HOLIDAY,
      'Christmas',
    );
  });

  it('does not validate or notify when assigning to yourself', async () => {
    db.card.create.mockResolvedValue(card());
    await post({ recipient: 'Grace', message: 'm', assigned_to: ME });
    await flush();
    expect(validateAssigneeAccess).not.toHaveBeenCalled();
    expect(broadcastAssignment).not.toHaveBeenCalled();
  });

  it('still succeeds when the notification step fails', async () => {
    db.card.create.mockResolvedValue(card({ assignedTo: OTHER }));
    broadcastAssignment.mockRejectedValue(new Error('sse down'));
    expect(
      (
        await readJson(
          await post({ recipient: 'Grace', message: 'm', assigned_to: OTHER }),
        )
      ).status,
    ).toBe(201);
    await flush();
  });

  it('returns 500 when the database fails', async () => {
    db.card.create.mockRejectedValue(new Error('db'));
    expect(
      (await readJson(await post({ recipient: 'G', message: 'm' }))).status,
    ).toBe(500);
  });
});

describe('PUT /cards, completion toggle', () => {
  const put = (body: unknown) => PUT(apiRequest('/x', 'PUT', body), ctx);

  it('marks a card sent, recording the date', async () => {
    db.card.findUnique.mockResolvedValue(existing());
    db.card.update.mockResolvedValue(card({ isCompleted: true }));
    const { status } = await readJson(
      await put({ cardId: CARD, isCompleted: true }),
    );

    expect(status).toBe(200);
    const { where, data } = db.card.update.mock.calls[0][0];
    expect(where).toEqual({ id: CARD, holidayId: HOLIDAY });
    expect(data.isCompleted).toBe(true);
    expect(data.sentDate).toBeInstanceOf(Date);
  });

  it('clears the sent date when unmarking', async () => {
    db.card.findUnique.mockResolvedValue(existing({ isCompleted: true }));
    db.card.update.mockResolvedValue(card());
    await put({ cardId: CARD, isCompleted: false });
    expect(db.card.update.mock.calls[0][0].data).toEqual({
      isCompleted: false,
      sentDate: null,
    });
  });

  it('answers 400 when the card does not exist', async () => {
    db.card.findUnique.mockResolvedValue(null);
    const { status, body } = await readJson(
      await put({ cardId: CARD, isCompleted: true }),
    );
    expect(status).toBe(400);
    expect(body.error).toBe('Card not found');
    expect(db.card.update).not.toHaveBeenCalled();
  });

  it("tells the card's creator when an assigned card is completed", async () => {
    db.card.findUnique.mockResolvedValue(
      existing({ assignedTo: ME, createdBy: OTHER }),
    );
    db.card.update.mockResolvedValue(card({ isCompleted: true }));
    await put({ cardId: CARD, isCompleted: true });
    await flush();

    expect(broadcastCompletion).toHaveBeenCalledWith(
      OTHER,
      'Me',
      'card',
      'Card for Grace',
      CARD,
      HOLIDAY,
      'Christmas',
    );
  });

  it.each([
    ['it was already completed', existing({ isCompleted: true, assignedTo: ME })],
    ['it has no assignee', existing({ assignedTo: null })],
    ['the caller created it', existing({ assignedTo: ME, createdBy: ME })],
  ])('sends no completion notification when %s', async (_, found) => {
    db.card.findUnique.mockResolvedValue(found);
    db.card.update.mockResolvedValue(card({ isCompleted: true }));
    await put({ cardId: CARD, isCompleted: true });
    await flush();
    expect(broadcastCompletion).not.toHaveBeenCalled();
  });

  it('only looks up cards that belong to the authorised holiday', async () => {
    db.card.findUnique.mockResolvedValue(existing());
    db.card.update.mockResolvedValue(card());
    await put({ cardId: CARD, isCompleted: true });
    expect(db.card.findUnique.mock.calls[0][0].where).toMatchObject({
      holidayId: HOLIDAY,
    });
  });
});

describe('PUT /cards, action format', () => {
  const put = (body: Record<string, unknown>) =>
    PUT(
      apiRequest('/x', 'PUT', {
        id: CARD,
        recipient: 'Grace',
        message: 'm',
        ...body,
      }),
      ctx,
    );

  it('rejects a body that matches neither format', async () => {
    expect(
      (await readJson(await PUT(apiRequest('/x', 'PUT', { nonsense: true }), ctx)))
        .status,
    ).toBe(400);
    expect((await readJson(await put({ action: 'explode' }))).status).toBe(400);
  });

  it('delete removes the card', async () => {
    db.card.findUnique.mockResolvedValue(existing());
    const { status, body } = await readJson(await put({ action: 'delete' }));
    expect(status).toBe(200);
    expect(body.data).toEqual({ success: true });
    expect(db.card.delete).toHaveBeenCalledWith({
      where: { id: CARD, holidayId: HOLIDAY },
    });
  });

  it('update writes the form fields and returns the card', async () => {
    db.card.findUnique.mockResolvedValue(existing());
    db.card.update.mockResolvedValue(card({ recipient: 'Ada' }));
    const { status } = await readJson(
      await put({
        action: 'update',
        recipient: 'Ada',
        message: 'Hi',
        address: null,
      }),
    );

    expect(status).toBe(200);
    expect(db.card.update.mock.calls[0][0].data).toEqual({
      recipient: 'Ada',
      message: 'Hi',
      address: null,
    });
  });

  it('only changes isCompleted and the assignee when they are given', async () => {
    db.card.findUnique.mockResolvedValue(existing());
    db.card.update.mockResolvedValue(card());
    await put({ action: 'toggle', isCompleted: true, assigned_to: OTHER });
    expect(db.card.update.mock.calls[0][0].data).toMatchObject({
      isCompleted: true,
      assignedTo: OTHER,
    });
  });

  it('answers 400 when the card to update does not exist', async () => {
    db.card.findUnique.mockResolvedValue(null);
    expect((await readJson(await put({ action: 'update' }))).status).toBe(400);
  });

  it('notifies a newly assigned user', async () => {
    db.card.findUnique.mockResolvedValue(existing({ assignedTo: null }));
    db.card.update.mockResolvedValue(card());
    await put({ action: 'update', assigned_to: OTHER });
    await flush();
    expect(broadcastAssignment).toHaveBeenCalledWith(
      OTHER,
      'Me',
      'card',
      'Card for Grace',
      CARD,
      HOLIDAY,
      'Christmas',
    );
  });

  it('tells the previous assignee when the assignment is removed', async () => {
    db.card.findUnique.mockResolvedValue(existing({ assignedTo: OTHER }));
    db.card.update.mockResolvedValue(card());
    await put({ action: 'update', assigned_to: null });
    await flush();

    expect(broadcastAssignment).not.toHaveBeenCalled();
    expect(broadcastNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: OTHER,
        title: 'Card Unassigned',
        entityId: CARD,
        fromUserId: ME,
      }),
    );
  });

  it('sends nothing when the assignee did not change', async () => {
    db.card.findUnique.mockResolvedValue(existing({ assignedTo: OTHER }));
    db.card.update.mockResolvedValue(card());
    await put({ action: 'update', assigned_to: OTHER });
    await flush();
    expect(broadcastAssignment).not.toHaveBeenCalled();
    expect(broadcastNotification).not.toHaveBeenCalled();
  });

  it('notifies the creator when an assigned card is completed through update', async () => {
    db.card.findUnique.mockResolvedValue(
      existing({ assignedTo: ME, createdBy: OTHER }),
    );
    db.card.update.mockResolvedValue(card({ isCompleted: true }));
    await put({ action: 'toggle', isCompleted: true });
    await flush();
    expect(broadcastCompletion).toHaveBeenCalledWith(
      OTHER,
      'Me',
      'card',
      'Card for Grace',
      CARD,
      HOLIDAY,
      'Christmas',
    );
  });

  it('returns 500 when the database fails', async () => {
    db.card.findUnique.mockRejectedValue(new Error('db'));
    expect((await readJson(await put({ action: 'update' }))).status).toBe(500);
  });

  it('refuses a caller with no access', async () => {
    assertHolidayAccess.mockResolvedValue(forbiddenResponse());
    expect((await readJson(await put({ action: 'delete' }))).status).toBe(403);
    expect(db.card.delete).not.toHaveBeenCalled();
  });
});

describe('PATCH /cards', () => {
  const patch = (body: Record<string, unknown>) =>
    PATCH(apiRequest('/x', 'PATCH', { cardId: CARD, ...body }), ctx);

  it('rejects a body with no valid card id', async () => {
    expect(
      (
        await readJson(
          await PATCH(apiRequest('/x', 'PATCH', { cardId: 'nope' }), ctx),
        )
      ).status,
    ).toBe(400);
  });

  it('refuses an assignee without access', async () => {
    validateAssigneeAccess.mockResolvedValue({ valid: false });
    const { status, body } = await readJson(await patch({ assigned_to: OTHER }));
    expect(status).toBe(400);
    expect(body.error).toBe('Invalid assignee');
  });

  it('answers 400 when the card does not exist', async () => {
    db.card.findUnique.mockResolvedValue(null);
    expect((await readJson(await patch({ recipient: 'x' }))).status).toBe(400);
  });

  it('updates only the fields that were sent', async () => {
    db.card.findUnique.mockResolvedValue(existing());
    db.card.update.mockResolvedValue(card());
    await patch({ message: 'New text' });
    expect(db.card.update.mock.calls[0][0].data).toEqual({ message: 'New text' });
  });

  it('maps every editable field, including the contact', async () => {
    db.card.findUnique.mockResolvedValue(existing());
    db.card.update.mockResolvedValue(card({ contact: { name: 'Grace Hopper' } }));
    const { body } = await readJson(
      await patch({
        recipient: 'G',
        message: 'm',
        address: '1 St',
        contact_id: CONTACT,
        assigned_to: ME,
      }),
    );

    expect(db.card.update.mock.calls[0][0].data).toEqual({
      recipient: 'G',
      message: 'm',
      address: '1 St',
      contactId: CONTACT,
      assignedTo: ME,
    });
    expect(body.data.data.recipient).toBe('Grace Hopper');
  });

  it('notifies a newly assigned user, but not on self-assignment or removal', async () => {
    db.card.findUnique.mockResolvedValue(existing({ assignedTo: null }));
    db.card.update.mockResolvedValue(card());

    await patch({ assigned_to: OTHER });
    await flush();
    expect(broadcastAssignment).toHaveBeenCalledTimes(1);

    await patch({ assigned_to: ME });
    await patch({ assigned_to: null });
    await flush();
    expect(broadcastAssignment).toHaveBeenCalledTimes(1);
  });

  it('returns 500 when the database fails', async () => {
    db.card.findUnique.mockRejectedValue(new Error('db'));
    expect((await readJson(await patch({ message: 'x' }))).status).toBe(500);
  });
});

describe('DELETE /cards', () => {
  const del = (query = `?cardId=${CARD}`) =>
    DELETE(apiRequest(`/x${query}`, 'DELETE'), ctx);

  it('needs a card id', async () => {
    const { status, body } = await readJson(await del(''));
    expect(status).toBe(400);
    expect(body.error).toBe('Card ID is required');
  });

  it('answers 400 when the card does not exist', async () => {
    db.card.findUnique.mockResolvedValue(null);
    expect((await readJson(await del())).status).toBe(400);
    expect(db.card.delete).not.toHaveBeenCalled();
  });

  it('deletes the card', async () => {
    db.card.findUnique.mockResolvedValue(card());
    const { status, body } = await readJson(await del());
    expect(status).toBe(200);
    expect(body.data).toEqual({ success: true });
    expect(db.card.delete).toHaveBeenCalledWith({
      where: { id: CARD, holidayId: HOLIDAY },
    });
  });

  it('only deletes a card that belongs to the authorised holiday', async () => {
    db.card.findUnique.mockResolvedValue(card());
    await del();
    expect(db.card.delete.mock.calls[0][0].where).toMatchObject({
      holidayId: HOLIDAY,
    });
  });

  it('returns 500 when the database fails', async () => {
    db.card.findUnique.mockResolvedValue(card());
    db.card.delete.mockRejectedValue(new Error('db'));
    expect((await readJson(await del())).status).toBe(500);
  });
});

describe('GET /cards', () => {
  it("lists the holiday's cards, newest first", async () => {
    db.card.findMany.mockResolvedValue([card()]);
    const { status, body } = await readJson(await GET(apiRequest('/x'), ctx));

    expect(status).toBe(200);
    expect(body.data).toEqual([card()]);
    expect(db.card.findMany).toHaveBeenCalledWith({
      where: { holidayId: HOLIDAY },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('refuses a caller with no access', async () => {
    assertHolidayAccess.mockResolvedValue(forbiddenResponse());
    expect((await readJson(await GET(apiRequest('/x'), ctx))).status).toBe(403);
    expect(db.card.findMany).not.toHaveBeenCalled();
  });

  it('returns 500 when the database fails', async () => {
    db.card.findMany.mockRejectedValue(new Error('db'));
    expect((await readJson(await GET(apiRequest('/x'), ctx))).status).toBe(500);
  });
});
