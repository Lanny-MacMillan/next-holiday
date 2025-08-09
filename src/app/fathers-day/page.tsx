"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchFathersDayGifts } from "@/store/slices/fathers-day/fathersDayGiftListSlice";
import { fetchFathersDayTasks } from "@/store/slices/fathers-day/fathersDayTasksSlice";
import { fetchFathersDayCards } from "@/store/slices/fathers-day/fathersDayCardsSlice";
import GiftListCard from "@/components/cards/gift/GiftListCard";
import HolidayTaskCard from "@/components/cards/holiday-task/HolidayTaskCard";
import HolidayHeader from "@/components/common/HolidayHeader";

const fathersDaySubsections = [
	{
		name: "Gift Ideas",
		description: "Track gift ideas for Father's Day",
		href: "/fathers-day/gift-list",
		sliceKey: "fathersDayGiftList",
		category: "Gifts",
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
	const cards = useAppSelector((state: any) => state.fathersDayCards.cards);

	useEffect(() => {
		dispatch(fetchFathersDayGifts());
		dispatch(fetchFathersDayTasks());
		dispatch(fetchFathersDayCards());
	}, [dispatch]);

	function getProgressData(sliceKey: string, category?: string) {
		let total = 0;
		let completed = 0;

		switch (sliceKey) {
			case "giftList":
			case "fathersDayGiftList":
				total = gifts.length;
				completed = gifts.filter((gift: any) => gift.isCompleted).length;
				break;
			case "cards":
				total = cards.length;
				completed = cards.filter((card: any) => card.isCompleted).length;
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
			<HolidayHeader
				holidayName="👨 Father's Day"
				description="Honor and celebrate Dad!"
			/>
			<main className="flex-1 w-full max-w-4xl flex flex-col gap-6 mt-4">
				<ul className="flex flex-col gap-4">
					{fathersDaySubsections.map((section) => {
						const { total, completed } = getProgressData(
							section.sliceKey,
							section.category
						);

						// Use GiftListCard for gift list sections
						if (
							section.sliceKey === "giftList" ||
							section.sliceKey === "fathersDayGiftList"
						) {
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
