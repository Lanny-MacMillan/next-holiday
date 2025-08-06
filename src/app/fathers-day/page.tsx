"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchFathersDayGifts } from "@/store/slices/fathersDayGiftListSlice";
import { fetchFathersDayTasks } from "@/store/slices/fathersDayTasksSlice";
import GiftListCard from "@/components/cards/gift/GiftListCard";
import HolidayTaskCard from "@/components/cards/holiday-task/HolidayTaskCard";

const fathersDaySubsections = [
	{
		name: "Gift Ideas",
		description: "Track gift ideas for Father's Day",
		href: "/fathers-day/gift-list",
		sliceKey: "giftList",
	},
	{
		name: "Card List",
		description: "Track cards to send on Father's Day",
		href: "/fathers-day/cards",
		sliceKey: "cards",
	},
	{
		name: "Event Planning",
		description: "Plan Father's Day celebrations",
		href: "/fathers-day/events",
		sliceKey: "tasks",
		category: "Events",
	},
];

export default function FathersDayPage() {
	const dispatch = useAppDispatch();

	const gifts = useAppSelector((state: any) => state.fathersDayGiftList.gifts);
	const tasks = useAppSelector((state: any) => state.fathersDayTasks.tasks);

	useEffect(() => {
		dispatch(fetchFathersDayGifts());
		dispatch(fetchFathersDayTasks());
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
		<div className="min-h-screen fathers-day-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
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
							👨 Father's Day
						</h1>
						<p className="text-center text-gray-600 dark:text-gray-400">
							Honor and celebrate Dad!
						</p>
					</div>
				</div>
			</header>
			<main className="flex-1 w-full max-w-md flex flex-col gap-6 mt-4">
				<ul className="flex flex-col gap-4">
					{fathersDaySubsections.map((section) => {
						const { total, completed } = getProgressData(
							section.sliceKey,
							section.category
						);

						// Use GiftListCard for gift list sections
						if (section.sliceKey === "giftList") {
							return (
								<li key={section.name}>
									<GiftListCard
										holiday="Father's Day"
										href={section.href}
										theme={{
											primaryColor: "#3b82f6", // Blue for Father's Day
											accentColor: "#60a5fa",
										}}
									/>
								</li>
							);
						}

						// Use HolidayTaskCard for task sections
						return (
							<li key={section.name}>
								<HolidayTaskCard
									holidayName="Father's Day"
									sectionName={section.name}
									description={section.description}
									href={section.href}
									totalItems={total}
									completedItems={completed}
									theme={{
										primaryColor: "#3b82f6", // Blue for Father's Day
										accentColor: "#60a5fa",
										progressColor: "#3b82f6",
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
