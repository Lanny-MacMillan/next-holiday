"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchCards } from "@/store/slices/cardsSlice";
import { fetchGifts } from "@/store/slices/giftListSlice";
import { fetchTasks } from "@/store/slices/tasksSlice";
import { fetchContacts } from "@/store/slices/addressBookSlice";

const subsections = [
	{
		name: "Cards",
		description: "Send festive greetings",
		href: "/christmas/cards",
		sliceKey: "cards",
	},
	{
		name: "Gift List",
		description: "Track your gift ideas",
		href: "/christmas/gift-list",
		sliceKey: "giftList",
	},
	{
		name: "Tasks",
		description: "Stay on top of your holiday to-dos",
		href: "/christmas/tasks",
		sliceKey: "tasks",
	},
	{
		name: "Address Book",
		description: "Keep track of all your loved ones",
		href: "/christmas/address-book",
		sliceKey: "addressBook",
	},
];

export default function ChristmasPage() {
	const dispatch = useAppDispatch();
	const cards = useAppSelector((state: any) => state.cards.cards);
	const gifts = useAppSelector((state: any) => state.giftList.gifts);
	const tasks = useAppSelector((state: any) => state.tasks.tasks);
	const contacts = useAppSelector((state: any) => state.addressBook.contacts);

	useEffect(() => {
		// Fetch all data when component mounts
		dispatch(fetchCards());
		dispatch(fetchGifts());
		dispatch(fetchTasks());
		dispatch(fetchContacts());
	}, [dispatch]);

	function getCount(sliceKey: string): number {
		switch (sliceKey) {
			case "cards":
				return cards.length;
			case "giftList":
				return gifts.length;
			case "tasks":
				return tasks.length;
			case "addressBook":
				return contacts.length;
			default:
				return 0;
		}
	}

	return (
		<div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex flex-col items-center p-4 sm:p-8 font-sans">
			<header className="w-full max-w-md py-6 flex flex-col items-center">
				<h1 className="text-3xl font-bold mb-2 text-gray-900">Christmas</h1>
				<p className="text-center text-gray-500">
					Plan your Christmas with ease!
				</p>
				<Link href="/" className="mt-2 text-blue-500 text-sm hover:underline">
					← Back to Holidays
				</Link>
			</header>
			<main className="flex-1 w-full max-w-md flex flex-col gap-6 mt-4">
				<h2 className="text-xl font-semibold mb-2">Sections</h2>
				<ul className="flex flex-col gap-4">
					{subsections.map((section) => (
						<li key={section.name}>
							<Link
								href={section.href}
								className="block bg-white rounded-2xl shadow-md p-5 transition hover:scale-[1.02] active:scale-100 border-l-4 border-green-400"
							>
								<div className="flex items-center justify-between mb-1">
									<h3 className="text-lg font-bold text-gray-900">
										{section.name}
									</h3>
									<span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
										{getCount(section.sliceKey)}
									</span>
								</div>
								<p className="text-gray-500 text-sm">{section.description}</p>
							</Link>
						</li>
					))}
				</ul>
			</main>
			<footer className="w-full max-w-md py-4 text-center text-xs text-gray-400 mt-8">
				&copy; {new Date().getFullYear()} Next Holiday
			</footer>
		</div>
	);
}
