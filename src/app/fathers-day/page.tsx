"use client";

import { useFormModalMutation } from "@/hooks/useFormModalMutation";
import {
	useGetGiftsQuery,
	useGetCardsQuery,
	useGetEventsQuery,
} from "@/store/api";
import GiftListCard from "@/components/cards/gift/GiftListCard";
import HolidayTaskCard from "@/components/cards/holiday-task/HolidayTaskCard";
import HolidayHeader from "@/components/common/HolidayHeader";

const fathersDaySubsections = [
	{
		name: "Gift Ideas",
		description: "Track gift ideas for Father's Day",
		href: "/fathers-day/gift-list",
		sliceKey: "giftList",
		type: "gift",
		category: "Gifts",
	},
	{
		name: "Card List",
		description: "Track cards to send on Father's Day",
		href: "/fathers-day/cards",
		sliceKey: "cards",
		type: "card",
	},
	{
		name: "Event Planning",
		description: "Plan Father's Day celebrations",
		href: "/fathers-day/events",
		sliceKey: "events",
		type: "task",
	},
];

export default function FathersDayPage() {
	const { holidayId, auth0User } = useFormModalMutation();

	// Fetch data using RTK Query
	const { data: gifts = [] } = useGetGiftsQuery(
		{ holidayId: holidayId || "", auth0User },
		{ skip: !holidayId || !auth0User }
	);
	const { data: cards = [] } = useGetCardsQuery(
		{ holidayId: holidayId || "", auth0User },
		{ skip: !holidayId || !auth0User }
	);
	const { data: events = [] } = useGetEventsQuery(
		{ holidayId: holidayId || "", auth0User },
		{ skip: !holidayId || !auth0User }
	);

	function getProgressData(sliceKey: string) {
		let total = 0;
		let completed = 0;

		switch (sliceKey) {
			case "giftList":
				total = gifts.length;
				completed = gifts.filter((gift: any) => gift.isCompleted).length;
				break;
			case "cards":
				total = cards.length;
				completed = cards.filter((card: any) => card.isCompleted).length;
				break;
			case "events":
				total = events.length;
				completed = events.filter((event: any) => event.isCompleted).length;
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
						const { total, completed } = getProgressData(section.sliceKey);

						// Use GiftListCard for gift list sections
						if (section.type === "gift") {
							return (
								<li key={section.name}>
									<GiftListCard
										holiday="Father's Day"
										href={section.href}
										holidayId={holidayId}
										theme={{
											primaryColor: "#3b82f6", // Blue for Father's Day
											accentColor: "#60a5fa",
										}}
										gamifiedBackgroundColor="bg-gradient-to-br from-blue-300 to-blue-500"
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
									gamifiedBackgroundColor="bg-gradient-to-br from-blue-300 to-blue-500"
								/>
							</li>
						);
					})}
				</ul>
			</main>
		</div>
	);
}
