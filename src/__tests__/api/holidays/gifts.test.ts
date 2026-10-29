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

import { DELETE, GET, PATCH, POST, PUT } from '@/app/api/holidays/[id]/gifts/route';

const HOLIDAY = 'holiday-1';
const ME = '11111111-1111-4111-8111-111111111111';
const OTHER = '22222222-2222-4222-8222-222222222222';
const GIFT = '33333333-3333-4333-8333-333333333333';
const CONTACT = '44444444-4444-4444-8444-444444444444';
const ctx = routeParams({ id: HOLIDAY });
const flush = () => new Promise(resolve => setTimeout(resolve, 10));

const forbiddenResponse = () =>
  new Response(JSON.stringify({ success: false, error: 'Forbidden' }), {
    status: 403,
  });
const gift = (over = {}) => ({
  id: GIFT,
  holidayId: HOLIDAY,
  contactId: null,
  name: 'Scarf',
  description: null,
  price: '12.5',
  actualPrice: null,
  store: null,
  productLink: null,
  notes: null,
  isCompleted: false,
  completedDate: null,
  assignedTo: null,
  createdBy: OTHER,
  shareId: null,
  contact: null,
  assignedUser: null,
  createdAt: new Date('2025-01-01T00:00:00Z'),
  updatedAt: new Date('2025-01-02T00:00:00Z'),
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
  ['POST', (b?: unknown) => POST(apiRequest('/x', 'POST', b ?? { name: 'a' }), ctx)],
  ['GET', () => GET(apiRequest('/x'), ctx)],
  [
    'PUT',
    () => PUT(apiRequest('/x', 'PUT', { giftId: GIFT, isCompleted: true }), ctx),
  ],
  [
    'PATCH',
    () => PATCH(apiRequest('/x', 'PATCH', { giftId: GIFT, name: 'a' }), ctx),
  ],
  ['DELETE', () => DELETE(apiRequest(`/x?giftId=${GIFT}`, 'DELETE'), ctx)],
])('%s access control', (_, call) => {
  it('refuses a caller with no access to the holiday', async () => {
    assertHolidayAccess.mockResolvedValue(forbiddenResponse());
    expect((await readJson(await call())).status).toBe(403);
    expect(assertHolidayAccess).toHaveBeenCalledWith(HOLIDAY, ME);
    expect(db.gift.create).not.toHaveBeenCalled();
    expect(db.gift.update).not.toHaveBeenCalled();
    expect(db.gift.delete).not.toHaveBeenCalled();
  });

  it('returns 401 when authentication fails', async () => {
    requireAuth.mockRejectedValue(new Error('Authentication required'));
    expect((await readJson(await call())).status).toBe(401);
  });
});

describe('POST /gifts', () => {
  const post = (body: unknown) => POST(apiRequest('/x', 'POST', body), ctx);

  it('answers 400 when the holiday does not exist', async () => {
    db.holiday.findUnique.mockResolvedValue(null);
    const { status, body } = await readJson(await post({ name: 'a' }));
    expect(status).toBe(400);
    expect(body.error).toBe('Holiday not found');
  });

  it.each([
    [{}],
    [{ name: '' }],
    [{ name: 'a', price: -1 }],
    [{ name: 'a', product_link: 'not a url' }],
    [{ name: 'a', assigned_to: 'not-a-uuid' }],
    [{ name: 'a', contact_id: 'not-a-uuid' }],
  ])('rejects an invalid body %p with 400', async body => {
    expect((await readJson(await post(body))).status).toBe(400);
    expect(db.gift.create).not.toHaveBeenCalled();
  });

  it('creates the gift in this holiday, owned by the caller, with defaults', async () => {
    db.gift.create.mockResolvedValue(gift());
    const { status, body } = await readJson(await post({ name: 'Scarf' }));

    expect(status).toBe(201);
    expect(db.gift.create).toHaveBeenCalledWith({
      data: {
        holidayId: HOLIDAY,
        name: 'Scarf',
        description: null,
        price: 0,
        actualPrice: null,
        store: null,
        productLink: null,
        notes: null,
        contactId: undefined,
        assignedTo: null,
        createdBy: ME,
      },
      include: { contact: true, assignedUser: true },
    });
    expect(body.data.data).toMatchObject({
      id: GIFT,
      price: 12.5,
      recipient: 'Unknown',
      completedDate: null,
      assignedToName: null,
      createdAt: '2025-01-01T00:00:00.000Z',
    });
  });

  it('stores an empty product link as null and an empty assignee as unassigned', async () => {
    db.gift.create.mockResolvedValue(gift());
    await post({
      name: 'a',
      product_link: '',
      assigned_to: '',
      price: 5,
      actual_price: 4,
    });
    expect(db.gift.create.mock.calls[0][0].data).toMatchObject({
      productLink: null,
      assignedTo: null,
      price: 5,
      actualPrice: 4,
    });
  });

  it('keeps a real product link', async () => {
    db.gift.create.mockResolvedValue(gift());
    await post({ name: 'a', product_link: 'https://shop.example/x' });
    expect(db.gift.create.mock.calls[0][0].data.productLink).toBe(
      'https://shop.example/x',
    );
  });

  it("uses the contact's name as the recipient", async () => {
    db.gift.create.mockResolvedValue(
      gift({
        contact: { name: 'Grace' },
        assignedUser: { name: 'Sam' },
        assignedTo: OTHER,
        actualPrice: '9',
      }),
    );
    const { body } = await readJson(await post({ name: 'a', contact_id: CONTACT }));
    expect(body.data.data).toMatchObject({
      recipient: 'Grace',
      assignedToName: 'Sam',
      actualPrice: 9,
    });
    expect(db.gift.create.mock.calls[0][0].data.contactId).toBe(CONTACT);
    expect(db.contact.create).not.toHaveBeenCalled();
  });

  describe('creating the recipient on the fly', () => {
    beforeEach(() => {
      db.account.findFirst.mockResolvedValue({ id: 'acct-1' });
      db.gift.create.mockResolvedValue(gift());
    });

    it("creates a contact in the caller's account", async () => {
      db.contact.create.mockResolvedValue({ id: CONTACT });
      await post({
        name: 'a',
        recipient_name: '  Grace  ',
        recipient_email: 'g@x.com',
        recipient_phone: '555',
        recipient_address: '1 Main St',
      });

      expect(db.account.findFirst).toHaveBeenCalledWith({
        where: { members: { some: { userId: ME } } },
        select: { id: true },
      });
      expect(db.contact.findFirst).toHaveBeenCalledWith({
        where: { accountId: 'acct-1', email: 'g@x.com' },
      });
      expect(db.contact.create.mock.calls[0][0].data).toMatchObject({
        accountId: 'acct-1',
        name: 'Grace',
        email: 'g@x.com',
        phone: '555',
        streetAddress: '1 Main St',
        createdBy: ME,
      });
      expect(db.gift.create.mock.calls[0][0].data.contactId).toBe(CONTACT);
    });

    it('leaves optional contact fields null when they are blank', async () => {
      db.contact.create.mockResolvedValue({ id: CONTACT });
      await post({
        name: 'a',
        recipient_name: 'Grace',
        recipient_email: '',
        recipient_phone: ' ',
      });
      expect(db.contact.findFirst).not.toHaveBeenCalled();
      expect(db.contact.create.mock.calls[0][0].data).toMatchObject({
        email: null,
        phone: null,
        streetAddress: null,
      });
    });

    it('reuses an existing contact with the same email and updates its details', async () => {
      db.contact.findFirst.mockResolvedValue({
        id: CONTACT,
        phone: '111',
        streetAddress: 'Old St',
      });
      db.contact.update.mockResolvedValue({ id: CONTACT });
      await post({
        name: 'a',
        recipient_name: 'Grace',
        recipient_email: 'g@x.com',
        recipient_phone: '222',
      });

      expect(db.contact.create).not.toHaveBeenCalled();
      const { where, data } = db.contact.update.mock.calls[0][0];
      expect(where).toEqual({ id: CONTACT });
      expect(data).toMatchObject({
        name: 'Grace',
        phone: '222',
        streetAddress: 'Old St',
      });
      expect(db.gift.create.mock.calls[0][0].data.contactId).toBe(CONTACT);
    });

    it('keeps the stored phone and address when the new ones are blank', async () => {
      db.contact.findFirst.mockResolvedValue({
        id: CONTACT,
        phone: '111',
        streetAddress: 'Old St',
      });
      db.contact.update.mockResolvedValue({ id: CONTACT });
      await post({
        name: 'a',
        recipient_name: 'Grace',
        recipient_email: 'g@x.com',
        recipient_address: '9 New St',
      });
      expect(db.contact.update.mock.calls[0][0].data).toMatchObject({
        phone: '111',
        streetAddress: '9 New St',
      });
    });

    it('returns 500 when the caller has no account', async () => {
      db.account.findFirst.mockResolvedValue(null);
      const { status, body } = await readJson(
        await post({ name: 'a', recipient_name: 'Grace' }),
      );
      expect(status).toBe(500);
      expect(body.error).toBe('User account not found');
      expect(db.gift.create).not.toHaveBeenCalled();
    });

    it('ignores a blank recipient name', async () => {
      await post({ name: 'a', recipient_name: '   ' });
      expect(db.account.findFirst).not.toHaveBeenCalled();
    });

    it('does not create contacts for Thanksgiving, which has no recipients', async () => {
      db.holiday.findUnique.mockResolvedValue({ name: 'Thanksgiving' });
      await post({ name: 'Turkey', recipient_name: 'Grace' });
      expect(db.account.findFirst).not.toHaveBeenCalled();
      expect(db.contact.create).not.toHaveBeenCalled();
      expect(db.gift.create).toHaveBeenCalled();
    });
  });

  it('uses the Thanksgiving schema, which only needs a name', async () => {
    db.holiday.findUnique.mockResolvedValue({ name: 'Thanksgiving' });
    db.gift.create.mockResolvedValue(gift());
    expect((await readJson(await post({ name: 'Turkey' }))).status).toBe(201);
    const { status, body } = await readJson(await post({ name: '' }));
    expect(status).toBe(400);
    expect(JSON.stringify(body.error)).toContain('Shopping Item Name is required');
  });

  describe('assignment', () => {
    it('refuses an assignee without access', async () => {
      validateAssigneeAccess.mockResolvedValue({ valid: false, error: 'No access' });
      const { status, body } = await readJson(
        await post({ name: 'a', assigned_to: OTHER }),
      );
      expect(status).toBe(400);
      expect(body.error).toBe('No access');
      expect(validateAssigneeAccess).toHaveBeenCalledWith(OTHER, HOLIDAY);
      expect(db.gift.create).not.toHaveBeenCalled();
    });

    it('falls back to a generic message when the validator gives none', async () => {
      validateAssigneeAccess.mockResolvedValue({ valid: false });
      expect(
        (await readJson(await post({ name: 'a', assigned_to: OTHER }))).body.error,
      ).toBe('Invalid assignee');
    });

    it('notifies someone else who is assigned the gift', async () => {
      db.gift.create.mockResolvedValue(gift({ assignedTo: OTHER }));
      await post({ name: 'Scarf', assigned_to: OTHER });
      await flush();
      expect(broadcastAssignment).toHaveBeenCalledWith(
        OTHER,
        'Me',
        'gift',
        'Scarf',
        GIFT,
        HOLIDAY,
        'Christmas',
      );
    });

    it('does not validate or notify when assigning to yourself', async () => {
      db.gift.create.mockResolvedValue(gift({ assignedTo: ME }));
      await post({ name: 'a', assigned_to: ME });
      await flush();
      expect(validateAssigneeAccess).not.toHaveBeenCalled();
      expect(broadcastAssignment).not.toHaveBeenCalled();
    });

    it('still succeeds when the broadcast fails', async () => {
      db.gift.create.mockResolvedValue(gift({ assignedTo: OTHER }));
      broadcastAssignment.mockRejectedValue(new Error('sse down'));
      expect(
        (await readJson(await post({ name: 'a', assigned_to: OTHER }))).status,
      ).toBe(201);
      await flush();
    });

    it('still succeeds when looking up the assigner name fails', async () => {
      db.gift.create.mockResolvedValue(gift({ assignedTo: OTHER }));
      getUserName.mockRejectedValue(new Error('db'));
      expect(
        (await readJson(await post({ name: 'a', assigned_to: OTHER }))).status,
      ).toBe(201);
    });
  });

  it('returns 500 when the database fails', async () => {
    db.gift.create.mockRejectedValue(new Error('db'));
    expect((await readJson(await post({ name: 'a' }))).status).toBe(500);
  });
});

describe('GET /gifts', () => {
  it("lists the holiday's gifts newest first, shaped for the UI", async () => {
    db.gift.findMany.mockResolvedValue([
      gift({
        contact: { name: 'Grace' },
        assignedUser: { name: 'Sam' },
        completedDate: new Date('2025-02-01T00:00:00Z'),
      }),
      gift({ id: 'g2' }),
    ]);
    const { status, body } = await readJson(await GET(apiRequest('/x'), ctx));

    expect(status).toBe(200);
    expect(db.gift.findMany).toHaveBeenCalledWith({
      where: { holidayId: HOLIDAY },
      include: { contact: true, assignedUser: true },
      orderBy: { createdAt: 'desc' },
    });
    expect(body.data[0]).toMatchObject({
      price: 12.5,
      recipient: 'Grace',
      assignedToName: 'Sam',
      completedDate: '2025-02-01T00:00:00.000Z',
      updatedAt: '2025-01-02T00:00:00.000Z',
    });
    expect(body.data[1]).toMatchObject({
      recipient: 'Unknown',
      assignedToName: null,
    });
  });

  it('returns 500 when the database fails', async () => {
    db.gift.findMany.mockRejectedValue(new Error('db'));
    expect((await readJson(await GET(apiRequest('/x'), ctx))).status).toBe(500);
  });
});

describe('PUT /gifts, completion toggle', () => {
  const put = (body: unknown) => PUT(apiRequest('/x', 'PUT', body), ctx);
  const found = (over = {}) => ({
    isCompleted: false,
    assignedTo: OTHER,
    createdBy: OTHER,
    name: 'Scarf',
    ...over,
  });

  it.each([
    [{}],
    [{ giftId: GIFT }],
    [{ giftId: 5, isCompleted: true }],
    [{ giftId: GIFT, isCompleted: 'yes' }],
  ])('rejects the body %p with 400', async body => {
    expect((await readJson(await put(body))).status).toBe(400);
    expect(db.gift.update).not.toHaveBeenCalled();
  });

  it('answers 400 when the gift is not in this holiday', async () => {
    db.gift.findUnique.mockResolvedValue(null);
    const { status, body } = await readJson(
      await put({ giftId: GIFT, isCompleted: true }),
    );
    expect(status).toBe(400);
    expect(body.error).toBe('Gift not found');
    expect(db.gift.findUnique.mock.calls[0][0].where).toEqual({
      id: GIFT,
      holidayId: HOLIDAY,
    });
  });

  it('marks the gift bought with a date, scoped to the holiday', async () => {
    db.gift.findUnique.mockResolvedValue(found());
    db.gift.update.mockResolvedValue(
      gift({ isCompleted: true, completedDate: new Date('2025-03-01T00:00:00Z') }),
    );
    const { status, body } = await readJson(
      await put({ giftId: GIFT, isCompleted: true }),
    );

    expect(status).toBe(200);
    const { where, data } = db.gift.update.mock.calls[0][0];
    expect(where).toEqual({ id: GIFT, holidayId: HOLIDAY });
    expect(data.isCompleted).toBe(true);
    expect(data.completedDate).toBeInstanceOf(Date);
    expect(body.data.data.completedDate).toBe('2025-03-01T00:00:00.000Z');
  });

  it('clears the date when unmarking', async () => {
    db.gift.findUnique.mockResolvedValue(found({ isCompleted: true }));
    db.gift.update.mockResolvedValue(gift());
    await put({ giftId: GIFT, isCompleted: false });
    expect(db.gift.update.mock.calls[0][0].data).toEqual({
      isCompleted: false,
      completedDate: null,
    });
  });

  it('tells whoever created an assigned gift when it is completed', async () => {
    db.gift.findUnique.mockResolvedValue(found());
    db.gift.update.mockResolvedValue(gift({ isCompleted: true }));
    await put({ giftId: GIFT, isCompleted: true });
    await flush();
    expect(broadcastCompletion).toHaveBeenCalledWith(
      OTHER,
      'Me',
      'gift',
      'Scarf',
      GIFT,
      HOLIDAY,
      'Christmas',
    );
  });

  it('falls back to a generic holiday name in the notification', async () => {
    db.gift.findUnique.mockResolvedValue(found());
    db.gift.update.mockResolvedValue(gift({ isCompleted: true }));
    db.holiday.findUnique.mockResolvedValue(null);
    await put({ giftId: GIFT, isCompleted: true });
    await flush();
    expect(broadcastCompletion.mock.calls[0][6]).toBe('Holiday');
  });

  it.each([
    ['it was already completed', found({ isCompleted: true })],
    ['it has no assignee', found({ assignedTo: null })],
    ['the caller created it', found({ createdBy: ME })],
  ])('sends no completion notification when %s', async (_, row) => {
    db.gift.findUnique.mockResolvedValue(row);
    db.gift.update.mockResolvedValue(gift({ isCompleted: true }));
    await put({ giftId: GIFT, isCompleted: true });
    await flush();
    expect(broadcastCompletion).not.toHaveBeenCalled();
  });

  it('still succeeds when the notification fails', async () => {
    db.gift.findUnique.mockResolvedValue(found());
    db.gift.update.mockResolvedValue(gift({ isCompleted: true }));
    broadcastCompletion.mockRejectedValue(new Error('sse down'));
    expect(
      (await readJson(await put({ giftId: GIFT, isCompleted: true }))).status,
    ).toBe(200);
    await flush();
  });

  it('returns 500 when the database fails', async () => {
    db.gift.findUnique.mockRejectedValue(new Error('db'));
    expect(
      (await readJson(await put({ giftId: GIFT, isCompleted: true }))).status,
    ).toBe(500);
  });
});

describe('PATCH /gifts', () => {
  const patch = (body: Record<string, unknown>) =>
    PATCH(apiRequest('/x', 'PATCH', { giftId: GIFT, name: 'Scarf', ...body }), ctx);

  it('answers 400 when the holiday does not exist', async () => {
    db.holiday.findUnique.mockResolvedValue(null);
    expect((await readJson(await patch({}))).status).toBe(400);
  });

  it('needs a giftId', async () => {
    const { status, body } = await readJson(
      await PATCH(apiRequest('/x', 'PATCH', { name: 'a' }), ctx),
    );
    expect(status).toBe(400);
    expect(body.error).toBe('giftId is required');
  });

  it('validates the edit with the same rules as creating', async () => {
    expect((await readJson(await patch({ name: '' }))).status).toBe(400);
    expect((await readJson(await patch({ price: -2 }))).status).toBe(400);
    expect(db.gift.update).not.toHaveBeenCalled();
  });

  it('answers 400 when the gift is not in this holiday', async () => {
    db.gift.findUnique.mockResolvedValue(null);
    const { status, body } = await readJson(await patch({}));
    expect(status).toBe(400);
    expect(body.error).toBe('Gift not found');
    expect(db.gift.findUnique.mock.calls[0][0].where).toEqual({
      id: GIFT,
      holidayId: HOLIDAY,
    });
  });

  it('writes the edited fields scoped to the holiday and returns the gift', async () => {
    db.gift.findUnique.mockResolvedValue({ assignedTo: null, name: 'Scarf' });
    db.gift.update.mockResolvedValue(
      gift({ name: 'Hat', contact: { name: 'Grace' } }),
    );
    const { status, body } = await readJson(
      await patch({
        name: 'Hat',
        price: 20,
        store: 'Shop',
        notes: 'n',
        product_link: 'https://x.example',
        contact_id: CONTACT,
      }),
    );

    expect(status).toBe(200);
    const { where, data } = db.gift.update.mock.calls[0][0];
    expect(where).toEqual({ id: GIFT, holidayId: HOLIDAY });
    expect(data).toEqual({
      name: 'Hat',
      description: null,
      price: 20,
      store: 'Shop',
      productLink: 'https://x.example',
      notes: 'n',
      contactId: CONTACT,
    });
    expect(body.data.data.recipient).toBe('Grace');
  });

  it('resets omitted optional fields to their defaults', async () => {
    db.gift.findUnique.mockResolvedValue({ assignedTo: null, name: 'Scarf' });
    db.gift.update.mockResolvedValue(gift());
    await patch({ product_link: '' });
    expect(db.gift.update.mock.calls[0][0].data).toMatchObject({
      price: 0,
      productLink: null,
      description: null,
    });
    expect(db.gift.update.mock.calls[0][0].data).not.toHaveProperty('assignedTo');
  });

  it('notifies a newly assigned user', async () => {
    db.gift.findUnique.mockResolvedValue({ assignedTo: null, name: 'Scarf' });
    db.gift.update.mockResolvedValue(gift({ assignedTo: OTHER }));
    await patch({ assigned_to: OTHER });
    await flush();
    expect(broadcastAssignment).toHaveBeenCalledWith(
      OTHER,
      'Me',
      'gift',
      'Scarf',
      GIFT,
      HOLIDAY,
      'Christmas',
    );
  });

  it('tells the previous assignee when the assignment is removed', async () => {
    db.gift.findUnique.mockResolvedValue({ assignedTo: OTHER, name: 'Scarf' });
    db.gift.update.mockResolvedValue(gift());
    await patch({ assigned_to: null });
    await flush();

    expect(db.gift.update.mock.calls[0][0].data.assignedTo).toBeNull();
    expect(broadcastAssignment).not.toHaveBeenCalled();
    expect(broadcastNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: OTHER,
        title: 'Gift Unassigned',
        entityId: GIFT,
        fromUserId: ME,
      }),
    );
  });

  it('sends nothing when the assignee did not change', async () => {
    db.gift.findUnique.mockResolvedValue({ assignedTo: OTHER, name: 'Scarf' });
    db.gift.update.mockResolvedValue(gift());
    await patch({ assigned_to: OTHER });
    await flush();
    expect(broadcastAssignment).not.toHaveBeenCalled();
    expect(broadcastNotification).not.toHaveBeenCalled();
  });

  it('sends nothing when you assign it to yourself', async () => {
    db.gift.findUnique.mockResolvedValue({ assignedTo: null, name: 'Scarf' });
    db.gift.update.mockResolvedValue(gift());
    await patch({ assigned_to: ME });
    await flush();
    expect(broadcastAssignment).not.toHaveBeenCalled();
  });

  it('still succeeds when the notification fails', async () => {
    db.gift.findUnique.mockResolvedValue({ assignedTo: null, name: 'Scarf' });
    db.gift.update.mockResolvedValue(gift());
    broadcastAssignment.mockRejectedValue(new Error('sse down'));
    expect((await readJson(await patch({ assigned_to: OTHER }))).status).toBe(200);
    await flush();
  });

  it('refuses an assignee without access, as creating does', async () => {
    validateAssigneeAccess.mockResolvedValue({ valid: false, error: 'No access' });
    db.gift.findUnique.mockResolvedValue({ assignedTo: null, name: 'Scarf' });
    db.gift.update.mockResolvedValue(gift());
    expect((await readJson(await patch({ assigned_to: OTHER }))).status).toBe(400);
  });

  it('returns 500 when the database fails', async () => {
    db.gift.findUnique.mockRejectedValue(new Error('db'));
    expect((await readJson(await patch({}))).status).toBe(500);
  });
});

describe('DELETE /gifts', () => {
  it('needs a giftId', async () => {
    const { status, body } = await readJson(
      await DELETE(apiRequest('/x', 'DELETE'), ctx),
    );
    expect(status).toBe(400);
    expect(body.error).toBe('giftId parameter is required');
  });

  it('deletes the gift scoped to the holiday', async () => {
    const { status, body } = await readJson(
      await DELETE(apiRequest(`/x?giftId=${GIFT}`, 'DELETE'), ctx),
    );
    expect(status).toBe(200);
    expect(body.data).toEqual({ success: true });
    expect(db.gift.delete).toHaveBeenCalledWith({
      where: { id: GIFT, holidayId: HOLIDAY },
    });
  });

  it('returns 500 when the database fails (including a gift from another holiday)', async () => {
    db.gift.delete.mockRejectedValue(new Error('Record not found'));
    expect(
      (await readJson(await DELETE(apiRequest(`/x?giftId=${GIFT}`, 'DELETE'), ctx)))
        .status,
    ).toBe(500);
  });
});
