import { NextRequest, NextResponse } from "next/server";
import { inviteRepository } from "@/utils/mockDb";

export async function POST(
	request: NextRequest,
	{ params }: { params: { inviteId: string } }
) {
	try {
		const { inviteId } = params;

		const result = await inviteRepository.accept(inviteId);
		return NextResponse.json(result);
	} catch (error) {
		console.error("Error accepting invite:", error);
		return NextResponse.json(
			{ error: "Failed to accept invite" },
			{ status: 500 }
		);
	}
}
