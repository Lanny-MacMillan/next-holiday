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
				{ status: 400 },
			);
		}

		// Convert holidayKey to display name for database lookup
		const holidayKeyToDisplayName: Record<string, string> = {
			"christmas": "Christmas",
			"hanukkah": "Hanukkah", 
			"kwanzaa": "Kwanzaa",
			"new-year": "New Year",
			"valentines": "Valentine's Day",
			"easter": "Easter",
			"halloween": "Halloween",
			"thanksgiving": "Thanksgiving",
			"mothers-day": "Mother's Day",
			"fathers-day": "Father's Day",
			"fourth-of-july": "Fourth of July",
			"birthday": "Birthday",
			"anniversary": "Anniversary",
			"graduation": "Graduation",
			"baby-shower": "Baby Shower",
		};

		const holidayDisplayName = holidayKeyToDisplayName[holidayKey] || holidayKey;

		// First, find the holiday by holidayType (using display name)
		const holiday = await prisma.holiday.findFirst({
			where: { holidayType: holidayDisplayName },
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
				{ status: 404 },
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
			{ status: 500 },
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
			// Look up the actual user ID from the Auth0 sub
			const user = await prisma.user.findUnique({
				where: { auth0Sub: userId },
			});

			if (!user) {
				return NextResponse.json([]);
			}

			// Find all shares where user is owner or member
			const shares = await prisma.share.findMany({
				where: {
					OR: [
						{ ownerUserId: user.id },
						{ members: { some: { userId: user.id } } },
					],
				},
				include: {
					members: {
						include: {
							user: {
								select: {
									id: true,
									name: true,
									email: true,
									picture: true,
								},
							},
						},
					},
					holiday: {
						select: {
							id: true,
							holidayType: true,
							name: true,
						},
					},
				},
			});

			// Transform the shares to match the expected format
			const transformedShares = shares.map((share) => ({
				shareId: share.id,
				holidayKey: share.holiday.holidayType,
				ownerUserId: share.ownerUserId,
				memberUserIds: share.members.map((m) => m.userId),
				createdAt: share.createdAt.toISOString(),
				updatedAt: share.updatedAt.toISOString(),
			}));

			return NextResponse.json(transformedShares);
		}

		return NextResponse.json(
			{ error: "Missing query parameters" },
			{ status: 400 },
		);
	} catch (error) {
		console.error("Error fetching shares:", error);
		return NextResponse.json(
			{ error: "Failed to fetch shares" },
			{ status: 500 },
		);
	}
}
