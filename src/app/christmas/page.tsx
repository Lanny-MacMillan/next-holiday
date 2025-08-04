"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchCards } from "@/store/slices/cardsSlice";
import { fetchGifts } from "@/store/slices/giftListSlice";
import { fetchTasks } from "@/store/slices/tasksSlice";
import { BudgetDisplay } from "@/components/BudgetDisplay";
import GiftCard from "@/components/cards/gift/GiftCard";
import HolidayTaskCard from "@/components/cards/holiday-task/HolidayTaskCard";

const subsections = [
	{
		name: "Gift List",
		description: "Track your gift ideas",
		href: "/christmas/gift-list",
		sliceKey: "giftList",
		type: "gift-list",
	},
	{
		name: "Cards",
		description: "Track your holiday cards",
		href: "/christmas/cards",
		sliceKey: "cards",
		type: "task",
	},
	{
		name: "Tasks",
		description: "Stay on top of your holiday to-dos",
		href: "/christmas/tasks",
		sliceKey: "tasks",
		type: "task",
	},
];

export default function ChristmasPage() {
	const dispatch = useAppDispatch();

	const cards = useAppSelector((state: any) => state.cards.cards);
	const gifts = useAppSelector((state: any) => state.giftList.gifts);
	const tasks = useAppSelector((state: any) => state.tasks.tasks);

	useEffect(() => {
		// Fetch all data when component mounts if not already initialized
		// The DataInitializer component should handle this, but we'll keep this as a fallback
		dispatch(fetchCards());
		dispatch(fetchGifts());
		dispatch(fetchTasks());
	}, [dispatch]);

	function getProgressData(sliceKey: string): {
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
				total = tasks.length;
				completed = tasks.filter((task: any) => task.isCompleted).length;
				break;
			default:
				total = 0;
				completed = 0;
		}

		const progress = total > 0 ? completed / total : 0;

		return { total, completed, progress };
	}

	return (
		<div className="min-h-screen christmas-cards-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<header className="w-full max-w-md py-6">
				<div className="flex items-center justify-center relative">
					<Link
						href="/"
						className="absolute left-0 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-xl"
					>
						←
					</Link>
					<div className="text-center">
						<h1 className="text-3xl font-bold mb-2 text-gray-800 dark:text-white">
							Christmas
						</h1>
						<p className="text-center text-gray-600 dark:text-gray-400">
							Plan your Christmas with ease!
						</p>
					</div>
				</div>
			</header>
			<main className="flex-1 w-full max-w-md flex flex-col gap-6 mt-4">
				<ul className="flex flex-col gap-4">
					{subsections.map((section) => {
						const { total, completed, progress } = getProgressData(
							section.sliceKey
						);

						// Determine which card component to use based on type
						if (section.type === "gift-list") {
							return (
								<li key={section.name}>
									<GiftCard
										holiday="Christmas"
										href={section.href}
										theme={{
											primaryColor: "#22c55e", // Green for Christmas
											accentColor: "#ea0808", // Yellow accent
										}}
									/>
								</li>
							);
						} else {
							// Use HolidayTaskCard for tasks and other sections
							return (
								<li key={section.name}>
									<HolidayTaskCard
										holidayName="Christmas"
										sectionName={section.name}
										description={section.description}
										href={section.href}
										totalItems={total}
										completedItems={completed}
										theme={{
											primaryColor: "#22c55e", // Green for Christmas
											accentColor: "#ea0808", // Yellow accent
											progressColor: "#22c55e", // Green for progress bar
										}}
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
