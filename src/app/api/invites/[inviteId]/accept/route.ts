import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";
import { requireAuth } from "@/lib/auth";

const prisma = new PrismaClient();

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ inviteId: string }> },
) {
	try {
		// Get the currently logged-in user
		const currentUser = await requireAuth(request);
		const { inviteId } = await params;

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
				{ status: 400 },
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

		// Use the currently logged-in user's ID
		const actualUserId = currentUser.id;

		// Check if user is already a member
		const existingMember = await prisma.shareMember.findUnique({
			where: {
				shareId_userId: {
					shareId: invite.shareId,
					userId: actualUserId,
				},
			},
		});

		if (!existingMember) {
			await prisma.shareMember.create({
				data: {
					shareId: invite.shareId,
					userId: actualUserId,
					invitedBy: invite.fromUserId,
				},
			});
		}

		// Get updated share
		const share = await prisma.share.findUnique({
			where: { id: invite.shareId },
			include: { members: true },
		});

		return NextResponse.json({ invite: updatedInvite, share });
	} catch (error) {
		console.error("Error accepting invite:", error);
		return NextResponse.json(
			{ error: "Failed to accept invite" },
			{ status: 500 },
		);
	}
}
