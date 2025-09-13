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
	// Add caching for read-mostly data
	const cacheKey = `home-data-${
		request.headers.get("x-test-user") || "anonymous"
	}`;

	// For now, use no-store since this is user-specific data
	// In production, you might want to use revalidate with tags for better performance
	try {
		// Convert Request to NextRequest for compatibility
		const nextRequest = new NextRequest(request.url, {
			headers: request.headers,
		});

		// Get current user from Auth0 session
		const user = await getCurrentUser(nextRequest);

		if (!user) {
			// No authenticated user
			return {
				user: null,
				account: null,
				holidayPreferences: null,
				contacts: null,
				needsUserSetup: true,
				needsHolidaySelection: false,
			};
		}

		// Find user's account
		let account = await prisma.account.findFirst({
			where: {
				members: {
					some: {
						userId: user.id,
					},
				},
			},
			include: {
				owner: {
					select: {
						id: true,
						name: true,
						email: true,
					},
				},
			},
		});

		if (!account) {
			// User exists but no account - they need to be added to DB
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

		// Get holiday preferences for this account with all related data
		const holidays = await prisma.holiday.findMany({
			where: { accountId: account.id },
			include: {
				budgets: true,
				gifts: true,
				cards: true,
				tasks: true,
			},
			orderBy: {
				holidayType: "asc",
			},
		});

		const holidayPreferences = holidays.map((holiday) => {
			const allTasks = holiday.tasks || [];

			// Debug: Log task categories for Kwanzaa
			if (holiday.holidayType === "Kwanzaa") {
				console.log(
					"Kwanzaa tasks:",
					allTasks.map((t: any) => ({
						id: t.id,
						title: t.title,
						category: t.category,
					}))
				);
			}

			// Filter tasks by category for specific holiday types
			const events = allTasks.filter((task: any) => task.category === "Events");
			const decorations = allTasks.filter(
				(task: any) => task.category === "Decorations"
			);
			const kwanzaaPrinciples = allTasks.filter(
				(task: any) => task.category === "Kwanzaa Principles"
			);

			return {
				holiday: holiday.holidayType,
				holidayId: holiday.id,
				budget: holiday.budgets[0]?.totalBudget
					? parseFloat(holiday.budgets[0].totalBudget.toString())
					: undefined,
				countdownTimer: holiday.countdownTimer?.toISOString(),
				gifts: holiday.gifts || [],
				cards: holiday.cards || [],
				tasks: allTasks,
				// Add filtered task categories
				events,
				decorations,
				kwanzaaPrinciples,
			};
		});

		// Get contacts for this account
		const contacts = await prisma.contact.findMany({
			where: { accountId: account.id },
			orderBy: {
				name: "asc",
			},
		});

		return {
			user: {
				id: user.id,
				email: user.email,
				name: user.name,
				picture: user.picture,
			},
			account: toPlain(account),
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
