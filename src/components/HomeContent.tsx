"use client";

import Link from "next/link";
import { useAppSelector } from "@/store/hooks";
import HolidayCard from "@/components/cards/HolidayCard";
import HolidayHeader from "@/components/common/HolidayHeader";
import { holidayData } from "@/data/holidayData";
import { getHolidayCountdownTime } from "@/utils/holidayUtils";
import { HomeData } from "@/types/home";

interface HomeContentProps {
	homeData: HomeData;
}

export default function HomeContent({ homeData }: HomeContentProps) {
	// Get state from Redux for progress calculations only
	const cards = useAppSelector((state) => state.cards?.cards || []);
	const gifts = useAppSelector((state) => state.giftList?.gifts || []);
	const tasks = useAppSelector((state) => state.tasks?.tasks || []);
	const contacts = useAppSelector((state) => state.addressBook?.contacts || []);

	// Add all holiday-specific state slices
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
	const babyShowerGifts = useAppSelector(
		(state) => state.babyShowerGiftList?.gifts || []
	);

	// Filter holidays based on server data
	const getSelectedHolidays = () => {
		if (
			!homeData.holidayPreferences ||
			homeData.holidayPreferences.length === 0
		) {
			return [];
		}

		const selectedHolidayNames = homeData.holidayPreferences.map(
			(choice) => choice.holiday
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

		return holidayData.filter((holiday) => {
			const holidayDisplayName = holidayNameMap[holiday.id];
			return selectedHolidayNames.includes(holidayDisplayName);
		});
	};

	const filteredHolidays = getSelectedHolidays();

	return (
		<div className="min-h-screen christmas-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayHeader
				holidayName="Next Holiday"
				description="Plan your holidays, stay organized, and have fun!"
				showBackButton={false}
			/>
			<main className="flex-1 w-full max-w-4xl flex flex-col gap-6 mt-4">
				{filteredHolidays.length === 0 ? (
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
						{filteredHolidays.map((holiday) => {
							const holidayPreference = homeData.holidayPreferences?.find(
								(pref) => pref.holiday === holiday.name
							);

							const state = {
								cards: { cards },
								giftList: { gifts },
								tasks: { tasks },
								addressBook: { contacts },
								hanukkahGiftList: { gifts: hanukkahGifts },
								hanukkahTasks: { tasks: hanukkahTasks },
								kwanzaaGiftList: { gifts: kwanzaaGifts },
								kwanzaaTasks: { tasks: kwanzaaTasks },

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
								anniversaryGiftList: { gifts: anniversaryGifts },
								anniversaryTasks: { tasks: anniversaryTasks },
								graduationGiftList: { gifts: graduationGifts },
								graduationTasks: { tasks: graduationTasks },
								babyShowerGiftList: { gifts: babyShowerGifts },
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
