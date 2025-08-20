import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAuth, assertHolidayAccess } from "@/lib/auth";
import { created, badRequest, serverError, ok } from "@/lib/http";

const bodySchema = z.object({
	contact_id: z.string().uuid(),
	rsvp_status: z.enum(["pending", "confirmed", "declined", "maybe"]).optional(),
	notes: z.string().optional(),
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
		const guestList = await prisma.guestList.upsert({
			where: {
				holidayId_contactId: {
					holidayId: id,
					contactId: data.contact_id,
				},
			},
			update: {
				rsvpStatus: data.rsvp_status ?? null,
				notes: data.notes ?? null,
			},
			create: {
				holidayId: id,
				contactId: data.contact_id,
				rsvpStatus: data.rsvp_status ?? null,
				notes: data.notes ?? null,
				createdBy: user.id,
			},
		});

		return created(guestList, {
			"Cache-Control": "private, max-age=5, stale-while-revalidate=60",
		});
	} catch (error) {
		console.error("Error creating/updating guest list:", error);
		return serverError("Failed to create/update guest list");
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

		const guestList = await prisma.guestList.findMany({
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

		return ok(guestList, {
			"Cache-Control": "private, max-age=5, stale-while-revalidate=60",
		});
	} catch (error) {
		console.error("Error fetching guest list:", error);
		return serverError("Failed to fetch guest list");
	}
}
