"use client";

import { useAuth0 } from "@auth0/auth0-react";
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { initializeTheme } from "@/store/slices/themeSlice";
import AuthWrapper from "./auth/AuthWrapper";
import Header from "./common/Header";
import Login from "./auth/Login";
import DataInitializer from "./DataInitializer";
import { ReactNode } from "react";

interface AppContentProps {
	children: ReactNode;
}

export default function AppContent({ children }: AppContentProps) {
	const { isAuthenticated, isLoading } = useAuth0();
	const dispatch = useAppDispatch();
	const { settings, initialized } = useAppSelector((state: any) => state.theme);

	// Initialize theme on mount
	useEffect(() => {
		if (!initialized) {
			dispatch(initializeTheme());
		}
	}, [dispatch, initialized]);

	// Apply theme to document
	useEffect(() => {
		if (initialized) {
			const html = document.documentElement;
			console.log(
				"Theme state:",
				settings.theme,
				"Display mode:",
				settings.displayMode,
				"Initialized:",
				initialized
			);

			// Apply dark/light theme
			if (settings.theme === "dark") {
				html.classList.add("dark");
				console.log("Added dark class to html");
			} else {
				html.classList.remove("dark");
				console.log("Removed dark class from html");
			}

			// Apply gamified/professional mode
			if (settings.displayMode === "gamified") {
				html.classList.add("gamified-mode");
				console.log("Added gamified-mode class to html");
			} else {
				html.classList.remove("gamified-mode");
				console.log("Removed gamified-mode class from html");
			}
		}
	}, [settings.theme, settings.displayMode, initialized]);

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
			<DataInitializer />
			<Header />
			<AuthWrapper>{children}</AuthWrapper>
		</>
	);
}
