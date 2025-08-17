import { NextRequest, NextResponse } from "next/server";
import { shareRepository } from "@/utils/mockDb";

export async function POST(
	request: NextRequest,
	{ params }: { params: { shareId: string } }
) {
	try {
		const { shareId } = params;
		const body = await request.json();
		const { userId } = body;

		if (!userId) {
			return NextResponse.json(
				{ error: "Missing required field: userId" },
				{ status: 400 }
			);
		}

		const share = await shareRepository.addMember(shareId, userId);
		return NextResponse.json(share);
	} catch (error) {
		console.error("Error adding member to share:", error);
		return NextResponse.json(
			{ error: "Failed to add member to share" },
			{ status: 500 }
		);
	}
}
