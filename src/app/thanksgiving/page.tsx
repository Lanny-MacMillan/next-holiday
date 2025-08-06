"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchThanksgivingGifts } from "@/store/slices/thanksgivingGiftListSlice";
import { fetchThanksgivingTasks } from "@/store/slices/thanksgivingTasksSlice";
import { BudgetDisplay } from "@/components/common/BudgetDisplay";
import GiftListCard from "@/components/cards/gift/GiftListCard";
import HolidayTaskCard from "@/components/cards/holiday-task/HolidayTaskCard";

const subsections = [
	{
		name: "Shopping List",
		description: "List of ingredients and supplies needed",
		href: "/thanksgiving/shopping-list",
		sliceKey: "giftList", // Changed from "tasks" to "giftList" to use GiftListCard
		category: "Shopping List",
	},
	{
		name: "Meal Planning",
		description: "Plan your Thanksgiving menu and dishes",
		href: "/thanksgiving/meal-planning",
		sliceKey: "tasks",
		category: "Meal Planning",
	},
	{
		name: "Guest List",
		description: "Manage your Thanksgiving guest list",
		href: "/thanksgiving/guest-list",
		sliceKey: "tasks",
		category: "Guest List",
	},
	{
		name: "Decorations Checklist",
		description: "Stay on top of your Thanksgiving decorations",
		href: "/thanksgiving/decorations-checklist",
		sliceKey: "tasks",
		category: "Decorations Checklist",
	},
];

export default function ThanksgivingPage() {
	const dispatch = useAppDispatch();

	const gifts = useAppSelector(
		(state: any) => state.thanksgivingGiftList.gifts
	);
	const tasks = useAppSelector((state: any) => state.thanksgivingTasks.tasks);

	useEffect(() => {
		dispatch(fetchThanksgivingGifts());
		dispatch(fetchThanksgivingTasks());
	}, [dispatch]);

	function getProgressData(sliceKey: string, category?: string) {
		let total = 0;
		let completed = 0;

		switch (sliceKey) {
			case "giftList":
				total = gifts.length;
				completed = gifts.filter((gift: any) => gift.isCompleted).length;
				break;
			case "tasks":
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
		<div className="min-h-screen thanksgiving-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<header className="w-full max-w-2xl py-6 flex flex-col items-center relative">
				<Link
					href="/"
					className="absolute left-0 top-10 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
				>
					<svg
						className="w-6 h-6"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M15 19l-7-7 7-7"
						/>
					</svg>
				</Link>
				<h1 className="text-3xl font-bold mb-2 text-gray-800 dark:text-white">
					🦃 Thanksgiving
				</h1>
				<p className="text-center text-gray-600 dark:text-gray-400">
					Plan your feast, guests, and gratitude!
				</p>
			</header>

			<main className="w-full max-w-2xl flex flex-col gap-6">
				<div className="grid gap-4">
					{subsections.map((section) => {
						const { total, completed } = getProgressData(
							section.sliceKey,
							section.category
						);

						// Use GiftListCard for shopping list (budget tracking) and gift list sections
						if (section.sliceKey === "giftList") {
							return (
								<GiftListCard
									key={section.name}
									holiday="Thanksgiving"
									href={section.href}
									theme={{
										primaryColor: "#d97706", // Amber for Thanksgiving
										accentColor: "#eab308",
									}}
								/>
							);
						}

						// Use HolidayTaskCard for task sections
						return (
							<HolidayTaskCard
								key={section.name}
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
							/>
						);
					})}
				</div>
			</main>
		</div>
	);
}
