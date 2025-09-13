"use client";

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

const mothersDaySubsections = [
	{
		name: "Gift Ideas",
		description: "Track gift ideas for Mother's Day",
		href: "/mothers-day/gift-list",
		sliceKey: "giftList",
		category: "Gifts",
		type: "gift-list",
	},
	{
		name: "Card List",
		description: "Track cards to send on Mother's Day",
		href: "/mothers-day/cards",
		sliceKey: "cards",
		type: "task",
	},
	{
		name: "Event Planning",
		description: "Plan Mother's Day celebrations",
		href: "/mothers-day/events",
		sliceKey: "events",
		type: "task",
	},
];

export default function MothersDayPage() {
	const { user: auth0User } = useAuth0();
	const holidayPreferences = useAppSelector(selectHolidayPreferences);
	const homeInitialized = useAppSelector(selectHomeInitialized);

	// Get holiday ID for Mother's Day - only resolve if home data is initialized
	const holidayId = homeInitialized
		? getHolidayIdFromRoute("/mothers-day", holidayPreferences)
		: getHolidayIdFromRoute("/mothers-day", holidayPreferences); // Allow fallback for cold entry

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
			default:
				total = 0;
				completed = 0;
		}

		const progress = total > 0 ? completed / total : 0;
		return { total, completed, progress };
	}

	return (
		<div className="min-h-screen mothers-day-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayHeader
				holidayName="🌸 Mother's Day"
				description="Show your love and appreciation!"
			/>
			<main className="flex-1 w-full max-w-4xl flex flex-col gap-6 mt-4">
				<ul className="flex flex-col gap-4">
					{mothersDaySubsections.map((section) => {
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
										holiday="Mother's Day"
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
											primaryColor: "#ec4899", // Pink for Mother's Day
											accentColor: "#f472b6",
										}}
										gamifiedBackgroundColor="bg-gradient-to-br from-pink-300 to-pink-500"
									/>
								</li>
							);
						} else {
							// Use HolidayTaskCard for tasks and other sections
							return (
								<li key={section.name}>
									<HolidayTaskCard
										holidayName="Mother's Day"
										sectionName={section.name}
										description={section.description}
										href={section.href}
										totalItems={total}
										completedItems={completed}
										theme={{
											primaryColor: "#ec4899", // Pink for Mother's Day
											accentColor: "#f472b6",
											progressColor: "#ec4899",
										}}
										gamifiedBackgroundColor="bg-gradient-to-br from-pink-300 to-pink-500"
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
