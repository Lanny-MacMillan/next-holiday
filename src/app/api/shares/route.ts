import { NextRequest, NextResponse } from "next/server";
import { shareRepository } from "@/utils/mockDb";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { holidayKey, ownerUserId } = body;

		if (!holidayKey || !ownerUserId) {
			return NextResponse.json(
				{ error: "Missing required fields: holidayKey, ownerUserId" },
				{ status: 400 }
			);
		}

		// Check if share already exists for this holiday
		const existingShare = await shareRepository.findByHolidayKey(holidayKey);
		if (existingShare) {
			return NextResponse.json(existingShare);
		}

		// Create new share
		const share = await shareRepository.create({
			holidayKey,
			ownerUserId,
			memberUserIds: [ownerUserId], // Owner is automatically a member
		});

		return NextResponse.json(share);
	} catch (error) {
		console.error("Error creating share:", error);
		return NextResponse.json(
			{ error: "Failed to create share" },
			{ status: 500 }
		);
	}
}

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const holidayKey = searchParams.get("holidayKey");
		const userId = searchParams.get("userId");

		if (holidayKey) {
			const share = await shareRepository.findByHolidayKey(holidayKey);
			if (!share) {
				return NextResponse.json(null);
			}
			return NextResponse.json(share);
		}

		if (userId) {
			// For now, return all shares where user is owner or member
			// In a real implementation, you'd have a method to find shares by user
			return NextResponse.json([]);
		}

		return NextResponse.json(
			{ error: "Missing query parameters" },
			{ status: 400 }
		);
	} catch (error) {
		console.error("Error fetching shares:", error);
		return NextResponse.json(
			{ error: "Failed to fetch shares" },
			{ status: 500 }
		);
	}
}
