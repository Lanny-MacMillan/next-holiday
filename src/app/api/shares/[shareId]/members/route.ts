import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

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

		// Find the share
		const share = await prisma.share.findUnique({
			where: { id: shareId },
		});

		if (!share) {
			return NextResponse.json({ error: "Share not found" }, { status: 404 });
		}

		// Check if user is already a member
		const existingMember = await prisma.shareMember.findUnique({
			where: {
				shareId_userId: {
					shareId,
					userId
				}
			}
		});

		if (existingMember) {
			return NextResponse.json(share);
		}

		// Add user to share members
		await prisma.shareMember.create({
			data: {
				shareId,
				userId,
			}
		});

		// IMPORTANT: Ensure the holiday owner is also a member
		// This fixes the bug where shares don't include the original holiday owner
		const shareWithHoliday = await prisma.share.findUnique({
			where: { id: shareId },
			include: {
				holiday: {
					include: {
						account: true
					}
				},
				members: true
			}
		});

		if (shareWithHoliday) {
			const holidayOwnerUserId = shareWithHoliday.holiday.account.ownerUserId;
			const ownerIsMember = shareWithHoliday.members.some(member => member.userId === holidayOwnerUserId);
			
			if (!ownerIsMember) {
				console.log(`🔧 Adding holiday owner ${holidayOwnerUserId} to share ${shareId}`);
				try {
					await prisma.shareMember.create({
						data: {
							shareId,
							userId: holidayOwnerUserId,
						}
					});
				} catch (error: any) {
					// Ignore if already exists due to race condition
					if (error.code !== 'P2002') {
						console.error('Error adding holiday owner to share:', error);
					}
				}
			}
		}

		// Get updated share with members
		const updatedShare = await prisma.share.findUnique({
			where: { id: shareId },
			include: { members: true }
		});

		return NextResponse.json(updatedShare);
	} catch (error) {
		console.error("Error adding member to share:", error);
		return NextResponse.json(
			{ error: "Failed to add member to share" },
			{ status: 500 }
		);
	}
}
