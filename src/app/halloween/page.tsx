"use client";

import { useAppSelector } from "@/store/hooks";
import { useAuth0 } from "@auth0/auth0-react";
import {
	useGetGiftsQuery,
	useGetCostumeIdeasQuery,
	useGetTrickOrTreatPrepQuery,
	useGetDecorationsQuery,
} from "@/store/api";
import GiftListCard from "@/components/cards/gift/GiftListCard";
import HolidayTaskCard from "@/components/cards/holiday-task/HolidayTaskCard";
import HolidayHeader from "@/components/common/HolidayHeader";
import { getHolidayIdFromRoute } from "@/utils/holidayUtils";

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
	const holidayPreferences = useAppSelector(
		(state: any) => state.home.data?.holidayPreferences || []
	);

	// Get holiday ID for Halloween
	const holidayId = getHolidayIdFromRoute("/halloween", holidayPreferences);

	// Use RTK Query to fetch data
	const { data: gifts = [] } = useGetGiftsQuery(
		{ holidayId: holidayId || "", auth0User },
		{ skip: !holidayId || !auth0User }
	);
	const { data: costumeIdeas = [] } = useGetCostumeIdeasQuery(
		{ holidayId: holidayId || "", auth0User },
		{ skip: !holidayId || !auth0User }
	);
	const { data: trickOrTreatPrep = [] } = useGetTrickOrTreatPrepQuery(
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
			case "costumeIdeas":
				total = costumeIdeas.length;
				completed = costumeIdeas.filter(
					(costume: any) => costume.isCompleted
				).length;
				break;
			case "trickOrTreatPrep":
				total = trickOrTreatPrep.length;
				completed = trickOrTreatPrep.filter(
					(prep: any) => prep.isCompleted
				).length;
				break;
			case "decorations":
				total = decorations.length;
				completed = decorations.filter(
					(decoration: any) => decoration.isCompleted
				).length;
				break;
			case "giftList":
				total = gifts.length;
				completed = gifts.filter((gift: any) => gift.isCompleted).length;
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
