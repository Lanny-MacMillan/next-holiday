import { NextRequest } from "next/server";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireAuth } from "@/lib/auth";
import { requireAccountAccess } from "@/lib/rbac";
import { toPlain } from "@/lib/json";
import { dateOnlyToUTC, toDateOnlyString } from "@/lib/dates";
import {
	ok,
	created,
	badRequest,
	unauthorized,
	forbidden,
	notFound,
	serverError,
} from "@/lib/http";

// Validation schemas
const CreateHolidaySchema = z.object({
	accountId: z.string().min(1),
	holidayType: z.string().min(1),
	name: z.string().min(1).max(100),
	description: z.string().optional(),
	startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD format
	endDate: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/)
		.optional(), // YYYY-MM-DD format
	colorLight: z.string().min(1),
	colorDark: z.string().min(1),
	isCustom: z.boolean().optional(),
});

const UpdateHolidaySchema = z.object({
	holidayType: z.string().min(1).optional(),
	name: z.string().min(1).max(100).optional(),
	description: z.string().optional(),
	startDate: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/)
		.optional(),
	endDate: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/)
		.optional(),
	colorLight: z.string().min(1).optional(),
	colorDark: z.string().min(1).optional(),
	isCustom: z.boolean().optional(),
});

const HolidayQuerySchema = z.object({
	accountId: z.string().optional(),
	holidayType: z.string().optional(),
	q: z.string().optional(),
	sortBy: z.enum(["name", "startDate", "createdAt"]).optional(),
	sortOrder: z.enum(["asc", "desc"]).optional(),
	scope: z.enum(["mine", "shared", "all"]).default("all"),
});

// GET /api/holidays - List holidays
export async function GET(request: NextRequest) {
	try {
		const user = await requireAuth(request);

		// Parse and validate query parameters
		const searchParams = request.nextUrl.searchParams;
		const queryResult = HolidayQuerySchema.safeParse({
			accountId: searchParams.get("accountId") || undefined,
			holidayType: searchParams.get("holidayType") || undefined,
			q: searchParams.get("q") || undefined,
			sortBy: searchParams.get("sortBy") || undefined,
			sortOrder: searchParams.get("sortOrder") || undefined,
			scope: searchParams.get("scope") || undefined,
		});

		if (!queryResult.success) {
			return badRequest(queryResult.error.issues);
		}

		const { accountId, holidayType, q, sortBy, sortOrder, scope } =
			queryResult.data;

		// Build base where clause: include
		// 1) Holidays in any account the user belongs to, or
		// 2) Holidays shared with the user via Share -> ShareMember
		const tenantOrShareFilter = {
			OR: [
				{
					account: {
						members: {
							some: {
								userId: user.id,
							},
						},
					},
				},
				{
					shares: {
						some: {
							members: {
								some: {
									userId: user.id,
								},
							},
						},
					},
				},
			],
		} as const;

		const textFilter = q
			? {
					OR: [
						{ name: { contains: q, mode: "insensitive" as const } },
						{ description: { contains: q, mode: "insensitive" as const } },
					],
			  }
			: {};

		const whereBase = {
			...tenantOrShareFilter,
			...(accountId && { accountId }),
			...(holidayType && { holidayType }),
			...textFilter,
		};

		// Apply scope filtering
		const where =
			scope === "mine"
				? { ...whereBase, createdBy: user.id }
				: scope === "shared"
				? { ...whereBase, createdBy: { not: user.id } }
				: whereBase;

		// Get holidays with simplified select and annotate visibility
		const items = await prisma.holiday.findMany({
			where,
			orderBy: [{ createdAt: "desc" }],
			distinct: ["id"],
			select: {
				id: true,
				name: true,
				holidayType: true,
				accountId: true,
				createdBy: true,
				createdAt: true,
				updatedAt: true,
			},
		});

		// Annotate visibility server-side
		const data = items.map((h) => ({
			...h,
			_visibility: h.createdBy === user.id ? "mine" : "shared",
		}));

		// Return a plain array; ok() wraps as { success: true, data }
		return ok(toPlain(data));
	} catch (error) {
		console.error("Error fetching holidays:", error);
		return serverError("Failed to fetch holidays");
	}
}

// POST /api/holidays - Create new holiday
export async function POST(request: NextRequest) {
	try {
		const user = await requireAuth(request);

		// Parse and validate request body
		const body = await request.json();
		const validation = CreateHolidaySchema.safeParse(body);

		if (!validation.success) {
			return badRequest(validation.error.issues);
		}

		const { accountId, startDate, endDate, ...data } = validation.data;

		// Check account access
		await requireAccountAccess(accountId, user.id);

		// Create holiday
		const holiday = await prisma.holiday.create({
			data: {
				id: uuidv4(),
				accountId,
				startDate: dateOnlyToUTC(startDate),
				endDate: endDate ? dateOnlyToUTC(endDate) : null,
				createdBy: user.id,
				...data,
			},
			include: {
				account: {
					select: {
						id: true,
						name: true,
					},
				},
				creator: {
					select: {
						id: true,
						name: true,
						email: true,
					},
				},
			},
		});

		// Transform date fields to strings for API response
		const transformedHoliday = {
			...holiday,
			startDate: toDateOnlyString(holiday.startDate),
			endDate: toDateOnlyString(holiday.endDate),
		};

		return created(toPlain(transformedHoliday));
	} catch (error) {
		console.error("Error creating holiday:", error);
		return serverError("Failed to create holiday");
	}
}
