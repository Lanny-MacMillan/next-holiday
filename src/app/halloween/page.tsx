"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchCards } from "@/store/slices/cardsSlice";
import { fetchHalloweenGifts } from "@/store/slices/halloweenGiftListSlice";
import { fetchHalloweenTasks } from "@/store/slices/halloweenTasksSlice";
import { fetchContacts } from "@/store/slices/addressBookSlice";
import { BudgetDisplay } from "@/components/BudgetDisplay";

const subsections = [
	{
		name: "Trick-or-Treat Prep",
		description: "List of things needed for trick-or-treating",
		href: "/halloween/trick-or-treat-prep",
		sliceKey: "tasks",
		category: "Trick-or-Treat Prep",
	},
	{
		name: "Costume Ideas",
		description: "List of possible costume ideas and who they may be for",
		href: "/halloween/costume-ideas",
		sliceKey: "tasks",
		category: "Costume Ideas",
	},
	{
		name: "Decorations Checklist",
		description: "Stay on top of your Halloween decorations",
		href: "/halloween/decorations",
		sliceKey: "tasks",
		category: "Decorations Checklist",
	},
];

export default function HalloweenPage() {
	const dispatch = useAppDispatch();

	const cards = useAppSelector((state: any) => state.cards.cards);
	const gifts = useAppSelector((state: any) => state.halloweenGiftList.gifts);
	const tasks = useAppSelector((state: any) => state.halloweenTasks.tasks);
	const contacts = useAppSelector((state: any) => state.addressBook.contacts);

	useEffect(() => {
		dispatch(fetchCards());
		dispatch(fetchHalloweenGifts());
		dispatch(fetchHalloweenTasks());
		dispatch(fetchContacts());
	}, [dispatch]);

	function getProgressData(sliceKey: string, category?: string) {
		let total = 0;
		let completed = 0;

		switch (sliceKey) {
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
		<div className="min-h-screen halloween-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
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
					🎃 Halloween
				</h1>
				<p className="text-center text-gray-600 dark:text-gray-400">
					Plan your spooky celebrations and trick-or-treating adventures!
				</p>
			</header>

			<main className="w-full max-w-2xl flex flex-col gap-6">
				<div className="mb-4">
					<BudgetDisplay holiday="Halloween" />
				</div>

				<div className="grid gap-4">
					{subsections.map((section) => {
						const progressData = getProgressData(
							section.sliceKey,
							section.category
						);
						return (
							<Link
								key={section.name}
								href={section.href}
								className="card rounded-lg p-6 transition hover:scale-[1.02] active:scale-100"
							>
								<div className="flex justify-between items-start mb-2">
									<div>
										<h3 className="text-lg font-semibold text-gray-800 dark:text-white">
											{section.name}
										</h3>
										<p className="text-gray-600 dark:text-gray-400 text-sm">
											{section.description}
										</p>
									</div>
									<span className="text-2xl text-gray-300 dark:text-gray-600">
										→
									</span>
								</div>
								<div className="mt-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
									<div
										className="bg-orange-400 dark:bg-orange-500 h-2 rounded-full transition-all"
										style={{ width: `${progressData.progress * 100}%` }}
									/>
								</div>
								<div className="flex justify-between items-center mt-1">
									<span className="text-xs text-gray-500 dark:text-gray-500">
										{Math.round(progressData.progress * 100)}% complete
									</span>
									<span className="text-xs text-gray-500 dark:text-gray-500">
										{progressData.completed}/{progressData.total} items
									</span>
								</div>
							</Link>
						);
					})}
				</div>
			</main>
		</div>
	);
}
