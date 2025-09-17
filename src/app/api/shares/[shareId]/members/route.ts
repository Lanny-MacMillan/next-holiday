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
					userId,
				},
			},
		});

		if (existingMember) {
			// Return the complete share with user data
			const completeShare = await prisma.share.findUnique({
				where: { id: shareId },
				include: {
					holiday: {
						select: {
							id: true,
							holidayType: true,
						},
					},
					members: {
						include: {
							user: {
								select: {
									id: true,
									name: true,
									picture: true,
									email: true,
								},
							},
						},
					},
					owner: {
						select: {
							id: true,
							name: true,
							picture: true,
							email: true,
						},
					},
				},
			});
			return NextResponse.json(completeShare);
		}

		// Add user to share members
		await prisma.shareMember.create({
			data: {
				shareId,
				userId,
			},
		});

		// Get updated share with members and user data
		const updatedShare = await prisma.share.findUnique({
			where: { id: shareId },
			include: {
				holiday: {
					select: {
						id: true,
						holidayType: true,
					},
				},
				members: {
					include: {
						user: {
							select: {
								id: true,
								name: true,
								picture: true,
								email: true,
							},
						},
					},
				},
				owner: {
					select: {
						id: true,
						name: true,
						picture: true,
						email: true,
					},
				},
			},
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
