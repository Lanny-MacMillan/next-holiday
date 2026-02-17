"use client";

import { useEffect } from "react";
import { useAppSelector } from "@/store/hooks";
import { useAuth0 } from "@auth0/auth0-react";
import { BudgetDisplay } from "@/components/common/BudgetDisplay";
import GiftListCard from "@/components/cards/gift/GiftListCard";
import HolidayTaskCard from "@/components/cards/holiday-task/HolidayTaskCard";
import HolidayHeader from "@/components/common/HolidayHeader";
import { getHolidayIdFromRoute } from "@/utils/holidayUtils";
import {
	selectHolidayPreferences,
	selectHomeInitialized,
	selectHomeData,
} from "@/store/selectors/home";
import { getHolidayDataFromRedux } from "@/utils/holidayData";
const subsections = [
	{
		name: "Gift List",
		description: "Track your Hanukkah gift ideas",
		href: "/hanukkah/gift-list",
		sliceKey: "giftList",
		type: "gift-list",
	},
	{
		name: "Candle Lighting Tracker",
		description: "Track the lighting of candles over the 8 days",
		href: "/hanukkah/candle-lighting",
		sliceKey: "candleLighting",
		type: "task",
	},
	{
		name: "Events",
		description: "Plan your Hanukkah events and celebrations",
		href: "/hanukkah/events",
		sliceKey: "events",
		type: "task",
	},
	{
		name: "Decorations Checklist",
		description: "Stay on top of your Hanukkah decorations",
		href: "/hanukkah/decorations",
		sliceKey: "decorations",
		type: "task",
	},
];

export default function HanukkahPage() {
	const { user: auth0User } = useAuth0();
	const holidayPreferences = useAppSelector(selectHolidayPreferences);
	const homeInitialized = useAppSelector(selectHomeInitialized);

	// Get holiday ID for Hanukkah - only resolve if home data is initialized
	const holidayId = homeInitialized
		? getHolidayIdFromRoute("/hanukkah", holidayPreferences)
		: getHolidayIdFromRoute("/hanukkah", holidayPreferences); // Allow fallback for cold entry

	// Get data from Redux home state first, fallback to RTK Query if needed
	const homeData = useAppSelector(selectHomeData);

	// Get current Redux state for skip logic
	const currentState = useAppSelector((state: any) => state);

	// Get holiday data from Redux if available
	const holidayData = getHolidayDataFromRedux(holidayId, currentState);

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
			case "events":
				if (holidayData.events) {
					total = holidayData.events.length;
					completed = holidayData.events.filter(
						(event: any) => event.isCompleted
					).length;
				}
				break;
			case "candleLighting":
				// Filter tasks by category for candle lighting
				if (holidayData.tasks) {
					const candleTasks = holidayData.tasks.filter(
						(task: any) => task.category === "Candle Lighting"
					);
					total = candleTasks.length;
					completed = candleTasks.filter(
						(task: any) => task.isCompleted
					).length;
				}
				break;
			case "decorations":
				// Decorations are stored as tasks with category "Decorations"
				const decorationTasks = holidayData.tasks?.filter(
					(task: any) => task.category === "Decorations"
				) || [];
				total = decorationTasks.length;
				completed = decorationTasks.filter(
					(task: any) => task.isCompleted
				).length;
				break;
			default:
				total = 0;
				completed = 0;
		}

		const progress = total > 0 ? completed / total : 0;

		return { total, completed, progress };
	}

	// Debug: Log all available data
	useEffect(() => {
		// Log the full home data structure
		if (homeData) {
			console.log("homeData.holidayPreferences:", homeData.holidayPreferences);
			if (homeData.holidayPreferences) {
				homeData.holidayPreferences.forEach((pref: any, index: number) => {
					console.log(`holidayPreferences[${index}]:`, pref);
					console.log(
						`holidayPreferences[${index}].holidayId:`,
						pref.holidayId
					);
					console.log(`holidayPreferences[${index}].gifts:`, pref.gifts);
					console.log(`holidayPreferences[${index}].cards:`, pref.cards);
					console.log(`holidayPreferences[${index}].tasks:`, pref.tasks);
				});
			}
		}
		console.log("=== HANUKKAH MAIN PAGE DEBUG ===");
		console.log("holidayId:", holidayId);
		console.log("homeInitialized:", homeInitialized);
		console.log("holidayData:", holidayData);
		console.log("holidayData.gifts:", holidayData?.gifts);
		console.log("holidayData.cards:", holidayData?.cards);
		console.log("holidayData.tasks:", holidayData?.tasks);
		console.log("holidayData.events:", holidayData?.events);
		console.log("holidayData.decorations:", holidayData?.decorations);
		console.log("=== END DEBUG ===");
	}, [holidayId, holidayData, homeInitialized, homeData]);

	return (
		<div className="min-h-screen hanukkah-cards-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayHeader
				holidayName="Hanukkah"
				description="Plan your Hanukkah with ease!"
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
										holiday="Hanukkah"
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
											primaryColor: "#3b82f6", // Blue for Hanukkah
											accentColor: "#3b82f6", // Blue accent
										}}
										gamifiedBackgroundColor="bg-gradient-to-br from-blue-400 to-blue-600"
									/>
								</li>
							);
						} else {
							// Use HolidayTaskCard for tasks and other sections
							return (
								<li key={section.name}>
									<HolidayTaskCard
										holidayName="Hanukkah"
										sectionName={section.name}
										description={section.description}
										href={section.href}
										totalItems={total}
										completedItems={completed}
										theme={{
											primaryColor: "#3b82f6", // Blue for Hanukkah
											accentColor: "#3b82f6", // Blue accent
											progressColor: "#3b82f6", // Blue for progress bar
										}}
										gamifiedBackgroundColor="bg-gradient-to-br from-blue-400 to-blue-600"
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
