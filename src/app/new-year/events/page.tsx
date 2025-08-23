"use client";

import Link from "next/link";

export default function NewYearEventsPage() {
	return (
		<div className="min-h-screen new-year-cards-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<header className="w-full max-w-md py-6">
				<div className="flex items-center justify-center relative">
					<Link
						href="/new-year"
						className="absolute left-0 text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300 text-xl"
					>
						←
					</Link>
					<div className="text-center">
						<h1 className="text-3xl font-bold mb-2 text-gray-800 dark:text-white">
							Events
						</h1>
						<p className="text-center text-gray-600 dark:text-gray-400">
							Plan your New Year events and celebrations
						</p>
					</div>
				</div>
			</header>

			<main className="flex-1 w-full max-w-md flex flex-col gap-6 mt-4">
				<div className="text-center py-8">
					<div className="text-6xl mb-4">🎉</div>
					<h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
						Events Coming Soon
					</h3>
					<p className="text-gray-600 dark:text-gray-400">
						This feature will allow you to plan your New Year events and
						celebrations.
					</p>
				</div>
			</main>

			<footer className="w-full max-w-md py-4 text-center text-xs text-gray-500 dark:text-gray-500 mt-8">
				&copy; {new Date().getFullYear()} Next Holiday
			</footer>
		</div>
	);
}
