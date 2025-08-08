"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchGraduationCards } from "@/store/slices/graduation/graduationCardsSlice";
import { fetchGraduationGifts } from "@/store/slices/graduation/graduationGiftListSlice";
import { fetchGraduationTasks } from "@/store/slices/graduation/graduationTasksSlice";
import { fetchGraduationContacts } from "@/store/slices/graduation/graduationAddressBookSlice";
import GiftListCard from "@/components/cards/gift/GiftListCard";
import HolidayTaskCard from "@/components/cards/holiday-task/HolidayTaskCard";
import HolidayHeader from "@/components/common/HolidayHeader";

const subsections = [
	{
		name: "Gift List",
		description: "Track graduation gift ideas",
		href: "/graduation/gift-list",
		sliceKey: "giftList",
		type: "gift-list",
	},
	{
		name: "Guest List",
		description: "Manage guests for graduation parties",
		href: "/graduation/guest-list",
		sliceKey: "addressBook",
		type: "task",
	},
	{
		name: "Event Planning",
		description: "Plan graduation ceremonies or parties",
		href: "/graduation/events",
		sliceKey: "tasks",
		type: "task",
		category: "Events",
	},
	{
		name: "Cards List",
		description: "Track graduation cards to send",
		href: "/graduation/cards",
		sliceKey: "cards",
		type: "task",
	},
];

export default function GraduationPage() {
	const dispatch = useAppDispatch();

	const cards = useAppSelector((state: any) => state.graduationCards.cards);
	const gifts = useAppSelector((state: any) => state.graduationGiftList.gifts);
	const tasks = useAppSelector((state: any) => state.graduationTasks.tasks);
	const contacts = useAppSelector(
		(state: any) => state.graduationAddressBook.contacts
	);

	useEffect(() => {
		// Fetch all data when component mounts if not already initialized
		dispatch(fetchGraduationCards());
		dispatch(fetchGraduationGifts());
		dispatch(fetchGraduationTasks());
		dispatch(fetchGraduationContacts());
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
		<div className="min-h-screen graduation-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayHeader
				holidayName="Graduation"
				description="Celebrate academic achievements!"
			/>
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
										holiday="Graduation"
										href={section.href}
										theme={{
											primaryColor: "#8b5cf6", // Purple for Graduation
											accentColor: "#8b5cf6", // Purple accent
										}}
									/>
								</li>
							);
						} else {
							// Use HolidayTaskCard for tasks and other sections
							return (
								<li key={section.name}>
									<HolidayTaskCard
										holidayName="Graduation"
										sectionName={section.name}
										description={section.description}
										href={section.href}
										totalItems={total}
										completedItems={completed}
										theme={{
											primaryColor: "#8b5cf6", // Purple for Graduation
											accentColor: "#8b5cf6", // Purple accent
											progressColor: "#8b5cf6", // Purple for progress bar
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
