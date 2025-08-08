"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchEasterGifts } from "@/store/slices/easter/easterGiftListSlice";
import { fetchEasterTasks } from "@/store/slices/easter/easterTasksSlice";
import GiftListCard from "@/components/cards/gift/GiftListCard";
import HolidayTaskCard from "@/components/cards/holiday-task/HolidayTaskCard";

const subsections = [
	{
		name: "Gift List",
		description: "Track your Easter gift ideas",
		href: "/easter/gift-list",
		sliceKey: "giftList",
	},
	{
		name: "Basket List",
		description: "Track your Easter basket items",
		href: "/easter/basket-list",
		sliceKey: "tasks",
		category: "Basket List",
	},
	{
		name: "Event Planning",
		description: "Plan your Easter events and celebrations",
		href: "/easter/events",
		sliceKey: "tasks",
		category: "Events",
	},
	{
		name: "Decorations Checklist",
		description: "Stay on top of your Easter decorations",
		href: "/easter/decorations",
		sliceKey: "tasks",
		category: "Decorations",
	},
];

export default function EasterPage() {
	const dispatch = useAppDispatch();

	const gifts = useAppSelector((state: any) => state.easterGiftList.gifts);
	const tasks = useAppSelector((state: any) => state.easterTasks.tasks);

	useEffect(() => {
		// Fetch all data when component mounts if not already initialized
		// The DataInitializer component should handle this, but we'll keep this as a fallback
		dispatch(fetchEasterGifts());
		dispatch(fetchEasterTasks());
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
		<div className="min-h-screen easter-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<header className="w-full max-w-md py-6">
				<div className="flex items-center justify-center relative">
					<Link
						href="/"
						className="absolute left-0 text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 text-xl"
					>
						←
					</Link>
					<div className="text-center">
						<h1 className="text-3xl font-bold mb-2 text-gray-800 dark:text-white">
							Easter
						</h1>
						<p className="text-center text-gray-600 dark:text-gray-400">
							Plan your Easter with ease!
						</p>
					</div>
				</div>
			</header>
			<main className="flex-1 w-full max-w-4xl flex flex-col gap-6 mt-4">
				<ul className="flex flex-col gap-4">
					{subsections.map((section) => {
						const { total, completed, progress } = getProgressData(
							section.sliceKey,
							section.category
						);

						// Use GiftListCard for gift list sections
						if (section.sliceKey === "giftList") {
							return (
								<li key={section.name}>
									<GiftListCard
										holiday="Easter"
										href={section.href}
										theme={{
											primaryColor: "#a855f7", // Purple for Easter
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
									holidayName="Easter"
									sectionName={section.name}
									description={section.description}
									href={section.href}
									totalItems={total}
									completedItems={completed}
									theme={{
										primaryColor: "#a855f7", // Purple for Easter
										accentColor: "#eab308",
										progressColor: "#a855f7",
									}}
								/>
							</li>
						);
					})}
				</ul>
			</main>
		</div>
	);
}
