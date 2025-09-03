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

		// Update invite status to declined
		const updatedInvite = await prisma.invite.update({
			where: { id: inviteId },
			data: {
				status: "declined",
				respondedAt: new Date(),
			},
		});

		return NextResponse.json(updatedInvite);
	} catch (error) {
		console.error("Error declining invite:", error);
		return NextResponse.json(
			{ error: "Failed to decline invite" },
			{ status: 500 }
		);
	}
}
