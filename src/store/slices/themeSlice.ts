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
		holidayChoices: [{ holiday: "Christmas", budget: 500 }],
		giftBudgetLimit: 500,
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
			// Save to localStorage
			if (typeof window !== "undefined") {
				localStorage.setItem("userSettings", JSON.stringify(state.settings));
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
						state.settings = { ...state.settings, ...parsedSettings };
					} catch (error) {
						console.error("Error parsing saved settings:", error);
					}
				}
			}
			state.initialized = true;
		},
	},
});

export const { toggleTheme, setTheme, updateSettings, initializeTheme } =
	themeSlice.actions;
export default themeSlice.reducer;
