"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchCards } from "@/store/slices/cardsSlice";
import { fetchEasterGifts } from "@/store/slices/easterGiftListSlice";
import { fetchEasterTasks } from "@/store/slices/easterTasksSlice";
import { fetchContacts } from "@/store/slices/addressBookSlice";
import GiftListCard from "@/components/cards/gift/GiftListCard";

const subsections = [
	{
		name: "Gift List",
		description: "Track your Easter gift ideas",
		href: "/easter/gift-list",
		sliceKey: "giftList",
	},
	{
		name: "Basket List",
		description: "Track your Easter basket items",
		href: "/easter/basket-list",
		sliceKey: "giftList",
	},
	{
		name: "Event Planning",
		description: "Plan your Easter events and celebrations",
		href: "/easter/events",
		sliceKey: "tasks",
		category: "Events",
	},
	{
		name: "Decorations Checklist",
		description: "Stay on top of your Easter decorations",
		href: "/easter/decorations",
		sliceKey: "tasks",
		category: "Decorations",
	},
];

export default function EasterPage() {
	const dispatch = useAppDispatch();

	const cards = useAppSelector((state: any) => state.cards.cards);
	const gifts = useAppSelector((state: any) => state.easterGiftList.gifts);
	const tasks = useAppSelector((state: any) => state.easterTasks.tasks);
	const contacts = useAppSelector((state: any) => state.addressBook.contacts);

	useEffect(() => {
		// Fetch all data when component mounts if not already initialized
		// The DataInitializer component should handle this, but we'll keep this as a fallback
		dispatch(fetchCards());
		dispatch(fetchEasterGifts());
		dispatch(fetchEasterTasks());
		dispatch(fetchContacts());
	}, [dispatch]);

	function getProgressData(
		sliceKey: string,
		category?: string
	): {
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
				// Filter tasks by category if provided
				const filteredTasks = category
					? tasks.filter((task: any) => task.category === category)
					: tasks;
				total = filteredTasks.length;
				completed = filteredTasks.filter(
					(task: any) => task.isCompleted
				).length;
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
		<div className="min-h-screen easter-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<header className="w-full max-w-md py-6">
				<div className="flex items-center justify-center relative">
					<Link
						href="/"
						className="absolute left-0 text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 text-xl"
					>
						←
					</Link>
					<div className="text-center">
						<h1 className="text-3xl font-bold mb-2 text-gray-800 dark:text-white">
							Easter
						</h1>
						<p className="text-center text-gray-600 dark:text-gray-400">
							Plan your Easter with ease!
						</p>
					</div>
				</div>
			</header>
			<main className="flex-1 w-full max-w-md flex flex-col gap-6 mt-4">
				<ul className="flex flex-col gap-4">
					{subsections.map((section) => {
						const { total, completed, progress } = getProgressData(
							section.sliceKey,
							section.category
						);

						// Use GiftListCard for gift list sections
						if (section.sliceKey === "giftList") {
							return (
								<li key={section.name}>
									<GiftListCard
										holiday="Easter"
										href={section.href}
										theme={{
											primaryColor: "#a855f7", // Purple for Easter
											accentColor: "#eab308",
										}}
									/>
								</li>
							);
						}

						return (
							<li key={section.name}>
								<Link
									href={section.href}
									className="block card rounded-2xl p-5 transition hover:scale-[1.02] active:scale-100"
								>
									<div className="flex items-center justify-between">
										<div className="flex-1">
											<h3 className="text-lg font-bold text-gray-800 dark:text-white">
												{section.name}
											</h3>
											<p className="text-gray-600 dark:text-gray-400 text-sm">
												{section.description}
											</p>
										</div>
										<div className="flex flex-col items-end gap-2">
											<span className="text-2xl text-gray-300 dark:text-gray-600">
												→
											</span>
											<div className="text-right">
												<div className="text-xs text-gray-500 dark:text-gray-500">
													{Math.round(progress * 100)}% complete
												</div>
												<div className="text-xs text-gray-500 dark:text-gray-500">
													{completed}/{total} items
												</div>
											</div>
										</div>
									</div>
									<div className="mt-3 w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
										<div
											className="bg-purple-400 dark:bg-purple-500 h-2 rounded-full transition-all"
											style={{ width: `${progress * 100}%` }}
										/>
									</div>
								</Link>
							</li>
						);
					})}
				</ul>
			</main>
		</div>
	);
}
