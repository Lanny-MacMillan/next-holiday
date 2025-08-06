"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchFourthOfJulyTasks } from "@/store/slices/fourth-of-july/fourthOfJulyTasksSlice";
import HolidayTaskCard from "@/components/cards/holiday-task/HolidayTaskCard";
import GuestListCard from "@/components/cards/guest/GuestListCard";

const fourthOfJulySubsections = [
	{
		name: "Event Planning",
		description: "Plan your Fourth of July celebrations",
		href: "/fourth-of-july/events",
		sliceKey: "tasks",
		category: "Events",
	},
	{
		name: "Guest List",
		description: "Manage your guest list",
		href: "/fourth-of-july/guest-list",
		sliceKey: "addressBook",
	},
	{
		name: "Decorations Checklist",
		description: "Track decorations and supplies",
		href: "/fourth-of-july/decorations",
		sliceKey: "tasks",
		category: "Decorations",
	},
];

export default function FourthOfJulyPage() {
	const dispatch = useAppDispatch();

	const tasks = useAppSelector((state: any) => state.fourthOfJulyTasks.tasks);

	useEffect(() => {
		dispatch(fetchFourthOfJulyTasks());
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
		<div className="min-h-screen fourth-of-july-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
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
							🎆 Fourth of July
						</h1>
						<p className="text-center text-gray-600 dark:text-gray-400">
							Celebrate independence and freedom!
						</p>
					</div>
				</div>
			</header>
			<main className="flex-1 w-full max-w-md flex flex-col gap-6 mt-4">
				<ul className="flex flex-col gap-4">
					{fourthOfJulySubsections.map((section) => {
						const { total, completed } = getProgressData(
							section.sliceKey,
							section.category
						);

						// Use GuestListCard for guest list section
						if (section.sliceKey === "addressBook") {
							return (
								<li key={section.name}>
									<GuestListCard
										holiday="Fourth of July"
										href={section.href}
										theme={{
											primaryColor: "#dc2626", // Red for Fourth of July
											accentColor: "#f87171",
										}}
									/>
								</li>
							);
						}

						// Use HolidayTaskCard for task sections
						return (
							<li key={section.name}>
								<HolidayTaskCard
									holidayName="Fourth of July"
									sectionName={section.name}
									description={section.description}
									href={section.href}
									totalItems={total}
									completedItems={completed}
									theme={{
										primaryColor: "#dc2626", // Red for Fourth of July
										accentColor: "#f87171",
										progressColor: "#dc2626",
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
