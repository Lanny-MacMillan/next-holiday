"use client";

import { useAppSelector } from "@/store/hooks";
import { useAuth0 } from "@auth0/auth0-react";
import {
	useGetGiftsQuery,
	useGetCardsQuery,
	useGetPartyPlanningQuery,
	useGetGuestListQuery,
} from "@/store/api";
import GiftListCard from "@/components/cards/gift/GiftListCard";
import GuestListCard from "@/components/cards/guest/GuestListCard";
import HolidayTaskCard from "@/components/cards/holiday-task/HolidayTaskCard";
import PartyPlanningCard from "@/components/cards/holiday-task/PartyPlanningCard";
import HolidayHeader from "@/components/common/HolidayHeader";
import { getHolidayIdFromRoute } from "@/utils/holidayUtils";

const subsections = [
	{
		name: "Gift List",
		description: "Track birthday gift ideas",
		href: "/birthday/gift-list",
		sliceKey: "giftList",
		category: "Gifts",
		type: "gift-list",
	},
	{
		name: "Guest List",
		description: "Track your birthday guests",
		href: "/birthday/guest-list",
		sliceKey: "guestList",
		type: "guest-list",
	},
	{
		name: "Party Planning",
		description: "Plan birthday parties and celebrations",
		href: "/birthday/party-planning",
		sliceKey: "partyPlanning",
		type: "task",
	},
	{
		name: "Cards List",
		description: "Track birthday cards to send",
		href: "/birthday/cards",
		sliceKey: "cards",
		type: "task",
	},
];

export default function BirthdayPage() {
	const { user: auth0User } = useAuth0();
	const holidayPreferences = useAppSelector(
		(state: any) => state.home.data?.holidayPreferences || []
	);

	// Get holiday ID for Birthday
	const holidayId = getHolidayIdFromRoute("/birthday", holidayPreferences);

	// Use RTK Query to fetch data
	const { data: gifts = [] } = useGetGiftsQuery(
		{ holidayId: holidayId || "", auth0User },
		{ skip: !holidayId || !auth0User }
	);
	const { data: cards = [] } = useGetCardsQuery(
		{ holidayId: holidayId || "", auth0User },
		{ skip: !holidayId || !auth0User }
	);
	const { data: partyPlanning = [] } = useGetPartyPlanningQuery(
		{ holidayId: holidayId || "", auth0User },
		{ skip: !holidayId || !auth0User }
	);
	const { data: guests = [] } = useGetGuestListQuery(
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
			case "partyPlanning":
				total = partyPlanning.length;
				completed = partyPlanning.filter(
					(planning: any) => planning.isCompleted
				).length;
				break;
			case "guestList":
				total = guests.length;
				completed = guests.filter((guest: any) => guest.isCompleted).length;
				break;
			default:
				total = 0;
				completed = 0;
		}

		const progress = total > 0 ? completed / total : 0;

		return { total, completed, progress };
	}

	return (
		<div className="min-h-screen birthday-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayHeader
				holidayName="Birthday"
				description="Plan your birthday celebrations with style!"
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
										holiday="Birthday"
										href={section.href}
										theme={{
											primaryColor: "#f59e0b", // Amber for Birthday
											accentColor: "#f59e0b", // Amber accent
										}}
										gamifiedBackgroundColor="bg-gradient-to-br from-yellow-300 to-yellow-500"
									/>
								</li>
							);
						} else if (section.type === "guest-list") {
							return (
								<li key={section.name}>
									<GuestListCard
										holiday="Birthday"
										href={section.href}
										theme={{
											primaryColor: "#f59e0b", // Amber for Birthday
											accentColor: "#f59e0b", // Amber accent
										}}
										holidayColor="bg-gradient-to-br from-yellow-300 to-yellow-500"
									/>
								</li>
							);
						} else if (section.name === "Party Planning") {
							// Use PartyPlanningCard for party planning section
							return (
								<li key={section.name}>
									<PartyPlanningCard
										holidayName="Birthday"
										sectionName={section.name}
										description={section.description}
										href={section.href}
										totalItems={total}
										completedItems={completed}
										theme={{
											primaryColor: "#f59e0b", // Amber for Birthday
											accentColor: "#f59e0b", // Amber accent
											progressColor: "#f59e0b", // Amber for progress bar
										}}
										holidayColor="bg-gradient-to-br from-yellow-300 to-yellow-500"
									/>
								</li>
							);
						} else {
							// Use HolidayTaskCard for tasks and other sections
							return (
								<li key={section.name}>
									<HolidayTaskCard
										holidayName="Birthday"
										sectionName={section.name}
										description={section.description}
										href={section.href}
										totalItems={total}
										completedItems={completed}
										theme={{
											primaryColor: "#f59e0b", // Amber for Birthday
											accentColor: "#f59e0b", // Amber accent
											progressColor: "#f59e0b", // Amber for progress bar
										}}
										gamifiedBackgroundColor="bg-gradient-to-br from-yellow-300 to-yellow-500"
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
