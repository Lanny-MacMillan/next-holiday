"use client";

import HolidayPageHeader from "@/components/common/HolidayPageHeader";

export default function NewYearResolutionsPage() {
	return (
		<div className="min-h-screen new-year-cards-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayPageHeader
				title="Resolution Tracker"
				backHref="/new-year"
				description="Track your New Year resolutions and goals"
				holidayColor="amber-600"
			/>

			<main className="flex-1 w-full max-w-4xl flex flex-col gap-6 mt-4">
				<div className="text-center py-8">
					<div className="text-6xl mb-4">🎯</div>
					<h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
						Resolution Tracker Coming Soon
					</h3>
					<p className="text-gray-600 dark:text-gray-400">
						This feature will allow you to track your New Year resolutions and
						goals.
					</p>
				</div>
			</main>

			<footer className="w-full max-w-md py-4 text-center text-xs text-gray-500 dark:text-gray-500 mt-8">
				&copy; {new Date().getFullYear()} Next Holiday
			</footer>
		</div>
	);
}
