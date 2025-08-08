"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchHalloweenTasks } from "@/store/slices/halloween/halloweenTasksSlice";
import GiftListCard from "@/components/cards/gift/GiftListCard";
import HolidayTaskCard from "@/components/cards/holiday-task/HolidayTaskCard";
import HolidayHeader from "@/components/common/HolidayHeader";

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
			<HolidayHeader
				holidayName="🎃 Halloween"
				description="Plan your spooky celebrations and trick-or-treating adventures!"
			/>
			<main className="flex-1 w-full max-w-4xl flex flex-col gap-6 mt-4">
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
