"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchNewYearGifts } from "@/store/slices/new-year/newYearGiftListSlice";
import { fetchNewYearTasks } from "@/store/slices/new-year/newYearTasksSlice";
import { BudgetDisplay } from "@/components/common/BudgetDisplay";
import GiftListCard from "@/components/cards/gift/GiftListCard";
import HolidayTaskCard from "@/components/cards/holiday-task/HolidayTaskCard";

const subsections = [
	{
		name: "Supplies List",
		description: "Track your party supplies and fireworks",
		href: "/new-year/supplies-list",
		sliceKey: "giftList",
		category: undefined,
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
			<header className="w-full max-w-md py-6">
				<div className="flex items-center justify-center relative">
					<Link
						href="/"
						className="absolute left-0 text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300 text-xl"
					>
						←
					</Link>
					<div className="text-center">
						<h1 className="text-3xl font-bold mb-2 text-gray-800 dark:text-white">
							New Year
						</h1>
						<p className="text-center text-gray-600 dark:text-gray-400">
							Plan your New Year with ease!
						</p>
					</div>
				</div>
			</header>
			<main className="flex-1 w-full max-w-md flex flex-col gap-6 mt-4">
				<ul className="flex flex-col gap-4">
					{subsections.map((section) => {
						const { total, completed } = getProgressData(
							section.sliceKey,
							section.category
						);

						// Use GiftListCard for gift list sections
						if (section.sliceKey === "giftList") {
							return (
								<li key={section.name}>
									<GiftListCard
										holiday="New Year"
										href={section.href}
										theme={{
											primaryColor: "#f59e0b", // Amber for New Year
											accentColor: "#eab308",
										}}
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
