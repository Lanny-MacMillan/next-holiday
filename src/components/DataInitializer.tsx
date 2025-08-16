"use client";

import { useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchCards } from "@/store/slices/cardsSlice";
import { fetchGifts } from "@/store/slices/giftListSlice";
import { fetchTasks } from "@/store/slices/tasksSlice";
import { fetchContacts } from "@/store/slices/addressBookSlice";
import { getCurrentUser } from "@/store/slices/userSlice";
import { getCurrentUserPreferences } from "@/store/slices/userPreferencesSlice";

export default function DataInitializer() {
	const { user: auth0User, isAuthenticated } = useAuth0();
	const dispatch = useAppDispatch();

	// User state
	const { user: reduxUser, initialized: userInitialized } = useAppSelector(
		(state) => state.user
	);

	// User preferences state
	const { initialized: preferencesInitialized } = useAppSelector(
		(state) => state.userPreferences
	);

	// Other data states
	const { initialized: cardsInitialized } = useAppSelector(
		(state) => state.cards
	);
	const { initialized: giftsInitialized } = useAppSelector(
		(state) => state.giftList
	);
	const { initialized: tasksInitialized } = useAppSelector(
		(state) => state.tasks
	);
	const { initialized: contactsInitialized } = useAppSelector(
		(state) => state.addressBook
	);

	// User initialization logic - now just fetches current user from API
	useEffect(() => {
		if (isAuthenticated && auth0User && !userInitialized) {
			console.log("DataInitializer: Fetching current user from API");
			dispatch(getCurrentUser(auth0User.sub!));
		}
	}, [isAuthenticated, auth0User, userInitialized, dispatch]);

	// User preferences initialization logic
	useEffect(() => {
		if (isAuthenticated && auth0User && !preferencesInitialized) {
			console.log("DataInitializer: Fetching user preferences from API");
			dispatch(getCurrentUserPreferences(auth0User.sub!));
		}
	}, [isAuthenticated, auth0User, preferencesInitialized, dispatch]);

	// Initialize other data
	useEffect(() => {
		// Only fetch data if user is initialized
		if (!userInitialized) {
			return;
		}

		// Fetch all data if not already initialized
		if (!cardsInitialized) {
			dispatch(fetchCards());
		}
		if (!giftsInitialized) {
			dispatch(fetchGifts());
		}
		if (!tasksInitialized) {
			dispatch(fetchTasks());
		}
		if (!contactsInitialized) {
			dispatch(fetchContacts());
		}
	}, [
		dispatch,
		userInitialized,
		cardsInitialized,
		giftsInitialized,
		tasksInitialized,
		contactsInitialized,
	]);

	// This component doesn't render anything
	return null;
}
