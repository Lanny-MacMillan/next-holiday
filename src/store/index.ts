import { configureStore } from "@reduxjs/toolkit";
import addressBookReducer from "./slices/addressBookSlice";
import cardsReducer from "./slices/cardsSlice";
import giftListReducer from "./slices/giftListSlice";
import tasksReducer from "./slices/tasksSlice";
import userReducer from "./slices/userSlice";
import themeReducer from "./slices/themeSlice";

export const store = configureStore({
	reducer: {
		addressBook: addressBookReducer,
		cards: cardsReducer,
		giftList: giftListReducer,
		tasks: tasksReducer,
		user: userReducer,
		theme: themeReducer,
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
