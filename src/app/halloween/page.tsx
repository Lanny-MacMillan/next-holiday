"use client";

import { useEffect } from "react";
import { useAppSelector } from "@/store/hooks";
import { useAuth0 } from "@auth0/auth0-react";
import { BudgetDisplay } from "@/components/common/BudgetDisplay";
import GiftListCard from "@/components/cards/gift/GiftListCard";
import HolidayTaskCard from "@/components/cards/holiday-task/HolidayTaskCard";
import HolidayHeader from "@/components/common/HolidayHeader";
import { getHolidayIdFromRoute } from "@/utils/holidayUtils";
import {
	selectHolidayPreferences,
	selectHomeInitialized,
	selectHomeData,
} from "@/store/selectors/home";
import { getHolidayDataFromRedux } from "@/utils/holidayData";

const subsections = [
	{
		name: "Trick-or-Treat Prep",
		description: "List of things needed for trick-or-treating",
		href: "/halloween/trick-or-treat-prep",
		sliceKey: "trickOrTreatPrep",
		type: "task",
	},
	{
		name: "Costume Ideas",
		description: "List of possible costume ideas and who they may be for",
		href: "/halloween/costume-ideas",
		sliceKey: "costumeIdeas",
		type: "task",
	},
	{
		name: "Decorations Checklist",
		description: "Stay on top of your Halloween decorations",
		href: "/halloween/decorations",
		sliceKey: "decorations",
		type: "task",
	},
];

export default function HalloweenPage() {
	const { user: auth0User } = useAuth0();
	const holidayPreferences = useAppSelector(selectHolidayPreferences);
	const homeInitialized = useAppSelector(selectHomeInitialized);

	// Get holiday ID for Halloween - only resolve if home data is initialized
	const holidayId = homeInitialized
		? getHolidayIdFromRoute("/halloween", holidayPreferences)
		: getHolidayIdFromRoute("/halloween", holidayPreferences); // Allow fallback for cold entry

	// Get data from Redux home state first, fallback to RTK Query if needed
	const homeData = useAppSelector(selectHomeData);

	// Get current Redux state for skip logic
	const currentState = useAppSelector((state: any) => state);

	// Get holiday data from Redux if available
	const holidayData = getHolidayDataFromRedux(holidayId, currentState);

	// Use only Redux data - no API calls on holiday pages

	function getProgressData(sliceKey: string): {
		total: number;
		completed: number;
		progress: number;
	} {
		let total = 0;
		let completed = 0;

		// Use only Redux data - no fallback to API calls
		if (!holidayData || !homeInitialized) {
			return { total: 0, completed: 0, progress: 0 };
		}

		switch (sliceKey) {
			case "costumeIdeas":
				// Filter tasks by category for costume ideas
				if (holidayData.tasks) {
					const costumeTasks = holidayData.tasks.filter(
						(task: any) => task.category === "Costume Ideas"
					);
					total = costumeTasks.length;
					completed = costumeTasks.filter(
						(task: any) => task.isCompleted
					).length;
				}
				break;
			case "trickOrTreatPrep":
				// Trick or treat prep are stored as tasks with category "Trick or Treat Prep"
				const trickOrTreatTasks = holidayData.tasks?.filter((task: any) => task.category === "Trick or Treat Prep") || [];
				total = trickOrTreatTasks.length;
				completed = trickOrTreatTasks.filter((task: any) => task.isCompleted).length;
				break;
			case "decorations":
				// Decorations are stored as tasks with category "Decorations"
				const decorationTasks = holidayData.tasks?.filter((task: any) => task.category === "Decorations") || [];
				total = decorationTasks.length;
				completed = decorationTasks.filter((task: any) => task.isCompleted).length;
				break;
			case "giftList":
				if (holidayData.gifts) {
					total = holidayData.gifts.length;
					completed = holidayData.gifts.filter(
						(gift: any) => gift.isCompleted
					).length;
				}
				break;
			default:
				total = 0;
				completed = 0;
		}

		const progress = total > 0 ? completed / total : 0;
		return { total, completed, progress };
	}


	return (
		<div className="min-h-screen halloween-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayHeader
				holidayName="🎃 Halloween"
				description="Plan your spooky celebrations and trick-or-treating adventures!"
			/>
			<main className="flex-1 w-full max-w-4xl flex flex-col gap-6 mt-4">
				<ul className="flex flex-col gap-4">
					{/* Gift List Card */}
					<li>
						<GiftListCard
							holiday="Halloween"
							href="/halloween/gift-list"
							budget={{
								spent:
									holidayData?.gifts?.reduce((sum: number, gift: any) => {
										const price = parseFloat(gift.price) || 0;
										return gift.isCompleted ? sum + price : sum;
									}, 0) || 0,
								planned:
									holidayData?.gifts?.reduce((sum: number, gift: any) => {
										return sum + (parseFloat(gift.price) || 0);
									}, 0) || 0,
								total: holidayData?.budget || 0,
								remaining:
									(holidayData?.budget || 0) -
									(holidayData?.gifts?.reduce((sum: number, gift: any) => {
										const price = parseFloat(gift.price) || 0;
										return gift.isCompleted ? sum + price : sum;
									}, 0) || 0),
								percentage:
									holidayData?.budget > 0
										? ((holidayData?.gifts?.reduce((sum: number, gift: any) => {
												const price = parseFloat(gift.price) || 0;
												return gift.isCompleted ? sum + price : sum;
										  }, 0) || 0) /
												holidayData.budget) *
										  100
										: 0,
							}}
							giftList={{
								totalItems: holidayData?.gifts?.length || 0,
								completedItems:
									holidayData?.gifts?.filter((gift: any) => gift.isCompleted)
										.length || 0,
							}}
							theme={{
								primaryColor: "#f97316", // Orange for Halloween
								accentColor: "#eab308",
							}}
							gamifiedBackgroundColor="bg-gradient-to-br from-orange-400 to-orange-600"
						/>
					</li>

					{subsections.map((section) => {
						const { total, completed, progress } = getProgressData(
							section.sliceKey
						);

						return (
							<li key={section.name}>
								<HolidayTaskCard
									holidayName="Halloween"
									sectionName={section.name}
									description={section.description}
									href={section.href}
									totalItems={total}
									completedItems={completed}
									theme={{
										primaryColor: "#f97316", // Orange for Halloween
										accentColor: "#eab308",
										progressColor: "#f97316",
									}}
									gamifiedBackgroundColor="bg-gradient-to-br from-orange-400 to-orange-600"
								/>
							</li>
						);
					})}
				</ul>
			</main>
			<footer className="w-full max-w-md py-4 text-center text-xs text-gray-500 dark:text-gray-500 mt-8">
				&copy; {new Date().getFullYear()} Next Holiday
			</footer>
		</div>
	);
}
