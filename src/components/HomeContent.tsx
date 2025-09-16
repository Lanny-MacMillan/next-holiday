"use client";

import Link from "next/link";
import { useState } from "react";
import HolidayCard from "@/components/cards/HolidayCard";
import HolidayHeader from "@/components/common/HolidayHeader";
import { holidayData } from "@/data/holidayData";
import { getHolidayCountdownTime } from "@/utils/holidayUtils";
import { HomeData } from "@/types/home";
import { useHomePageData } from "@/hooks/useHomePageData";
import { useGetHolidaysQuery } from "@/store/api";
import { useAuth0 } from "@auth0/auth0-react";
import {
	selectMyHolidays,
	selectSharedHolidays,
	selectAllHolidays,
	HolidayDTO,
} from "@/store/selectors/holidays";

interface HomeContentProps {
	homeData: HomeData;
}

export default function HomeContent({ homeData }: HomeContentProps) {
	const { user: auth0User, isLoading: authLoading } = useAuth0();
	const [scope, setScope] = useState<"mine" | "shared" | "all">("all");

	// Use the new hook to get all holiday data from the database
	const { isLoading, createLegacyStateObject, holidayPreferences } =
		useHomePageData(homeData);

	// Fetch holidays data for the new display
	const shouldSkip = authLoading || !auth0User;
	const {
		data: holidays = [],
		isLoading: holidaysLoading,
		error: holidaysError,
	} = useGetHolidaysQuery(
		shouldSkip ? undefined : { scope: "all", auth0User },
		{
			skip: shouldSkip,
		}
	);

	// Apply client-side filtering based on scope for the new holidays display
	const filteredHolidaysFromAPI =
		scope === "mine"
			? selectMyHolidays(holidays)
			: scope === "shared"
			? selectSharedHolidays(holidays)
			: selectAllHolidays(holidays);

	// Check if there are any shared holidays to determine if we should show the sorting bar
	const sharedHolidays = selectSharedHolidays(holidays);
	const hasSharedHolidays = sharedHolidays.length > 0;

	// Debug logging for shared holidays detection
	console.log("[HomeContent] All holidays:", holidays);
	console.log("[HomeContent] Shared holidays:", sharedHolidays);
	console.log("[HomeContent] Has shared holidays:", hasSharedHolidays);
	console.log("[HomeContent] My holidays:", selectMyHolidays(holidays));

	// Filter holidays based on server data for the original UI
	// IMPORTANT: Only include holidays the current user OWNS.
	// Shared holidays should not appear in the user's preferences list.
	const getSelectedHolidays = () => {
		if (!holidayPreferences || holidayPreferences.length === 0) {
			console.log("[HomeContent] No holidayPreferences");
			return [];
		}

		// Build a set of holiday types the current user owns
		const ownedHolidayTypes = new Set(
			selectMyHolidays(holidays).map((h: HolidayDTO) => h.holidayType)
		);

		const selectedHolidayNames = holidayPreferences.map(
			(choice: any) => choice.holiday
		);
		console.log(
			"[HomeContent] holidayPreferences names:",
			selectedHolidayNames
		);

		const holidayNameMap: { [key: string]: string } = {
			christmas: "Christmas",
			hanukkah: "Hanukkah",
			kwanzaa: "Kwanzaa",
			"new-year": "New Year",
			valentines: "Valentine's Day",
			easter: "Easter",
			halloween: "Halloween",
			thanksgiving: "Thanksgiving",
			"mothers-day": "Mother's Day",
			"fathers-day": "Father's Day",
			"fourth-of-july": "Fourth of July",
			birthday: "Birthday",
			anniversary: "Anniversary",
			graduation: "Graduation",
			"baby-shower": "Baby Shower",
		};

		const filtered = holidayData.filter((holiday) => {
			const holidayDisplayName = holidayNameMap[holiday.id];
			// Only include if: user selected it in preferences AND the user owns
			// at least one Holiday record of this type (not shared)
			return (
				selectedHolidayNames.includes(holidayDisplayName) &&
				ownedHolidayTypes.has(holidayDisplayName)
			);
		});

		console.log(
			"[HomeContent] filteredHolidays:",
			filtered.map((h) => ({ id: h.id, name: h.name }))
		);
		return filtered;
	};

	const filteredHolidaysFromPreferences = getSelectedHolidays();

	// Show loading state while fetching data
	if (isLoading || holidaysLoading) {
		return (
			<div className="min-h-screen christmas-gradient flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
					<p className="text-gray-600 dark:text-gray-300">
						Loading your holiday data...
					</p>
				</div>
			</div>
		);
	}

	// If there are shared holidays, show the holidays page-style display
	if (hasSharedHolidays) {
		const tabs = [
			{ id: "all", label: "All" },
			{ id: "mine", label: "My Holidays" },
			{ id: "shared", label: "Shared With Me" },
		] as const;

		return (
			<div className="min-h-screen christmas-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
				<HolidayHeader
					holidayName="Next Holiday"
					description="Plan your holidays, stay organized, and have fun!"
					showBackButton={false}
				/>

				<main className="flex-1 w-full max-w-4xl flex flex-col gap-6 mt-4">
					{/* Filter Tabs - Only show when there are shared holidays */}
					<div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-1">
						<div className="flex space-x-1">
							{tabs.map((tab) => (
								<button
									key={tab.id}
									onClick={() => setScope(tab.id)}
									className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
										scope === tab.id
											? "bg-blue-500 text-white"
											: "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
									}`}
								>
									{tab.label}
								</button>
							))}
						</div>
					</div>

					{/* Error State */}
					{holidaysError && (
						<div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
							<p className="text-red-800 dark:text-red-200">
								Error loading holidays: {holidaysError.toString()}
							</p>
						</div>
					)}

					{/* Holidays List (professional cards) */}
					{!holidaysError && (
						<div className="space-y-4">
							{filteredHolidaysFromAPI.length === 0 ? (
								<div className="text-center py-8">
									<p className="text-gray-600 dark:text-gray-400 mb-4">
										{scope === "mine" &&
											"You haven't created any holidays yet."}
										{scope === "shared" &&
											"No holidays have been shared with you yet."}
										{scope === "all" && "No holidays found."}
									</p>
								</div>
							) : (
								<ul className="flex flex-col gap-4">
									{filteredHolidaysFromAPI.map((holiday: HolidayDTO) => {
										const meta = holidayData.find(
											(h) => h.name === holiday.holidayType
										);
										const holidayPreference = holidayPreferences?.find(
											(pref: any) => pref.holiday === holiday.holidayType
										);
										const state = createLegacyStateObject(
											holidayPreference?.holidayId || "",
											holiday.holidayType
										);
										const progress = meta ? meta.getProgress(state) : 0;
										const completedItems = meta
											? meta.getCompletedItems(state)
											: 0;
										const totalItems = meta ? meta.getTotalItems(state) : 0;

										// Use the correct holidayId: own preference ID if present; otherwise the shared holiday's ID
										const effectiveHolidayId =
											holidayPreference?.holidayId || holiday.id;
										return (
											<HolidayCard
												key={`${holiday.id}-${holiday._visibility}`}
												id={meta?.id || holiday.id}
												name={meta?.name || holiday.name}
												description={meta?.description || holiday.holidayType}
												route={meta?.route || "/"}
												color={meta?.color || "#3B82F6"}
												progress={progress}
												completedItems={completedItems}
												totalItems={totalItems}
												holidayId={effectiveHolidayId}
												countdownTimer={holidayPreference?.countdownTimer}
											/>
										);
									})}
								</ul>
							)}
						</div>
					)}
				</main>

				<footer className="w-full max-w-md py-4 text-center text-xs text-gray-500 dark:text-gray-500 mt-8">
					&copy; {new Date().getFullYear()} Next Holiday
				</footer>
			</div>
		);
	}

	// Original UI for users with no shared holidays
	return (
		<div className="min-h-screen christmas-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayHeader
				holidayName="Next Holiday"
				description="Plan your holidays, stay organized, and have fun!"
				showBackButton={false}
			/>
			<main className="flex-1 w-full max-w-4xl flex flex-col gap-6 mt-4">
				{filteredHolidaysFromPreferences.length === 0 ? (
					<div className="text-center py-8">
						<p className="text-gray-600 dark:text-gray-400 mb-4">
							Welcome! To get started, select which holidays you'd like to plan
							for.
						</p>
						<Link
							href="/settings"
							className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 underline"
						>
							Go to Settings to select holidays
						</Link>
					</div>
				) : (
					<ul className="flex flex-col gap-4">
						{filteredHolidaysFromPreferences.map((holiday) => {
							const holidayPreference = holidayPreferences?.find(
								(pref: any) => pref.holiday === holiday.name
							);

							// Create state object using the new hook for this specific holiday
							const state = createLegacyStateObject(
								holidayPreference?.holidayId || "",
								holiday.name
							);

							const progress = holiday.getProgress(state);
							const completedItems = holiday.getCompletedItems(state);
							const totalItems = holiday.getTotalItems(state);

							return (
								<HolidayCard
									key={holiday.id}
									id={holiday.id}
									name={holiday.name}
									description={holiday.description}
									route={holiday.route}
									color={holiday.color}
									progress={progress}
									completedItems={completedItems}
									totalItems={totalItems}
									holidayId={holidayPreference?.holidayId}
									countdownTimer={holidayPreference?.countdownTimer}
								/>
							);
						})}
					</ul>
				)}
			</main>

			<footer className="w-full max-w-md py-4 text-center text-xs text-gray-500 dark:text-gray-500 mt-8">
				&copy; {new Date().getFullYear()} Next Holiday
			</footer>
		</div>
	);
}
