"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchValentinesGifts } from "@/store/slices/valentines/valentinesGiftListSlice";
import { fetchValentinesTasks } from "@/store/slices/valentines/valentinesTasksSlice";
import GiftListCard from "@/components/cards/gift/GiftListCard";
import HolidayTaskCard from "@/components/cards/holiday-task/HolidayTaskCard";

const subsections = [
	{
		name: "Gift List",
		description: "Track your Valentine's gift ideas",
		href: "/valentines/gift-list",
		sliceKey: "valentinesGiftList",
	},
	{
		name: "Date Ideas",
		description: "Plan romantic activities and dates",
		href: "/valentines/date-ideas",
		sliceKey: "valentinesTasks",
		category: "Date Ideas",
	},
	{
		name: "Card List",
		description: "Track your Valentine's cards",
		href: "/valentines/cards",
		sliceKey: "valentinesTasks",
		category: "Cards",
	},
	{
		name: "Reservations Tracker",
		description: "Track restaurant and activity reservations",
		href: "/valentines/reservations",
		sliceKey: "valentinesTasks",
		category: "Reservations",
	},
];

export default function ValentinesPage() {
	const dispatch = useAppDispatch();

	const valentinesGifts = useAppSelector(
		(state: any) => state.valentinesGiftList.gifts
	);
	const valentinesTasks = useAppSelector(
		(state: any) => state.valentinesTasks.tasks
	);

	useEffect(() => {
		// Fetch all data when component mounts if not already initialized
		dispatch(fetchValentinesGifts());
		dispatch(fetchValentinesTasks());
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
			case "valentinesGiftList":
				total = valentinesGifts.length;
				completed = valentinesGifts.filter(
					(gift: any) => gift.isCompleted
				).length;
				break;
			case "valentinesTasks":
				// Filter tasks by category if provided
				const filteredTasks = category
					? valentinesTasks.filter((task: any) => task.category === category)
					: valentinesTasks;
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
		<div className="min-h-screen valentines-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
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
							Valentine's Day
						</h1>
						<p className="text-center text-gray-600 dark:text-gray-400">
							Plan your romantic celebration with ease!
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
						if (section.sliceKey === "valentinesGiftList") {
							return (
								<li key={section.name}>
									<GiftListCard
										holiday="Valentine's Day"
										href={section.href}
										theme={{
											primaryColor: "#ec4899", // Pink for Valentine's Day
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
									holidayName="Valentine's Day"
									sectionName={section.name}
									description={section.description}
									href={section.href}
									totalItems={total}
									completedItems={completed}
									theme={{
										primaryColor: "#ec4899", // Pink for Valentine's Day
										accentColor: "#eab308",
										progressColor: "#ec4899",
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
