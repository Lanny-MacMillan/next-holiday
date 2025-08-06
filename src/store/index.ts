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
import birthdayGiftListReducer from "./slices/birthday/birthdayGiftListSlice";
import birthdayTasksReducer from "./slices/birthday/birthdayTasksSlice";
import birthdayCardsReducer from "./slices/birthday/birthdayCardsSlice";
import birthdayAddressBookReducer from "./slices/birthday/birthdayAddressBookSlice";
import anniversaryGiftListReducer from "./slices/anniversary/anniversaryGiftListSlice";
import anniversaryTasksReducer from "./slices/anniversary/anniversaryTasksSlice";
import graduationGiftListReducer from "./slices/graduation/graduationGiftListSlice";
import graduationTasksReducer from "./slices/graduation/graduationTasksSlice";
import graduationCardsReducer from "./slices/graduation/graduationCardsSlice";
import graduationAddressBookReducer from "./slices/graduation/graduationAddressBookSlice";
import babyShowerGiftListReducer from "./slices/baby-shower/babyShowerGiftListSlice";
import babyShowerTasksReducer from "./slices/baby-shower/babyShowerTasksSlice";
import babyShowerAddressBookReducer from "./slices/baby-shower/babyShowerAddressBookSlice";

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
		birthdayGiftList: birthdayGiftListReducer,
		birthdayTasks: birthdayTasksReducer,
		birthdayCards: birthdayCardsReducer,
		birthdayAddressBook: birthdayAddressBookReducer,
		anniversaryGiftList: anniversaryGiftListReducer,
		anniversaryTasks: anniversaryTasksReducer,
		graduationGiftList: graduationGiftListReducer,
		graduationTasks: graduationTasksReducer,
		graduationCards: graduationCardsReducer,
		graduationAddressBook: graduationAddressBookReducer,
		babyShowerGiftList: babyShowerGiftListReducer,
		babyShowerTasks: babyShowerTasksReducer,
		babyShowerAddressBook: babyShowerAddressBookReducer,
	},
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware({
			serializableCheck: {
				ignoredActions: ["persist/PERSIST"],
			},
		}),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
