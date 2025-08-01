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
		description: "Track your holiday cards",
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

	function getProgressData(sliceKey: string): {
		total: number;
		completed: number;
		progress: number;
	} {
		let total = 0;
		let completed = 0;

		switch (sliceKey) {
			case "cards":
				total = cards.length;
				completed = cards.filter((card: any) => card.isCompleted).length;
				break;
			case "giftList":
				total = gifts.length;
				completed = gifts.filter((gift: any) => gift.isCompleted).length;
				break;
			case "tasks":
				total = tasks.length;
				completed = tasks.filter((task: any) => task.isCompleted).length;
				break;
			case "addressBook":
				total = contacts.length;
				completed = 0; // Address book doesn't have completion status
				break;
			default:
				total = 0;
				completed = 0;
		}

		const progress = total > 0 ? completed / total : 0;

		return { total, completed, progress };
	}

	return (
		<div className="min-h-screen christmas-cards-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<header className="w-full max-w-md py-6 flex flex-col items-center">
				<h1 className="text-3xl font-bold mb-2 text-gray-800 dark:text-white">
					Christmas
				</h1>
				<p className="text-center text-gray-600 dark:text-gray-400">
					Plan your Christmas with ease!
				</p>
				<Link
					href="/"
					className="mt-2 text-blue-600 text-sm hover:underline dark:text-blue-400"
				>
					← Back to Holidays
				</Link>
			</header>
			<main className="flex-1 w-full max-w-md flex flex-col gap-6 mt-4">
				<h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-white">
					Sections
				</h2>
				<ul className="flex flex-col gap-4">
					{subsections.map((section) => {
						const { total, completed, progress } = getProgressData(
							section.sliceKey
						);

						return (
							<li key={section.name}>
								<Link
									href={section.href}
									className="block card card-cards rounded-2xl p-5 transition hover:scale-[1.02] active:scale-100"
								>
									<div className="flex items-center justify-between mb-1">
										<h3 className="text-lg font-bold text-gray-800 dark:text-white">
											{section.name}
										</h3>
										<span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs font-medium px-2.5 py-0.5 rounded-full">
											{total}
										</span>
									</div>
									<p className="text-gray-600 dark:text-gray-400 text-sm">
										{section.description}
									</p>
									{/* Progress bar */}
									<div className="mt-3 w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
										<div
											className="bg-green-400 dark:bg-green-500 h-2 rounded-full transition-all"
											style={{ width: `${progress * 100}%` }}
										/>
									</div>
									{/* Progress text */}
									<div className="flex justify-between items-center mt-1">
										<span className="text-xs text-gray-500 dark:text-gray-500">
											{Math.round(progress * 100)}% complete
										</span>
										<span className="text-xs text-gray-500 dark:text-gray-500">
											{completed}/{total} items
										</span>
									</div>
								</Link>
							</li>
						);
					})}
				</ul>
			</main>
			<footer className="w-full max-w-md py-4 text-center text-xs text-gray-500 dark:text-gray-500 mt-8">
				&copy; {new Date().getFullYear()} Next Holiday
			</footer>
		</div>
	);
}
