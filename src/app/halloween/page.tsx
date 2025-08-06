"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchHalloweenTasks } from "@/store/slices/halloween/halloweenTasksSlice";
import GiftListCard from "@/components/cards/gift/GiftListCard";
import HolidayTaskCard from "@/components/cards/holiday-task/HolidayTaskCard";

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

	const tasks = useAppSelector((state: any) => state.halloweenTasks.tasks);

	useEffect(() => {
		dispatch(fetchHalloweenTasks());
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
			<header className="w-full max-w-md py-6">
				<div className="flex items-center justify-center relative">
					<Link
						href="/"
						className="absolute left-0 text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300 text-xl"
					>
						←
					</Link>
					<div className="text-center">
						<h1 className="text-3xl font-bold mb-2 text-gray-800 dark:text-white">
							🎃 Halloween
						</h1>
						<p className="text-center text-gray-600 dark:text-gray-400">
							Plan your spooky celebrations and trick-or-treating adventures!
						</p>
					</div>
				</div>
			</header>
			<main className="flex-1 w-full max-w-md flex flex-col gap-6 mt-4">
				<ul className="flex flex-col gap-4">
					{/* Gift List Card */}
					<li>
						<GiftListCard
							holiday="Halloween"
							href="/halloween/gift-list"
							theme={{
								primaryColor: "#f97316", // Orange for Halloween
								accentColor: "#eab308",
							}}
						/>
					</li>

					{subsections.map((section) => {
						const { total, completed } = getProgressData(
							section.sliceKey,
							section.category
						);

						return (
							<li key={section.name}>
								<HolidayTaskCard
									holidayName="Halloween"
									sectionName={section.name}
									description={section.description}
									href={section.href}
									totalItems={total}
									completedItems={completed}
									theme={{
										primaryColor: "#f97316", // Orange for Halloween
										accentColor: "#eab308",
										progressColor: "#f97316",
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
