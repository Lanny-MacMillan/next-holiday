"use client";

import { useAppSelector } from "@/store/hooks";
import { useAuth0 } from "@auth0/auth0-react";
import {
	useGetGiftsQuery,
	useGetCardsQuery,
	useGetTasksQuery,
} from "@/store/api";
import GiftListCard from "@/components/cards/gift/GiftListCard";
import HolidayTaskCard from "@/components/cards/holiday-task/HolidayTaskCard";
import GuestListCard from "@/components/cards/guest/GuestListCard";
import HolidayHeader from "@/components/common/HolidayHeader";
import { getHolidayIdFromRoute } from "@/utils/holidayUtils";

const subsections = [
	{
		name: "Gift List",
		description: "Track graduation gift ideas",
		href: "/graduation/gift-list",
		sliceKey: "giftList",
		category: "Gifts",
		type: "gift-list",
	},
	{
		name: "Guest List",
		description: "Manage guests for graduation parties",
		href: "/graduation/guest-list",
		sliceKey: "guestList",
		type: "guest-list",
	},
	{
		name: "Event Planning",
		description: "Plan graduation ceremonies or parties",
		href: "/graduation/events",
		sliceKey: "tasks",
		type: "task",
		category: "Events",
	},
	{
		name: "Cards List",
		description: "Track graduation cards to send",
		href: "/graduation/cards",
		sliceKey: "cards",
		type: "task",
	},
];

export default function GraduationPage() {
	const { user: auth0User } = useAuth0();
	const holidayPreferences = useAppSelector(
		(state: any) => state.home.data?.holidayPreferences || []
	);

	// Get holiday ID for Graduation
	const holidayId = getHolidayIdFromRoute("/graduation", holidayPreferences);

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

	function getProgressData(sliceKey: string): {
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
				total = tasks.length;
				completed = tasks.filter((task: any) => task.isCompleted).length;
				break;
			case "guestList":
				// Guest list doesn't have completion status, so we'll show total count
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
		<div className="min-h-screen graduation-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayHeader
				holidayName="Graduation"
				description="Celebrate academic achievements!"
			/>
			<main className="flex-1 w-full max-w-4xl flex flex-col gap-6 mt-4">
				<ul className="flex flex-col gap-4">
					{subsections.map((section) => {
						const { total, completed, progress } = getProgressData(
							section.sliceKey
						);

						// Determine which card component to use based on type
						if (section.type === "gift-list") {
							return (
								<li key={section.name}>
									<GiftListCard
										holiday="Graduation"
										href={section.href}
										theme={{
											primaryColor: "#8b5cf6", // Purple for Graduation
											accentColor: "#8b5cf6", // Purple accent
										}}
										gamifiedBackgroundColor="bg-gradient-to-br from-purple-300 to-purple-500"
									/>
								</li>
							);
						} else if (section.type === "guest-list") {
							return (
								<li key={section.name}>
									<GuestListCard
										holiday="Graduation"
										href={section.href}
										theme={{
											primaryColor: "#8b5cf6", // Purple for Graduation
											accentColor: "#8b5cf6", // Purple accent
										}}
										holidayColor="bg-gradient-to-br from-purple-300 to-purple-500"
									/>
								</li>
							);
						} else {
							// Use HolidayTaskCard for tasks and other sections
							return (
								<li key={section.name}>
									<HolidayTaskCard
										holidayName="Graduation"
										sectionName={section.name}
										description={section.description}
										href={section.href}
										totalItems={total}
										completedItems={completed}
										theme={{
											primaryColor: "#8b5cf6", // Purple for Graduation
											accentColor: "#8b5cf6", // Purple accent
											progressColor: "#8b5cf6", // Purple for progress bar
										}}
										gamifiedBackgroundColor="bg-gradient-to-br from-purple-300 to-purple-500"
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
