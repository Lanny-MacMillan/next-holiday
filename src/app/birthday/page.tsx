"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchBirthdayCards } from "@/store/slices/birthday/birthdayCardsSlice";
import { fetchBirthdayGifts } from "@/store/slices/birthday/birthdayGiftListSlice";
import { fetchBirthdayTasks } from "@/store/slices/birthday/birthdayTasksSlice";
import { fetchBirthdayContacts } from "@/store/slices/birthday/birthdayAddressBookSlice";
import GiftListCard from "@/components/cards/gift/GiftListCard";
import HolidayTaskCard from "@/components/cards/holiday-task/HolidayTaskCard";
import PartyPlanningCard from "@/components/cards/holiday-task/PartyPlanningCard";

const subsections = [
	{
		name: "Gift List",
		description: "Track birthday gift ideas",
		href: "/birthday/gift-list",
		sliceKey: "giftList",
		type: "gift-list",
	},
	{
		name: "Guest List",
		description: "Track your birthday guests",
		href: "/birthday/guest-list",
		sliceKey: "addressBook",
		type: "task",
	},
	{
		name: "Party Planning",
		description: "Plan birthday parties and celebrations",
		href: "/birthday/party-planning",
		sliceKey: "tasks",
		type: "task",
		category: "Events",
	},
	{
		name: "Cards List",
		description: "Track birthday cards to send",
		href: "/birthday/cards",
		sliceKey: "cards",
		type: "task",
	},
];

export default function BirthdayPage() {
	const dispatch = useAppDispatch();

	const cards = useAppSelector((state: any) => state.birthdayCards.cards);
	const gifts = useAppSelector((state: any) => state.birthdayGiftList.gifts);
	const tasks = useAppSelector((state: any) => state.birthdayTasks.tasks);
	const contacts = useAppSelector(
		(state: any) => state.birthdayAddressBook.contacts
	);

	useEffect(() => {
		// Fetch all data when component mounts if not already initialized
		dispatch(fetchBirthdayCards());
		dispatch(fetchBirthdayGifts());
		dispatch(fetchBirthdayTasks());
		dispatch(fetchBirthdayContacts());
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
		<div className="min-h-screen birthday-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<header className="w-full max-w-md py-6">
				<div className="flex items-center justify-center relative">
					<Link
						href="/"
						className="absolute left-0 text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300 text-xl"
					>
						←
					</Link>
					<div className="text-center">
						<h1 className="text-3xl font-bold mb-2 text-gray-800 dark:text-white">
							Birthday
						</h1>
						<p className="text-center text-gray-600 dark:text-gray-400">
							Plan your birthday celebrations with style!
						</p>
					</div>
				</div>
			</header>
			<main className="flex-1 w-full max-w-4xl flex flex-col gap-6 mt-4">
				<ul className="flex flex-col gap-4">
					{subsections.map((section) => {
						const { total, completed, progress } = getProgressData(
							section.sliceKey
						);

						// Determine which card component to use based on type
						if (section.type === "gift-list") {
							return (
								<li key={section.name}>
									<GiftListCard
										holiday="Birthday"
										href={section.href}
										theme={{
											primaryColor: "#f59e0b", // Amber for Birthday
											accentColor: "#f59e0b", // Amber accent
										}}
									/>
								</li>
							);
						} else if (section.name === "Party Planning") {
							// Use PartyPlanningCard for party planning section
							return (
								<li key={section.name}>
									<PartyPlanningCard
										holidayName="Birthday"
										sectionName={section.name}
										description={section.description}
										href={section.href}
										totalItems={total}
										completedItems={completed}
										theme={{
											primaryColor: "#f59e0b", // Amber for Birthday
											accentColor: "#f59e0b", // Amber accent
											progressColor: "#f59e0b", // Amber for progress bar
										}}
									/>
								</li>
							);
						} else {
							// Use HolidayTaskCard for tasks and other sections
							return (
								<li key={section.name}>
									<HolidayTaskCard
										holidayName="Birthday"
										sectionName={section.name}
										description={section.description}
										href={section.href}
										totalItems={total}
										completedItems={completed}
										theme={{
											primaryColor: "#f59e0b", // Amber for Birthday
											accentColor: "#f59e0b", // Amber accent
											progressColor: "#f59e0b", // Amber for progress bar
										}}
									/>
								</li>
							);
						}
					})}
				</ul>
			</main>
			<footer className="w-full max-w-md py-4 text-center text-xs text-gray-500 dark:text-gray-500 mt-8">
				&copy; {new Date().getFullYear()} Next Holiday
			</footer>
		</div>
	);
}
