"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchBirthdayCards } from "@/store/slices/birthday/birthdayCardsSlice";
import { fetchBirthdayGifts } from "@/store/slices/birthday/birthdayGiftListSlice";
import { fetchBirthdayTasks } from "@/store/slices/birthday/birthdayTasksSlice";
import { fetchBirthdayContacts } from "@/store/slices/birthday/birthdayAddressBookSlice";
import { fetchBirthdayGuests } from "@/store/slices/birthday/birthdayGuestListSlice";
import GiftListCard from "@/components/cards/gift/GiftListCard";
import GuestListCard from "@/components/cards/guest/GuestListCard";
import HolidayTaskCard from "@/components/cards/holiday-task/HolidayTaskCard";
import PartyPlanningCard from "@/components/cards/holiday-task/PartyPlanningCard";
import HolidayHeader from "@/components/common/HolidayHeader";
import CountdownWithInvite from "@/components/common/CountdownWithInvite";
import SharedIndicator from "@/components/common/SharedIndicator";

const subsections = [
	{
		name: "Gift List",
		description: "Track birthday gift ideas",
		href: "/birthday/gift-list",
		sliceKey: "birthdayGiftList",
		category: "Gifts",
		type: "gift-list",
	},
	{
		name: "Guest List",
		description: "Track your birthday guests",
		href: "/birthday/guest-list",
		sliceKey: "birthdayGuestList",
		type: "guest-list",
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
	const guests = useAppSelector((state: any) => state.birthdayGuestList.guests);

	useEffect(() => {
		// Fetch all data when component mounts if not already initialized
		dispatch(fetchBirthdayCards());
		dispatch(fetchBirthdayGifts());
		dispatch(fetchBirthdayTasks());
		dispatch(fetchBirthdayContacts());
		dispatch(fetchBirthdayGuests());
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
			case "birthdayGiftList":
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
			case "birthdayGuestList":
				total = guests.length;
				completed = guests.filter((guest: any) => guest.isCompleted).length;
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
			<HolidayHeader
				holidayName="Birthday"
				description="Plan your birthday celebrations with style!"
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
										holiday="Birthday"
										href={section.href}
										theme={{
											primaryColor: "#f59e0b", // Amber for Birthday
											accentColor: "#f59e0b", // Amber accent
										}}
										gamifiedBackgroundColor="bg-gradient-to-br from-yellow-300 to-yellow-500"
									/>
								</li>
							);
						} else if (section.type === "guest-list") {
							return (
								<li key={section.name}>
									<GuestListCard
										holiday="Birthday"
										href={section.href}
										theme={{
											primaryColor: "#f59e0b", // Amber for Birthday
											accentColor: "#f59e0b", // Amber accent
										}}
										holidayColor="bg-gradient-to-br from-yellow-300 to-yellow-500"
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
										holidayColor="bg-gradient-to-br from-yellow-300 to-yellow-500"
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
										gamifiedBackgroundColor="bg-gradient-to-br from-yellow-300 to-yellow-500"
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
