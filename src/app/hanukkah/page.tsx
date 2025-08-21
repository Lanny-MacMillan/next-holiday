"use client";

import { useAppSelector } from "@/store/hooks";
import { useAuth0 } from "@auth0/auth0-react";
import {
	useGetGiftsQuery,
	useGetCardsQuery,
	useGetTasksQuery,
} from "@/store/api";
import GiftListCard from "@/components/cards/gift/GiftListCard";
import HolidayTaskCard from "@/components/cards/holiday-task/HolidayTaskCard";
import HolidayHeader from "@/components/common/HolidayHeader";
import { getHolidayIdFromRoute } from "@/utils/holidayUtils";

const subsections = [
	{
		name: "Gift List",
		description: "Track your Hanukkah gift ideas",
		href: "/hanukkah/gift-list",
		sliceKey: "giftList",
		category: "Gifts",
		type: "gift-list",
	},
	{
		name: "Candle Lighting Tracker",
		description: "Track the lighting of 9 candles over 8 days",
		href: "/hanukkah/candle-lighting",
		sliceKey: "tasks",
		category: "Candle Lighting",
		type: "task",
	},
	{
		name: "Events",
		description: "Plan your Hanukkah events and celebrations",
		href: "/hanukkah/events",
		sliceKey: "tasks",
		category: "Events",
		type: "task",
	},
	{
		name: "Decorations Checklist",
		description: "Stay on top of your Hanukkah decorations",
		href: "/hanukkah/decorations",
		sliceKey: "tasks",
		category: "Decorations",
		type: "task",
	},
];

export default function HanukkahPage() {
	const { user: auth0User } = useAuth0();
	const holidayPreferences = useAppSelector(
		(state: any) => state.home.data?.holidayPreferences || []
	);

	// Get holiday ID for Hanukkah
	const holidayId = getHolidayIdFromRoute("/hanukkah", holidayPreferences);

	// Use RTK Query to fetch data
	const { data: gifts = [] } = useGetGiftsQuery(
		{ holidayId: holidayId || "", auth0User },
		{ skip: !holidayId || !auth0User }
	);
	const { data: cards = [] } = useGetCardsQuery(
		{ holidayId: holidayId || "", auth0User },
		{ skip: !holidayId || !auth0User }
	);
	const { data: tasks = [] } = useGetTasksQuery(
		{ holidayId: holidayId || "", auth0User },
		{ skip: !holidayId || !auth0User }
	);

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

		switch (sliceKey) {
			case "cards":
				total = cards.length;
				completed = cards.filter((card: any) => card.isCompleted).length;
				break;
			case "giftList":
				total = gifts.length;
				completed = gifts.filter((gift: any) => gift.isCompleted).length;
				break;
			case "tasks":
				// Filter tasks by category if provided
				const filteredTasks = category
					? tasks.filter((task: any) => task.category === category)
					: tasks;
				total = filteredTasks.length;
				completed = filteredTasks.filter(
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
							section.sliceKey,
							section.category
						);

						// Determine which card component to use based on type
						if (section.type === "gift-list") {
							return (
								<li key={section.name}>
									<GiftListCard
										holiday="Hanukkah"
										href={section.href}
										theme={{
											primaryColor: "#3b82f6", // Blue for Hanukkah
											accentColor: "#eab308",
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
											accentColor: "#eab308",
											progressColor: "#3b82f6", // Blue for Hanukkah
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
