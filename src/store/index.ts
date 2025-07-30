import { configureStore } from "@reduxjs/toolkit";
import addressBookReducer from "./slices/addressBookSlice";
import cardsReducer from "./slices/cardsSlice";
import giftListReducer from "./slices/giftListSlice";
import tasksReducer from "./slices/tasksSlice";

export const store = configureStore({
	reducer: {
		addressBook: addressBookReducer,
		cards: cardsReducer,
		giftList: giftListReducer,
		tasks: tasksReducer,
	},
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware({
			serializableCheck: {
				// Ignore these action types for serializable check
				ignoredActions: ["persist/PERSIST"],
			},
		}),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
