"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchAnniversaryGifts } from "@/store/slices/anniversary/anniversaryGiftListSlice";
import { fetchAnniversaryTasks } from "@/store/slices/anniversary/anniversaryTasksSlice";
import GiftListCard from "@/components/cards/gift/GiftListCard";
import HolidayTaskCard from "@/components/cards/holiday-task/HolidayTaskCard";

const subsections = [
	{
		name: "Gift Ideas",
		description: "Track anniversary gift ideas",
		href: "/anniversary/gift-list",
		sliceKey: "giftList",
		type: "gift-list",
	},
	{
		name: "Date Ideas",
		description: "Plan special anniversary dates",
		href: "/anniversary/date-ideas",
		sliceKey: "tasks",
		type: "task",
		category: "Planning",
	},
	{
		name: "Event Planning",
		description: "Organize anniversary celebrations",
		href: "/anniversary/events",
		sliceKey: "tasks",
		type: "task",
		category: "Events",
	},
];

export default function AnniversaryPage() {
	const dispatch = useAppDispatch();

	const gifts = useAppSelector((state: any) => state.anniversaryGiftList.gifts);
	const tasks = useAppSelector((state: any) => state.anniversaryTasks.tasks);

	useEffect(() => {
		// Fetch all data when component mounts if not already initialized
		dispatch(fetchAnniversaryGifts());
		dispatch(fetchAnniversaryTasks());
	}, [dispatch]);

	function getProgressData(sliceKey: string): {
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
		<div className="min-h-screen anniversary-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<header className="w-full max-w-md py-6">
				<div className="flex items-center justify-center relative">
					<Link
						href="/"
						className="absolute left-0 text-pink-600 hover:text-pink-800 dark:text-pink-400 dark:hover:text-pink-300 text-xl"
					>
						←
					</Link>
					<div className="text-center">
						<h1 className="text-3xl font-bold mb-2 text-gray-800 dark:text-white">
							Anniversary
						</h1>
						<p className="text-center text-gray-600 dark:text-gray-400">
							Plan romantic anniversaries and celebrations!
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
									<GiftListCard
										holiday="Anniversary"
										href={section.href}
										theme={{
											primaryColor: "#ec4899", // Pink for Anniversary
											accentColor: "#ec4899", // Pink accent
										}}
									/>
								</li>
							);
						} else {
							// Use HolidayTaskCard for tasks and other sections
							return (
								<li key={section.name}>
									<HolidayTaskCard
										holidayName="Anniversary"
										sectionName={section.name}
										description={section.description}
										href={section.href}
										totalItems={total}
										completedItems={completed}
										theme={{
											primaryColor: "#ec4899", // Pink for Anniversary
											accentColor: "#ec4899", // Pink accent
											progressColor: "#ec4899", // Pink for progress bar
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
