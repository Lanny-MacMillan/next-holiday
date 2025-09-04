import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

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

		// First, find the holiday by holidayType (holidayKey)
		const holiday = await prisma.holiday.findFirst({
			where: { holidayType: holidayKey },
		});

		if (!holiday) {
			return NextResponse.json({ error: "Holiday not found" }, { status: 404 });
		}

		// Check if share already exists for this holiday
		const existingShare = await prisma.share.findFirst({
			where: { holidayId: holiday.id },
		});

		if (existingShare) {
			return NextResponse.json(existingShare);
		}

		// Look up the actual user ID from the Auth0 sub
		const ownerUser = await prisma.user.findUnique({
			where: { auth0Sub: ownerUserId },
		});

		if (!ownerUser) {
			return NextResponse.json(
				{ error: "Owner user not found" },
				{ status: 404 }
			);
		}

		// Create new share using the internal user ID
		const share = await prisma.share.create({
			data: {
				holidayId: holiday.id,
				ownerUserId: ownerUser.id, // Use internal user ID, not Auth0 sub
			},
		});

		// Add owner as first member using the internal user ID
		await prisma.shareMember.create({
			data: {
				shareId: share.id,
				userId: ownerUser.id, // Use internal user ID, not Auth0 sub
			},
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
			// Find holiday by holidayType, then find share
			const holiday = await prisma.holiday.findFirst({
				where: { holidayType: holidayKey },
			});

			if (!holiday) {
				return NextResponse.json(null);
			}

			const share = await prisma.share.findFirst({
				where: { holidayId: holiday.id },
			});

			if (!share) {
				return NextResponse.json(null);
			}

			return NextResponse.json(share);
		}

		if (userId) {
			// Find all shares where user is owner or member
			const shares = await prisma.share.findMany({
				where: {
					OR: [{ ownerUserId: userId }, { members: { some: { userId } } }],
				},
			});
			return NextResponse.json(shares);
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
