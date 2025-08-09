"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchNewYearGifts } from "@/store/slices/new-year/newYearGiftListSlice";
import { fetchNewYearTasks } from "@/store/slices/new-year/newYearTasksSlice";
import { BudgetDisplay } from "@/components/common/BudgetDisplay";
import GiftListCard from "@/components/cards/gift/GiftListCard";
import HolidayTaskCard from "@/components/cards/holiday-task/HolidayTaskCard";
import HolidayHeader from "@/components/common/HolidayHeader";

const subsections = [
	{
		name: "Supplies List",
		description: "Track your party supplies and fireworks",
		href: "/new-year/supplies-list",
		sliceKey: "newYearGiftList",
		category: "Supplies",
	},
	{
		name: "Resolution Tracker",
		description: "Track your New Year resolutions",
		href: "/new-year/resolutions",
		sliceKey: "tasks",
		category: "Resolutions",
	},
	{
		name: "Events",
		description: "Plan your New Year events and celebrations",
		href: "/new-year/events",
		sliceKey: "tasks",
		category: "Events",
	},
	{
		name: "Decorations Checklist",
		description: "Stay on top of your New Year decorations",
		href: "/new-year/decorations",
		sliceKey: "tasks",
		category: "Decorations",
	},
];

export default function NewYearPage() {
	const dispatch = useAppDispatch();

	const gifts = useAppSelector((state: any) => state.newYearGiftList.gifts);
	const tasks = useAppSelector((state: any) => state.newYearTasks.tasks);

	useEffect(() => {
		// Fetch all data when component mounts if not already initialized
		// The DataInitializer component should handle this, but we'll keep this as a fallback
		dispatch(fetchNewYearGifts());
		dispatch(fetchNewYearTasks());
	}, [dispatch]);

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
			case "newYearGiftList":
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
		<div className="min-h-screen new-year-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayHeader
				holidayName="New Year"
				description="Plan your New Year with ease!"
			/>
			<main className="flex-1 w-full max-w-4xl flex flex-col gap-6 mt-4">
				<ul className="flex flex-col gap-4">
					{subsections.map((section) => {
						const { total, completed } = getProgressData(
							section.sliceKey,
							section.category
						);

						// Use GiftListCard for gift list sections
						if (section.sliceKey.includes("GiftList")) {
							return (
								<li key={section.name}>
									<GiftListCard
										holiday="New Year"
										href={section.href}
										theme={{
											primaryColor: "#f59e0b", // Amber for New Year
											accentColor: "#eab308",
										}}
										gamifiedBackgroundColor="bg-gradient-to-br from-yellow-400 to-yellow-600"
									/>
								</li>
							);
						}

						// Use HolidayTaskCard for task sections
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
										primaryColor: "#f59e0b", // Amber for New Year
										accentColor: "#eab308",
										progressColor: "#f59e0b",
									}}
									gamifiedBackgroundColor="bg-gradient-to-br from-yellow-400 to-yellow-600"
								/>
							</li>
						);
					})}
				</ul>
			</main>
			<footer className="w-full max-w-md py-4 text-center text-xs text-gray-500 dark:text-gray-500 mt-8">
				&copy; {new Date().getFullYear()} Next Holiday
			</footer>
		</div>
	);
}
