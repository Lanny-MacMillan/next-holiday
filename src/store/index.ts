import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import addressBookReducer from "./slices/addressBookSlice";
import cardsReducer from "./slices/cardsSlice";
import giftListReducer from "./slices/giftListSlice";
import tasksReducer from "./slices/tasksSlice";

// Persist configuration
const persistConfig = {
	key: "root",
	storage,
	whitelist: ["addressBook", "cards", "giftList", "tasks"], // Only persist these reducers
};

// Create persisted reducers
const persistedAddressBookReducer = persistReducer(
	{ key: "addressBook", storage },
	addressBookReducer
);
const persistedCardsReducer = persistReducer(
	{ key: "cards", storage },
	cardsReducer
);
const persistedGiftListReducer = persistReducer(
	{ key: "giftList", storage },
	giftListReducer
);
const persistedTasksReducer = persistReducer(
	{ key: "tasks", storage },
	tasksReducer
);

export const store = configureStore({
	reducer: {
		addressBook: persistedAddressBookReducer,
		cards: persistedCardsReducer,
		giftList: persistedGiftListReducer,
		tasks: persistedTasksReducer,
	},
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware({
			serializableCheck: {
				// Ignore these action types for serializable check
				ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
			},
		}),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
