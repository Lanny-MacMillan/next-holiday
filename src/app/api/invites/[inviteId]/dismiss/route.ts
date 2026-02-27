import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ inviteId: string }> },
) {
	try {
		const { inviteId } = await params;

		// Find the invite
		const invite = await prisma.invite.findUnique({
			where: { id: inviteId },
		});

		if (!invite) {
			return NextResponse.json({ error: "Invite not found" }, { status: 404 });
		}

		// Update invite to mark as dismissed by sender
		const updatedInvite = await prisma.invite.update({
			where: { id: inviteId },
			data: {
				senderDismissedAt: new Date(),
			},
		});

		return NextResponse.json(updatedInvite);
	} catch (error) {
		console.error("Error dismissing invite:", error);
		return NextResponse.json(
			{ error: "Failed to dismiss invite" },
			{ status: 500 },
		);
	}
}