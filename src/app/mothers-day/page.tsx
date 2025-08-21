"use client";

import { useAppSelector } from "@/store/hooks";
import { useAuth0 } from "@auth0/auth0-react";
import { useFormModalMutation } from "@/hooks/useFormModalMutation";
import {
	useGetGiftsQuery,
	useGetCardsQuery,
	useGetTasksQuery,
} from "@/store/api";
import GiftListCard from "@/components/cards/gift/GiftListCard";
import HolidayTaskCard from "@/components/cards/holiday-task/HolidayTaskCard";
import HolidayHeader from "@/components/common/HolidayHeader";

const mothersDaySubsections = [
	{
		name: "Gift Ideas",
		description: "Track gift ideas for Mother's Day",
		href: "/mothers-day/gift-list",
		sliceKey: "giftList",
		category: "Gifts",
		type: "gift-list",
	},
	{
		name: "Card List",
		description: "Track cards to send on Mother's Day",
		href: "/mothers-day/cards",
		sliceKey: "cards",
		type: "task",
	},
	{
		name: "Event Planning",
		description: "Plan Mother's Day celebrations",
		href: "/mothers-day/events",
		sliceKey: "tasks",
		category: "Events",
		type: "task",
	},
];

export default function MothersDayPage() {
	const { user: auth0User } = useAuth0();
	const { holidayId } = useFormModalMutation();

	// Use RTK Query to fetch data
	const { data: gifts = [] } = useGetGiftsQuery(
		{ holidayId: holidayId || "", auth0User },
		{ skip: !holidayId || !auth0User }
	);
	const { data: cards = [] } = useGetCardsQuery(
		{ holidayId: holidayId || "", auth0User },
		{ skip: !holidayId || !auth0User }
	);
	const { data: tasks = [] } = useGetTasksQuery(
		{ holidayId: holidayId || "", auth0User },
		{ skip: !holidayId || !auth0User }
	);

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
			case "cards":
				total = cards.length;
				completed = cards.filter((card: any) => card.isCompleted).length;
				break;
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
		<div className="min-h-screen mothers-day-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayHeader
				holidayName="🌸 Mother's Day"
				description="Show your love and appreciation!"
			/>
			<main className="flex-1 w-full max-w-4xl flex flex-col gap-6 mt-4">
				<ul className="flex flex-col gap-4">
					{mothersDaySubsections.map((section) => {
						const { total, completed, progress } = getProgressData(
							section.sliceKey,
							section.category
						);

						// Determine which card component to use based on type
						if (section.type === "gift-list") {
							return (
								<li key={section.name}>
									<GiftListCard
										holiday="Mother's Day"
										holidayId={holidayId}
										href={section.href}
										theme={{
											primaryColor: "#ec4899", // Pink for Mother's Day
											accentColor: "#f472b6",
										}}
										gamifiedBackgroundColor="bg-gradient-to-br from-pink-300 to-pink-500"
									/>
								</li>
							);
						} else {
							// Use HolidayTaskCard for tasks and other sections
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
						}
					})}
				</ul>
			</main>
			<footer className="w-full max-w-md py-4 text-center text-xs text-gray-500 dark:text-gray-500 mt-8">
				&copy; {new Date().getFullYear()} Next Holiday
			</footer>
		</div>
	);
}
