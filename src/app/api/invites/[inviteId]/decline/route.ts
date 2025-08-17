import { NextRequest, NextResponse } from "next/server";
import { inviteRepository } from "@/utils/mockDb";

export async function POST(
	request: NextRequest,
	{ params }: { params: { inviteId: string } }
) {
	try {
		const { inviteId } = params;

		const invite = await inviteRepository.decline(inviteId);
		return NextResponse.json(invite);
	} catch (error) {
		console.error("Error declining invite:", error);
		return NextResponse.json(
			{ error: "Failed to decline invite" },
			{ status: 500 }
		);
	}
}
