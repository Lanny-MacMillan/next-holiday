"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchCards } from "@/store/slices/cardsSlice";
import { fetchGifts } from "@/store/slices/giftListSlice";
import { fetchTasks } from "@/store/slices/tasksSlice";
import { BudgetDisplay } from "@/components/BudgetDisplay";
import GiftCard from "@/components/cards/gift/GiftCard";

const subsections = [
	{
		name: "Gift List",
		description: "Track your gift ideas",
		href: "/christmas/gift-list",
		sliceKey: "giftList",
	},
	{
		name: "Cards",
		description: "Track your holiday cards",
		href: "/christmas/cards",
		sliceKey: "cards",
	},
	{
		name: "Tasks",
		description: "Stay on top of your holiday to-dos",
		href: "/christmas/tasks",
		sliceKey: "tasks",
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

						return (
							<li key={section.name}>
								<Link
									href={section.href}
									className="block card card-cards rounded-2xl p-5 transition hover:scale-[1.02] active:scale-100"
								>
									{/* Gift Card for Gift List */}
									{section.sliceKey === "giftList" && (
										<GiftCard
											holiday="Christmas"
											theme={{
												primaryColor: "#22c55e", // Green for Christmas
												accentColor: "#eab308", // Yellow accent
											}}
										/>
									)}

									<div className="flex items-center justify-between mb-1">
										<h3 className="text-lg font-bold text-gray-800 dark:text-white">
											{section.name}
										</h3>
										<span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs font-medium px-2.5 py-0.5 rounded-full">
											{total}
										</span>
									</div>
									<p className="text-gray-600 dark:text-gray-400 text-sm">
										{section.description}
									</p>
									{/* Progress bar */}
									<div className="mt-3 w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
										<div
											className="bg-green-400 dark:bg-green-500 h-2 rounded-full transition-all"
											style={{ width: `${progress * 100}%` }}
										/>
									</div>
									{/* Progress text */}
									<div className="flex justify-between items-center mt-1">
										<span className="text-xs text-gray-500 dark:text-gray-500">
											{Math.round(progress * 100)}% complete
										</span>
										<span className="text-xs text-gray-500 dark:text-gray-500">
											{completed}/{total} items
										</span>
									</div>
								</Link>
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
