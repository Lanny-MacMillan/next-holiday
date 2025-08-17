"use client";

import Image from "next/image";
import Link from "next/link";
import { useAppSelector } from "@/store/hooks";

import HolidayCard from "@/components/cards/HolidayCard";
import HolidayHeader from "@/components/common/HolidayHeader";
import { holidayData } from "@/data/holidayData";
import { getHolidayCountdownTime } from "@/utils/holidayUtils";
import GamifiedHolidayCardExample from "@/components/examples/GamifiedHolidayCardExample";

export default function Home() {
	// Get state from all Redux slices
	const cards = useAppSelector((state) => state.cards?.cards || []);
	const gifts = useAppSelector((state) => state.giftList?.gifts || []);
	const tasks = useAppSelector((state) => state.tasks?.tasks || []);
	const contacts = useAppSelector((state) => state.addressBook?.contacts || []);

	// Get settings to check holiday preferences
	const { settings } = useAppSelector((state: any) => state.theme);
	const {
		preferences: holidayPreferences,
		loading: holidayPreferencesLoading,
		initialized: holidayPreferencesInitialized,
	} = useAppSelector((state: any) => state.holidayPreferences);

	console.log("Main page holiday preferences state:", {
		holidayPreferences,
		holidayPreferencesLoading,
		holidayPreferencesInitialized,
	});

	// Get loading states
	const cardsLoading = useAppSelector((state) => state.cards?.loading || false);
	const giftsLoading = useAppSelector(
		(state) => state.giftList?.loading || false
	);
	const tasksLoading = useAppSelector((state) => state.tasks?.loading || false);
	const contactsLoading = useAppSelector(
		(state) => state.addressBook?.loading || false
	);

	// Check if any data is still loading
	const isLoading =
		cardsLoading ||
		giftsLoading ||
		tasksLoading ||
		contactsLoading ||
		holidayPreferencesLoading;

	// Get all holiday data from Redux state
	const hanukkahGifts = useAppSelector(
		(state) => state.hanukkahGiftList?.gifts || []
	);
	const hanukkahTasks = useAppSelector(
		(state) => state.hanukkahTasks?.tasks || []
	);

	// Get countdown states
	const countdown = useAppSelector((state) => state.countdown);
	const hanukkahCountdown = useAppSelector((state) => state.hanukkahCountdown);
	const kwanzaaCountdown = useAppSelector((state) => state.kwanzaaCountdown);
	const newYearCountdown = useAppSelector((state) => state.newYearCountdown);
	const valentinesCountdown = useAppSelector(
		(state) => state.valentinesCountdown
	);
	const easterCountdown = useAppSelector((state) => state.easterCountdown);
	const halloweenCountdown = useAppSelector(
		(state) => state.halloweenCountdown
	);
	const thanksgivingCountdown = useAppSelector(
		(state) => state.thanksgivingCountdown
	);
	const kwanzaaGifts = useAppSelector(
		(state) => state.kwanzaaGiftList?.gifts || []
	);
	const kwanzaaTasks = useAppSelector(
		(state) => state.kwanzaaTasks?.tasks || []
	);
	const newYearGifts = useAppSelector(
		(state) => state.newYearGiftList?.gifts || []
	);
	const newYearTasks = useAppSelector(
		(state) => state.newYearTasks?.tasks || []
	);
	const valentinesGifts = useAppSelector(
		(state) => state.valentinesGiftList?.gifts || []
	);
	const valentinesTasks = useAppSelector(
		(state) => state.valentinesTasks?.tasks || []
	);
	const easterGifts = useAppSelector(
		(state) => state.easterGiftList?.gifts || []
	);
	const easterTasks = useAppSelector((state) => state.easterTasks?.tasks || []);
	const halloweenGifts = useAppSelector(
		(state) => state.halloweenGiftList?.gifts || []
	);
	const halloweenTasks = useAppSelector(
		(state) => state.halloweenTasks?.tasks || []
	);
	const thanksgivingGifts = useAppSelector(
		(state) => state.thanksgivingGiftList?.gifts || []
	);
	const thanksgivingTasks = useAppSelector(
		(state) => state.thanksgivingTasks?.tasks || []
	);
	const mothersDayGifts = useAppSelector(
		(state) => state.mothersDayGiftList?.gifts || []
	);
	const mothersDayTasks = useAppSelector(
		(state) => state.mothersDayTasks?.tasks || []
	);
	const fathersDayGifts = useAppSelector(
		(state) => state.fathersDayGiftList?.gifts || []
	);
	const fathersDayTasks = useAppSelector(
		(state) => state.fathersDayTasks?.tasks || []
	);
	const fourthOfJulyTasks = useAppSelector(
		(state) => state.fourthOfJulyTasks?.tasks || []
	);
	const birthdayGifts = useAppSelector(
		(state) => state.birthdayGiftList?.gifts || []
	);
	const birthdayTasks = useAppSelector(
		(state) => state.birthdayTasks?.tasks || []
	);
	const birthdayCards = useAppSelector(
		(state) => state.birthdayCards?.cards || []
	);
	const birthdayContacts = useAppSelector(
		(state) => state.birthdayAddressBook?.contacts || []
	);
	const anniversaryGifts = useAppSelector(
		(state) => state.anniversaryGiftList?.gifts || []
	);
	const anniversaryTasks = useAppSelector(
		(state) => state.anniversaryTasks?.tasks || []
	);
	const graduationGifts = useAppSelector(
		(state) => state.graduationGiftList?.gifts || []
	);
	const graduationTasks = useAppSelector(
		(state) => state.graduationTasks?.tasks || []
	);
	const graduationCards = useAppSelector(
		(state) => state.graduationCards?.cards || []
	);
	const graduationContacts = useAppSelector(
		(state) => state.graduationAddressBook?.contacts || []
	);
	const babyShowerGifts = useAppSelector(
		(state) => state.babyShowerGiftList?.gifts || []
	);
	const babyShowerTasks = useAppSelector(
		(state) => state.babyShowerTasks?.tasks || []
	);
	const babyShowerContacts = useAppSelector(
		(state) => state.babyShowerAddressBook?.contacts || []
	);

	// Filter holidays based on user preferences
	const getSelectedHolidays = () => {
		console.log("getSelectedHolidays called:", {
			holidayPreferencesLoading,
			holidayPreferences,
			holidayDataLength: holidayData.length,
		});

		// Wait for holiday preferences to load from database
		if (holidayPreferencesLoading) {
			console.log("Holiday preferences still loading, returning empty array");
			return []; // Return empty array while loading
		}

		// Use holiday preferences from database
		// If holidayPreferences is null, it means either:
		// 1. No preferences have been set yet (user hasn't visited settings)
		// 2. The API call failed or returned no data
		// In either case, we should show a message to guide the user
		const holidayChoices = holidayPreferences || [];

		console.log("Holiday choices:", holidayChoices);

		// If no holiday choices are set, return empty array (no holidays to show)
		if (!holidayChoices || holidayChoices.length === 0) {
			console.log("No holiday choices found, returning empty array");
			return [];
		}

		// Get the list of selected holiday names from preferences
		const selectedHolidayNames = holidayChoices.map(
			(choice: { holiday: string; budget?: number }) => choice.holiday
		);

		console.log("Selected holiday names:", selectedHolidayNames);

		// Filter holidayData to only include selected holidays
		const filteredHolidays = holidayData.filter((holiday) => {
			// Map holiday IDs to display names for comparison
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

			const holidayDisplayName = holidayNameMap[holiday.id];
			const isSelected = selectedHolidayNames.includes(holidayDisplayName);
			console.log(
				`Holiday ${holiday.id} (${holidayDisplayName}): ${
					isSelected ? "selected" : "not selected"
				}`
			);
			return isSelected;
		});

		console.log("Filtered holidays:", filteredHolidays);
		return filteredHolidays;
	};

	// Show loading state while data is being fetched
	if (isLoading) {
		return (
			<div className="min-h-screen christmas-gradient flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
					<p className="text-gray-600 dark:text-gray-300">
						{holidayPreferencesLoading
							? "Loading your holiday preferences..."
							: "Loading your holiday data..."}
					</p>
				</div>
			</div>
		);
	}

	// Get filtered holidays
	const filteredHolidays = getSelectedHolidays();

	// Sort holidays by countdown timer
	const sortedHolidays = [...filteredHolidays].sort((a, b) => {
		const state = {
			cards: { cards },
			giftList: { gifts },
			tasks: { tasks },
			addressBook: { contacts },
			hanukkahGiftList: { gifts: hanukkahGifts },
			hanukkahTasks: { tasks: hanukkahTasks },
			kwanzaaGiftList: { gifts: kwanzaaGifts },
			kwanzaaTasks: { tasks: kwanzaaTasks },
			newYearGiftList: { gifts: newYearGifts },
			newYearTasks: { tasks: newYearTasks },
			valentinesGiftList: { gifts: valentinesGifts },
			valentinesTasks: { tasks: valentinesTasks },
			easterGiftList: { gifts: easterGifts },
			easterTasks: { tasks: easterTasks },
			halloweenGiftList: { gifts: halloweenGifts },
			halloweenTasks: { tasks: halloweenTasks },
			thanksgivingGiftList: { gifts: thanksgivingGifts },
			thanksgivingTasks: { tasks: thanksgivingTasks },
			mothersDayGiftList: { gifts: mothersDayGifts },
			mothersDayTasks: { tasks: mothersDayTasks },
			fathersDayGiftList: { gifts: fathersDayGifts },
			fathersDayTasks: { tasks: fathersDayTasks },
			fourthOfJulyTasks: { tasks: fourthOfJulyTasks },
			birthdayGiftList: { gifts: birthdayGifts },
			birthdayTasks: { tasks: birthdayTasks },
			birthdayCards: { cards: birthdayCards },
			birthdayAddressBook: { contacts: birthdayContacts },
			anniversaryGiftList: { gifts: anniversaryGifts },
			anniversaryTasks: { tasks: anniversaryTasks },
			graduationGiftList: { gifts: graduationGifts },
			graduationTasks: { tasks: graduationTasks },
			graduationCards: { cards: graduationCards },
			graduationAddressBook: { contacts: graduationContacts },
			babyShowerGiftList: { gifts: babyShowerGifts },
			babyShowerTasks: { tasks: babyShowerTasks },
			babyShowerAddressBook: { contacts: babyShowerContacts },
			// Add countdown states
			countdown,
			hanukkahCountdown,
			kwanzaaCountdown,
			newYearCountdown,
			valentinesCountdown,
			easterCountdown,
			halloweenCountdown,
			thanksgivingCountdown,
		};

		const aCountdown = getHolidayCountdownTime(a.name, state);
		const bCountdown = getHolidayCountdownTime(b.name, state);

		// Sort by countdown time (closest first, then expired, then no countdown)
		return aCountdown - bCountdown;
	});

	return (
		<div className="min-h-screen christmas-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayHeader
				holidayName="Next Holiday"
				description="Plan your holidays, stay organized, and have fun!"
				showBackButton={false}
			/>
			<main className="flex-1 w-full max-w-4xl flex flex-col gap-6 mt-4">
				{sortedHolidays.length === 0 ? (
					<div className="text-center py-8">
						<p className="text-gray-600 dark:text-gray-400 mb-4">
							{holidayPreferences === null
								? "Welcome! To get started, select which holidays you'd like to plan for."
								: "No holidays selected in your preferences."}
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
						{sortedHolidays.map((holiday) => {
							// Find the holiday preference data for this holiday
							const holidayPreference = holidayPreferences?.find(
								(pref: any) => {
									// Map holiday names to holiday types for comparison
									const holidayNameMap: { [key: string]: string } = {
										Christmas: "Christmas",
										Hanukkah: "Hanukkah",
										Kwanzaa: "Kwanzaa",
										"New Year": "New Year",
										"Valentine's Day": "Valentine's Day",
										Easter: "Easter",
										Halloween: "Halloween",
										Thanksgiving: "Thanksgiving",
										"Mother's Day": "Mother's Day",
										"Father's Day": "Father's Day",
										"Fourth of July": "Fourth of July",
										Birthday: "Birthday",
										Anniversary: "Anniversary",
										Graduation: "Graduation",
										"Baby Shower": "Baby Shower",
									};
									return pref.holiday === holidayNameMap[holiday.name];
								}
							);

							// Get holiday ID and countdown timer from preferences
							const holidayId = holidayPreference?.holidayId;
							const countdownTimer = holidayPreference?.countdownTimer;

							const state = {
								cards: { cards },
								giftList: { gifts },
								tasks: { tasks },
								addressBook: { contacts },
								hanukkahGiftList: { gifts: hanukkahGifts },
								hanukkahTasks: { tasks: hanukkahTasks },
								kwanzaaGiftList: { gifts: kwanzaaGifts },
								kwanzaaTasks: { tasks: kwanzaaTasks },
								newYearGiftList: { gifts: newYearGifts },
								newYearTasks: { tasks: newYearTasks },
								valentinesGiftList: { gifts: valentinesGifts },
								valentinesTasks: { tasks: valentinesTasks },
								easterGiftList: { gifts: easterGifts },
								easterTasks: { tasks: easterTasks },
								halloweenGiftList: { gifts: halloweenGifts },
								halloweenTasks: { tasks: halloweenTasks },
								thanksgivingGiftList: { gifts: thanksgivingGifts },
								thanksgivingTasks: { tasks: thanksgivingTasks },
								mothersDayGiftList: { gifts: mothersDayGifts },
								mothersDayTasks: { tasks: mothersDayTasks },
								fathersDayGiftList: { gifts: fathersDayGifts },
								fathersDayTasks: { tasks: fathersDayTasks },
								fourthOfJulyTasks: { tasks: fourthOfJulyTasks },
								birthdayGiftList: { gifts: birthdayGifts },
								birthdayTasks: { tasks: birthdayTasks },
								birthdayCards: { cards: birthdayCards },
								birthdayAddressBook: { contacts: birthdayContacts },
								anniversaryGiftList: { gifts: anniversaryGifts },
								anniversaryTasks: { tasks: anniversaryTasks },
								graduationGiftList: { gifts: graduationGifts },
								graduationTasks: { tasks: graduationTasks },
								graduationCards: { cards: graduationCards },
								graduationAddressBook: { contacts: graduationContacts },
								babyShowerGiftList: { gifts: babyShowerGifts },
								babyShowerTasks: { tasks: babyShowerTasks },
								babyShowerAddressBook: { contacts: babyShowerContacts },
							};

							const progress = holiday.getProgress(state);
							const completedItems = holiday.getCompletedItems(state);
							const totalItems = holiday.getTotalItems(state);

							// Get gamified background color for each holiday
							const getGamifiedBackgroundColor = (holidayId: string) => {
								const colorMap: { [key: string]: string } = {
									christmas: "bg-gradient-to-br from-red-400 to-red-600",
									hanukkah: "bg-gradient-to-br from-blue-400 to-blue-600",
									kwanzaa: "bg-gradient-to-br from-red-400 to-red-600",
									"new-year": "bg-gradient-to-br from-yellow-400 to-yellow-600",
									valentines: "bg-gradient-to-br from-pink-300 to-pink-500",
									easter: "bg-gradient-to-br from-purple-300 to-purple-500",
									halloween: "bg-gradient-to-br from-orange-400 to-orange-600",
									thanksgiving: "bg-gradient-to-br from-amber-400 to-amber-600",
									"mothers-day": "bg-gradient-to-br from-pink-300 to-pink-500",
									"fathers-day": "bg-gradient-to-br from-blue-300 to-blue-500",
									"fourth-of-july": "bg-gradient-to-br from-red-400 to-red-600",
									birthday: "bg-gradient-to-br from-yellow-300 to-yellow-500",
									anniversary: "bg-gradient-to-br from-pink-300 to-pink-500",
									graduation: "bg-gradient-to-br from-purple-300 to-purple-500",
									"baby-shower": "bg-gradient-to-br from-cyan-300 to-cyan-500",
								};
								return (
									colorMap[holidayId] ||
									"bg-gradient-to-br from-gray-400 to-gray-600"
								);
							};

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
									gamifiedBackgroundColor={getGamifiedBackgroundColor(
										holiday.id
									)}
									holidayId={holidayId}
									countdownTimer={countdownTimer}
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
