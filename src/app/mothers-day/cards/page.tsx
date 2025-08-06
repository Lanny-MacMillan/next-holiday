"use client";

import Link from "next/link";

export default function MothersDayCardsPage() {
	return (
		<div className="min-h-screen mothers-day-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<header className="w-full max-w-md py-6">
				<div className="flex items-center justify-center relative">
					<Link
						href="/mothers-day"
						className="absolute left-0 text-pink-600 hover:text-pink-800 dark:text-pink-400 dark:hover:text-pink-300 text-xl"
					>
						←
					</Link>
					<div className="text-center">
						<h1 className="text-3xl font-bold mb-2 text-gray-800 dark:text-white">
							🌸 Mother's Day Cards
						</h1>
						<p className="text-center text-gray-600 dark:text-gray-400">
							Track cards to send on Mother's Day
						</p>
					</div>
				</div>
			</header>
			<main className="flex-1 w-full max-w-md flex flex-col gap-6 mt-4">
				<div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
					<p className="text-gray-600 dark:text-gray-400 text-center">
						Card tracking functionality coming soon!
					</p>
				</div>
			</main>
		</div>
	);
}
