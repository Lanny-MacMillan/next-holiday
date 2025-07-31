"use client";

import { useAuth0 } from "@auth0/auth0-react";
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { initializeTheme } from "@/store/slices/themeSlice";
import AuthWrapper from "./AuthWrapper";
import Header from "./Header";
import Login from "./Login";

export default function AppContent() {
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
			console.log("Theme state:", settings.theme, "Initialized:", initialized);
			if (settings.theme === "dark") {
				html.classList.add("dark");
				console.log("Added dark class to html");
			} else {
				html.classList.remove("dark");
				console.log("Removed dark class from html");
			}
		}
	}, [settings.theme, initialized]);

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
			<Header />
			<AuthWrapper>{/* Your existing app content will go here */}</AuthWrapper>
		</>
	);
}
