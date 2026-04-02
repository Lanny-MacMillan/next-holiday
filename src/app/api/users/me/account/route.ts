import { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { toPlain } from '@/lib/json';
import { ok, serverError } from '@/lib/http';

// GET /api/users/me/account - Get or create user's first account
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    // Find user's first account or create one
    let account = await prisma.account.findFirst({
      where: {
        members: {
          some: {
            userId: user.id,
          },
        },
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // If no account exists, create one
    if (!account) {
      // Create account and add member in a single transaction
      account = await prisma.$transaction(async tx => {
        const newAccount = await tx.account.create({
          data: {
            id: uuidv4(),
            name: `${user.name || user.email || 'My Family'}'s Account`,
            ownerUserId: user.id,
          },
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

        // Add user as member of the account
        await tx.accountMember.create({
          data: {
            accountId: newAccount.id,
            userId: user.id,
            role: 'owner',
          },
        });

        return newAccount;
      });
    } else {
      console.log('Found existing account:', account.id);
    }

    return ok(toPlain(account));
  } catch (error) {
    console.error('Error getting user account:', error);
    return serverError('Failed to get user account');
  }
}
