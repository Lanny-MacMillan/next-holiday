"use client";

import { useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchCards } from "@/store/slices/cardsSlice";
import { fetchGifts } from "@/store/slices/giftListSlice";
import { fetchTasks } from "@/store/slices/tasksSlice";
import { fetchContacts } from "@/store/slices/addressBookSlice";
import { fetchBudgets } from "@/store/slices/budgetsSlice";
import { getCurrentUser } from "@/store/slices/userSlice";
import { setHomeData } from "@/store/slices/homeSlice";

export default function DataInitializer() {
	const { user: auth0User, isAuthenticated } = useAuth0();
	const dispatch = useAppDispatch();

	// User state
	const { user: reduxUser, initialized: userInitialized } = useAppSelector(
		(state) => state.user
	);

	// Home data state (includes holiday preferences)
	const { initialized: homeInitialized } = useAppSelector(
		(state) => state.home
	);
	const holidayPreferences = useAppSelector(
		(state) => state.home.data?.holidayPreferences || []
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
	const { initialized: budgetsInitialized } = useAppSelector(
		(state) => state.budgets
	);

	// User initialization logic - now just fetches current user from API
	useEffect(() => {
		if (isAuthenticated && auth0User && !userInitialized) {
			console.log("DataInitializer: Fetching current user from API");
			dispatch(getCurrentUser(auth0User.sub!));
		}
	}, [isAuthenticated, auth0User, userInitialized, dispatch]);

	// Load home data if not already initialized
	useEffect(() => {
		if (isAuthenticated && auth0User && !homeInitialized) {
			console.log("DataInitializer: Fetching home data");
			fetchHomeData();
		}
	}, [isAuthenticated, auth0User, homeInitialized]);

	async function fetchHomeData() {
		try {
			const response = await fetch("/api/home", {
				headers: {
					"Content-Type": "application/json",
					"x-test-user": JSON.stringify({
						sub: auth0User!.sub,
						email: auth0User!.email,
						name: auth0User!.name,
						picture: auth0User!.picture,
					}),
				},
			});

			if (!response.ok) {
				throw new Error("Failed to fetch home data");
			}

			const result = await response.json();
			const data = result.data;
			dispatch(setHomeData(data));
		} catch (err) {
			console.error("Error fetching home data:", err);
		}
	}

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
		if (
			!budgetsInitialized &&
			holidayPreferences &&
			holidayPreferences.length > 0
		) {
			// Extract holiday IDs from preferences and fetch budgets
			const holidayIds = holidayPreferences
				.filter((pref) => pref.holidayId)
				.map((pref) => pref.holidayId!);

			if (holidayIds.length > 0) {
				console.log(
					"DataInitializer: Fetching budgets for holidays:",
					holidayIds
				);
				dispatch(
					fetchBudgets({
						holidayIds,
						auth0User,
					})
				);
			}
		}
	}, [
		dispatch,
		userInitialized,
		cardsInitialized,
		giftsInitialized,
		tasksInitialized,
		contactsInitialized,
		budgetsInitialized,
		holidayPreferences,
		auth0User,
	]);

	// This component doesn't render anything
	return null;
}
