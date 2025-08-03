"use client";

import Image from "next/image";
import Link from "next/link";
import { useAppSelector } from "@/store/hooks";
import CountdownTimer from "@/components/CountdownTimer";
// import ReduxExample from "@/components/ReduxExample";
// import ReduxTest from "@/components/ReduxTest";

export default function Home() {
	// Get state from all Redux slices
	const cards = useAppSelector((state) => state.cards.cards);
	const gifts = useAppSelector((state) => state.giftList.gifts);
	const tasks = useAppSelector((state) => state.tasks.tasks);
	const contacts = useAppSelector((state) => state.addressBook.contacts);

	// Get loading states
	const cardsLoading = useAppSelector((state) => state.cards.loading);
	const giftsLoading = useAppSelector((state) => state.giftList.loading);
	const tasksLoading = useAppSelector((state) => state.tasks.loading);
	const contactsLoading = useAppSelector((state) => state.addressBook.loading);

	// Check if any data is still loading
	const isLoading =
		cardsLoading || giftsLoading || tasksLoading || contactsLoading;

	// Calculate active (incomplete) items from each section
	const activeCards = cards.filter((card) => !card.isCompleted).length;
	const activeGifts = gifts.filter((gift) => !gift.isCompleted).length;
	const activeTasks = tasks.filter((task) => !task.isCompleted).length;
	const totalContacts = contacts.length; // Address book doesn't have completion status, so count all

	// Calculate total items and completed items for Christmas
	const totalItems = cards.length + gifts.length + tasks.length + totalContacts;
	const completedItems =
		cards.filter((card) => card.isCompleted).length +
		gifts.filter((gift) => gift.isCompleted).length +
		tasks.filter((task) => task.isCompleted).length;

	// Calculate progress (avoid division by zero)
	const christmasProgress = totalItems > 0 ? completedItems / totalItems : 0;

	// Calculate Hanukkah progress using separate Hanukkah data
	const hanukkahGifts = useAppSelector((state) => state.hanukkahGiftList.gifts);
	const hanukkahTasks = useAppSelector((state) => state.hanukkahTasks.tasks);
	const totalHanukkahItems = hanukkahGifts.length + hanukkahTasks.length;
	const completedHanukkahItems =
		hanukkahGifts.filter((gift) => gift.isCompleted).length +
		hanukkahTasks.filter((task) => task.isCompleted).length;
	const hanukkahProgress =
		totalHanukkahItems > 0 ? completedHanukkahItems / totalHanukkahItems : 0;

	// Calculate Kwanzaa progress using separate Kwanzaa data
	const kwanzaaGifts = useAppSelector((state) => state.kwanzaaGiftList.gifts);
	const kwanzaaTasks = useAppSelector((state) => state.kwanzaaTasks.tasks);
	const totalKwanzaaItems = kwanzaaGifts.length + kwanzaaTasks.length;
	const completedKwanzaaItems =
		kwanzaaGifts.filter((gift) => gift.isCompleted).length +
		kwanzaaTasks.filter((task) => task.isCompleted).length;
	const kwanzaaProgress =
		totalKwanzaaItems > 0 ? completedKwanzaaItems / totalKwanzaaItems : 0;

	// Calculate New Year progress using separate New Year data
	const newYearGifts = useAppSelector((state) => state.newYearGiftList.gifts);
	const newYearTasks = useAppSelector((state) => state.newYearTasks.tasks);
	const totalNewYearItems = newYearGifts.length + newYearTasks.length;
	const completedNewYearItems =
		newYearGifts.filter((gift) => gift.isCompleted).length +
		newYearTasks.filter((task) => task.isCompleted).length;
	const newYearProgress =
		totalNewYearItems > 0 ? completedNewYearItems / totalNewYearItems : 0;

	// Calculate Valentine's Day progress using separate Valentine's Day data
	const valentinesGifts = useAppSelector(
		(state) => state.valentinesGiftList.gifts
	);
	const valentinesTasks = useAppSelector(
		(state) => state.valentinesTasks.tasks
	);
	const totalValentinesItems = valentinesGifts.length + valentinesTasks.length;
	const completedValentinesItems =
		valentinesGifts.filter((gift) => gift.isCompleted).length +
		valentinesTasks.filter((task) => task.isCompleted).length;
	const valentinesProgress =
		totalValentinesItems > 0
			? completedValentinesItems / totalValentinesItems
			: 0;

	// Calculate Easter progress using separate Easter data
	const easterGifts = useAppSelector((state) => state.easterGiftList.gifts);
	const easterTasks = useAppSelector((state) => state.easterTasks.tasks);
	const totalEasterItems = easterGifts.length + easterTasks.length;
	const completedEasterItems =
		easterGifts.filter((gift) => gift.isCompleted).length +
		easterTasks.filter((task) => task.isCompleted).length;
	const easterProgress =
		totalEasterItems > 0 ? completedEasterItems / totalEasterItems : 0;

	// Show loading state while data is being fetched
	if (isLoading) {
		return (
			<div className="min-h-screen christmas-gradient flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
					<p className="text-gray-600 dark:text-gray-300">
						Loading your holiday data...
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen christmas-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<header className="w-full max-w-md py-6">
				<h1 className="text-3xl font-bold text-center mb-2 text-gray-800 dark:text-white">
					Next Holiday
				</h1>
				<p className="text-center text-gray-600 dark:text-gray-400">
					Plan your holidays, stay organized, and have fun!
				</p>
			</header>
			<main className="flex-1 w-full max-w-md flex flex-col gap-6 mt-4">
				<h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-white">
					Upcoming Holidays
				</h2>
				<ul className="flex flex-col gap-4">
					<li>
						<div className="relative card rounded-2xl p-5 flex items-center gap-4 transition hover:scale-[1.02] active:scale-100">
							{/* Progress visual: floating germs (placeholder: globe.svg) */}
							<div className="relative w-16 h-16 flex-shrink-0">
								<Image
									src="/globe.svg"
									alt="Progress germs"
									fill
									className="object-contain animate-bounce"
								/>
								{/* Progress ring */}
								<svg
									className="absolute top-0 left-0 w-16 h-16"
									viewBox="0 0 64 64"
								>
									<circle
										cx="32"
										cy="32"
										r="28"
										fill="none"
										stroke="#e5e7eb"
										strokeWidth="6"
										className="dark:stroke-gray-600"
									/>
									<circle
										cx="32"
										cy="32"
										r="28"
										fill="none"
										stroke="#22c55e"
										strokeWidth="6"
										strokeDasharray={2 * Math.PI * 28}
										strokeDashoffset={
											2 * Math.PI * 28 * (1 - christmasProgress)
										}
										strokeLinecap="round"
										style={{ transition: "stroke-dashoffset 0.5s" }}
										className="dark:stroke-green-400"
									/>
								</svg>
							</div>
							<div className="flex-1">
								<div className="flex justify-between items-start">
									<div>
										<h3 className="text-lg font-bold text-gray-800 dark:text-white">
											Christmas
										</h3>
										<p className="text-gray-600 dark:text-gray-400 text-sm">
											Plan cards, gifts, and more!
										</p>
									</div>
									{/* Countdown Timer - positioned on the right */}
									<div className="flex flex-col items-end gap-2 z-20 relative">
										<CountdownTimer className="" />
										<span className="text-2xl text-gray-300 dark:text-gray-600">
											→
										</span>
									</div>
								</div>
								<div className="mt-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
									<div
										className="bg-green-400 dark:bg-green-500 h-2 rounded-full transition-all"
										style={{ width: `${christmasProgress * 100}%` }}
									/>
								</div>
								<div className="flex justify-between items-center mt-1">
									<span className="text-xs text-gray-500 dark:text-gray-500">
										{Math.round(christmasProgress * 100)}% complete
									</span>
									<span className="text-xs text-gray-500 dark:text-gray-500">
										{completedItems}/{totalItems} items
									</span>
								</div>
							</div>
							<Link
								href="/christmas"
								className="absolute inset-0 z-10"
								aria-label="Go to Christmas page"
							>
								<span className="sr-only">Go to Christmas page</span>
							</Link>
						</div>
					</li>
					<li>
						<div className="relative card rounded-2xl p-5 flex items-center gap-4 transition hover:scale-[1.02] active:scale-100">
							{/* Progress visual: floating germs (placeholder: globe.svg) */}
							<div className="relative w-16 h-16 flex-shrink-0">
								<Image
									src="/globe.svg"
									alt="Progress germs"
									fill
									className="object-contain animate-bounce"
								/>
								{/* Progress ring */}
								<svg
									className="absolute top-0 left-0 w-16 h-16"
									viewBox="0 0 64 64"
								>
									<circle
										cx="32"
										cy="32"
										r="28"
										fill="none"
										stroke="#e5e7eb"
										strokeWidth="6"
										className="dark:stroke-gray-600"
									/>
									<circle
										cx="32"
										cy="32"
										r="28"
										fill="none"
										stroke="#3b82f6"
										strokeWidth="6"
										strokeDasharray={2 * Math.PI * 28}
										strokeDashoffset={2 * Math.PI * 28 * (1 - hanukkahProgress)}
										strokeLinecap="round"
										style={{ transition: "stroke-dashoffset 0.5s" }}
										className="dark:stroke-blue-400"
									/>
								</svg>
							</div>
							<div className="flex-1">
								<div className="flex justify-between items-start">
									<div>
										<h3 className="text-lg font-bold text-gray-800 dark:text-white">
											Hanukkah
										</h3>
										<p className="text-gray-600 dark:text-gray-400 text-sm">
											Plan gifts, candles, and more!
										</p>
									</div>
									{/* Countdown Timer - positioned on the right */}
									<div className="flex flex-col items-end gap-2 z-20 relative">
										<CountdownTimer className="" holiday="Hanukkah" />
										<span className="text-2xl text-gray-300 dark:text-gray-600">
											→
										</span>
									</div>
								</div>
								<div className="mt-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
									<div
										className="bg-blue-400 dark:bg-blue-500 h-2 rounded-full transition-all"
										style={{ width: `${hanukkahProgress * 100}%` }}
									/>
								</div>
								<div className="flex justify-between items-center mt-1">
									<span className="text-xs text-gray-500 dark:text-gray-500">
										{Math.round(hanukkahProgress * 100)}% complete
									</span>
									<span className="text-xs text-gray-500 dark:text-gray-500">
										{completedHanukkahItems}/{totalHanukkahItems} items
									</span>
								</div>
							</div>
							<Link
								href="/hanukkah"
								className="absolute inset-0 z-10"
								aria-label="Go to Hanukkah page"
							>
								<span className="sr-only">Go to Hanukkah page</span>
							</Link>
						</div>
					</li>
					<li>
						<div className="relative card rounded-2xl p-5 flex items-center gap-4 transition hover:scale-[1.02] active:scale-100">
							{/* Progress visual: floating germs (placeholder: globe.svg) */}
							<div className="relative w-16 h-16 flex-shrink-0">
								<Image
									src="/globe.svg"
									alt="Progress germs"
									fill
									className="object-contain animate-bounce"
								/>
								{/* Progress ring */}
								<svg
									className="absolute top-0 left-0 w-16 h-16"
									viewBox="0 0 64 64"
								>
									<circle
										cx="32"
										cy="32"
										r="28"
										fill="none"
										stroke="#e5e7eb"
										strokeWidth="6"
										className="dark:stroke-gray-600"
									/>
									<circle
										cx="32"
										cy="32"
										r="28"
										fill="none"
										stroke="#dc2626"
										strokeWidth="6"
										strokeDasharray={2 * Math.PI * 28}
										strokeDashoffset={2 * Math.PI * 28 * (1 - kwanzaaProgress)}
										strokeLinecap="round"
										style={{ transition: "stroke-dashoffset 0.5s" }}
										className="dark:stroke-red-400"
									/>
								</svg>
							</div>
							<div className="flex-1">
								<div className="flex justify-between items-start">
									<div>
										<h3 className="text-lg font-bold text-gray-800 dark:text-white">
											Kwanzaa
										</h3>
										<p className="text-gray-600 dark:text-gray-400 text-sm">
											Plan gifts, principles, and more!
										</p>
									</div>
									{/* Countdown Timer - positioned on the right */}
									<div className="flex flex-col items-end gap-2 z-20 relative">
										<CountdownTimer className="" holiday="Kwanzaa" />
										<span className="text-2xl text-gray-300 dark:text-gray-600">
											→
										</span>
									</div>
								</div>
								<div className="mt-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
									<div
										className="bg-red-400 dark:bg-red-500 h-2 rounded-full transition-all"
										style={{ width: `${kwanzaaProgress * 100}%` }}
									/>
								</div>
								<div className="flex justify-between items-center mt-1">
									<span className="text-xs text-gray-500 dark:text-gray-500">
										{Math.round(kwanzaaProgress * 100)}% complete
									</span>
									<span className="text-xs text-gray-500 dark:text-gray-500">
										{completedKwanzaaItems}/{totalKwanzaaItems} items
									</span>
								</div>
							</div>
							<Link
								href="/kwanzaa"
								className="absolute inset-0 z-10"
								aria-label="Go to Kwanzaa page"
							>
								<span className="sr-only">Go to Kwanzaa page</span>
							</Link>
						</div>
					</li>
					<li>
						<div className="relative card rounded-2xl p-5 flex items-center gap-4 transition hover:scale-[1.02] active:scale-100">
							{/* Progress visual: floating germs (placeholder: globe.svg) */}
							<div className="relative w-16 h-16 flex-shrink-0">
								<Image
									src="/globe.svg"
									alt="Progress germs"
									fill
									className="object-contain animate-bounce"
								/>
								{/* Progress ring */}
								<svg
									className="absolute top-0 left-0 w-16 h-16"
									viewBox="0 0 64 64"
								>
									<circle
										cx="32"
										cy="32"
										r="28"
										fill="none"
										stroke="#e5e7eb"
										strokeWidth="6"
										className="dark:stroke-gray-600"
									/>
									<circle
										cx="32"
										cy="32"
										r="28"
										fill="none"
										stroke="#f59e0b"
										strokeWidth="6"
										strokeDasharray={2 * Math.PI * 28}
										strokeDashoffset={2 * Math.PI * 28 * (1 - newYearProgress)}
										strokeLinecap="round"
										style={{ transition: "stroke-dashoffset 0.5s" }}
										className="dark:stroke-amber-400"
									/>
								</svg>
							</div>
							<div className="flex-1">
								<div className="flex justify-between items-start">
									<div>
										<h3 className="text-lg font-bold text-gray-800 dark:text-white">
											New Year
										</h3>
										<p className="text-gray-600 dark:text-gray-400 text-sm">
											Plan resolutions, parties, and more!
										</p>
									</div>
									{/* Countdown Timer - positioned on the right */}
									<div className="flex flex-col items-end gap-2 z-20 relative">
										<CountdownTimer className="" holiday="New Year" />
										<span className="text-2xl text-gray-300 dark:text-gray-600">
											→
										</span>
									</div>
								</div>
								<div className="mt-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
									<div
										className="bg-amber-400 dark:bg-amber-500 h-2 rounded-full transition-all"
										style={{ width: `${newYearProgress * 100}%` }}
									/>
								</div>
								<div className="flex justify-between items-center mt-1">
									<span className="text-xs text-gray-500 dark:text-gray-500">
										{Math.round(newYearProgress * 100)}% complete
									</span>
									<span className="text-xs text-gray-500 dark:text-gray-500">
										{completedNewYearItems}/{totalNewYearItems} items
									</span>
								</div>
							</div>
							<Link
								href="/new-year"
								className="absolute inset-0 z-10"
								aria-label="Go to New Year page"
							>
								<span className="sr-only">Go to New Year page</span>
							</Link>
						</div>
					</li>
					<li>
						<div className="relative card rounded-2xl p-5 flex items-center gap-4 transition hover:scale-[1.02] active:scale-100">
							{/* Progress visual: floating germs (placeholder: globe.svg) */}
							<div className="relative w-16 h-16 flex-shrink-0">
								<Image
									src="/globe.svg"
									alt="Progress germs"
									fill
									className="object-contain animate-bounce"
								/>
								{/* Progress ring */}
								<svg
									className="absolute top-0 left-0 w-16 h-16"
									viewBox="0 0 64 64"
								>
									<circle
										cx="32"
										cy="32"
										r="28"
										fill="none"
										stroke="#e5e7eb"
										strokeWidth="6"
										className="dark:stroke-gray-600"
									/>
									<circle
										cx="32"
										cy="32"
										r="28"
										fill="none"
										stroke="#ec4899"
										strokeWidth="6"
										strokeDasharray={2 * Math.PI * 28}
										strokeDashoffset={
											2 * Math.PI * 28 * (1 - valentinesProgress)
										}
										strokeLinecap="round"
										style={{ transition: "stroke-dashoffset 0.5s" }}
										className="dark:stroke-pink-400"
									/>
								</svg>
							</div>
							<div className="flex-1">
								<div className="flex justify-between items-start">
									<div>
										<h3 className="text-lg font-bold text-gray-800 dark:text-white">
											Valentine's Day
										</h3>
										<p className="text-gray-600 dark:text-gray-400 text-sm">
											Plan gifts, dates, and romantic surprises!
										</p>
									</div>
									{/* Countdown Timer - positioned on the right */}
									<div className="flex flex-col items-end gap-2 z-20 relative">
										<CountdownTimer className="" holiday="Valentine's Day" />
										<span className="text-2xl text-gray-300 dark:text-gray-600">
											→
										</span>
									</div>
								</div>
								<div className="mt-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
									<div
										className="bg-pink-400 dark:bg-pink-500 h-2 rounded-full transition-all"
										style={{ width: `${valentinesProgress * 100}%` }}
									/>
								</div>
								<div className="flex justify-between items-center mt-1">
									<span className="text-xs text-gray-500 dark:text-gray-500">
										{Math.round(valentinesProgress * 100)}% complete
									</span>
									<span className="text-xs text-gray-500 dark:text-gray-500">
										{completedValentinesItems}/{totalValentinesItems} items
									</span>
								</div>
							</div>
							<Link
								href="/valentines"
								className="absolute inset-0 z-10"
								aria-label="Go to Valentine's Day page"
							>
								<span className="sr-only">Go to Valentine's Day page</span>
							</Link>
						</div>
					</li>
					<li>
						<div className="relative card rounded-2xl p-5 flex items-center gap-4 transition hover:scale-[1.02] active:scale-100">
							{/* Progress visual: floating germs (placeholder: globe.svg) */}
							<div className="relative w-16 h-16 flex-shrink-0">
								<Image
									src="/globe.svg"
									alt="Progress germs"
									fill
									className="object-contain animate-bounce"
								/>
								{/* Progress ring */}
								<svg
									className="absolute top-0 left-0 w-16 h-16"
									viewBox="0 0 64 64"
								>
									<circle
										cx="32"
										cy="32"
										r="28"
										fill="none"
										stroke="#e5e7eb"
										strokeWidth="6"
										className="dark:stroke-gray-600"
									/>
									<circle
										cx="32"
										cy="32"
										r="28"
										fill="none"
										stroke="#8b5cf6"
										strokeWidth="6"
										strokeDasharray={2 * Math.PI * 28}
										strokeDashoffset={2 * Math.PI * 28 * (1 - easterProgress)}
										strokeLinecap="round"
										style={{ transition: "stroke-dashoffset 0.5s" }}
										className="dark:stroke-purple-400"
									/>
								</svg>
							</div>
							<div className="flex-1">
								<div className="flex justify-between items-start">
									<div>
										<h3 className="text-lg font-bold text-gray-800 dark:text-white">
											Easter
										</h3>
										<p className="text-gray-600 dark:text-gray-400 text-sm">
											Plan gifts, baskets, and egg hunts!
										</p>
									</div>
									{/* Countdown Timer - positioned on the right */}
									<div className="flex flex-col items-end gap-2 z-20 relative">
										<CountdownTimer className="" holiday="Easter" />
										<span className="text-2xl text-gray-300 dark:text-gray-600">
											→
										</span>
									</div>
								</div>
								<div className="mt-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
									<div
										className="bg-purple-400 dark:bg-purple-500 h-2 rounded-full transition-all"
										style={{ width: `${easterProgress * 100}%` }}
									/>
								</div>
								<div className="flex justify-between items-center mt-1">
									<span className="text-xs text-gray-500 dark:text-gray-500">
										{Math.round(easterProgress * 100)}% complete
									</span>
									<span className="text-xs text-gray-500 dark:text-gray-500">
										{completedEasterItems}/{totalEasterItems} items
									</span>
								</div>
							</div>
							<Link
								href="/easter"
								className="absolute inset-0 z-10"
								aria-label="Go to Easter page"
							>
								<span className="sr-only">Go to Easter page</span>
							</Link>
						</div>
					</li>
				</ul>
			</main>
			{/* <div className="w-full max-w-4xl mt-8">
				<ReduxExample />
				<div className="mt-8">
					<ReduxTest />
				</div>
			</div> */}
			<footer className="w-full max-w-md py-4 text-center text-xs text-gray-500 dark:text-gray-500 mt-8">
				&copy; {new Date().getFullYear()} Next Holiday
			</footer>
		</div>
	);
}
