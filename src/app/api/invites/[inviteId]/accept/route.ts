import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ inviteId: string }> }
) {
	try {
		const { inviteId } = await params;
		console.log("[accept] inviteId:", inviteId);

		// Find the invite
		const invite = await prisma.invite.findUnique({
			where: { id: inviteId },
		});
		console.log("[accept] invite:", invite);

		if (!invite) {
			return NextResponse.json({ error: "Invite not found" }, { status: 404 });
		}

		if (invite.status !== "pending") {
			return NextResponse.json(
				{ error: "Invite is not pending" },
				{ status: 400 }
			);
		}

		// Update invite status to accepted
		const updatedInvite = await prisma.invite.update({
			where: { id: inviteId },
			data: {
				status: "accepted",
				respondedAt: new Date(),
			},
		});
		console.log("[accept] updatedInvite:", updatedInvite);

		// Resolve the internal user ID to add as a share member
		let resolvedUserId: string | null = invite.toUserId ?? null;
		if (!resolvedUserId && invite.toEmail) {
			const toUser = await prisma.user.findFirst({
				where: {
					OR: [{ email: invite.toEmail }, { auth0Sub: invite.toEmail }],
				},
				select: { id: true },
			});
			resolvedUserId = toUser?.id ?? null;
		}
		console.log("[accept] resolvedUserId:", resolvedUserId);

		if (!resolvedUserId) {
			return NextResponse.json(
				{ error: "Invite target user not found" },
				{ status: 400 }
			);
		}

		// Avoid duplicate membership in share
		const existingMember = await prisma.shareMember.findUnique({
			where: {
				shareId_userId: { shareId: invite.shareId, userId: resolvedUserId },
			},
		});
		console.log("[accept] existing share member:", !!existingMember);

		if (!existingMember) {
			await prisma.shareMember.create({
				data: {
					shareId: invite.shareId,
					userId: resolvedUserId,
					invitedBy: invite.fromUserId,
				},
			});
			console.log("[accept] created ShareMember for", resolvedUserId);
		}

		// Get updated share
		const share = await prisma.share.findUnique({
			where: { id: invite.shareId },
			include: { members: true },
		});
		console.log(
			"[accept] final share members:",
			share?.members?.map((m) => m.userId)
		);

		return NextResponse.json({ invite: updatedInvite, share });
	} catch (error) {
		console.error("Error accepting invite:", error);
		return NextResponse.json(
			{ error: "Failed to accept invite" },
			{ status: 500 }
		);
	}
}
