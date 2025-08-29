import { useAuth0 } from "@auth0/auth0-react";
import { useAppSelector } from "@/store/hooks";
import {
	useGetAllCardsQuery,
	useGetAllGiftsQuery,
	useGetAllTasksQuery,
} from "@/store/api";

export function useHomePageData(homeData?: any) {
	const { user: auth0User } = useAuth0();
	const holidayPreferences = useAppSelector(
		(state: any) => state.home.data?.holidayPreferences || []
	);
	const homeInitialized = useAppSelector(
		(state: any) => state.home.initialized
	);

	// Only fetch data if home is initialized
	const shouldFetch = homeInitialized && auth0User;

	// Fetch all data for all holidays
	const { data: allCards = [], isLoading: cardsLoading } = useGetAllCardsQuery(
		{ auth0User },
		{ skip: !shouldFetch }
	);

	const { data: allGifts = [], isLoading: giftsLoading } = useGetAllGiftsQuery(
		{ auth0User },
		{ skip: !shouldFetch }
	);

	const { data: allTasks = [], isLoading: tasksLoading } = useGetAllTasksQuery(
		{ auth0User },
		{ skip: !shouldFetch }
	);

	// Contacts are fetched as part of home data
	const contacts = homeData?.contacts || [];
	const contactsLoading = false;

	// Group data by holiday
	const getDataByHoliday = (holidayId: string) => {
		return {
			cards: allCards.filter((card: any) => card.holidayId === holidayId),
			gifts: allGifts.filter((gift: any) => gift.holidayId === holidayId),
			tasks: allTasks.filter((task: any) => task.holidayId === holidayId),
		};
	};

	// Create a state object that matches the legacy slice structure for each holiday
	const createLegacyStateObject = (holidayId: string, holidayName?: string) => {
		if (!holidayId) {
			// Return empty state if no holidayId is provided
			return {
				cards: { cards: [] },
				giftList: { gifts: [] },
				tasks: { tasks: [] },
				addressBook: { contacts },
			};
		}

		const holidayData = getDataByHoliday(holidayId);

		// Create the base state object
		const baseState: any = {
			cards: { cards: holidayData.cards },
			giftList: { gifts: holidayData.gifts },
			tasks: { tasks: holidayData.tasks },
			addressBook: { contacts },
		};

		// Add holiday-specific slices based on the holiday name
		if (holidayName) {
			// Map holiday names to their expected state slice keys
			const holidaySliceMap: { [key: string]: any } = {
				Christmas: {
					cards: { cards: holidayData.cards },
					giftList: { gifts: holidayData.gifts },
					tasks: { tasks: holidayData.tasks },
				},
				Hanukkah: {
					hanukkahGiftList: { gifts: holidayData.gifts },
					hanukkahTasks: { tasks: holidayData.tasks },
				},
				Kwanzaa: {
					kwanzaaGiftList: { gifts: holidayData.gifts },
					kwanzaaTasks: { tasks: holidayData.tasks },
				},
				"New Year": {
					newYearGiftList: { gifts: holidayData.gifts },
					newYearTasks: { tasks: holidayData.tasks },
				},
				"Valentine's Day": {
					valentinesGiftList: { gifts: holidayData.gifts },
					valentinesTasks: { tasks: holidayData.tasks },
				},
				Easter: {
					easterGiftList: { gifts: holidayData.gifts },
					easterTasks: { tasks: holidayData.tasks },
				},
				Halloween: {
					halloweenGiftList: { gifts: holidayData.gifts },
					halloweenTasks: { tasks: holidayData.tasks },
				},
				Thanksgiving: {
					thanksgivingGiftList: { gifts: holidayData.gifts },
					thanksgivingTasks: { tasks: holidayData.tasks },
				},
				"Mother's Day": {
					mothersDayGiftList: { gifts: holidayData.gifts },
					mothersDayTasks: { tasks: holidayData.tasks },
				},
				"Father's Day": {
					fathersDayGiftList: { gifts: holidayData.gifts },
					fathersDayTasks: { tasks: holidayData.tasks },
				},
				"Fourth of July": {
					fourthOfJulyTasks: { tasks: holidayData.tasks },
				},
				Birthday: {
					birthdayGiftList: { gifts: holidayData.gifts },
					birthdayTasks: { tasks: holidayData.tasks },
					birthdayCards: { cards: holidayData.cards },
					birthdayAddressBook: { contacts },
				},
				Anniversary: {
					anniversaryGiftList: { gifts: holidayData.gifts },
					anniversaryTasks: { tasks: holidayData.tasks },
				},
				Graduation: {
					graduationGiftList: { gifts: holidayData.gifts },
					graduationTasks: { tasks: holidayData.tasks },
					graduationCards: { cards: holidayData.cards },
					graduationAddressBook: { contacts },
				},
				"Baby Shower": {
					babyShowerGiftList: { gifts: holidayData.gifts },
					babyShowerAddressBook: { contacts },
				},
			};

			// Add the holiday-specific slices to the base state
			const holidaySlices = holidaySliceMap[holidayName];
			if (holidaySlices) {
				Object.assign(baseState, holidaySlices);
			}
		}

		return baseState;
	};

	const isLoading =
		cardsLoading || giftsLoading || tasksLoading || contactsLoading;

	return {
		allCards,
		allGifts,
		allTasks,
		contacts,
		isLoading,
		getDataByHoliday,
		createLegacyStateObject,
		holidayPreferences,
	};
}
