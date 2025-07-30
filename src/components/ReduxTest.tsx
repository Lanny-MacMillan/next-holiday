"use client";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchContacts } from "@/store/slices/addressBookSlice";
import { fetchCards } from "@/store/slices/cardsSlice";
import { fetchGifts } from "@/store/slices/giftListSlice";
import { fetchTasks } from "@/store/slices/tasksSlice";

export default function ReduxTest() {
	const dispatch = useAppSelector((state) => state);

	const testRedux = () => {
		console.log("Redux store state:", dispatch);
		return "Redux is working!";
	};

	return (
		<div className="p-4 bg-green-50 rounded-lg">
			<h3 className="font-semibold text-green-800">Redux Test</h3>
			<p className="text-sm text-green-600">{testRedux()}</p>
			<p className="text-xs text-green-500 mt-2">
				Check browser console for store state
			</p>
		</div>
	);
}
