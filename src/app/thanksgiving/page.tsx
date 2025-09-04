"use client";

import { useAppSelector } from "@/store/hooks";
import { useAuth0 } from "@auth0/auth0-react";
import {
	useGetGiftsQuery,
	useGetMealPlanningQuery,
	useGetGuestListQuery,
	useGetDecorationsQuery,
} from "@/store/api";
import { getHolidayIdFromRoute } from "@/utils/holidayUtils";
import GiftListCard from "@/components/cards/gift/GiftListCard";
import HolidayTaskCard from "@/components/cards/holiday-task/HolidayTaskCard";
import GuestListCard from "@/components/cards/guest/GuestListCard";
import HolidayHeader from "@/components/common/HolidayHeader";

const subsections = [
	{
		name: "Shopping List",
		description: "List of ingredients and supplies needed",
		href: "/thanksgiving/shopping-list",
		sliceKey: "giftList",
		category: "Shopping List",
		type: "gift-list",
	},
	{
		name: "Meal Planning",
		description: "Plan your Thanksgiving menu and dishes",
		href: "/thanksgiving/meal-planning",
		sliceKey: "mealPlanning",
		type: "task",
	},
	{
		name: "Guest List",
		description: "Manage your Thanksgiving guest list",
		href: "/thanksgiving/guest-list",
		sliceKey: "guestList",
		type: "guest-list",
	},
	{
		name: "Decorations Checklist",
		description: "Stay on top of your Thanksgiving decorations",
		href: "/thanksgiving/decorations-checklist",
		sliceKey: "decorations",
		type: "task",
	},
];

export default function ThanksgivingPage() {
	const { user: auth0User } = useAuth0();
	const holidayPreferences = useAppSelector(
		(state: any) => state.home.data?.holidayPreferences || []
	);

	// Get user preferences for display mode
	const { preferences } = useAppSelector((state: any) => state.userPreferences);
	const isGamifiedMode = preferences?.displayMode === "gamified";

	// Get holiday ID for Thanksgiving
	const holidayId = getHolidayIdFromRoute("/thanksgiving", holidayPreferences);

	// Use RTK Query to fetch data
	const { data: gifts = [] } = useGetGiftsQuery(
		{ holidayId: holidayId || "", auth0User },
		{ skip: !holidayId || !auth0User }
	);
	const { data: mealPlanning = [] } = useGetMealPlanningQuery(
		{ holidayId: holidayId || "", auth0User },
		{ skip: !holidayId || !auth0User }
	);
	const { data: guests = [] } = useGetGuestListQuery(
		{ holidayId: holidayId || "", auth0User },
		{ skip: !holidayId || !auth0User }
	);
	const { data: decorations = [] } = useGetDecorationsQuery(
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
			case "guestList":
				total = guests.length;
				completed = guests.filter((guest: any) => guest.isCompleted).length;
				break;
			case "mealPlanning":
				total = mealPlanning.length;
				completed = mealPlanning.filter((meal: any) => meal.isCompleted).length;
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
		<div className="min-h-screen thanksgiving-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayHeader
				holidayName="🦃 Thanksgiving"
				description="Plan your feast, guests, and gratitude!"
			/>
			<main className="flex-1 w-full max-w-4xl flex flex-col gap-6 mt-4">
				<ul className="flex flex-col gap-4">
					{subsections.map((section) => {
						const { total, completed } = getProgressData(section.sliceKey);

						// Use GiftListCard for shopping list (budget tracking) and gift list sections
						if (section.type === "gift-list") {
							return (
								<li key={section.name}>
									<GiftListCard
										holiday="Thanksgiving"
										href={section.href}
										theme={{
											primaryColor: "#d97706", // Amber for Thanksgiving
											accentColor: "#eab308",
										}}
										gamifiedBackgroundColor="bg-gradient-to-br from-amber-400 to-amber-600"
									/>
								</li>
							);
						}

						// Use GuestListCard for guest list section
						if (section.type === "guest-list") {
							return (
								<li key={section.name}>
									<GuestListCard
										holiday="Thanksgiving"
										href={section.href}
										theme={{
											primaryColor: "#d97706", // Amber for Thanksgiving
											accentColor: "#eab308",
										}}
										gamified={isGamifiedMode}
										holidayColor="bg-gradient-to-br from-amber-400 to-amber-600"
									/>
								</li>
							);
						}

						// Use HolidayTaskCard for task sections
						return (
							<li key={section.name}>
								<HolidayTaskCard
									holidayName="Thanksgiving"
									sectionName={section.name}
									description={section.description}
									href={section.href}
									totalItems={total}
									completedItems={completed}
									theme={{
										primaryColor: "#d97706", // Amber for Thanksgiving
										accentColor: "#eab308",
										progressColor: "#d97706",
									}}
									gamifiedBackgroundColor="bg-gradient-to-br from-amber-400 to-amber-600"
								/>
							</li>
						);
					})}
				</ul>
			</main>
		</div>
	);
}
