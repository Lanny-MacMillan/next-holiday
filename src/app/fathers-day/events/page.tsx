"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchFathersDayTasks } from "@/store/slices/fathersDayTasksSlice";
import HolidayTaskCard from "@/components/cards/holiday-task/HolidayTaskCard";

export default function FathersDayEventsPage() {
	const dispatch = useAppDispatch();
	const tasks = useAppSelector((state: any) => state.fathersDayTasks.tasks);

	useEffect(() => {
		dispatch(fetchFathersDayTasks());
	}, [dispatch]);

	const eventTasks = tasks.filter((task: any) => task.category === "Events");
	const total = eventTasks.length;
	const completed = eventTasks.filter((task: any) => task.isCompleted).length;

	return (
		<div className="min-h-screen fathers-day-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<header className="w-full max-w-md py-6">
				<div className="flex items-center justify-center relative">
					<Link
						href="/fathers-day"
						className="absolute left-0 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-xl"
					>
						←
					</Link>
					<div className="text-center">
						<h1 className="text-3xl font-bold mb-2 text-gray-800 dark:text-white">
							👨 Father's Day Events
						</h1>
						<p className="text-center text-gray-600 dark:text-gray-400">
							Plan Father's Day celebrations
						</p>
					</div>
				</div>
			</header>
			<main className="flex-1 w-full max-w-md flex flex-col gap-6 mt-4">
				<HolidayTaskCard
					holidayName="Father's Day"
					sectionName="Event Planning"
					description="Plan Father's Day celebrations"
					href="/fathers-day/events"
					totalItems={total}
					completedItems={completed}
					theme={{
						primaryColor: "#3b82f6",
						accentColor: "#60a5fa",
						progressColor: "#3b82f6",
					}}
				/>
			</main>
		</div>
	);
}
