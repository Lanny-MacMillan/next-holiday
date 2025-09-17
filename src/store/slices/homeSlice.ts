import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { HomeData } from "@/types/home";

interface HomeState {
	data: HomeData | null;
	loading: boolean;
	error: string | null;
	initialized: boolean;
}

const initialState: HomeState = {
	data: null,
	loading: false,
	error: null,
	initialized: false,
};

const homeSlice = createSlice({
	name: "home",
	initialState,
	reducers: {
		setHomeData: (state, action: PayloadAction<HomeData>) => {
			state.data = action.payload;
			state.initialized = true;
			state.loading = false;
			state.error = null;
		},
		setLoading: (state, action: PayloadAction<boolean>) => {
			state.loading = action.payload;
		},
		setError: (state, action: PayloadAction<string | null>) => {
			state.error = action.payload;
			state.loading = false;
		},
		clearHomeData: (state) => {
			state.data = null;
			state.initialized = false;
			state.loading = false;
			state.error = null;
		},
		updateGiftInHomeData: (
			state,
			action: PayloadAction<{
				holidayId: string;
				giftId: string;
				updates: any;
			}>
		) => {
			if (!state.data?.holidayPreferences) return;

			const { holidayId, giftId, updates } = action.payload;
			const holidayPref = state.data.holidayPreferences.find(
				(pref) => pref.holidayId === holidayId
			);

			if (holidayPref?.gifts) {
				const giftIndex = holidayPref.gifts.findIndex(
					(gift: any) => gift.id === giftId
				);
				if (giftIndex !== -1) {
					holidayPref.gifts[giftIndex] = {
						...holidayPref.gifts[giftIndex],
						...updates,
					};
				}
			}
		},
		updateCardInHomeData: (
			state,
			action: PayloadAction<{
				holidayId: string;
				cardId: string;
				updates: any;
			}>
		) => {
			if (!state.data?.holidayPreferences) return;

			const { holidayId, cardId, updates } = action.payload;
			const holidayPref = state.data.holidayPreferences.find(
				(pref) => pref.holidayId === holidayId
			);

			if (holidayPref?.cards) {
				const cardIndex = holidayPref.cards.findIndex(
					(card: any) => card.id === cardId
				);
				if (cardIndex !== -1) {
					holidayPref.cards[cardIndex] = {
						...holidayPref.cards[cardIndex],
						...updates,
					};
				}
			}
		},
		updateTaskInHomeData: (
			state,
			action: PayloadAction<{
				holidayId: string;
				taskId: string;
				updates: any;
			}>
		) => {
			if (!state.data?.holidayPreferences) return;

			const { holidayId, taskId, updates } = action.payload;
			const holidayPref = state.data.holidayPreferences.find(
				(pref) => pref.holidayId === holidayId
			);

			if (holidayPref?.tasks) {
				const taskIndex = holidayPref.tasks.findIndex(
					(task: any) => task.id === taskId
				);
				if (taskIndex !== -1) {
					holidayPref.tasks[taskIndex] = {
						...holidayPref.tasks[taskIndex],
						...updates,
					};
				}
			}
		},
		addGiftToHomeData: (
			state,
			action: PayloadAction<{
				holidayId: string;
				gift: any;
			}>
		) => {
			if (!state.data?.holidayPreferences) return;

			const { holidayId, gift } = action.payload;
			const holidayPref = state.data.holidayPreferences.find(
				(pref) => pref.holidayId === holidayId
			);

			if (holidayPref) {
				if (!holidayPref.gifts) holidayPref.gifts = [];
				holidayPref.gifts.push(gift);
			}
		},
		removeGiftFromHomeData: (
			state,
			action: PayloadAction<{
				holidayId: string;
				giftId: string;
			}>
		) => {
			if (!state.data?.holidayPreferences) return;

			const { holidayId, giftId } = action.payload;
			const holidayPref = state.data.holidayPreferences.find(
				(pref) => pref.holidayId === holidayId
			);

			if (holidayPref?.gifts) {
				holidayPref.gifts = holidayPref.gifts.filter(
					(gift: any) => gift.id !== giftId
				);
			}
		},
		addTaskToHomeData: (
			state,
			action: PayloadAction<{
				holidayId: string;
				task: any;
			}>
		) => {
			if (!state.data?.holidayPreferences) return;

			const { holidayId, task } = action.payload;
			const holidayPref = state.data.holidayPreferences.find(
				(pref) => pref.holidayId === holidayId
			);

			if (holidayPref) {
				if (!holidayPref.tasks) holidayPref.tasks = [];
				holidayPref.tasks.push(task);
			}
		},
		removeTaskFromHomeData: (
			state,
			action: PayloadAction<{
				holidayId: string;
				taskId: string;
			}>
		) => {
			if (!state.data?.holidayPreferences) return;

			const { holidayId, taskId } = action.payload;
			const holidayPref = state.data.holidayPreferences.find(
				(pref) => pref.holidayId === holidayId
			);

			if (holidayPref?.tasks) {
				holidayPref.tasks = holidayPref.tasks.filter(
					(task: any) => task.id !== taskId
				);
			}
		},
		addEventToHomeData: (
			state,
			action: PayloadAction<{
				holidayId: string;
				event: any;
			}>
		) => {
			if (!state.data?.holidayPreferences) return;

			const { holidayId, event } = action.payload;
			const holidayPref = state.data.holidayPreferences.find(
				(pref) => pref.holidayId === holidayId
			);

			if (holidayPref) {
				if (!holidayPref.events) holidayPref.events = [];
				holidayPref.events.push(event);
			}
		},
		removeEventFromHomeData: (
			state,
			action: PayloadAction<{
				holidayId: string;
				eventId: string;
			}>
		) => {
			if (!state.data?.holidayPreferences) return;

			const { holidayId, eventId } = action.payload;
			const holidayPref = state.data.holidayPreferences.find(
				(pref) => pref.holidayId === holidayId
			);

			if (holidayPref?.events) {
				holidayPref.events = holidayPref.events.filter(
					(event: any) => event.id !== eventId
				);
			}
		},
		updateEventInHomeData: (
			state,
			action: PayloadAction<{
				holidayId: string;
				eventId: string;
				updates: any;
			}>
		) => {
			if (!state.data?.holidayPreferences) return;

			const { holidayId, eventId, updates } = action.payload;
			const holidayPref = state.data.holidayPreferences.find(
				(pref) => pref.holidayId === holidayId
			);

			if (holidayPref?.events) {
				const eventIndex = holidayPref.events.findIndex(
					(event: any) => event.id === eventId
				);
				if (eventIndex !== -1) {
					holidayPref.events[eventIndex] = {
						...holidayPref.events[eventIndex],
						...updates,
					};
				}
			}
		},
		addDecorationToHomeData: (
			state,
			action: PayloadAction<{
				holidayId: string;
				decoration: any;
			}>
		) => {
			if (!state.data?.holidayPreferences) return;

			const { holidayId, decoration } = action.payload;
			const holidayPref = state.data.holidayPreferences.find(
				(pref) => pref.holidayId === holidayId
			);

			if (holidayPref) {
				if (!holidayPref.decorations) holidayPref.decorations = [];
				holidayPref.decorations.push(decoration);
			}
		},
		removeDecorationFromHomeData: (
			state,
			action: PayloadAction<{
				holidayId: string;
				decorationId: string;
			}>
		) => {
			if (!state.data?.holidayPreferences) return;

			const { holidayId, decorationId } = action.payload;
			const holidayPref = state.data.holidayPreferences.find(
				(pref) => pref.holidayId === holidayId
			);

			if (holidayPref?.decorations) {
				holidayPref.decorations = holidayPref.decorations.filter(
					(decoration: any) => decoration.id !== decorationId
				);
			}
		},
		updateDecorationInHomeData: (
			state,
			action: PayloadAction<{
				holidayId: string;
				decorationId: string;
				updates: any;
			}>
		) => {
			if (!state.data?.holidayPreferences) return;

			const { holidayId, decorationId, updates } = action.payload;
			const holidayPref = state.data.holidayPreferences.find(
				(pref) => pref.holidayId === holidayId
			);

			if (holidayPref?.decorations) {
				const decorationIndex = holidayPref.decorations.findIndex(
					(decoration: any) => decoration.id === decorationId
				);
				if (decorationIndex !== -1) {
					holidayPref.decorations[decorationIndex] = {
						...holidayPref.decorations[decorationIndex],
						...updates,
					};
				}
			}
		},
		addCardToHomeData: (
			state,
			action: PayloadAction<{
				holidayId: string;
				card: any;
			}>
		) => {
			if (!state.data?.holidayPreferences) return;

			const { holidayId, card } = action.payload;
			const holidayPref = state.data.holidayPreferences.find(
				(pref) => pref.holidayId === holidayId
			);

			if (holidayPref) {
				if (!holidayPref.cards) holidayPref.cards = [];
				holidayPref.cards.push(card);
			}
		},
		removeCardFromHomeData: (
			state,
			action: PayloadAction<{
				holidayId: string;
				cardId: string;
			}>
		) => {
			if (!state.data?.holidayPreferences) return;

			const { holidayId, cardId } = action.payload;
			const holidayPref = state.data.holidayPreferences.find(
				(pref) => pref.holidayId === holidayId
			);

			if (holidayPref?.cards) {
				holidayPref.cards = holidayPref.cards.filter(
					(card: any) => card.id !== cardId
				);
			}
		},
		addGuestToHomeData: (
			state,
			action: PayloadAction<{
				holidayId: string;
				guest: any;
			}>
		) => {
			if (!state.data?.holidayPreferences) return;

			const { holidayId, guest } = action.payload;
			const holidayPref = state.data.holidayPreferences.find(
				(pref) => pref.holidayId === holidayId
			);

			if (holidayPref) {
				if (!holidayPref.guestLists) holidayPref.guestLists = [];
				holidayPref.guestLists.push(guest);
			}
		},
		removeGuestFromHomeData: (
			state,
			action: PayloadAction<{
				holidayId: string;
				guestId: string;
			}>
		) => {
			if (!state.data?.holidayPreferences) return;

			const { holidayId, guestId } = action.payload;
			const holidayPref = state.data.holidayPreferences.find(
				(pref) => pref.holidayId === holidayId
			);

			if (holidayPref?.guestLists) {
				holidayPref.guestLists = holidayPref.guestLists.filter(
					(guest: any) => guest.id !== guestId
				);
			}
		},
		updateGuestInHomeData: (
			state,
			action: PayloadAction<{
				holidayId: string;
				guestId: string;
				updates: any;
			}>
		) => {
			if (!state.data?.holidayPreferences) return;

			const { holidayId, guestId, updates } = action.payload;
			const holidayPref = state.data.holidayPreferences.find(
				(pref) => pref.holidayId === holidayId
			);

			if (holidayPref?.guestLists) {
				const guestIndex = holidayPref.guestLists.findIndex(
					(guest: any) => guest.id === guestId
				);
				if (guestIndex !== -1) {
					holidayPref.guestLists[guestIndex] = {
						...holidayPref.guestLists[guestIndex],
						...updates,
					};
				}
			}
		},
		addHolidayToHomeData: (
			state,
			action: PayloadAction<{
				holiday: any;
			}>
		) => {
			if (!state.data) {
				state.data = {
					user: null,
					account: null,
					holidayPreferences: [],
					contacts: null,
					needsUserSetup: false,
					needsHolidaySelection: false,
				};
			}

			if (!state.data.holidayPreferences) {
				state.data.holidayPreferences = [];
			}

			const { holiday } = action.payload;

			// Check if holiday already exists to prevent duplicates
			const existingIndex = state.data.holidayPreferences.findIndex(
				(h: any) => h.holidayId === holiday.holidayId
			);

			if (existingIndex === -1) {
				// Holiday doesn't exist, add it
				state.data.holidayPreferences.push(holiday);
			} else {
				// Holiday exists, update it instead of adding duplicate
				state.data.holidayPreferences[existingIndex] = holiday;
			}
		},
		refreshHomeData: (state, action: PayloadAction<HomeData>) => {
			state.data = action.payload;
			state.initialized = true;
			state.loading = false;
			state.error = null;
		},
	},
});

// Selectors
export const selectHomeData = (state: { home: HomeState }) => state.home.data;
export const selectHolidayPreferences = (state: { home: HomeState }) =>
	state.home.data?.holidayPreferences || [];
export const selectContacts = (state: { home: HomeState }) =>
	state.home.data?.contacts || [];
export const selectHomeLoading = (state: { home: HomeState }) =>
	state.home.loading;
export const selectHomeError = (state: { home: HomeState }) => state.home.error;
export const selectHomeInitialized = (state: { home: HomeState }) =>
	state.home.initialized;

// Selector for guest lists by holiday ID
export const selectGuestListsByHoliday =
	(holidayId: string) => (state: { home: HomeState }) => {
		const holidayPref = state.home.data?.holidayPreferences?.find(
			(pref) => pref.holidayId === holidayId
		);
		return holidayPref?.guestLists || [];
	};

export const {
	setHomeData,
	setLoading,
	setError,
	clearHomeData,
	updateGiftInHomeData,
	updateCardInHomeData,
	updateTaskInHomeData,
	addGiftToHomeData,
	removeGiftFromHomeData,
	addTaskToHomeData,
	removeTaskFromHomeData,
	addEventToHomeData,
	removeEventFromHomeData,
	updateEventInHomeData,
	addDecorationToHomeData,
	removeDecorationFromHomeData,
	updateDecorationInHomeData,
	addCardToHomeData,
	removeCardFromHomeData,
	addGuestToHomeData,
	removeGuestFromHomeData,
	updateGuestInHomeData,
	addHolidayToHomeData,
	refreshHomeData,
} = homeSlice.actions;
export default homeSlice.reducer;
