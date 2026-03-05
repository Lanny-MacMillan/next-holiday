import { HolidayShare } from '@/store/slices/sharesSlice';
import { Invite } from '@/store/slices/invitesSlice';

// In-memory storage
let shares: HolidayShare[] = [];
let invites: Invite[] = [];

// Database interfaces for easy replacement later
export interface ShareRepository {
  create(
    share: Omit<HolidayShare, 'shareId' | 'createdAt' | 'updatedAt'>,
  ): Promise<HolidayShare>;
  findByHolidayKey(holidayKey: string): Promise<HolidayShare | null>;
  findById(shareId: string): Promise<HolidayShare | null>;
  update(share: HolidayShare): Promise<HolidayShare>;
  addMember(shareId: string, userId: string): Promise<HolidayShare>;
}

export interface InviteRepository {
  create(
    invite: Omit<Invite, 'inviteId' | 'status' | 'createdAt' | 'respondedAt'>,
  ): Promise<Invite>;
  findById(inviteId: string): Promise<Invite | null>;
  findByUserId(userId: string): Promise<Invite[]>;
  findPendingByUserId(userId: string): Promise<Invite[]>;
  update(invite: Invite): Promise<Invite>;
  accept(inviteId: string): Promise<{ invite: Invite; share: HolidayShare }>;
  decline(inviteId: string): Promise<Invite>;
}

// Mock implementations
export class MockShareRepository implements ShareRepository {
  async create(
    shareData: Omit<HolidayShare, 'shareId' | 'createdAt' | 'updatedAt'>,
  ): Promise<HolidayShare> {
    const share: HolidayShare = {
      ...shareData,
      shareId: this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    shares.push(share);
    return share;
  }

  async findByHolidayKey(holidayKey: string): Promise<HolidayShare | null> {
    return shares.find(share => share.holidayKey === holidayKey) || null;
  }

  async findById(shareId: string): Promise<HolidayShare | null> {
    return shares.find(share => share.shareId === shareId) || null;
  }

  async update(share: HolidayShare): Promise<HolidayShare> {
    const index = shares.findIndex(s => s.shareId === share.shareId);
    if (index === -1) {
      throw new Error('Share not found');
    }

    const updatedShare = {
      ...share,
      updatedAt: new Date().toISOString(),
    };

    shares[index] = updatedShare;
    return updatedShare;
  }

  async addMember(shareId: string, userId: string): Promise<HolidayShare> {
    const share = await this.findById(shareId);
    if (!share) {
      throw new Error('Share not found');
    }

    if (!share.memberUserIds.includes(userId)) {
      share.memberUserIds.push(userId);
      return await this.update(share);
    }

    return share;
  }

  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }
}

export class MockInviteRepository implements InviteRepository {
  async create(
    inviteData: Omit<Invite, 'inviteId' | 'status' | 'createdAt' | 'respondedAt'>,
  ): Promise<Invite> {
    const invite: Invite = {
      ...inviteData,
      inviteId: this.generateId(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    invites.push(invite);
    return invite;
  }

  async findById(inviteId: string): Promise<Invite | null> {
    return invites.find(invite => invite.inviteId === inviteId) || null;
  }

  async findByUserId(userId: string): Promise<Invite[]> {
    return invites.filter(
      invite =>
        invite.fromUserId === userId ||
        invite.toUserId === userId ||
        invite.toEmail === userId,
    );
  }

  async findPendingByUserId(userId: string): Promise<Invite[]> {
    return invites.filter(
      invite =>
        (invite.toUserId === userId || invite.toEmail === userId) &&
        invite.status === 'pending',
    );
  }

  async update(invite: Invite): Promise<Invite> {
    const index = invites.findIndex(i => i.inviteId === invite.inviteId);
    if (index === -1) {
      throw new Error('Invite not found');
    }

    invites[index] = invite;
    return invite;
  }

  async accept(inviteId: string): Promise<{ invite: Invite; share: HolidayShare }> {
    const invite = await this.findById(inviteId);
    if (!invite) {
      throw new Error('Invite not found');
    }

    if (invite.status !== 'pending') {
      throw new Error('Invite is not pending');
    }

    // Update invite status
    const updatedInvite: Invite = {
      ...invite,
      status: 'accepted',
      respondedAt: new Date().toISOString(),
    };
    await this.update(updatedInvite);

    // Add user to share
    const shareRepo = new MockShareRepository();
    const share = await shareRepo.addMember(
      invite.shareId,
      invite.toUserId || invite.toEmail || '',
    );

    return { invite: updatedInvite, share };
  }

  async decline(inviteId: string): Promise<Invite> {
    const invite = await this.findById(inviteId);
    if (!invite) {
      throw new Error('Invite not found');
    }

    if (invite.status !== 'pending') {
      throw new Error('Invite is not pending');
    }

    const updatedInvite: Invite = {
      ...invite,
      status: 'declined',
      respondedAt: new Date().toISOString(),
    };

    return await this.update(updatedInvite);
  }

  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }
}

// Export repository instances
export const shareRepository = new MockShareRepository();
export const inviteRepository = new MockInviteRepository();

// Utility functions for testing and debugging
export const clearMockData = () => {
  shares = [];
  invites = [];
};

export const getMockData = () => ({
  shares: [...shares],
  invites: [...invites],
});
