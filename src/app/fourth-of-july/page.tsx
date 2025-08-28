"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchFourthOfJulyTasks } from "@/store/slices/fourth-of-july/fourthOfJulyTasksSlice";
import HolidayTaskCard from "@/components/cards/holiday-task/HolidayTaskCard";
import GuestListCard from "@/components/cards/guest/GuestListCard";
import GiftListCard from "@/components/cards/gift/GiftListCard";
import HolidayHeader from "@/components/common/HolidayHeader";
import CountdownWithInvite from "@/components/common/CountdownWithInvite";
import SharedIndicator from "@/components/common/SharedIndicator";

const fourthOfJulySubsections = [
	{
		name: "Supplies List",
		description: "Track all your Fourth of July supplies",
		href: "/fourth-of-july/supplies-list",
		sliceKey: "gifts",
		type: "gift-list",
	},
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
			case "gifts":
				// For supplies list, we'll show 0 progress since it's handled by RTK Query
				total = 0;
				completed = 0;
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
			<HolidayHeader
				holidayName="🎆 Fourth of July"
				description="Celebrate independence and freedom!"
			/>
			<main className="flex-1 w-full max-w-4xl flex flex-col gap-6 mt-4">
				<ul className="flex flex-col gap-4">
					{fourthOfJulySubsections.map((section) => {
						const { total, completed } = getProgressData(
							section.sliceKey,
							section.category
						);

						// Use GiftListCard for gift list sections
						if (section.type === "gift-list") {
							return (
								<li key={section.name}>
									<GiftListCard
										holiday="Fourth of July"
										href={section.href}
										theme={{
											primaryColor: "#dc2626", // Red for Fourth of July
											accentColor: "#dc2626", // Red accent
										}}
										gamifiedBackgroundColor="bg-gradient-to-br from-red-400 to-red-600"
									/>
								</li>
							);
						}

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
										holidayColor="bg-gradient-to-br from-red-400 to-red-600"
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
									gamifiedBackgroundColor="bg-gradient-to-br from-red-400 to-red-600"
								/>
							</li>
						);
					})}
				</ul>
			</main>
		</div>
	);
}
