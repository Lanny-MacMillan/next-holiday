import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, assertHolidayAccess } from "@/lib/auth";
import { created, badRequest, serverError, ok } from "@/lib/http";

const bodySchema = z.object({
	recipient: z.string().min(1),
	message: z.string().min(1),
	address: z.string().nullable().optional(),
	contact_id: z.string().uuid().nullable().optional(),
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

		const json = await request.json();
		const parsed = bodySchema.safeParse(json);
		if (!parsed.success) {
			return badRequest(parsed.error.issues);
		}

		const data = parsed.data;
		const card = await prisma.card.create({
			data: {
				holidayId: id,
				recipient: data.recipient,
				message: data.message,
				address: data.address ?? null,
				contactId: data.contact_id ?? null,
				createdBy: user.id,
			},
		});

		return created(card, {
			"Cache-Control": "private, max-age=5, stale-while-revalidate=60",
		});
	} catch (error) {
		console.error("Error creating card:", error);
		return serverError("Failed to create card");
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

		const cards = await prisma.card.findMany({
			where: {
				holidayId: id,
			},
			orderBy: {
				createdAt: "desc",
			},
		});

		return ok(cards, {
			"Cache-Control": "private, max-age=5, stale-while-revalidate=60",
		});
	} catch (error) {
		console.error("Error fetching cards:", error);
		return serverError("Failed to fetch cards");
	}
}
