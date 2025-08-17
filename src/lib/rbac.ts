import { prisma } from "./prisma";

export async function requireAccountAccess(
	accountId: string,
	userId: string,
	roles: Array<"owner" | "admin" | "member"> = ["owner", "admin", "member"]
) {
	const m = await prisma.accountMember.findUnique({
		where: { accountId_userId: { accountId, userId } },
		select: { role: true },
	});
	if (!m || !roles.includes(m.role as any)) {
		throw new Response(JSON.stringify({ success: false, error: "Forbidden" }), {
			status: 403,
		});
	}
}

export async function requireAccountOwner(accountId: string, userId: string) {
	return requireAccountAccess(accountId, userId, ["owner"]);
}

export async function requireAccountAdmin(accountId: string, userId: string) {
	return requireAccountAccess(accountId, userId, ["owner", "admin"]);
}
