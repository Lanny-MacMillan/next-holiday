import { configureStore } from "@reduxjs/toolkit";
import addressBookReducer from "./slices/addressBookSlice";
import cardsReducer from "./slices/cardsSlice";
import giftListReducer from "./slices/giftListSlice";
import tasksReducer from "./slices/tasksSlice";
import userReducer from "./slices/userSlice";
import themeReducer from "./slices/themeSlice";
import countdownReducer from "./slices/countdownSlice";
import hanukkahGiftListReducer from "./slices/hanukkahGiftListSlice";
import hanukkahTasksReducer from "./slices/hanukkahTasksSlice";
import hanukkahCountdownReducer from "./slices/hanukkahCountdownSlice";
import kwanzaaGiftListReducer from "./slices/kwanzaaGiftListSlice";
import kwanzaaTasksReducer from "./slices/kwanzaaTasksSlice";
import kwanzaaCountdownReducer from "./slices/kwanzaaCountdownSlice";
import newYearGiftListReducer from "./slices/newYearGiftListSlice";
import newYearTasksReducer from "./slices/newYearTasksSlice";
import newYearCountdownReducer from "./slices/newYearCountdownSlice";
import valentinesGiftListReducer from "./slices/valentinesGiftListSlice";
import valentinesTasksReducer from "./slices/valentinesTasksSlice";
import valentinesCountdownReducer from "./slices/valentinesCountdownSlice";
import easterGiftListReducer from "./slices/easterGiftListSlice";
import easterTasksReducer from "./slices/easterTasksSlice";
import easterCountdownReducer from "./slices/easterCountdownSlice";
import halloweenGiftListReducer from "./slices/halloweenGiftListSlice";
import halloweenTasksReducer from "./slices/halloweenTasksSlice";
import halloweenCountdownReducer from "./slices/halloweenCountdownSlice";
import thanksgivingGiftListReducer from "./slices/thanksgivingGiftListSlice";
import thanksgivingTasksReducer from "./slices/thanksgivingTasksSlice";
import thanksgivingCountdownReducer from "./slices/thanksgivingCountdownSlice";
import thanksgivingGuestListReducer from "./slices/thanksgivingGuestListSlice";
import thanksgivingMealPlanningReducer from "./slices/thanksgivingMealPlanningSlice";

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
