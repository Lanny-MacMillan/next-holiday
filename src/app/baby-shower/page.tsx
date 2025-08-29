"use client";

import { useAppSelector } from "@/store/hooks";
import { useAuth0 } from "@auth0/auth0-react";
import { useGetGiftsQuery, useGetCardsQuery } from "@/store/api";
import { useBabyShowerTasksMutations } from "@/hooks/useBabyShowerTasksMutations";
import { useBabyShowerGamesMutations } from "@/hooks/useBabyShowerGamesMutations";
import GiftListCard from "@/components/cards/gift/GiftListCard";
import HolidayTaskCard from "@/components/cards/holiday-task/HolidayTaskCard";
import GuestListCard from "@/components/cards/guest/GuestListCard";
import HolidayHeader from "@/components/common/HolidayHeader";

const subsections = [
	{
		name: "Gift Registry Tracker",
		description: "Track baby shower gifts and registry items",
		href: "/baby-shower/gift-list",
		sliceKey: "giftList",
		category: "Gifts",
		type: "gift-list",
	},
	{
		name: "Guest List",
		description: "Manage your baby shower guest list",
		href: "/baby-shower/guest-list",
		sliceKey: "guestList",
		type: "guest-list",
	},
	{
		name: "Games & Activities",
		description: "Plan fun baby shower games and activities",
		href: "/baby-shower/games",
		sliceKey: "tasks",
		type: "task",
		category: "Games",
	},
];

export default function BabyShowerPage() {
	const { user: auth0User } = useAuth0();

	// Use the baby shower tasks mutations hook
	const { tasks, loading, error, holidayId } = useBabyShowerTasksMutations();

	// Use the baby shower games mutations hook for Games & Activities section
	const { babyShowerGames } = useBabyShowerGamesMutations();

	// Use RTK Query to fetch data
	const { data: gifts = [] } = useGetGiftsQuery(
		{ holidayId: holidayId || "", auth0User },
		{ skip: !holidayId || !auth0User }
	);
	const { data: cards = [] } = useGetCardsQuery(
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
				// For Games & Activities, use babyShowerGames data instead of tasks
				if (category === "Games") {
					total = babyShowerGames.length;
					completed = babyShowerGames.filter(
						(game: any) => game.isCompleted
					).length;
				} else {
					const filteredTasks = category
						? tasks.filter((task: any) => task.category === category)
						: tasks;
					total = filteredTasks.length;
					completed = filteredTasks.filter(
						(task: any) => task.isCompleted
					).length;
				}
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
		<div className="min-h-screen baby-shower-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayHeader
				holidayName="Baby Shower"
				description="Plan the perfect baby shower celebration!"
			/>
			<main className="flex-1 w-full max-w-4xl flex flex-col gap-6 mt-4">
				<ul className="flex flex-col gap-4">
					{subsections.map((section) => {
						const { total, completed, progress } = getProgressData(
							section.sliceKey,
							section.category
						);

						// Determine which card component to use based on type
						if (section.type === "gift-list") {
							return (
								<li key={section.name}>
									<GiftListCard
										holiday="Baby Shower"
										href={section.href}
										theme={{
											primaryColor: "#06b6d4", // Cyan for Baby Shower
											accentColor: "#06b6d4", // Cyan accent
										}}
										gamifiedBackgroundColor="bg-gradient-to-br from-cyan-300 to-cyan-500"
									/>
								</li>
							);
						} else if (section.type === "guest-list") {
							return (
								<li key={section.name}>
									<GuestListCard
										holiday="Baby Shower"
										href={section.href}
										theme={{
											primaryColor: "#06b6d4", // Cyan for Baby Shower
											accentColor: "#06b6d4", // Cyan accent
										}}
										holidayColor="bg-gradient-to-br from-cyan-300 to-cyan-500"
									/>
								</li>
							);
						} else {
							// Use HolidayTaskCard for tasks and other sections
							return (
								<li key={section.name}>
									<HolidayTaskCard
										holidayName="Baby Shower"
										sectionName={section.name}
										description={section.description}
										href={section.href}
										totalItems={total}
										completedItems={completed}
										theme={{
											primaryColor: "#06b6d4", // Cyan for Baby Shower
											accentColor: "#06b6d4", // Cyan accent
											progressColor: "#06b6d4", // Cyan for progress bar
										}}
										gamifiedBackgroundColor="bg-gradient-to-br from-cyan-300 to-cyan-500"
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
