"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchBabyShowerGifts } from "@/store/slices/baby-shower/babyShowerGiftListSlice";
import { fetchBabyShowerTasks } from "@/store/slices/baby-shower/babyShowerTasksSlice";
import { fetchBabyShowerContacts } from "@/store/slices/baby-shower/babyShowerAddressBookSlice";
import { fetchBabyShowerGuests } from "@/store/slices/baby-shower/babyShowerGuestListSlice";
import GiftListCard from "@/components/cards/gift/GiftListCard";
import HolidayTaskCard from "@/components/cards/holiday-task/HolidayTaskCard";
import GuestListCard from "@/components/cards/guest/GuestListCard";
import HolidayHeader from "@/components/common/HolidayHeader";

const subsections = [
	{
		name: "Gift Registry Tracker",
		description: "Track baby shower gifts and registry items",
		href: "/baby-shower/gift-list",
		sliceKey: "babyShowerGiftList",
		category: "Gifts",
		type: "gift-list",
	},
	{
		name: "Guest List",
		description: "Manage your baby shower guest list",
		href: "/baby-shower/guest-list",
		sliceKey: "babyShowerGuestList",
		type: "guest-list",
	},
	{
		name: "Games & Activities",
		description: "Plan fun baby shower games and activities",
		href: "/baby-shower/games",
		sliceKey: "tasks",
		type: "task",
		category: "Games",
	},
];

export default function BabyShowerPage() {
	const dispatch = useAppDispatch();

	const gifts = useAppSelector((state: any) => state.babyShowerGiftList.gifts);
	const tasks = useAppSelector((state: any) => state.babyShowerTasks.tasks);
	const contacts = useAppSelector(
		(state: any) => state.babyShowerAddressBook.contacts
	);
	const guests = useAppSelector(
		(state: any) => state.babyShowerGuestList.guests
	);

	useEffect(() => {
		// Fetch all data when component mounts if not already initialized
		dispatch(fetchBabyShowerGifts());
		dispatch(fetchBabyShowerTasks());
		dispatch(fetchBabyShowerContacts());
		dispatch(fetchBabyShowerGuests());
	}, [dispatch]);

	function getProgressData(sliceKey: string): {
		total: number;
		completed: number;
		progress: number;
	} {
		let total = 0;
		let completed = 0;

		switch (sliceKey) {
			case "giftList":
			case "babyShowerGiftList":
				total = gifts.length;
				completed = gifts.filter((gift: any) => gift.isCompleted).length;
				break;
			case "tasks":
				total = tasks.length;
				completed = tasks.filter((task: any) => task.isCompleted).length;
				break;
			case "guestList":
			case "babyShowerGuestList":
				total = guests.length;
				completed = guests.filter((guest: any) => guest.isCompleted).length;
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
		<div className="min-h-screen baby-shower-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayHeader
				holidayName="Baby Shower"
				description="Plan the perfect baby shower celebration!"
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
										holiday="Baby Shower"
										href={section.href}
										theme={{
											primaryColor: "#06b6d4", // Cyan for Baby Shower
											accentColor: "#06b6d4", // Cyan accent
										}}
										gamifiedBackgroundColor="bg-gradient-to-br from-cyan-300 to-cyan-500"
									/>
								</li>
							);
						} else if (section.type === "guest-list") {
							return (
								<li key={section.name}>
									<GuestListCard
										holiday="Baby Shower"
										href={section.href}
										theme={{
											primaryColor: "#06b6d4", // Cyan for Baby Shower
											accentColor: "#06b6d4", // Cyan accent
										}}
										holidayColor="bg-gradient-to-br from-cyan-300 to-cyan-500"
									/>
								</li>
							);
						} else {
							// Use HolidayTaskCard for tasks and other sections
							return (
								<li key={section.name}>
									<HolidayTaskCard
										holidayName="Baby Shower"
										sectionName={section.name}
										description={section.description}
										href={section.href}
										totalItems={total}
										completedItems={completed}
										theme={{
											primaryColor: "#06b6d4", // Cyan for Baby Shower
											accentColor: "#06b6d4", // Cyan accent
											progressColor: "#06b6d4", // Cyan for progress bar
										}}
										gamifiedBackgroundColor="bg-gradient-to-br from-cyan-300 to-cyan-500"
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
