"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchThanksgivingGifts } from "@/store/slices/thanksgiving/thanksgivingGiftListSlice";
import { fetchThanksgivingTasks } from "@/store/slices/thanksgiving/thanksgivingTasksSlice";
import { fetchThanksgivingGuests } from "@/store/slices/thanksgiving/thanksgivingGuestListSlice";
import { fetchThanksgivingRecipes } from "@/store/slices/thanksgiving/thanksgivingMealPlanningSlice";
import { BudgetDisplay } from "@/components/common/BudgetDisplay";
import GiftListCard from "@/components/cards/gift/GiftListCard";
import HolidayTaskCard from "@/components/cards/holiday-task/HolidayTaskCard";
import GuestListCard from "@/components/cards/guest/GuestListCard";

const subsections = [
	{
		name: "Shopping List",
		description: "List of ingredients and supplies needed",
		href: "/thanksgiving/shopping-list",
		sliceKey: "giftList", // Changed from "tasks" to "giftList" to use GiftListCard
		category: "Shopping List",
	},
	{
		name: "Meal Planning",
		description: "Plan your Thanksgiving menu and dishes",
		href: "/thanksgiving/meal-planning",
		sliceKey: "mealPlanning",
		category: "Meal Planning",
	},
	{
		name: "Guest List",
		description: "Manage your Thanksgiving guest list",
		href: "/thanksgiving/guest-list",
		sliceKey: "guestList",
		category: "Guest List",
	},
	{
		name: "Decorations Checklist",
		description: "Stay on top of your Thanksgiving decorations",
		href: "/thanksgiving/decorations-checklist",
		sliceKey: "tasks",
		category: "Decorations Checklist",
	},
];

export default function ThanksgivingPage() {
	const dispatch = useAppDispatch();

	const gifts = useAppSelector(
		(state: any) => state.thanksgivingGiftList.gifts
	);
	const tasks = useAppSelector((state: any) => state.thanksgivingTasks.tasks);
	const guests = useAppSelector(
		(state: any) => state.thanksgivingGuestList.guests
	);
	const recipes = useAppSelector(
		(state: any) => state.thanksgivingMealPlanning.recipes
	);

	useEffect(() => {
		dispatch(fetchThanksgivingGifts());
		dispatch(fetchThanksgivingTasks());
		dispatch(fetchThanksgivingGuests());
		dispatch(fetchThanksgivingRecipes());
	}, [dispatch]);

	function getProgressData(sliceKey: string, category?: string) {
		let total = 0;
		let completed = 0;

		switch (sliceKey) {
			case "giftList":
				total = gifts.length;
				completed = gifts.filter((gift: any) => gift.isCompleted).length;
				break;
			case "guestList":
				total = guests.length;
				completed = guests.filter((guest: any) => guest.isCompleted).length;
				break;
			case "mealPlanning":
				total = recipes.length;
				completed = recipes.filter((recipe: any) => recipe.isCompleted).length;
				break;
			case "tasks":
				const filteredTasks = category
					? tasks.filter((task: any) => task.category === category)
					: tasks;
				total = filteredTasks.length;
				completed = filteredTasks.filter(
					(task: any) => task.isCompleted
				).length;
				break;
			default:
				total = 0;
				completed = 0;
		}

		const progress = total > 0 ? completed / total : 0;
		return { total, completed, progress };
	}

	return (
		<div className="min-h-screen thanksgiving-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
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
							🦃 Thanksgiving
						</h1>
						<p className="text-center text-gray-600 dark:text-gray-400">
							Plan your feast, guests, and gratitude!
						</p>
					</div>
				</div>
			</header>
			<main className="flex-1 w-full max-w-md flex flex-col gap-6 mt-4">
				<ul className="flex flex-col gap-4">
					{subsections.map((section) => {
						const { total, completed } = getProgressData(
							section.sliceKey,
							section.category
						);

						// Use GiftListCard for shopping list (budget tracking) and gift list sections
						if (section.sliceKey === "giftList") {
							return (
								<li key={section.name}>
									<GiftListCard
										holiday="Thanksgiving"
										href={section.href}
										theme={{
											primaryColor: "#d97706", // Amber for Thanksgiving
											accentColor: "#eab308",
										}}
									/>
								</li>
							);
						}

						// Use GuestListCard for guest list section
						if (section.sliceKey === "guestList") {
							return (
								<li key={section.name}>
									<GuestListCard
										holiday="Thanksgiving"
										href={section.href}
										theme={{
											primaryColor: "#d97706", // Amber for Thanksgiving
											accentColor: "#eab308",
										}}
									/>
								</li>
							);
						}

						// Use HolidayTaskCard for task sections
						return (
							<li key={section.name}>
								<HolidayTaskCard
									holidayName="Thanksgiving"
									sectionName={section.name}
									description={section.description}
									href={section.href}
									totalItems={total}
									completedItems={completed}
									theme={{
										primaryColor: "#d97706", // Amber for Thanksgiving
										accentColor: "#eab308",
										progressColor: "#d97706",
									}}
								/>
							</li>
						);
					})}
				</ul>
			</main>
		</div>
	);
}
