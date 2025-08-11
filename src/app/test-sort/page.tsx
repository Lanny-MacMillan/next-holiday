"use client";

import Link from "next/link";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { updateSettings } from "@/store/slices/themeSlice";
import GiftListCard from "@/components/cards/gift/GiftListCard";
import HolidayTaskCard from "@/components/cards/holiday-task/HolidayTaskCard";

export default function TestSortPage() {
	const dispatch = useAppDispatch();
	const { settings } = useAppSelector((state: any) => state.theme);
	const cards = useAppSelector((state: any) => state.cards.cards);
	const gifts = useAppSelector((state: any) => state.giftList.gifts);
	const tasks = useAppSelector((state: any) => state.tasks.tasks);

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
			default:
				total = 0;
				completed = 0;
		}

		const progress = total > 0 ? completed / total : 0;

		return { total, completed, progress };
	}

	const { total: giftTotal, completed: giftCompleted } =
		getProgressData("giftList");
	const { total: taskTotal, completed: taskCompleted } =
		getProgressData("tasks");

	const toggleDisplayMode = () => {
		const newMode =
			settings.displayMode === "professional" ? "gamified" : "professional";
		dispatch(updateSettings({ displayMode: newMode }));
	};

	return (
		<div className="min-h-screen bg-gray-50 flex flex-col items-center p-4 sm:p-8 font-sans">
			<header className="w-full max-w-6xl py-6">
				<div className="flex items-center justify-center relative">
					<Link
						href="/"
						className="absolute left-0 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-xl"
					>
						←
					</Link>
					<div className="text-center">
						<h1 className="text-3xl font-bold mb-2 text-gray-800 dark:text-white">
							Card Style Comparison
						</h1>
						<p className="text-center text-gray-600 dark:text-gray-400">
							Professional vs Gamified Card Styles
						</p>
					</div>
				</div>
			</header>
			<main className="flex-1 w-full max-w-6xl flex flex-col gap-8 mt-4">
				{/* Display Mode Toggle */}
				<div className="flex justify-center mb-6">
					<div className="bg-white rounded-lg p-4 shadow-md">
						<div className="flex items-center space-x-4">
							<span className="text-sm font-medium text-gray-700">
								Display Mode:
							</span>
							<button
								onClick={toggleDisplayMode}
								className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
									settings.displayMode === "gamified"
										? "bg-blue-600"
										: "bg-gray-400"
								}`}
							>
								<span
									className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
										settings.displayMode === "gamified"
											? "translate-x-6"
											: "translate-x-1"
									}`}
								/>
							</button>
							<span className="text-sm font-medium text-gray-700">
								{settings.displayMode === "gamified"
									? "Gamified"
									: "Professional"}
							</span>
						</div>
					</div>
				</div>

				{/* Current Mode Section */}
				<div className="mb-8">
					<h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">
						Current Mode:{" "}
						{settings.displayMode === "gamified" ? "Gamified" : "Professional"}
					</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<GiftListCard
							holiday="Christmas"
							href="/christmas/gift-list"
							theme={{
								primaryColor: "#22c55e",
								accentColor: "#22c55e",
							}}
						/>
						<HolidayTaskCard
							holidayName="Christmas"
							sectionName="Tasks"
							description="Stay on top of your holiday to-dos"
							href="/christmas/tasks"
							totalItems={taskTotal}
							completedItems={taskCompleted}
							theme={{
								primaryColor: "#22c55e",
								accentColor: "#22c55e",
								progressColor: "#22c55e",
							}}
						/>
					</div>
				</div>

				{/* Different Holiday Examples */}
				<div className="mb-8">
					<h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">
						Different Holiday Colors
					</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						<GiftListCard
							holiday="Valentine's Day"
							href="/valentines/gift-list"
						/>
						<GiftListCard holiday="Halloween" href="/halloween/gift-list" />
						<GiftListCard holiday="Easter" href="/easter/basket-list" />
						<HolidayTaskCard
							holidayName="Valentine's Day"
							sectionName="Tasks"
							description="Plan romantic surprises"
							href="/valentines/tasks"
							totalItems={taskTotal}
							completedItems={taskCompleted}
						/>
						<HolidayTaskCard
							holidayName="Halloween"
							sectionName="Tasks"
							description="Plan costumes and decorations"
							href="/halloween/tasks"
							totalItems={taskTotal}
							completedItems={taskCompleted}
						/>
						<HolidayTaskCard
							holidayName="Easter"
							sectionName="Tasks"
							description="Plan egg hunts and baskets"
							href="/easter/tasks"
							totalItems={taskTotal}
							completedItems={taskCompleted}
						/>
					</div>
				</div>
			</main>
			<footer className="w-full max-w-6xl py-4 text-center text-xs text-gray-500 dark:text-gray-500 mt-8">
				&copy; {new Date().getFullYear()} Next Holiday
			</footer>
		</div>
	);
}
