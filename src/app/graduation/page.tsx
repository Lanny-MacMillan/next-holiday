"use client";

import { useAppSelector } from "@/store/hooks";
import { useAuth0 } from "@auth0/auth0-react";
import GiftListCard from "@/components/cards/gift/GiftListCard";
import HolidayTaskCard from "@/components/cards/holiday-task/HolidayTaskCard";
import GuestListCard from "@/components/cards/guest/GuestListCard";
import HolidayHeader from "@/components/common/HolidayHeader";
import { getHolidayIdFromRoute } from "@/utils/holidayUtils";
import { getHolidayDataFromRedux } from "@/utils/holidayData";
import {
	selectHolidayPreferences,
	selectHomeInitialized,
	selectHomeData,
} from "@/store/selectors/home";

const subsections = [
	{
		name: "Gift List",
		description: "Track graduation gift ideas",
		href: "/graduation/gift-list",
		sliceKey: "giftList",
		category: "Gifts",
		type: "gift-list",
	},
	{
		name: "Guest List",
		description: "Manage guests for graduation parties",
		href: "/graduation/guest-list",
		sliceKey: "guestList",
		type: "guest-list",
	},
	{
		name: "Event Planning",
		description: "Plan graduation ceremonies or parties",
		href: "/graduation/events",
		sliceKey: "tasks",
		type: "task",
		category: "Events",
	},
	{
		name: "Cards List",
		description: "Track graduation cards to send",
		href: "/graduation/cards",
		sliceKey: "cards",
		type: "task",
	},
];

export default function GraduationPage() {
	const { user: auth0User } = useAuth0();
	const holidayPreferences = useAppSelector(selectHolidayPreferences);
	const homeInitialized = useAppSelector(selectHomeInitialized);

	// Get holiday ID for Graduation - only resolve if home data is initialized
	const holidayId = homeInitialized
		? getHolidayIdFromRoute("/graduation", holidayPreferences)
		: getHolidayIdFromRoute("/graduation", holidayPreferences); // Allow fallback for cold entry

	// Get data from Redux home state first, fallback to RTK Query if needed
	const homeData = useAppSelector(selectHomeData);

	// Get current Redux state for skip logic
	const currentState = useAppSelector((state: any) => state);

	// Get holiday data from Redux if available
	const holidayData = getHolidayDataFromRedux(holidayId, currentState);

	// Use only Redux data - no API calls on holiday pages

	function getProgressData(
		sliceKey: string,
		category?: string
	): {
		total: number;
		completed: number;
		progress: number;
	} {
		let total = 0;
		let completed = 0;

		// Use only Redux data - no fallback to API calls
		if (!holidayData || !homeInitialized) {
			return { total: 0, completed: 0, progress: 0 };
		}

		switch (sliceKey) {
			case "cards":
				if (holidayData.cards) {
					total = holidayData.cards.length;
					completed = holidayData.cards.filter(
						(card: any) => card.isCompleted
					).length;
				}
				break;
			case "giftList":
				if (holidayData.gifts) {
					total = holidayData.gifts.length;
					completed = holidayData.gifts.filter(
						(gift: any) => gift.isCompleted
					).length;
				}
				break;
			case "tasks":
				// For Event Planning, filter tasks by category "Events" (like New Year)
				if (category === "Events") {
					// Events are stored as tasks with category "Events"
					const eventTasks = holidayData.tasks?.filter((task: any) => task.category === "Events") || [];
					total = eventTasks.length;
					completed = eventTasks.filter((task: any) => task.isCompleted).length;
				} else {
					// Filter tasks by category
					if (holidayData.tasks) {
						const filteredTasks = category
							? holidayData.tasks.filter(
									(task: any) => task.category === category
							  )
							: holidayData.tasks;
						total = filteredTasks.length;
						completed = filteredTasks.filter(
							(task: any) => task.isCompleted
						).length;
					}
				}
				break;
			case "guestList":
				// Guest lists are stored separately from tasks
				if (holidayData.guestLists) {
					const guestLists = holidayData.guestLists || [];
					total = guestLists.length;
					completed = guestLists.filter((guest: any) => guest.rsvpStatus === "confirmed").length;
				}
				break;
			default:
				total = 0;
				completed = 0;
		}

		const progress = total > 0 ? completed / total : 0;

		return { total, completed, progress };
	}

	return (
		<div className="min-h-screen graduation-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayHeader
				holidayName="Graduation"
				description="Celebrate academic achievements!"
			/>
			<main className="flex-1 w-full max-w-4xl flex flex-col gap-6 mt-4">
				<ul className="flex flex-col gap-4">
					{subsections.map((section) => {
						const { total, completed, progress } = getProgressData(
							section.sliceKey,
							section.category
						);

						// Determine which card component to use based on type
						if (section.type === "gift-list") {
							// Calculate budget data from Redux
							const budgetLimit = holidayData?.budget || 0;
							const gifts = holidayData?.gifts || [];

							// Calculate spent amount from completed gifts
							const totalSpent = gifts.reduce((sum: number, gift: any) => {
								const price = parseFloat(gift.price) || 0;
								return gift.isCompleted ? sum + price : sum;
							}, 0);

							// Calculate total planned (all gifts with prices)
							const totalPlanned = gifts.reduce((sum: number, gift: any) => {
								return sum + (parseFloat(gift.price) || 0);
							}, 0);

							const remaining = budgetLimit - totalSpent;
							const budgetPercentage =
								budgetLimit > 0 ? (totalSpent / budgetLimit) * 100 : 0;

							const getBudgetStatus = () => {
								if (budgetPercentage >= 80) return "Budget nearly exhausted";
								if (budgetPercentage >= 60) return "Moderate budget remaining";
								return "Plenty of budget left";
							};

							return (
								<li key={section.name}>
									<GiftListCard
										holiday="Graduation"
										href={section.href}
										budget={{
											spent: totalSpent,
											planned: totalPlanned,
											total: budgetLimit,
											remaining,
											percentage: budgetPercentage,
										}}
										giftList={{
											totalItems: total,
											completedItems: completed,
										}}
										theme={{
											primaryColor: "#8b5cf6", // Purple for Graduation
											accentColor: "#8b5cf6", // Purple accent
										}}
										gamifiedBackgroundColor="bg-gradient-to-br from-purple-300 to-purple-500"
									/>
								</li>
							);
						} else if (section.type === "guest-list") {
							return (
								<li key={section.name}>
									<GuestListCard
										holiday="Graduation"
										href={section.href}
										theme={{
											primaryColor: "#8b5cf6", // Purple for Graduation
											accentColor: "#8b5cf6", // Purple accent
										}}
										holidayColor="bg-gradient-to-br from-purple-300 to-purple-500"
									/>
								</li>
							);
						} else {
							// Use HolidayTaskCard for tasks and other sections
							return (
								<li key={section.name}>
									<HolidayTaskCard
										holidayName="Graduation"
										sectionName={section.name}
										description={section.description}
										href={section.href}
										totalItems={total}
										completedItems={completed}
										theme={{
											primaryColor: "#8b5cf6", // Purple for Graduation
											accentColor: "#8b5cf6", // Purple accent
											progressColor: "#8b5cf6", // Purple for progress bar
										}}
										gamifiedBackgroundColor="bg-gradient-to-br from-purple-300 to-purple-500"
									/>
								</li>
							);
						}
					})}
				</ul>
			</main>
			<footer className="w-full max-w-md py-4 text-center text-xs text-gray-500 dark:text-gray-500 mt-8">
				&copy; {new Date().getFullYear()} Next Holiday
			</footer>
		</div>
	);
}
