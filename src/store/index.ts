import { configureStore } from "@reduxjs/toolkit";
import addressBookReducer from "./slices/addressBookSlice";
import cardsReducer from "./slices/cardsSlice";
import giftListReducer from "./slices/giftListSlice";
import tasksReducer from "./slices/tasksSlice";
import userReducer from "./slices/userSlice";
import themeReducer from "./slices/themeSlice";
import countdownReducer from "./slices/countdownSlice";
import hanukkahGiftListReducer from "./slices/hanukkah/hanukkahGiftListSlice";
import hanukkahTasksReducer from "./slices/hanukkah/hanukkahTasksSlice";
import hanukkahCountdownReducer from "./slices/hanukkah/hanukkahCountdownSlice";
import kwanzaaGiftListReducer from "./slices/kwanzaa/kwanzaaGiftListSlice";
import kwanzaaTasksReducer from "./slices/kwanzaa/kwanzaaTasksSlice";
import kwanzaaCountdownReducer from "./slices/kwanzaa/kwanzaaCountdownSlice";
import newYearGiftListReducer from "./slices/new-year/newYearGiftListSlice";
import newYearTasksReducer from "./slices/new-year/newYearTasksSlice";
import newYearCountdownReducer from "./slices/new-year/newYearCountdownSlice";
import valentinesGiftListReducer from "./slices/valentines/valentinesGiftListSlice";
import valentinesTasksReducer from "./slices/valentines/valentinesTasksSlice";
import valentinesCountdownReducer from "./slices/valentines/valentinesCountdownSlice";
import easterGiftListReducer from "./slices/easter/easterGiftListSlice";
import easterTasksReducer from "./slices/easter/easterTasksSlice";
import easterCountdownReducer from "./slices/easter/easterCountdownSlice";
import halloweenGiftListReducer from "./slices/halloween/halloweenGiftListSlice";
import halloweenTasksReducer from "./slices/halloween/halloweenTasksSlice";
import halloweenCountdownReducer from "./slices/halloween/halloweenCountdownSlice";
import thanksgivingGiftListReducer from "./slices/thanksgiving/thanksgivingGiftListSlice";
import thanksgivingTasksReducer from "./slices/thanksgiving/thanksgivingTasksSlice";
import thanksgivingCountdownReducer from "./slices/thanksgiving/thanksgivingCountdownSlice";
import thanksgivingGuestListReducer from "./slices/thanksgiving/thanksgivingGuestListSlice";
import thanksgivingMealPlanningReducer from "./slices/thanksgiving/thanksgivingMealPlanningSlice";
import mothersDayGiftListReducer from "./slices/mothers-day/mothersDayGiftListSlice";
import mothersDayTasksReducer from "./slices/mothers-day/mothersDayTasksSlice";
import fathersDayGiftListReducer from "./slices/fathers-day/fathersDayGiftListSlice";
import fathersDayTasksReducer from "./slices/fathers-day/fathersDayTasksSlice";
import fathersDayCardsReducer from "./slices/fathers-day/fathersDayCardsSlice";
import fourthOfJulyTasksReducer from "./slices/fourth-of-july/fourthOfJulyTasksSlice";
import fourthOfJulyGuestListReducer from "./slices/fourth-of-july/fourthOfJulyGuestListSlice";
import birthdayGiftListReducer from "./slices/birthday/birthdayGiftListSlice";
import birthdayTasksReducer from "./slices/birthday/birthdayTasksSlice";
import birthdayCardsReducer from "./slices/birthday/birthdayCardsSlice";
import birthdayAddressBookReducer from "./slices/birthday/birthdayAddressBookSlice";
import birthdayGuestListReducer from "./slices/birthday/birthdayGuestListSlice";
import anniversaryGiftListReducer from "./slices/anniversary/anniversaryGiftListSlice";
import anniversaryTasksReducer from "./slices/anniversary/anniversaryTasksSlice";
import graduationGiftListReducer from "./slices/graduation/graduationGiftListSlice";
import graduationTasksReducer from "./slices/graduation/graduationTasksSlice";
import graduationCardsReducer from "./slices/graduation/graduationCardsSlice";
import graduationAddressBookReducer from "./slices/graduation/graduationAddressBookSlice";
import babyShowerGiftListReducer from "./slices/baby-shower/babyShowerGiftListSlice";
import babyShowerTasksReducer from "./slices/baby-shower/babyShowerTasksSlice";
import babyShowerAddressBookReducer from "./slices/baby-shower/babyShowerAddressBookSlice";
import babyShowerGuestListReducer from "./slices/baby-shower/babyShowerGuestListSlice";
import graduationCountdownReducer from "./slices/graduation/graduationCountdownSlice";
import anniversaryCountdownReducer from "./slices/anniversary/anniversaryCountdownSlice";
import birthdayCountdownReducer from "./slices/birthday/birthdayCountdownSlice";
import fourthOfJulyCountdownReducer from "./slices/fourth-of-july/fourthOfJulyCountdownSlice";
import fathersDayCountdownReducer from "./slices/fathers-day/fathersDayCountdownSlice";
import mothersDayCountdownReducer from "./slices/mothers-day/mothersDayCountdownSlice";
import christmasCountdownReducer from "./slices/christmas/christmasCountdownSlice";

// Check if we should disable serializable checks in development
const shouldDisableSerializableCheck =
	process.env.NODE_ENV === "development" &&
	process.env.NEXT_PUBLIC_DISABLE_SERIALIZABLE_CHECK === "true";

export const store = configureStore({
	reducer: {
		addressBook: addressBookReducer,
		cards: cardsReducer,
		giftList: giftListReducer,
		tasks: tasksReducer,
		user: userReducer,
		theme: themeReducer,
		countdown: countdownReducer,
		hanukkahGiftList: hanukkahGiftListReducer,
		hanukkahTasks: hanukkahTasksReducer,
		hanukkahCountdown: hanukkahCountdownReducer,
		kwanzaaGiftList: kwanzaaGiftListReducer,
		kwanzaaTasks: kwanzaaTasksReducer,
		kwanzaaCountdown: kwanzaaCountdownReducer,
		newYearGiftList: newYearGiftListReducer,
		newYearTasks: newYearTasksReducer,
		newYearCountdown: newYearCountdownReducer,
		valentinesGiftList: valentinesGiftListReducer,
		valentinesTasks: valentinesTasksReducer,
		valentinesCountdown: valentinesCountdownReducer,
		easterGiftList: easterGiftListReducer,
		easterTasks: easterTasksReducer,
		easterCountdown: easterCountdownReducer,
		halloweenGiftList: halloweenGiftListReducer,
		halloweenTasks: halloweenTasksReducer,
		halloweenCountdown: halloweenCountdownReducer,
		thanksgivingGiftList: thanksgivingGiftListReducer,
		thanksgivingTasks: thanksgivingTasksReducer,
		thanksgivingCountdown: thanksgivingCountdownReducer,
		thanksgivingGuestList: thanksgivingGuestListReducer,
		thanksgivingMealPlanning: thanksgivingMealPlanningReducer,
		mothersDayGiftList: mothersDayGiftListReducer,
		mothersDayTasks: mothersDayTasksReducer,
		fathersDayGiftList: fathersDayGiftListReducer,
		fathersDayTasks: fathersDayTasksReducer,
		fathersDayCards: fathersDayCardsReducer,
		fourthOfJulyTasks: fourthOfJulyTasksReducer,
		fourthOfJulyGuestList: fourthOfJulyGuestListReducer,
		birthdayGiftList: birthdayGiftListReducer,
		birthdayTasks: birthdayTasksReducer,
		birthdayCards: birthdayCardsReducer,
		birthdayAddressBook: birthdayAddressBookReducer,
		birthdayGuestList: birthdayGuestListReducer,
		anniversaryGiftList: anniversaryGiftListReducer,
		anniversaryTasks: anniversaryTasksReducer,
		graduationGiftList: graduationGiftListReducer,
		graduationTasks: graduationTasksReducer,
		graduationCards: graduationCardsReducer,
		graduationAddressBook: graduationAddressBookReducer,
		babyShowerGiftList: babyShowerGiftListReducer,
		babyShowerTasks: babyShowerTasksReducer,
		babyShowerAddressBook: babyShowerAddressBookReducer,
		babyShowerGuestList: babyShowerGuestListReducer,
		graduationCountdown: graduationCountdownReducer,
		anniversaryCountdown: anniversaryCountdownReducer,
		birthdayCountdown: birthdayCountdownReducer,
		fourthOfJulyCountdown: fourthOfJulyCountdownReducer,
		fathersDayCountdown: fathersDayCountdownReducer,
		mothersDayCountdown: mothersDayCountdownReducer,
		christmasCountdown: christmasCountdownReducer,
	},
	middleware: (getDefaultMiddleware) => {
		const middleware = getDefaultMiddleware({
			serializableCheck: shouldDisableSerializableCheck
				? false
				: {
						// Ignore specific actions that might contain non-serializable data
						ignoredActions: [
							"persist/PERSIST",
							"persist/REHYDRATE",
							"persist/PAUSE",
							"persist/PURGE",
							"persist/REGISTER",
							"persist/FLUSH",
						],
						// Ignore specific paths in the state that might contain non-serializable data
						ignoredPaths: [
							"user.user", // Auth0 user object might contain non-serializable data
						],
						// Increase the warning threshold for development
						warnAfter: 128, // Increase from default 32ms to 128ms
				  },
			// Disable immutable check in development to improve performance
			immutableCheck: {
				warnAfter: 128,
			},
		});

		// Log middleware configuration in development
		if (process.env.NODE_ENV === "development") {
			console.log("Redux middleware configuration:", {
				serializableCheck: shouldDisableSerializableCheck
					? "disabled"
					: "enabled",
				immutableCheck: "enabled with 128ms threshold",
				reducerCount: 50, // Approximate count of reducers
			});
		}

		return middleware;
	},
	// Enable Redux DevTools in development
	devTools: process.env.NODE_ENV !== "production",
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
