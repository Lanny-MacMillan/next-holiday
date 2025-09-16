import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { toPlain } from "@/lib/json";
import { HomeData } from "@/types/home";

/**
 * Fetch all data needed for the home page on the server side
 * This function handles all the data fetching logic that was previously done on the client
 */
export async function getHomeData(request: Request): Promise<HomeData> {
	try {
		const nextRequest = new NextRequest(request.url, {
			headers: request.headers,
		});
		const user = await getCurrentUser(nextRequest);
		console.log("[homeData] user:", user?.id, user?.email);

		if (!user) {
			return {
				user: null,
				account: null,
				holidayPreferences: null,
				contacts: null,
				needsUserSetup: true,
				needsHolidaySelection: false,
			};
		}

		// 1) User's own accounts
		const accounts = await prisma.account.findMany({
			where: { members: { some: { userId: user.id } } },
			include: { owner: { select: { id: true, name: true, email: true } } },
		});
		const ownAccountIds = accounts.map((a) => a.id);
		console.log("[homeData] own accounts:", ownAccountIds);

		// 2) Holidays explicitly shared with the user (ShareMember)
		const sharedHolidays = await prisma.share.findMany({
			where: { members: { some: { userId: user.id } } },
			select: { holidayId: true },
		});
		const sharedHolidayIds = sharedHolidays.map((s) => s.holidayId);
		console.log("[homeData] shared holiday ids:", sharedHolidayIds);

		if (accounts.length === 0 && sharedHolidayIds.length === 0) {
			return {
				user: {
					id: user.id,
					email: user.email,
					name: user.name,
					picture: user.picture,
				},
				account: null,
				holidayPreferences: null,
				contacts: null,
				needsUserSetup: true,
				needsHolidaySelection: false,
			};
		}

		// Fetch holidays from user's own accounts or those shared with them
		const holidays = await prisma.holiday.findMany({
			where: {
				OR: [
					{ accountId: { in: ownAccountIds } },
					{ id: { in: sharedHolidayIds } },
				],
			},
			include: {
				budgets: true,
				gifts: true,
				cards: true,
				tasks: true,
				guestLists: { include: { contact: true } },
			},
			orderBy: { holidayType: "asc" },
		});
		console.log(
			"[homeData] holidays fetched:",
			holidays.length,
			holidays.map((h) => ({
				id: h.id,
				type: h.holidayType,
				accountId: h.accountId,
			}))
		);

		const typeToDisplay: Record<string, string> = {
			christmas: "Christmas",
			hanksgiving: "Thanksgiving",
			halloween: "Halloween",
			easter: "Easter",
			valentines: "Valentine's Day",
			"new-year": "New Year",
			hanukkah: "Hanukkah",
			birthday: "Birthday",
			anniversary: "Anniversary",
			"mothers-day": "Mother's Day",
			"fathers-day": "Father's Day",
			"fourth-of-july": "Fourth of July",
			graduation: "Graduation",
			"baby-shower": "Baby Shower",
		};

		const holidayPreferences = holidays.map((holiday) => {
			const allTasks = holiday.tasks || [];
			const events = allTasks.filter((task: any) => task.category === "Events");
			const decorations = allTasks.filter(
				(task: any) => task.category === "Decorations"
			);
			const kwanzaaPrinciples = allTasks.filter(
				(task: any) => task.category === "Kwanzaa Principles"
			);
			const guestLists =
				holiday.guestLists?.map((guestList: any) => ({
					id: guestList.id,
					holidayId: guestList.holidayId,
					contactId: guestList.contactId,
					rsvpStatus: guestList.rsvpStatus,
					rsvpDate: guestList.rsvpDate?.toISOString(),
					notes: guestList.notes,
					createdBy: guestList.createdBy,
					createdAt: guestList.createdAt.toISOString(),
					updatedAt: guestList.updatedAt.toISOString(),
					contact: guestList.contact
						? {
								id: guestList.contact.id,
								name: guestList.contact.name,
								email: guestList.contact.email,
								phone: guestList.contact.phone,
								streetAddress: guestList.contact.streetAddress,
								city: guestList.contact.city,
								state: guestList.contact.state,
								postalCode: guestList.contact.postalCode,
								relationship: guestList.contact.relationship,
								notes: guestList.contact.notes,
								createdAt: guestList.contact.createdAt.toISOString(),
								updatedAt: guestList.contact.updatedAt.toISOString(),
						  }
						: null,
				})) || [];

			return {
				holiday: typeToDisplay[holiday.holidayType] || holiday.holidayType,
				holidayId: holiday.id,
				budget: holiday.budgets[0]?.totalBudget
					? parseFloat(holiday.budgets[0].totalBudget.toString())
					: undefined,
				countdownTimer: holiday.countdownTimer?.toISOString(),
				gifts: holiday.gifts || [],
				cards: holiday.cards || [],
				tasks: allTasks,
				events,
				decorations,
				kwanzaaPrinciples,
				guestLists,
			};
		});

		console.log(
			"[homeData] holidayPreferences (display name -> id):",
			holidayPreferences.map((p) => ({ holiday: p.holiday, id: p.holidayId }))
		);

		// Contacts only from user's own accounts
		const contacts = await prisma.contact.findMany({
			where: { accountId: { in: ownAccountIds } },
			orderBy: { name: "asc" },
		});

		return {
			user: {
				id: user.id,
				email: user.email,
				name: user.name,
				picture: user.picture,
			},
			account: toPlain(accounts[0] || null),
			holidayPreferences,
			contacts: toPlain(contacts),
			needsUserSetup: false,
			needsHolidaySelection: holidayPreferences.length === 0,
		};
	} catch (error) {
		console.error("Error fetching home data:", error);
		throw new Error("Failed to fetch home data");
	}
}
