"use client";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchContacts } from "@/store/slices/addressBookSlice";
import { fetchCards } from "@/store/slices/cardsSlice";
import { fetchGifts } from "@/store/slices/giftListSlice";
import { fetchTasks } from "@/store/slices/tasksSlice";

export default function ReduxTest() {
	const dispatch = useAppSelector((state) => state);
	const addressBook = useAppSelector((state: any) => state.addressBook);
	const cards = useAppSelector((state: any) => state.cards);
	const gifts = useAppSelector((state: any) => state.giftList);
	const tasks = useAppSelector((state: any) => state.tasks);

	const testRedux = () => {
		console.log("Redux store state:", dispatch);
		return "Redux is working!";
	};

	return (
		<div className="p-4 bg-green-50 rounded-lg">
			<h3 className="font-semibold text-green-800">Redux Test</h3>
			<p className="text-sm text-green-600">{testRedux()}</p>
			<div className="text-xs text-green-500 mt-2 space-y-1">
				<p>
					Address Book: {addressBook.contacts.length} contacts (initialized:{" "}
					{addressBook.initialized ? "Yes" : "No"})
				</p>
				<p>
					Cards: {cards.cards.length} cards (initialized:{" "}
					{cards.initialized ? "Yes" : "No"})
				</p>
				<p>
					Gifts: {gifts.gifts.length} gifts (initialized:{" "}
					{gifts.initialized ? "Yes" : "No"})
				</p>
				<p>
					Tasks: {tasks.tasks.length} tasks (initialized:{" "}
					{tasks.initialized ? "Yes" : "No"})
				</p>
			</div>
			<p className="text-xs text-green-500 mt-2">
				Check browser console for store state
			</p>
		</div>
	);
}
