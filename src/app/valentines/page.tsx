"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchValentinesGifts } from "@/store/slices/valentinesGiftListSlice";
import { fetchValentinesTasks } from "@/store/slices/valentinesTasksSlice";
import { BudgetDisplay } from "@/components/common/BudgetDisplay";

const subsections = [
	{
		name: "Gift List",
		description: "Track your Valentine's gift ideas",
		href: "/valentines/gift-list",
		sliceKey: "valentinesGiftList",
	},
	{
		name: "Date Ideas",
		description: "Plan romantic activities and dates",
		href: "/valentines/date-ideas",
		sliceKey: "valentinesTasks",
	},
	{
		name: "Card List",
		description: "Track your Valentine's cards",
		href: "/valentines/cards",
		sliceKey: "cards",
	},
	{
		name: "Reservations Tracker",
		description: "Track restaurant and activity reservations",
		href: "/valentines/reservations",
		sliceKey: "valentinesTasks",
	},
];

export default function ValentinesPage() {
	const dispatch = useAppDispatch();

	const valentinesGifts = useAppSelector(
		(state: any) => state.valentinesGiftList.gifts
	);
	const valentinesTasks = useAppSelector(
		(state: any) => state.valentinesTasks.tasks
	);
	const cards = useAppSelector((state: any) => state.cards.cards);

	useEffect(() => {
		// Fetch all data when component mounts if not already initialized
		dispatch(fetchValentinesGifts());
		dispatch(fetchValentinesTasks());
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
			case "valentinesGiftList":
				total = valentinesGifts.length;
				completed = valentinesGifts.filter(
					(gift: any) => gift.isCompleted
				).length;
				break;
			case "valentinesTasks":
				// For Date Ideas and Reservations, filter by category
				const isDateIdeas = window.location.pathname.includes("date-ideas");
				const isReservations =
					window.location.pathname.includes("reservations");

				if (isDateIdeas) {
					const dateIdeasTasks = valentinesTasks.filter(
						(task: any) => task.category === "Date Ideas"
					);
					total = dateIdeasTasks.length;
					completed = dateIdeasTasks.filter(
						(task: any) => task.isCompleted
					).length;
				} else if (isReservations) {
					const reservationTasks = valentinesTasks.filter(
						(task: any) => task.category === "Reservations"
					);
					total = reservationTasks.length;
					completed = reservationTasks.filter(
						(task: any) => task.isCompleted
					).length;
				} else {
					total = valentinesTasks.length;
					completed = valentinesTasks.filter(
						(task: any) => task.isCompleted
					).length;
				}
				break;
			default:
				total = 0;
				completed = 0;
		}

		const progress = total > 0 ? completed / total : 0;

		return { total, completed, progress };
	}

	return (
		<div className="min-h-screen valentines-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<header className="w-full max-w-md py-6">
				<div className="flex items-center justify-center relative">
					<Link
						href="/"
						className="absolute left-0 text-pink-600 hover:text-pink-800 dark:text-pink-400 dark:hover:text-pink-300 text-xl"
					>
						←
					</Link>
					<div className="text-center">
						<h1 className="text-3xl font-bold mb-2 text-gray-800 dark:text-white">
							Valentine's Day
						</h1>
						<p className="text-center text-gray-600 dark:text-gray-400">
							Plan your romantic celebration with ease!
						</p>
					</div>
				</div>
			</header>
			<main className="flex-1 w-full max-w-md flex flex-col gap-6 mt-4">
				<ul className="flex flex-col gap-4">
					{subsections.map((section) => {
						const { total, completed, progress } = getProgressData(
							section.sliceKey
						);

						return (
							<li key={section.name}>
								<Link
									href={section.href}
									className="block card card-valentines rounded-2xl p-5 transition hover:scale-[1.02] active:scale-100"
								>
									{/* Budget Display for Gift List */}
									{section.sliceKey === "valentinesGiftList" && (
										<BudgetDisplay holiday="Valentine's Day" />
									)}

									<div className="flex items-center justify-between mb-1">
										<h3 className="text-lg font-bold text-gray-800 dark:text-white">
											{section.name}
										</h3>
										<span className="bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-300 text-xs font-medium px-2.5 py-0.5 rounded-full">
											{total}
										</span>
									</div>
									<p className="text-gray-600 dark:text-gray-400 text-sm">
										{section.description}
									</p>
									{/* Progress bar */}
									<div className="mt-3 w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
										<div
											className="bg-pink-400 dark:bg-pink-500 h-2 rounded-full transition-all"
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
