"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchContacts } from "@/store/slices/addressBookSlice";
import { fetchCards } from "@/store/slices/cardsSlice";
import { fetchGifts } from "@/store/slices/giftListSlice";
import { fetchTasks } from "@/store/slices/tasksSlice";

export default function ReduxExample() {
	const dispatch = useAppDispatch();

	// Select state from different slices
	const {
		contacts,
		loading: contactsLoading,
		initialized: contactsInitialized,
	} = useAppSelector((state: any) => state.addressBook);
	const {
		cards,
		loading: cardsLoading,
		initialized: cardsInitialized,
	} = useAppSelector((state: any) => state.cards);
	const {
		gifts,
		loading: giftsLoading,
		initialized: giftsInitialized,
	} = useAppSelector((state: any) => state.giftList);
	const {
		tasks,
		loading: tasksLoading,
		initialized: tasksInitialized,
	} = useAppSelector((state: any) => state.tasks);

	useEffect(() => {
		// Fetch data when component mounts
		dispatch(fetchContacts());
		dispatch(fetchCards());
		dispatch(fetchGifts());
		dispatch(fetchTasks());
	}, [dispatch]);

	const isLoading =
		(contactsLoading && !contactsInitialized) ||
		(cardsLoading && !cardsInitialized) ||
		(giftsLoading && !giftsInitialized) ||
		(tasksLoading && !tasksInitialized);

	if (isLoading) {
		return <div className="p-4">Loading Redux data...</div>;
	}

	return (
		<div className="p-4 space-y-6">
			<h2 className="text-2xl font-bold text-purple-800">
				Redux Store Example
			</h2>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				<div className="bg-blue-50 p-4 rounded-lg">
					<h3 className="font-semibold text-blue-800">Address Book</h3>
					<p className="text-sm text-blue-600">{contacts.length} contacts</p>
				</div>

				<div className="bg-green-50 p-4 rounded-lg">
					<h3 className="font-semibold text-green-800">Cards</h3>
					<p className="text-sm text-green-600">{cards.length} cards</p>
				</div>

				<div className="bg-purple-50 p-4 rounded-lg">
					<h3 className="font-semibold text-purple-800">Gift List</h3>
					<p className="text-sm text-purple-600">{gifts.length} gifts</p>
				</div>

				<div className="bg-orange-50 p-4 rounded-lg">
					<h3 className="font-semibold text-orange-800">Tasks</h3>
					<p className="text-sm text-orange-600">{tasks.length} tasks</p>
				</div>
			</div>

			<div className="bg-purple-50 p-4 rounded-lg">
				<h3 className="font-semibold mb-2 text-purple-800">Sample Data</h3>
				<div className="text-sm text-purple-600 space-y-2">
					{contacts.length > 0 && (
						<p>
							<strong>Contact:</strong> {contacts[0].name} ({contacts[0].email})
						</p>
					)}
					{cards.length > 0 && (
						<p>
							<strong>Card:</strong> {cards[0].title} for {cards[0].recipient}
						</p>
					)}
					{gifts.length > 0 && (
						<p>
							<strong>Gift:</strong> {gifts[0].name} for {gifts[0].recipient}
						</p>
					)}
					{tasks.length > 0 && (
						<p>
							<strong>Task:</strong> {tasks[0].title} ({tasks[0].priority})
						</p>
					)}
				</div>
			</div>
		</div>
	);
}
