"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchCards } from "@/store/slices/cardsSlice";
import { fetchGifts } from "@/store/slices/giftListSlice";
import { fetchTasks } from "@/store/slices/tasksSlice";
import { fetchContacts } from "@/store/slices/addressBookSlice";
import { fetchShares } from "@/store/slices/sharesSlice";

export default function DataInitializer() {
	const dispatch = useAppDispatch();
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
	const { initialized: sharesInitialized } = useAppSelector(
		(state) => state.shares
	);
	const homeData = useAppSelector((state: any) => state.home.data);

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
		// Only fetch contacts if not initialized AND not available in home data
		if (!contactsInitialized && !homeData?.contacts?.length) {
			dispatch(fetchContacts());
		}
		if (!sharesInitialized) {
			console.log("[DataInitializer] Fetching shares...");
			dispatch(fetchShares());
		} else {
			console.log("[DataInitializer] Shares already initialized");
		}
	}, [
		dispatch,
		cardsInitialized,
		giftsInitialized,
		tasksInitialized,
		contactsInitialized,
		sharesInitialized,
		homeData?.contacts?.length,
	]);

	// This component doesn't render anything
	return null;
}
