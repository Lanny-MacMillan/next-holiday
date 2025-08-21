import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, assertHolidayAccess } from "@/lib/auth";
import { created, badRequest, serverError, ok } from "@/lib/http";

// Base schema without contact_id
const baseSchema = z.object({
	name: z.string().min(1),
	description: z.string().nullable().optional(),
	price: z.number().min(0).optional(),
	actual_price: z.number().min(0).optional(),
	store: z.string().nullable().optional(),
	product_link: z
		.union([z.string().url(), z.string().length(0), z.null(), z.undefined()])
		.optional(),
	notes: z.string().nullable().optional(),
});

// Schema for holidays that require contact_id (like Christmas)
const giftWithContactSchema = baseSchema.extend({
	contact_id: z.string().uuid(),
});

// Schema for holidays that don't require contact_id (like Thanksgiving)
const giftWithoutContactSchema = baseSchema.extend({
	contact_id: z.string().uuid().nullable().optional(),
	// For Thanksgiving, only name is required
	name: z.string().min(1, "Shopping Item Name is required"),
	description: z.string().nullable().optional(),
	price: z.number().min(0).optional(),
	actual_price: z.number().min(0).optional(),
	store: z.string().nullable().optional(),
	product_link: z
		.union([z.string().url(), z.string().length(0), z.null(), z.undefined()])
		.optional(),
	notes: z.string().nullable().optional(),
});

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const user = await requireAuth(request);
		const { id } = await params;
		const forbidden = await assertHolidayAccess(id, user.id);
		if (forbidden) return forbidden;

		// Get holiday information to determine validation schema
		const holiday = await prisma.holiday.findUnique({
			where: { id },
			select: { name: true },
		});

		if (!holiday) {
			return badRequest("Holiday not found");
		}

		const json = await request.json();

		// Use different schema based on holiday
		let parsed;
		if (holiday.name === "Thanksgiving") {
			parsed = giftWithoutContactSchema.safeParse(json);
		} else {
			parsed = giftWithContactSchema.safeParse(json);
		}

		if (!parsed.success) {
			return badRequest(parsed.error.issues);
		}

		const data = parsed.data;
		const gift = await prisma.gift.create({
			data: {
				holidayId: id,
				name: data.name,
				description: data.description ?? null,
				price: data.price ?? 0,
				actualPrice: data.actual_price ?? null,
				store: data.store ?? null,
				productLink:
					data.product_link && data.product_link.length > 0
						? data.product_link
						: null,
				notes: data.notes ?? null,
				contactId: data.contact_id,
				createdBy: user.id,
			},
		});

		return created(gift, {
			"Cache-Control": "private, max-age=5, stale-while-revalidate=60",
		});
	} catch (error) {
		console.error("Error creating gift:", error);
		return serverError("Failed to create gift");
	}
}

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const user = await requireAuth(request);
		const { id } = await params;
		const forbidden = await assertHolidayAccess(id, user.id);
		if (forbidden) return forbidden;

		const gifts = await prisma.gift.findMany({
			where: {
				holidayId: id,
			},
			include: {
				contact: true,
			},
			orderBy: {
				createdAt: "desc",
			},
		});

		// Transform gifts to match the expected UI interface
		const transformedGifts = gifts.map((gift) => ({
			id: gift.id,
			name: gift.name,
			description: gift.description,
			price: Number(gift.price),
			recipient: gift.contact?.name || "Unknown",
			isCompleted: gift.isCompleted,
			completedDate: gift.completedDate?.toISOString(),
			store: gift.store,
			productLink: gift.productLink,
			notes: gift.notes,
			shareId: gift.shareId,
			createdAt: gift.createdAt.toISOString(),
			updatedAt: gift.updatedAt.toISOString(),
		}));

		return ok(transformedGifts, {
			"Cache-Control": "private, max-age=5, stale-while-revalidate=60",
		});
	} catch (error) {
		console.error("Error fetching gifts:", error);
		return serverError("Failed to fetch gifts");
	}
}

export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const user = await requireAuth(request);
		const { id } = await params;
		const forbidden = await assertHolidayAccess(id, user.id);
		if (forbidden) return forbidden;

		const json = await request.json();
		const { giftId, isCompleted } = json;

		if (typeof giftId !== "string" || typeof isCompleted !== "boolean") {
			return badRequest("Invalid request body");
		}

		const updatedGift = await prisma.gift.update({
			where: {
				id: giftId,
				holidayId: id,
			},
			data: {
				isCompleted,
				completedDate: isCompleted ? new Date() : null,
			},
		});

		// Transform the response to match UI expectations
		const transformedGift = {
			id: updatedGift.id,
			name: updatedGift.name,
			description: updatedGift.description,
			price: Number(updatedGift.price),
			recipient: "Unknown", // Will be populated by the GET endpoint transformation
			isCompleted: updatedGift.isCompleted,
			completedDate: updatedGift.completedDate?.toISOString(),
			store: updatedGift.store,
			productLink: updatedGift.productLink,
			notes: updatedGift.notes,
			shareId: updatedGift.shareId,
			createdAt: updatedGift.createdAt.toISOString(),
			updatedAt: updatedGift.updatedAt.toISOString(),
		};

		return ok(transformedGift, {
			"Cache-Control": "private, max-age=5, stale-while-revalidate=60",
		});
	} catch (error) {
		console.error("Error updating gift:", error);
		return serverError("Failed to update gift");
	}
}

export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const user = await requireAuth(request);
		const { id } = await params;
		const forbidden = await assertHolidayAccess(id, user.id);
		if (forbidden) return forbidden;

		// Get holiday information to determine validation schema
		const holiday = await prisma.holiday.findUnique({
			where: { id },
			select: { name: true },
		});

		if (!holiday) {
			return badRequest("Holiday not found");
		}

		const json = await request.json();
		const { giftId, ...updateData } = json;

		if (!giftId) {
			return badRequest("giftId is required");
		}

		// Validate update data based on holiday
		let parsed;
		if (holiday.name === "Thanksgiving") {
			parsed = giftWithoutContactSchema.safeParse(updateData);
		} else {
			parsed = giftWithContactSchema.safeParse(updateData);
		}

		if (!parsed.success) {
			return badRequest(parsed.error.issues);
		}

		// Update the gift
		const updatedGift = await prisma.gift.update({
			where: {
				id: giftId,
				holidayId: id,
			},
			data: {
				name: updateData.name,
				description: updateData.description ?? null,
				price: updateData.price ?? 0,
				store: updateData.store ?? null,
				productLink:
					updateData.product_link && updateData.product_link.length > 0
						? updateData.product_link
						: null,
				notes: updateData.notes ?? null,
				contactId: updateData.contact_id,
			},
		});

		return ok(updatedGift, {
			"Cache-Control": "private, max-age=5, stale-while-revalidate=60",
		});
	} catch (error) {
		console.error("Error updating gift:", error);
		return serverError("Failed to update gift");
	}
}

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const user = await requireAuth(request);
		const { id } = await params;
		const forbidden = await assertHolidayAccess(id, user.id);
		if (forbidden) return forbidden;

		const { searchParams } = new URL(request.url);
		const giftId = searchParams.get("giftId");

		if (!giftId) {
			return badRequest("giftId parameter is required");
		}

		// Delete the gift
		await prisma.gift.delete({
			where: {
				id: giftId,
				holidayId: id,
			},
		});

		return ok(
			{ success: true },
			{
				"Cache-Control": "private, max-age=5, stale-while-revalidate=60",
			}
		);
	} catch (error) {
		console.error("Error deleting gift:", error);
		return serverError("Failed to delete gift");
	}
}
