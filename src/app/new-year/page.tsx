"use client";

import { useAppSelector } from "@/store/hooks";
import { useAuth0 } from "@auth0/auth0-react";
import { useGetGiftsQuery, useGetTasksQuery } from "@/store/api";
import GiftListCard from "@/components/cards/gift/GiftListCard";
import HolidayTaskCard from "@/components/cards/holiday-task/HolidayTaskCard";
import HolidayHeader from "@/components/common/HolidayHeader";
import { getHolidayIdFromRoute } from "@/utils/holidayUtils";

const subsections = [
	{
		name: "Resolution Tracker",
		description: "Track your New Year resolutions and goals",
		href: "/new-year/resolutions",
		sliceKey: "tasks",
		type: "task",
		category: "Resolutions",
	},
	{
		name: "Supplies List",
		description: "Plan your party supplies and fireworks",
		href: "/new-year/supplies",
		sliceKey: "giftList",
		type: "gift-list",
	},
	{
		name: "Events",
		description: "Plan your New Year events and celebrations",
		href: "/new-year/events",
		sliceKey: "tasks",
		type: "task",
		category: "Events",
	},
	{
		name: "Decorations Checklist",
		description: "Stay on top of your New Year decorations",
		href: "/new-year/decorations",
		sliceKey: "tasks",
		type: "task",
		category: "Decorations",
	},
];

export default function NewYearPage() {
	const { user: auth0User } = useAuth0();
	const holidayPreferences = useAppSelector(
		(state: any) => state.home.data?.holidayPreferences || []
	);

	// Get holiday ID for New Year
	const holidayId = getHolidayIdFromRoute("/new-year", holidayPreferences);

	// Use RTK Query to fetch data
	const { data: gifts = [] } = useGetGiftsQuery(
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
		<div className="min-h-screen new-year-cards-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayHeader
				holidayName="New Year"
				description="Plan your New Year with ease!"
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
										holiday="New Year"
										href={section.href}
										theme={{
											primaryColor: "#d97706", // Amber for New Year
											accentColor: "#d97706", // Amber accent
										}}
										gamifiedBackgroundColor="bg-gradient-to-br from-amber-400 to-amber-600"
									/>
								</li>
							);
						} else {
							// Use HolidayTaskCard for tasks and other sections
							return (
								<li key={section.name}>
									<HolidayTaskCard
										holidayName="New Year"
										sectionName={section.name}
										description={section.description}
										href={section.href}
										totalItems={total}
										completedItems={completed}
										theme={{
											primaryColor: "#d97706", // Amber for New Year
											accentColor: "#d97706", // Amber accent
											progressColor: "#d97706", // Amber for progress bar
										}}
										gamifiedBackgroundColor="bg-gradient-to-br from-amber-400 to-amber-600"
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
