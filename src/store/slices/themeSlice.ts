import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface UserSettings {
	theme: "light" | "dark";
	displayMode: "professional" | "gamified";
	holidayChoices: Array<{ holiday: string; budget: number }>;
	giftBudgetLimit: number;
	notifications: {
		pushNotifications: boolean;
		reminderNotifications: boolean;
		taskDueReminders: boolean;
		holidayCountdownAlerts: boolean;
	};
}

interface ThemeState {
	settings: UserSettings;
	initialized: boolean;
}

const initialState: ThemeState = {
	settings: {
		theme: "light",
		displayMode: "professional",
		holidayChoices: [],
		giftBudgetLimit: 0,
		notifications: {
			pushNotifications: true,
			reminderNotifications: true,
			taskDueReminders: true,
			holidayCountdownAlerts: true,
		},
	},
	initialized: false,
};

const themeSlice = createSlice({
	name: "theme",
	initialState,
	reducers: {
		toggleTheme: (state) => {
			state.settings.theme =
				state.settings.theme === "light" ? "dark" : "light";
			// Update localStorage
			if (typeof window !== "undefined") {
				localStorage.setItem("theme", state.settings.theme);
			}
		},
		setTheme: (state, action: PayloadAction<"light" | "dark">) => {
			state.settings.theme = action.payload;
			if (typeof window !== "undefined") {
				localStorage.setItem("theme", action.payload);
			}
		},
		updateSettings: (state, action: PayloadAction<Partial<UserSettings>>) => {
			state.settings = { ...state.settings, ...action.payload };
			// Save to localStorage, but exclude holidayChoices since they should be fetched from DB
			if (typeof window !== "undefined") {
				const settingsToSave = { ...state.settings };
				// Remove holidayChoices from localStorage persistence
				delete settingsToSave.holidayChoices;
				localStorage.setItem("userSettings", JSON.stringify(settingsToSave));
			}
		},
		initializeTheme: (state) => {
			if (typeof window !== "undefined") {
				const savedTheme = localStorage.getItem("theme") as "light" | "dark";
				const savedSettings = localStorage.getItem("userSettings");

				if (savedTheme) {
					state.settings.theme = savedTheme;
				}

				if (savedSettings) {
					try {
						const parsedSettings = JSON.parse(savedSettings);
						// Don't load holidayChoices from localStorage - they should come from DB
						const { holidayChoices, ...settingsToLoad } = parsedSettings;
						state.settings = { ...state.settings, ...settingsToLoad };
					} catch (error) {
						console.error("Error parsing saved settings:", error);
					}
				}
			}
			state.initialized = true;
		},
		// Add a new action to clear cached data when user logs out or changes
		clearCachedData: (state) => {
			if (typeof window !== "undefined") {
				// Clear holidayChoices from localStorage
				const savedSettings = localStorage.getItem("userSettings");
				if (savedSettings) {
					try {
						const parsedSettings = JSON.parse(savedSettings);
						const { holidayChoices, ...settingsToKeep } = parsedSettings;
						localStorage.setItem(
							"userSettings",
							JSON.stringify(settingsToKeep)
						);
					} catch (error) {
						console.error("Error clearing cached holiday data:", error);
					}
				}
			}
			// Reset holidayChoices in state
			state.settings.holidayChoices = [];
		},
	},
});

export const {
	toggleTheme,
	setTheme,
	updateSettings,
	initializeTheme,
	clearCachedData,
} = themeSlice.actions;
export default themeSlice.reducer;
