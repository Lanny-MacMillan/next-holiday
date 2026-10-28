/** @jest-environment node */
import { NextRequest } from 'next/server';

const requireAuth = jest.fn();
jest.mock('@/lib/auth', () => ({
  requireAuth: (...a: unknown[]) => requireAuth(...a),
}));

const db = {
  notification: { findMany: jest.fn() },
  invite: { findMany: jest.fn() },
};
jest.mock('@/lib/prisma', () => ({ prisma: db }));

import { GET } from '@/app/api/notifications/route';

const user = { id: 'me-id', auth0Sub: 'auth0|me', email: 'me@x.com' };
const inviteWhere = () => db.invite.findMany.mock.calls[0][0].where.OR;

beforeEach(() => {
  jest.clearAllMocks();
  db.notification.findMany.mockResolvedValue([]);
  db.invite.findMany.mockResolvedValue([]);
});

describe('GET /api/notifications pending invites', () => {
  it('matches invites by user id and by a verified email', async () => {
    requireAuth.mockResolvedValue({ ...user, verifiedEmail: 'me@x.com' });
    await GET(new NextRequest('http://localhost/api/notifications'));
    expect(inviteWhere()).toEqual([{ toUserId: 'me-id' }, { toEmail: 'me@x.com' }]);
  });

  it('only matches by user id when the email is unverified', async () => {
    requireAuth.mockResolvedValue({ ...user, verifiedEmail: null });
    await GET(new NextRequest('http://localhost/api/notifications'));
    expect(inviteWhere()).toEqual([{ toUserId: 'me-id' }]);
  });
});
