"use client";

import Image from "next/image";
import Link from "next/link";
import { useAppSelector } from "@/store/hooks";
import CountdownTimer from "@/components/common/CountdownTimer";
import HolidayCard from "@/components/cards/HolidayCard";
import { holidayData } from "@/data/holidayData";
import GamifiedHolidayCardExample from "@/components/examples/GamifiedHolidayCardExample";
// import ReduxExample from "@/components/ReduxExample";
// import ReduxTest from "@/components/ReduxTest";

export default function Home() {
	// Get state from all Redux slices
	const cards = useAppSelector((state) => state.cards?.cards || []);
	const gifts = useAppSelector((state) => state.giftList?.gifts || []);
	const tasks = useAppSelector((state) => state.tasks?.tasks || []);
	const contacts = useAppSelector((state) => state.addressBook?.contacts || []);

	// Get settings to check holiday preferences
	const { settings } = useAppSelector((state: any) => state.theme);

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
		cardsLoading || giftsLoading || tasksLoading || contactsLoading;

	// Get all holiday data from Redux state
	const hanukkahGifts = useAppSelector(
		(state) => state.hanukkahGiftList?.gifts || []
	);
	const hanukkahTasks = useAppSelector(
		(state) => state.hanukkahTasks?.tasks || []
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
		// If no holiday choices are set, show all holidays (default behavior)
		if (!settings.holidayChoices || settings.holidayChoices.length === 0) {
			return holidayData;
		}

		// Get the list of selected holiday names from settings
		const selectedHolidayNames = settings.holidayChoices.map(
			(choice: { holiday: string; budget: number }) => choice.holiday
		);

		// Filter holidayData to only include selected holidays
		return holidayData.filter((holiday) => {
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
			return selectedHolidayNames.includes(holidayDisplayName);
		});
	};

	// Show loading state while data is being fetched
	if (isLoading) {
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

	// Get filtered holidays
	const filteredHolidays = getSelectedHolidays();

	return (
		<div className="min-h-screen christmas-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<header className="w-full max-w-md py-6">
				<h1 className="text-3xl font-bold text-center mb-2 text-gray-800 dark:text-white">
					Next Holiday
				</h1>
				<p className="text-center text-gray-600 dark:text-gray-400">
					Plan your holidays, stay organized, and have fun!
				</p>
			</header>
			<main className="flex-1 w-full max-w-4xl flex flex-col gap-6 mt-4">
				<h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-white">
					Upcoming Holidays
				</h2>
				{filteredHolidays.length === 0 ? (
					<div className="text-center py-8">
						<p className="text-gray-600 dark:text-gray-400 mb-4">
							No holidays selected in your preferences.
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
						{filteredHolidays.map((holiday) => {
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
								/>
							);
						})}
					</ul>
				)}
			</main>
			{/* <div className="w-full max-w-4xl mt-8">
				<ReduxExample />
				<div className="mt-8">
					<ReduxTest />
				</div>
			</div> */}

			<footer className="w-full max-w-md py-4 text-center text-xs text-gray-500 dark:text-gray-500 mt-8">
				&copy; {new Date().getFullYear()} Next Holiday
			</footer>
		</div>
	);
}
