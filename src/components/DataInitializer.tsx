"use client";

import { useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchCards } from "@/store/slices/cardsSlice";
import { fetchGifts } from "@/store/slices/giftListSlice";
import { fetchTasks } from "@/store/slices/tasksSlice";
import { fetchContacts } from "@/store/slices/addressBookSlice";
import {
	checkUserInDb,
	addUserToDb,
	loadUserData,
	setUser,
} from "@/store/slices/userSlice";

export default function DataInitializer() {
	const { user: auth0User, isAuthenticated } = useAuth0();
	const dispatch = useAppDispatch();

	// User state
	const { user: reduxUser, initialized: userInitialized } = useAppSelector(
		(state) => state.user
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

	// User initialization logic
	useEffect(() => {
		if (isAuthenticated && auth0User && !userInitialized) {
			const userSub = auth0User.sub;

			// Ensure userSub exists before proceeding
			if (!userSub) {
				console.error("User sub is undefined");
				return;
			}

			// Check if user exists in our system
			dispatch(checkUserInDb(userSub)).then((result) => {
				if (result.meta.requestStatus === "fulfilled") {
					const payload = result.payload as {
						isInDb: boolean;
						isFirstLogin: boolean;
					};
					const { isInDb, isFirstLogin } = payload;

					if (isInDb && !isFirstLogin) {
						// User exists, load their data
						dispatch(loadUserData(userSub));
					} else if (isFirstLogin) {
						// First time user, create new user record
						const newUserData = {
							sub: userSub,
							email: auth0User.email || "",
							name: auth0User.name || "",
							picture: auth0User.picture || "",
						};
						dispatch(addUserToDb(newUserData));
					}
				}
			});
		}
	}, [isAuthenticated, auth0User, userInitialized, dispatch]);

	// Initialize other data
	useEffect(() => {
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
		cardsInitialized,
		giftsInitialized,
		tasksInitialized,
		contactsInitialized,
	]);

	// This component doesn't render anything
	return null;
}
