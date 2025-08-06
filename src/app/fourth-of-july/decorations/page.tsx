"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchFourthOfJulyTasks } from "@/store/slices/fourth-of-july/fourthOfJulyTasksSlice";
import HolidayTaskCard from "@/components/cards/holiday-task/HolidayTaskCard";

export default function FourthOfJulyDecorationsPage() {
	const dispatch = useAppDispatch();
	const tasks = useAppSelector((state: any) => state.fourthOfJulyTasks.tasks);

	useEffect(() => {
		dispatch(fetchFourthOfJulyTasks());
	}, [dispatch]);

	const decorationTasks = tasks.filter(
		(task: any) => task.category === "Decorations"
	);
	const total = decorationTasks.length;
	const completed = decorationTasks.filter(
		(task: any) => task.isCompleted
	).length;

	return (
		<div className="min-h-screen fourth-of-july-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<header className="w-full max-w-md py-6">
				<div className="flex items-center justify-center relative">
					<Link
						href="/fourth-of-july"
						className="absolute left-0 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-xl"
					>
						←
					</Link>
					<div className="text-center">
						<h1 className="text-3xl font-bold mb-2 text-gray-800 dark:text-white">
							🎆 Fourth of July Decorations
						</h1>
						<p className="text-center text-gray-600 dark:text-gray-400">
							Track decorations and supplies
						</p>
					</div>
				</div>
			</header>
			<main className="flex-1 w-full max-w-md flex flex-col gap-6 mt-4">
				<HolidayTaskCard
					holidayName="Fourth of July"
					sectionName="Decorations Checklist"
					description="Track decorations and supplies"
					href="/fourth-of-july/decorations"
					totalItems={total}
					completedItems={completed}
					theme={{
						primaryColor: "#dc2626",
						accentColor: "#f87171",
						progressColor: "#dc2626",
					}}
				/>
			</main>
		</div>
	);
}
