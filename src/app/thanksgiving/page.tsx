"use client";

import { useEffect } from "react";
import { useAppSelector } from "@/store/hooks";
import { useAuth0 } from "@auth0/auth0-react";
import { BudgetDisplay } from "@/components/common/BudgetDisplay";
import { getHolidayIdFromRoute } from "@/utils/holidayUtils";
import GiftListCard from "@/components/cards/gift/GiftListCard";
import HolidayTaskCard from "@/components/cards/holiday-task/HolidayTaskCard";
import GuestListCard from "@/components/cards/guest/GuestListCard";
import HolidayHeader from "@/components/common/HolidayHeader";
import {
	selectHolidayPreferences,
	selectHomeInitialized,
	selectHomeData,
} from "@/store/selectors/home";
import { getHolidayDataFromRedux } from "@/utils/holidayData";

const subsections = [
	{
		name: "Shopping List",
		description: "List of ingredients and supplies needed",
		href: "/thanksgiving/shopping-list",
		sliceKey: "giftList",
		category: "Shopping List",
		type: "gift-list",
	},
	{
		name: "Meal Planning",
		description: "Plan your Thanksgiving menu and dishes",
		href: "/thanksgiving/meal-planning",
		sliceKey: "mealPlanning",
		type: "task",
	},
	{
		name: "Guest List",
		description: "Manage your Thanksgiving guest list",
		href: "/thanksgiving/guest-list",
		sliceKey: "guestList",
		type: "guest-list",
	},
	{
		name: "Decorations Checklist",
		description: "Stay on top of your Thanksgiving decorations",
		href: "/thanksgiving/decorations-checklist",
		sliceKey: "decorations",
		type: "task",
	},
];

export default function ThanksgivingPage() {
	const { user: auth0User } = useAuth0();
	const holidayPreferences = useAppSelector(selectHolidayPreferences);
	const homeInitialized = useAppSelector(selectHomeInitialized);

	// Get holiday ID for Thanksgiving - only resolve if home data is initialized
	const holidayId = homeInitialized
		? getHolidayIdFromRoute("/thanksgiving", holidayPreferences)
		: getHolidayIdFromRoute("/thanksgiving", holidayPreferences); // Allow fallback for cold entry

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
			case "giftList":
				if (holidayData.gifts) {
					total = holidayData.gifts.length;
					completed = holidayData.gifts.filter(
						(gift: any) => gift.isCompleted
					).length;
				}
				break;
			case "guestList":
				// Guest list doesn't have completion status, so we'll show total count
				total = 0;
				completed = 0;
				break;
			case "mealPlanning":
				// Filter tasks by category for meal planning
				if (holidayData.tasks) {
					const mealTasks = holidayData.tasks.filter(
						(task: any) => task.category === "Meal Planning"
					);
					total = mealTasks.length;
					completed = mealTasks.filter((task: any) => task.isCompleted).length;
				}
				break;
			case "decorations":
				if (holidayData.decorations) {
					total = holidayData.decorations.length;
					completed = holidayData.decorations.filter(
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
					console.log(`holidayPreferences[${index}].tasks:`, pref.tasks);
					console.log(
						`holidayPreferences[${index}].decorations:`,
						pref.decorations
					);
				});
			}
		}
		console.log("=== THANKSGIVING MAIN PAGE DEBUG ===");
		console.log("holidayId:", holidayId);
		console.log("homeInitialized:", homeInitialized);
		console.log("holidayData:", holidayData);
		console.log("holidayData.gifts:", holidayData?.gifts);
		console.log("holidayData.tasks:", holidayData?.tasks);
		console.log("holidayData.decorations:", holidayData?.decorations);
		console.log("=== END DEBUG ===");
	}, [holidayId, holidayData, homeInitialized, homeData]);

	return (
		<div className="min-h-screen thanksgiving-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayHeader
				holidayName="🦃 Thanksgiving"
				description="Plan your feast, guests, and gratitude!"
			/>
			<main className="flex-1 w-full max-w-4xl flex flex-col gap-6 mt-4">
				<ul className="flex flex-col gap-4">
					{subsections.map((section) => {
						const { total, completed } = getProgressData(section.sliceKey);

						// Use GiftListCard for shopping list (budget tracking) and gift list sections
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
										holiday="Thanksgiving"
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
											primaryColor: "#d97706", // Amber for Thanksgiving
											accentColor: "#eab308",
										}}
										gamifiedBackgroundColor="bg-gradient-to-br from-amber-400 to-amber-600"
									/>
								</li>
							);
						}

						// Use GuestListCard for guest list section
						if (section.type === "guest-list") {
							return (
								<li key={section.name}>
									<GuestListCard
										holiday="Thanksgiving"
										href={section.href}
										theme={{
											primaryColor: "#d97706", // Amber for Thanksgiving
											accentColor: "#eab308",
										}}
										holidayColor="bg-gradient-to-br from-amber-400 to-amber-600"
									/>
								</li>
							);
						}

						// Use HolidayTaskCard for task sections
						return (
							<li key={section.name}>
								<HolidayTaskCard
									holidayName="Thanksgiving"
									sectionName={section.name}
									description={section.description}
									href={section.href}
									totalItems={total}
									completedItems={completed}
									theme={{
										primaryColor: "#d97706", // Amber for Thanksgiving
										accentColor: "#eab308",
										progressColor: "#d97706",
									}}
									gamifiedBackgroundColor="bg-gradient-to-br from-amber-400 to-amber-600"
								/>
							</li>
						);
					})}
				</ul>
			</main>
		</div>
	);
}
