"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchMothersDayGifts } from "@/store/slices/mothers-day/mothersDayGiftListSlice";
import { fetchMothersDayTasks } from "@/store/slices/mothers-day/mothersDayTasksSlice";
import GiftListCard from "@/components/cards/gift/GiftListCard";
import HolidayTaskCard from "@/components/cards/holiday-task/HolidayTaskCard";
import HolidayHeader from "@/components/common/HolidayHeader";

const mothersDaySubsections = [
	{
		name: "Gift Ideas",
		description: "Track gift ideas for Mother's Day",
		href: "/mothers-day/gift-list",
		sliceKey: "mothersDayGiftList",
		category: "Gifts",
	},
	{
		name: "Card List",
		description: "Track cards to send on Mother's Day",
		href: "/mothers-day/cards",
		sliceKey: "cards",
	},

	{
		name: "Event Planning",
		description: "Plan Mother's Day celebrations",
		href: "/mothers-day/events",
		sliceKey: "tasks",
		category: "Events",
	},
];

export default function MothersDayPage() {
	const dispatch = useAppDispatch();

	const gifts = useAppSelector((state: any) => state.mothersDayGiftList.gifts);
	const tasks = useAppSelector((state: any) => state.mothersDayTasks.tasks);

	useEffect(() => {
		dispatch(fetchMothersDayGifts());
		dispatch(fetchMothersDayTasks());
	}, [dispatch]);

	function getProgressData(sliceKey: string, category?: string) {
		let total = 0;
		let completed = 0;

		switch (sliceKey) {
			case "giftList":
			case "mothersDayGiftList":
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
		<div className="min-h-screen mothers-day-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayHeader
				holidayName="🌸 Mother's Day"
				description="Show your love and appreciation!"
			/>
			<main className="flex-1 w-full max-w-4xl flex flex-col gap-6 mt-4">
				<ul className="flex flex-col gap-4">
					{mothersDaySubsections.map((section) => {
						const { total, completed } = getProgressData(
							section.sliceKey,
							section.category
						);

						// Use GiftListCard for gift list sections
						if (
							section.sliceKey === "giftList" ||
							section.sliceKey === "mothersDayGiftList"
						) {
							return (
								<li key={section.name}>
									<GiftListCard
										holiday="Mother's Day"
										href={section.href}
										theme={{
											primaryColor: "#ec4899", // Pink for Mother's Day
											accentColor: "#f472b6",
										}}
										gamifiedBackgroundColor="bg-gradient-to-br from-pink-300 to-pink-500"
									/>
								</li>
							);
						}

						// Use HolidayTaskCard for task sections
						return (
							<li key={section.name}>
								<HolidayTaskCard
									holidayName="Mother's Day"
									sectionName={section.name}
									description={section.description}
									href={section.href}
									totalItems={total}
									completedItems={completed}
									theme={{
										primaryColor: "#ec4899", // Pink for Mother's Day
										accentColor: "#f472b6",
										progressColor: "#ec4899",
									}}
									gamifiedBackgroundColor="bg-gradient-to-br from-pink-300 to-pink-500"
								/>
							</li>
						);
					})}
				</ul>
			</main>
		</div>
	);
}
