"use client";

import { useAuth0 } from "@auth0/auth0-react";
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { initializeTheme } from "@/store/slices/themeSlice";
import { updateUserPreferences } from "@/store/slices/userPreferencesSlice";
import AuthWrapper from "./auth/AuthWrapper";
import Header from "./common/Header";
import Login from "./auth/Login";
import DataInitializer from "./DataInitializer";
import UserSync from "./auth/UserSync";
import { ReactNode } from "react";

interface AppContentProps {
	children: ReactNode;
}

export default function AppContent({ children }: AppContentProps) {
	const { isAuthenticated, isLoading } = useAuth0();
	const dispatch = useAppDispatch();
	const { settings, initialized } = useAppSelector((state: any) => state.theme);
	const { preferences, initialized: preferencesInitialized } = useAppSelector(
		(state: any) => state.userPreferences
	);

	// Initialize theme on mount
	useEffect(() => {
		if (!initialized) {
			dispatch(initializeTheme());
		}
	}, [dispatch, initialized]);

	// Apply theme to document
	useEffect(() => {
		if (initialized && preferencesInitialized) {
			const html = document.documentElement;

			// Use preferences from database if available, otherwise fall back to theme slice
			const currentTheme = preferences?.theme || settings.theme;
			const currentDisplayMode =
				preferences?.displayMode || settings.displayMode;

			console.log(
				"Theme state:",
				currentTheme,
				"Display mode:",
				currentDisplayMode,
				"Initialized:",
				initialized,
				"Preferences initialized:",
				preferencesInitialized
			);

			// Apply dark/light theme
			if (currentTheme === "dark") {
				html.classList.add("dark");
				console.log("Added dark class to html");
			} else {
				html.classList.remove("dark");
				console.log("Removed dark class from html");
			}

			// Apply gamified/professional mode
			if (currentDisplayMode === "gamified") {
				html.classList.add("gamified-mode");
				console.log("Added gamified-mode class to html");
			} else {
				html.classList.remove("gamified-mode");
				console.log("Removed gamified-mode class from html");
			}
		}
	}, [
		settings.theme,
		settings.displayMode,
		initialized,
		preferences?.theme,
		preferences?.displayMode,
		preferencesInitialized,
	]);

	if (isLoading) {
		return (
			<div className="min-h-screen christmas-gradient flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
					<p className="text-gray-600 dark:text-gray-300">Loading...</p>
				</div>
			</div>
		);
	}

	if (!isAuthenticated) {
		return <Login />;
	}

	return (
		<>
			<UserSync />
			<DataInitializer />
			<Header />
			<AuthWrapper>{children}</AuthWrapper>
		</>
	);
}
