import { prisma } from "./prisma";
import { forbidden } from "./http";

export type MemberRole = "owner" | "admin" | "member";

export interface AccountMember {
	accountId: string;
	userId: string;
	role: MemberRole;
	invitedBy?: string | null;
	createdAt: Date;
}

/**
 * Check if user has access to an account with specified roles
 * Throws 403 Forbidden if access is denied
 */
export async function requireAccountAccess(
	accountId: string,
	userId: string,
	roles: MemberRole[] = ["owner", "admin", "member"]
): Promise<AccountMember> {
	const member = await prisma.accountMember.findUnique({
		where: {
			accountId_userId: {
				accountId,
				userId,
			},
		},
	});

	if (!member) {
		throw forbidden("Access denied: User is not a member of this account");
	}

	if (!roles.includes(member.role)) {
		throw forbidden(
			`Access denied: User role '${
				member.role
			}' is not sufficient. Required: ${roles.join(", ")}`
		);
	}

	return member;
}

/**
 * Check if user is the owner of an account
 */
export async function requireAccountOwner(
	accountId: string,
	userId: string
): Promise<AccountMember> {
	return requireAccountAccess(accountId, userId, ["owner"]);
}

/**
 * Check if user is an admin or owner of an account
 */
export async function requireAccountAdmin(
	accountId: string,
	userId: string
): Promise<AccountMember> {
	return requireAccountAccess(accountId, userId, ["owner", "admin"]);
}

/**
 * Check if user has any access to an account (owner, admin, or member)
 */
export async function requireAccountMember(
	accountId: string,
	userId: string
): Promise<AccountMember> {
	return requireAccountAccess(accountId, userId, ["owner", "admin", "member"]);
}

/**
 * Get user's role in an account (returns null if not a member)
 */
export async function getUserAccountRole(
	accountId: string,
	userId: string
): Promise<MemberRole | null> {
	const member = await prisma.accountMember.findUnique({
		where: {
			accountId_userId: {
				accountId,
				userId,
			},
		},
		select: {
			role: true,
		},
	});

	return member?.role || null;
}

/**
 * Check if user has a specific role in an account
 */
export async function hasAccountRole(
	accountId: string,
	userId: string,
	role: MemberRole
): Promise<boolean> {
	const userRole = await getUserAccountRole(accountId, userId);

	if (!userRole) return false;

	const roleHierarchy: Record<MemberRole, number> = {
		owner: 3,
		admin: 2,
		member: 1,
	};

	return roleHierarchy[userRole] >= roleHierarchy[role];
}
