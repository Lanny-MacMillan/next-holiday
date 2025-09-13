"use client";

import { useEffect } from "react";
import { useAppSelector } from "@/store/hooks";
import { useAuth0 } from "@auth0/auth0-react";
import GiftListCard from "@/components/cards/gift/GiftListCard";
import HolidayTaskCard from "@/components/cards/holiday-task/HolidayTaskCard";
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
		description: "Track your Kwanzaa gift ideas",
		href: "/kwanzaa/gift-list",
		sliceKey: "giftList",
		type: "gift-list",
	},
	{
		name: "Daily Principle Tracker",
		description: "Track the seven principles of Kwanzaa",
		href: "/kwanzaa/daily-principles",
		sliceKey: "kwanzaaPrinciples",
		type: "task",
	},
	{
		name: "Events",
		description: "Plan your Kwanzaa events and celebrations",
		href: "/kwanzaa/events",
		sliceKey: "events",
		type: "task",
	},
	{
		name: "Decorations Checklist",
		description: "Stay on top of your Kwanzaa decorations",
		href: "/kwanzaa/decorations",
		sliceKey: "decorations",
		type: "task",
	},
];

export default function KwanzaaPage() {
	const { user: auth0User } = useAuth0();
	const holidayPreferences = useAppSelector(selectHolidayPreferences);
	const homeInitialized = useAppSelector(selectHomeInitialized);

	// Get holiday ID for Kwanzaa - try to resolve from home data, fallback to route-based resolution
	const holidayId = homeInitialized
		? getHolidayIdFromRoute("/kwanzaa", holidayPreferences)
		: getHolidayIdFromRoute("/kwanzaa", holidayPreferences); // Allow fallback for cold entry

	// Get data from Redux home state first, fallback to RTK Query if needed
	const homeData = useAppSelector(selectHomeData);

	// Get current Redux state for skip logic
	const currentState = useAppSelector((state: any) => state);

	// Get holiday data from Redux if available
	const holidayData = getHolidayDataFromRedux(holidayId, currentState);

	// Debug: Log holiday data
	useEffect(() => {
		console.log("Kwanzaa page - holidayId:", holidayId);
		console.log("Kwanzaa page - holidayData:", holidayData);
		console.log("Kwanzaa page - homeInitialized:", homeInitialized);
		console.log("Kwanzaa page - homeData:", homeData);
	}, [holidayId, holidayData, homeInitialized, homeData]);

	// Use only Redux data - no API calls on holiday pages

	function getProgressData(sliceKey: string): {
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
			case "giftList":
				if (holidayData.gifts) {
					total = holidayData.gifts.length;
					completed = holidayData.gifts.filter(
						(gift: any) => gift.isCompleted
					).length;
				}
				break;
			case "events":
				// Events are stored in the tasks array with category "Events"
				if (holidayData.tasks) {
					const events = holidayData.tasks.filter(
						(task: any) => task.category === "Events"
					);
					total = events.length;
					completed = events.filter((event: any) => event.isCompleted).length;
				}
				break;
			case "kwanzaaPrinciples":
				// Daily Principles are stored in the tasks array with category "Daily Principles"
				if (holidayData.tasks) {
					const dailyPrinciples = holidayData.tasks.filter(
						(task: any) => task.category === "Daily Principles"
					);
					total = dailyPrinciples.length;
					completed = dailyPrinciples.filter(
						(principle: any) => principle.isCompleted
					).length;
				}
				break;
			case "decorations":
				// Decorations are stored in the tasks array with category "Decorations"
				if (holidayData.tasks) {
					const decorations = holidayData.tasks.filter(
						(task: any) => task.category === "Decorations"
					);
					total = decorations.length;
					completed = decorations.filter(
						(decoration: any) => decoration.isCompleted
					).length;
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
		<div className="min-h-screen kwanzaa-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayHeader
				holidayName="Kwanzaa"
				description="Plan your Kwanzaa with ease!"
			/>
			<main className="flex-1 w-full max-w-4xl flex flex-col gap-6 mt-4">
				<ul className="flex flex-col gap-4">
					{subsections.map((section) => {
						const { total, completed, progress } = getProgressData(
							section.sliceKey
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
										holiday="Kwanzaa"
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
											primaryColor: "#dc2626", // Red for Kwanzaa
											accentColor: "#dc2626", // Red accent
										}}
										gamifiedBackgroundColor="bg-gradient-to-br from-red-400 to-red-600"
									/>
								</li>
							);
						} else {
							// Use HolidayTaskCard for tasks and other sections
							return (
								<li key={section.name}>
									<HolidayTaskCard
										holidayName="Kwanzaa"
										sectionName={section.name}
										description={section.description}
										href={section.href}
										totalItems={total}
										completedItems={completed}
										theme={{
											primaryColor: "#dc2626", // Red for Kwanzaa
											accentColor: "#dc2626", // Red accent
											progressColor: "#dc2626", // Red for progress bar
										}}
										gamifiedBackgroundColor="bg-gradient-to-br from-red-400 to-red-600"
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
