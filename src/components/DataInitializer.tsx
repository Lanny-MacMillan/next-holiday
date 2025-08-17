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
import { fetchHolidayPreferences } from "@/store/slices/holidayPreferencesSlice";

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

	// Holiday preferences state
	const {
		preferences: holidayPreferences,
		loading: holidayPreferencesLoading,
		initialized: holidayPreferencesInitialized,
	} = useAppSelector((state) => state.holidayPreferences);

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

	// Holiday preferences initialization logic
	useEffect(() => {
		console.log("DataInitializer: Holiday preferences effect triggered", {
			isAuthenticated,
			auth0User: !!auth0User,
			userInitialized,
			reduxUser: !!reduxUser,
			holidayPreferencesInitialized,
		});

		if (
			isAuthenticated &&
			auth0User &&
			userInitialized &&
			reduxUser &&
			!holidayPreferencesInitialized
		) {
			console.log("DataInitializer: Fetching holiday preferences from API");

			// First, fetch the user's account to get the account ID
			const fetchUserAccount = async () => {
				try {
					const response = await fetch("/api/users/me/account", {
						headers: {
							"Content-Type": "application/json",
							"x-test-user": JSON.stringify({
								sub: auth0User.sub,
								email: auth0User.email,
								name: auth0User.name,
							}),
						},
					});

					if (response.ok) {
						const accountData = await response.json();
						const accountId = accountData.data?.id;

						if (accountId) {
							console.log("DataInitializer: Fetched account ID:", accountId);
							// Now fetch holiday preferences with the account ID
							dispatch(
								fetchHolidayPreferences({
									accountId,
									auth0User,
								})
							);
						} else {
							console.log(
								"DataInitializer: No account ID found, user may not have an account yet"
							);
							// This is normal for new users who haven't set up their account yet
						}
					} else {
						console.error(
							"DataInitializer: Failed to fetch account:",
							response.status,
							response.statusText
						);
					}
				} catch (error) {
					console.error(
						"DataInitializer: Failed to fetch user account:",
						error
					);
				}
			};

			fetchUserAccount();
		}
	}, [
		isAuthenticated,
		auth0User,
		userInitialized,
		reduxUser,
		holidayPreferencesInitialized,
		dispatch,
	]);

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
