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
									auth0Sub: true, // Include auth0Sub for frontend comparison
									name: true,
									email: true,
									picture: true,
								},
							},
						},
					},
					owner: { // Include owner user data
						select: {
							id: true,
							auth0Sub: true,
							name: true,
							email: true,
							picture: true,
						},
					},
					holiday: {
						select: {
							id: true,
							holidayType: true,
							name: true,
						},
					},
					invites: {
						select: {
							id: true,
							status: true,
							toEmail: true,
						},
					},
				},
			});

			// Transform the shares to include member user information
			const holidayDisplayNameToKey: Record<string, string> = {
				"Christmas": "christmas",
				"Hanukkah": "hanukkah", 
				"Kwanzaa": "kwanzaa",
				"New Year": "new-year",
				"Valentine's Day": "valentines",
				"Easter": "easter",
				"Halloween": "halloween",
				"Thanksgiving": "thanksgiving",
				"Mother's Day": "mothers-day",
				"Father's Day": "fathers-day",
				"Fourth of July": "fourth-of-july",
				"Birthday": "birthday",
				"Anniversary": "anniversary",
				"Graduation": "graduation",
				"Baby Shower": "baby-shower",
			};

			const transformedShares = shares
				.map((share: any) => {
					// Check if this share has any pending invites
					const pendingInvites = share.invites.filter((invite: any) => invite.status === 'pending');
					const hasPendingInvites = pendingInvites.length > 0;
					
					// If this share only has 1 member (the owner) and no pending invites, don't include it
					// This filters out shares where invites have been declined or expired
					if (share.members.length === 1 && !hasPendingInvites) {
						return null;
					}

					return {
						shareId: share.id,
						holidayKey: holidayDisplayNameToKey[share.holiday.holidayType] || share.holiday.holidayType.toLowerCase().replace(/\s+/g, '-').replace(/'/g, ''),
						ownerUserId: share.owner.auth0Sub, // Use Auth0 sub instead of internal ID
						memberUserIds: share.members.map((m: any) => m.user.auth0Sub), // Use Auth0 subs for backward compatibility
						members: share.members.map((m: any) => ({
							userId: m.user.auth0Sub, // Use Auth0 sub instead of internal ID
							name: m.user.name,
							email: m.user.email,
							picture: m.user.picture,
							joinedAt: m.joinedAt?.toISOString(),
						})),
						hasPendingInvites,
						pendingInviteCount: pendingInvites.length,
						createdAt: share.createdAt.toISOString(),
						updatedAt: share.updatedAt.toISOString(),
					};
				})
				.filter(Boolean); // Remove null entries

			console.log('📤 API Shares Response:', {
				userId,
				shareCount: transformedShares.length,
				shares: transformedShares
			});

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
