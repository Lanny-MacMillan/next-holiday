import { NextRequest, NextResponse } from "next/server";
import { inviteRepository, shareRepository } from "@/utils/mockDb";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { shareId, fromUserId, toUserId, toEmail, holidayKey, message } =
			body;

		if (!shareId || !fromUserId || !holidayKey || (!toUserId && !toEmail)) {
			return NextResponse.json(
				{
					error:
						"Missing required fields: shareId, fromUserId, holidayKey, and either toUserId or toEmail",
				},
				{ status: 400 }
			);
		}

		// Verify share exists
		const share = await shareRepository.findById(shareId);
		if (!share) {
			return NextResponse.json({ error: "Share not found" }, { status: 404 });
		}

		// Create invite
		const invite = await inviteRepository.create({
			shareId,
			fromUserId,
			toUserId,
			toEmail,
			holidayKey,
			message,
		});

		return NextResponse.json(invite);
	} catch (error) {
		console.error("Error creating invite:", error);
		return NextResponse.json(
			{ error: "Failed to create invite" },
			{ status: 500 }
		);
	}
}

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const inbox = searchParams.get("inbox");
		const userId = searchParams.get("userId");

		if (inbox === "1" && userId) {
			const invites = await inviteRepository.findPendingByUserId(userId);
			return NextResponse.json(invites);
		}

		if (userId) {
			const invites = await inviteRepository.findByUserId(userId);
			return NextResponse.json(invites);
		}

		return NextResponse.json(
			{ error: "Missing query parameters" },
			{ status: 400 }
		);
	} catch (error) {
		console.error("Error fetching invites:", error);
		return NextResponse.json(
			{ error: "Failed to fetch invites" },
			{ status: 500 }
		);
	}
}
