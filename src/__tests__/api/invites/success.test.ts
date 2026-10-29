/** @jest-environment node */
const getCurrentUser = jest.fn();
jest.mock('@/lib/auth', () => ({
  getCurrentUser: (...a: unknown[]) => getCurrentUser(...a),
  getVerifiedClaims: jest.fn(),
  requireAuth: jest.fn(),
}));
jest.mock('@/lib/prisma', () => ({
  prisma: require('@/__tests__/support/api').prismaMock,
}));
const broadcastInvite = jest.fn();
jest.mock('@/lib/realTimeNotifications', () => ({
  broadcastInvite: (...a: unknown[]) => broadcastInvite(...a),
}));

import {
  apiRequest,
  prismaMock as db,
  readJson,
  resetPrismaMock,
  routeParams,
} from '@/__tests__/support/api';
import { GET, POST } from '@/app/api/invites/route';
import { POST as accept } from '@/app/api/invites/[inviteId]/accept/route';

const me = {
  id: 'me-id',
  auth0Sub: 'auth0|me',
  email: 'me@x.com',
  verifiedEmail: 'me@x.com',
  name: 'Me',
};

beforeEach(() => {
  resetPrismaMock();
  getCurrentUser.mockReset().mockResolvedValue(me);
  broadcastInvite.mockReset().mockResolvedValue(true);
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

describe('POST /api/invites', () => {
  const send = async (over: Record<string, unknown> = {}) =>
    readJson(
      await POST(
        apiRequest('/api/invites', 'POST', {
          shareId: 's1',
          holidayKey: 'new-year',
          toEmail: 'new@x.com',
          ...over,
        }),
      ),
    );

  beforeEach(() => {
    db.share.findUnique.mockResolvedValue({
      id: 's1',
      ownerUserId: 'me-id',
      members: [],
    });
    db.invite.findFirst.mockResolvedValue(null);
    db.user.findFirst.mockResolvedValue(null);
    db.invite.create.mockImplementation(
      async ({ data }: { data: Record<string, unknown> }) => ({
        id: 'inv1',
        ...data,
      }),
    );
  });

  it('keeps an email invite for someone who has not signed up', async () => {
    const { status, body } = await send();

    expect(status).toBe(200);
    expect(body).toMatchObject({
      inviteStatus: 'new_invite',
      userLookupStatus: 'unregistered_email',
      toEmail: 'new@x.com',
      fromUserId: 'me-id',
      status: 'pending',
      message: "Invite sent to new@x.com! They'll see it when they sign up.",
    });
    expect(broadcastInvite).not.toHaveBeenCalled();
  });

  it('turns an email into a user invite for a registered user and notifies them live', async () => {
    db.user.findFirst.mockResolvedValue({ id: 'u2' });
    const { body } = await send({ message: 'come along' });

    expect(body).toMatchObject({
      userLookupStatus: 'registered_user',
      toUserId: 'u2',
    });
    expect(body.toEmail).toBeUndefined();
    expect(body.message).toBe(
      "Invite sent to new@x.com! They'll receive real-time notifications.",
    );
    expect(broadcastInvite).toHaveBeenCalledWith(
      'u2',
      'Me',
      'New Year',
      'inv1',
      's1',
      'come along',
    );
  });

  it('invites a user id directly', async () => {
    const { body } = await send({ toEmail: undefined, toUserId: 'u3' });
    expect(body).toMatchObject({
      toUserId: 'u3',
      inviteStatus: 'new_invite',
      message: 'Invite sent successfully',
    });
    expect(db.user.findFirst).not.toHaveBeenCalled();
  });

  it('describes a second invite to someone who declined before', async () => {
    db.invite.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'old', status: 'declined' });
    const { body } = await send();
    expect(body).toMatchObject({
      inviteStatus: 'reinvite_after_decline',
      message: 'Reinvite sent successfully',
    });
  });

  it('refuses a duplicate pending invite', async () => {
    db.invite.findFirst.mockResolvedValueOnce({ id: 'dup' });
    const { status, body } = await send();

    expect(status).toBe(409);
    expect(body.inviteStatus).toBe('duplicate_pending');
    expect(db.invite.create).not.toHaveBeenCalled();
  });

  it('refuses to invite yourself, including via your own email', async () => {
    expect((await send({ toEmail: undefined, toUserId: 'me-id' })).status).toBe(400);

    db.user.findFirst.mockResolvedValue({ id: 'me-id' });
    expect((await send({ toEmail: 'me@x.com' })).body.error).toBe(
      'You cannot invite yourself',
    );
    expect(db.invite.create).not.toHaveBeenCalled();
  });

  it('still creates the invite when the live notification fails', async () => {
    db.user.findFirst.mockResolvedValue({ id: 'u2' });
    broadcastInvite.mockRejectedValue(new Error('sse down'));
    expect((await send()).status).toBe(200);
  });

  it('requires a share, a holiday key and a recipient', async () => {
    expect((await send({ shareId: undefined })).status).toBe(400);
    expect((await send({ holidayKey: undefined })).status).toBe(400);
    expect((await send({ toEmail: undefined })).status).toBe(400);
  });

  it('is 404 for an unknown share and 500 on a db failure', async () => {
    db.share.findUnique.mockResolvedValueOnce(null);
    expect((await send()).status).toBe(404);

    db.invite.create.mockRejectedValue(new Error('db down'));
    expect((await send()).status).toBe(500);
  });
});

describe('GET /api/invites', () => {
  const get = async (query = '') =>
    readJson(await GET(apiRequest(`/api/invites${query}`)));
  const whereOf = () => db.invite.findMany.mock.calls[0][0].where;

  beforeEach(() => {
    db.user.findUnique.mockResolvedValue({ id: 'me-id' });
    db.invite.findMany.mockResolvedValue([{ id: 'i1' }]);
  });

  it('inbox: pending invites to the user, by id, auth0 sub and verified email', async () => {
    const { body } = await get('?inbox=1');

    expect(body).toEqual([{ id: 'i1' }]);
    expect(whereOf()).toEqual({
      OR: [{ toUserId: 'me-id' }, { toEmail: 'auth0|me' }, { toEmail: 'me@x.com' }],
      status: 'pending',
    });
  });

  it('inbox: leaves out the email match when it is not verified', async () => {
    getCurrentUser.mockResolvedValue({ ...me, verifiedEmail: undefined });
    await get('?inbox=1');
    expect(whereOf().OR).toEqual([{ toUserId: 'me-id' }, { toEmail: 'auth0|me' }]);
  });

  it('inbox: still searches by email when the user lookup fails', async () => {
    db.user.findUnique.mockRejectedValue(new Error('db down'));
    await get('?inbox=1');
    expect(whereOf().OR).toEqual([{ toEmail: 'auth0|me' }, { toEmail: 'me@x.com' }]);
  });

  it('outgoing: invites the user sent that they have not dismissed', async () => {
    await get('?outgoing=1');
    expect(whereOf()).toEqual({ fromUserId: 'me-id', senderDismissedAt: null });
  });

  it('outgoing: 404 when the user is not in the database', async () => {
    db.user.findUnique.mockResolvedValue(null);
    expect((await get('?outgoing=1')).status).toBe(404);
  });

  it('default: everything sent to or from the user', async () => {
    await get();
    expect(whereOf().OR).toEqual([
      { fromUserId: 'me-id' },
      { toUserId: 'me-id' },
      { toEmail: 'auth0|me' },
      { toEmail: 'me@x.com' },
    ]);
  });

  it('refuses a query for another user', async () => {
    expect((await get('?userId=auth0|other')).status).toBe(403);
  });

  it('is 500 on a db failure', async () => {
    db.invite.findMany.mockRejectedValue(new Error('db down'));
    expect((await get('?inbox=1')).status).toBe(500);
  });
});

describe('POST /api/invites/[inviteId]/accept', () => {
  const invite = {
    id: 'inv1',
    shareId: 's1',
    toUserId: 'me-id',
    toEmail: null,
    fromUserId: 'u2',
    status: 'pending',
  };
  const run = async () =>
    readJson(
      await accept(
        apiRequest('/api/invites/inv1/accept', 'POST'),
        routeParams({ inviteId: 'inv1' }),
      ),
    );

  const person = (n: number) => ({
    id: `u${n}`,
    auth0Sub: `auth0|${n}`,
    name: `P${n}`,
    email: `p${n}@x.com`,
    picture: null,
  });
  const sharePayload = {
    id: 's1',
    holiday: { id: 'h1', holidayType: "Valentine's Day", name: 'V' },
    owner: person(2),
    members: [
      { user: person(2), joinedAt: 'then' },
      { user: person(1), joinedAt: 'now' },
    ],
  };

  beforeEach(() => {
    db.invite.findUnique.mockResolvedValue(invite);
    db.invite.update.mockResolvedValue({ ...invite, status: 'accepted' });
    db.shareMember.findUnique.mockResolvedValue(null);
    db.share.findUnique.mockResolvedValue(sharePayload);
    db.account.findFirst.mockResolvedValue({ id: 'acc1' });
    db.holiday.findFirst.mockResolvedValue(null);
  });

  it('marks the invite accepted and joins the share, crediting the sender', async () => {
    const { status, body } = await run();

    expect(status).toBe(200);
    const update = db.invite.update.mock.calls[0][0];
    expect(update.where).toEqual({ id: 'inv1' });
    expect(update.data).toMatchObject({ status: 'accepted' });
    expect(update.data.respondedAt).toBeInstanceOf(Date);
    expect(db.shareMember.create).toHaveBeenCalledWith({
      data: { shareId: 's1', userId: 'me-id', invitedBy: 'u2' },
    });
    expect(body.invite.status).toBe('accepted');
  });

  it('returns the share in the shape the client expects', async () => {
    const { body } = await run();
    expect(body.share).toMatchObject({
      shareId: 's1',
      holidayKey: 'valentine-s-day',
      memberUserIds: ['auth0|2', 'auth0|1'],
    });
    expect(body.share.members[1]).toEqual({
      userId: 'auth0|1',
      name: 'P1',
      email: 'p1@x.com',
      picture: null,
      joinedAt: 'now',
    });
  });

  it('replaces the user’s own holiday of the same type, which cascades its data', async () => {
    db.holiday.findFirst.mockResolvedValue({ id: 'my-old-holiday' });
    await run();

    expect(db.holiday.findFirst).toHaveBeenCalledWith({
      where: { accountId: 'acc1', holidayType: "Valentine's Day" },
    });
    expect(db.holiday.delete).toHaveBeenCalledWith({
      where: { id: 'my-old-holiday' },
    });
  });

  it('never deletes the holiday being shared', async () => {
    db.holiday.findFirst.mockResolvedValue({ id: 'h1' });
    await run();
    expect(db.holiday.delete).not.toHaveBeenCalled();
  });

  it('works for a user with no account of their own', async () => {
    db.account.findFirst.mockResolvedValue(null);
    expect((await run()).status).toBe(200);
    expect(db.holiday.findFirst).not.toHaveBeenCalled();
  });

  it('does not add a second membership', async () => {
    db.shareMember.findUnique.mockResolvedValue({ shareId: 's1', userId: 'me-id' });
    expect((await run()).status).toBe(200);
    expect(db.shareMember.create).not.toHaveBeenCalled();
    expect(db.holiday.delete).not.toHaveBeenCalled();
  });

  it('is 404 when the share disappeared (after the invite is already marked accepted)', async () => {
    db.share.findUnique.mockResolvedValueOnce(null);
    expect((await run()).status).toBe(404);
  });

  it('answers with a null share if it cannot be reloaded', async () => {
    db.share.findUnique
      .mockResolvedValueOnce({ holiday: { id: 'h1', holidayType: 'Easter' } })
      .mockResolvedValueOnce(null);
    expect((await run()).body.share).toBeNull();
  });

  it('refuses an invite that is not pending, or is the user’s own', async () => {
    db.invite.findUnique.mockResolvedValue({ ...invite, status: 'declined' });
    expect((await run()).status).toBe(400);

    db.invite.findUnique.mockResolvedValue({ ...invite, fromUserId: 'me-id' });
    expect((await run()).body.error).toBe('You cannot accept your own invite');
    expect(db.invite.update).not.toHaveBeenCalled();
  });

  it('is 404 for an unknown invite and 500 on a db failure', async () => {
    db.invite.findUnique.mockResolvedValue(null);
    expect((await run()).status).toBe(404);

    db.invite.findUnique.mockResolvedValue(invite);
    db.invite.update.mockRejectedValue(new Error('db down'));
    expect((await run()).status).toBe(500);
  });
});
