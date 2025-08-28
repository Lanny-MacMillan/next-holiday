"use client";

import { useAppSelector } from "@/store/hooks";
import { useAuth0 } from "@auth0/auth0-react";
import {
	useGetGiftsQuery,
	useGetEventsQuery,
	useGetDecorationsQuery,
} from "@/store/api";
import GiftListCard from "@/components/cards/gift/GiftListCard";
import HolidayTaskCard from "@/components/cards/holiday-task/HolidayTaskCard";
import HolidayHeader from "@/components/common/HolidayHeader";
import { getHolidayIdFromRoute } from "@/utils/holidayUtils";

const subsections = [
	{
		name: "Basket List",
		description: "Track your Easter basket items",
		href: "/easter/basket-list",
		sliceKey: "giftList",
		category: "Basket List",
		type: "gift-list",
	},
	{
		name: "Event Planning",
		description: "Plan your Easter events and celebrations",
		href: "/easter/events",
		sliceKey: "events",
		type: "task",
	},
	{
		name: "Decorations Checklist",
		description: "Stay on top of your Easter decorations",
		href: "/easter/decorations",
		sliceKey: "decorations",
		type: "task",
	},
];

export default function EasterPage() {
	const { user: auth0User } = useAuth0();
	const holidayPreferences = useAppSelector(
		(state: any) => state.home.data?.holidayPreferences || []
	);

	// Get holiday ID for Easter
	const holidayId = getHolidayIdFromRoute("/easter", holidayPreferences);

	// Use RTK Query to fetch data
	const { data: gifts = [] } = useGetGiftsQuery(
		{ holidayId: holidayId || "", auth0User },
		{ skip: !holidayId || !auth0User }
	);
	const { data: events = [] } = useGetEventsQuery(
		{ holidayId: holidayId || "", auth0User },
		{ skip: !holidayId || !auth0User }
	);
	const { data: decorations = [] } = useGetDecorationsQuery(
		{ holidayId: holidayId || "", auth0User },
		{ skip: !holidayId || !auth0User }
	);

	function getProgressData(sliceKey: string): {
		total: number;
		completed: number;
		progress: number;
	} {
		let total = 0;
		let completed = 0;

		switch (sliceKey) {
			case "giftList":
				total = gifts.length;
				completed = gifts.filter((gift: any) => gift.isCompleted).length;
				break;
			case "events":
				total = events.length;
				completed = events.filter((event: any) => event.isCompleted).length;
				break;
			case "decorations":
				total = decorations.length;
				completed = decorations.filter(
					(decoration: any) => decoration.isCompleted
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
		<div className="min-h-screen easter-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayHeader
				holidayName="Easter"
				description="Plan your Easter with ease!"
			/>
			<main className="flex-1 w-full max-w-4xl flex flex-col gap-6 mt-4">
				<ul className="flex flex-col gap-4">
					{subsections.map((section) => {
						const { total, completed, progress } = getProgressData(
							section.sliceKey
						);

						// Use GiftListCard for gift list sections
						if (section.type === "gift-list") {
							return (
								<li key={section.name}>
									<GiftListCard
										holiday="Easter"
										href={section.href}
										theme={{
											primaryColor: "#a855f7", // Purple for Easter
											accentColor: "#eab308",
										}}
										gamifiedBackgroundColor="bg-gradient-to-br from-purple-300 to-purple-500"
									/>
								</li>
							);
						}

						// Use HolidayTaskCard for task sections
						return (
							<li key={section.name}>
								<HolidayTaskCard
									holidayName="Easter"
									sectionName={section.name}
									description={section.description}
									href={section.href}
									totalItems={total}
									completedItems={completed}
									theme={{
										primaryColor: "#a855f7", // Purple for Easter
										accentColor: "#eab308",
										progressColor: "#a855f7",
									}}
									gamifiedBackgroundColor="bg-gradient-to-br from-purple-300 to-purple-500"
								/>
							</li>
						);
					})}
				</ul>
			</main>
		</div>
	);
}
