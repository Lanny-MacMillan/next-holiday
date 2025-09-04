"use client";

import { useAppSelector } from "@/store/hooks";
import { useAuth0 } from "@auth0/auth0-react";
import { useGetGiftsQuery, useGetDateIdeasQuery } from "@/store/api";
import GiftListCard from "@/components/cards/gift/GiftListCard";
import HolidayTaskCard from "@/components/cards/holiday-task/HolidayTaskCard";
import HolidayHeader from "@/components/common/HolidayHeader";
import { getHolidayIdFromRoute } from "@/utils/holidayUtils";

const subsections = [
	{
		name: "Gift Ideas",
		description: "Track anniversary gift ideas",
		href: "/anniversary/gift-list",
		sliceKey: "giftList",
		category: "Gifts",
		type: "gift-list",
	},
	{
		name: "Date Ideas",
		description: "Plan special anniversary dates",
		href: "/anniversary/date-ideas",
		sliceKey: "dateIdeas",
		type: "task",
	},
];

export default function AnniversaryPage() {
	const { user: auth0User } = useAuth0();
	const holidayPreferences = useAppSelector(
		(state: any) => state.home.data?.holidayPreferences || []
	);

	// Get holiday ID for Anniversary
	const holidayId = getHolidayIdFromRoute("/anniversary", holidayPreferences);

	// Use RTK Query to fetch data
	const { data: gifts = [] } = useGetGiftsQuery(
		{ holidayId: holidayId || "", auth0User },
		{ skip: !holidayId || !auth0User }
	);
	const { data: dateIdeas = [] } = useGetDateIdeasQuery(
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
			case "dateIdeas":
				total = dateIdeas.length;
				completed = dateIdeas.filter((idea: any) => idea.isCompleted).length;
				break;
			default:
				total = 0;
				completed = 0;
		}

		const progress = total > 0 ? completed / total : 0;

		return { total, completed, progress };
	}

	return (
		<div className="min-h-screen anniversary-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayHeader
				holidayName="Anniversary"
				description="Plan romantic anniversaries and celebrations!"
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
										holiday="Anniversary"
										href={section.href}
										theme={{
											primaryColor: "#ec4899", // Pink for Anniversary
											accentColor: "#ec4899", // Pink accent
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
										holidayName="Anniversary"
										sectionName={section.name}
										description={section.description}
										href={section.href}
										totalItems={total}
										completedItems={completed}
										theme={{
											primaryColor: "#ec4899", // Pink for Anniversary
											accentColor: "#ec4899", // Pink accent
											progressColor: "#ec4899", // Pink for progress bar
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
