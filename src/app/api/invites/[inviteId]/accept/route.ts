import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export async function POST(
	request: NextRequest,
	{ params }: { params: { inviteId: string } }
) {
	try {
		const { inviteId } = params;

		// Find the invite
		const invite = await prisma.invite.findUnique({
			where: { id: inviteId },
		});

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

		// Add user to share members
		const userId = invite.toUserId || invite.toEmail;
		if (userId) {
			await prisma.shareMember.create({
				data: {
					shareId: invite.shareId,
					userId: userId,
					invitedBy: invite.fromUserId,
				}
			});
		}

		// Get updated share
		const share = await prisma.share.findUnique({
			where: { id: invite.shareId },
			include: { members: true }
		});

		return NextResponse.json({ invite: updatedInvite, share });
	} catch (error) {
		console.error("Error accepting invite:", error);
		return NextResponse.json(
			{ error: "Failed to accept invite" },
			{ status: 500 }
		);
	}
}
