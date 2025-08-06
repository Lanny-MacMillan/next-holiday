"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchMothersDayTasks } from "@/store/slices/mothers-day/mothersDayTasksSlice";
import HolidayTaskCard from "@/components/cards/holiday-task/HolidayTaskCard";

export default function MothersDayEventsPage() {
	const dispatch = useAppDispatch();
	const tasks = useAppSelector((state: any) => state.mothersDayTasks.tasks);

	useEffect(() => {
		dispatch(fetchMothersDayTasks());
	}, [dispatch]);

	const eventTasks = tasks.filter((task: any) => task.category === "Events");
	const total = eventTasks.length;
	const completed = eventTasks.filter((task: any) => task.isCompleted).length;

	return (
		<div className="min-h-screen mothers-day-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<header className="w-full max-w-md py-6">
				<div className="flex items-center justify-center relative">
					<Link
						href="/mothers-day"
						className="absolute left-0 text-pink-600 hover:text-pink-800 dark:text-pink-400 dark:hover:text-pink-300 text-xl"
					>
						←
					</Link>
					<div className="text-center">
						<h1 className="text-3xl font-bold mb-2 text-gray-800 dark:text-white">
							🌸 Mother's Day Events
						</h1>
						<p className="text-center text-gray-600 dark:text-gray-400">
							Plan your Mother's Day celebrations
						</p>
					</div>
				</div>
			</header>
			<main className="flex-1 w-full max-w-md flex flex-col gap-6 mt-4">
				<HolidayTaskCard
					holidayName="Mother's Day"
					sectionName="Event Planning"
					description="Plan Mother's Day celebrations"
					href="/mothers-day/events"
					totalItems={total}
					completedItems={completed}
					theme={{
						primaryColor: "#ec4899",
						accentColor: "#f472b6",
						progressColor: "#ec4899",
					}}
				/>
			</main>
		</div>
	);
}
