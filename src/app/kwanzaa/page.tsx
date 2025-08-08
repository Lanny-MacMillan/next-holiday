"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchKwanzaaGifts } from "@/store/slices/kwanzaa/kwanzaaGiftListSlice";
import { fetchKwanzaaTasks } from "@/store/slices/kwanzaa/kwanzaaTasksSlice";
import GiftListCard from "@/components/cards/gift/GiftListCard";
import HolidayTaskCard from "@/components/cards/holiday-task/HolidayTaskCard";

const subsections = [
	{
		name: "Gift List",
		description: "Track your Kwanzaa gift ideas",
		href: "/kwanzaa/gift-list",
		sliceKey: "giftList",
		category: undefined,
	},
	{
		name: "Daily Principle Tracker",
		description: "Track the seven principles of Kwanzaa",
		href: "/kwanzaa/daily-principles",
		sliceKey: "tasks",
		category: "Daily Principles",
	},
	{
		name: "Events",
		description: "Plan your Kwanzaa events and celebrations",
		href: "/kwanzaa/events",
		sliceKey: "tasks",
		category: "Events",
	},
	{
		name: "Decorations Checklist",
		description: "Stay on top of your Kwanzaa decorations",
		href: "/kwanzaa/decorations",
		sliceKey: "tasks",
		category: "Decorations",
	},
];

export default function HanukkahPage() {
	const dispatch = useAppDispatch();

	const gifts = useAppSelector((state: any) => state.kwanzaaGiftList.gifts);
	const tasks = useAppSelector((state: any) => state.kwanzaaTasks.tasks);

	useEffect(() => {
		// Fetch all data when component mounts if not already initialized
		// The DataInitializer component should handle this, but we'll keep this as a fallback
		dispatch(fetchKwanzaaGifts());
		dispatch(fetchKwanzaaTasks());
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
		<div className="min-h-screen kwanzaa-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<header className="w-full max-w-md py-6">
				<div className="flex items-center justify-center relative">
					<Link
						href="/"
						className="absolute left-0 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-xl"
					>
						←
					</Link>
					<div className="text-center">
						<h1 className="text-3xl font-bold mb-2 text-gray-800 dark:text-white">
							Kwanzaa
						</h1>
						<p className="text-center text-gray-600 dark:text-gray-400">
							Plan your Kwanzaa with ease!
						</p>
					</div>
				</div>
			</header>
			<main className="flex-1 w-full max-w-4xl flex flex-col gap-6 mt-4">
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
										holiday="Kwanzaa"
										href={section.href}
										theme={{
											primaryColor: "#dc2626", // Red for Kwanzaa
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
									holidayName="Kwanzaa"
									sectionName={section.name}
									description={section.description}
									href={section.href}
									totalItems={total}
									completedItems={completed}
									theme={{
										primaryColor: "#dc2626", // Red for Kwanzaa
										accentColor: "#eab308",
										progressColor: "#dc2626",
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
