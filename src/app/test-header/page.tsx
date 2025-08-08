"use client";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { updateSettings } from "@/store/slices/themeSlice";
import HolidayHeader from "@/components/common/HolidayHeader";

export default function TestHeaderPage() {
	const dispatch = useAppDispatch();
	const { displayMode } = useAppSelector((state: any) => state.theme.settings);

	const toggleDisplayMode = () => {
		const newMode =
			displayMode === "professional" ? "gamified" : "professional";
		dispatch(updateSettings({ displayMode: newMode }));
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center p-4 sm:p-8 font-sans">
			<HolidayHeader
				holidayName="Test Holiday"
				description="Testing the HolidayHeader component with different display modes!"
			/>

			<main className="w-full max-w-4xl flex flex-col gap-6 mt-4">
				<div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
					<h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
						Display Mode Test
					</h2>

					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-gray-800 dark:text-gray-300">
									Current Mode: <span className="font-bold">{displayMode}</span>
								</p>
								<p className="text-xs text-gray-600 dark:text-gray-400">
									{displayMode === "professional"
										? "Using default font (Inter)"
										: "Using Fredoka font"}
								</p>
							</div>
							<button
								onClick={toggleDisplayMode}
								className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
							>
								Toggle to{" "}
								{displayMode === "professional" ? "Gamified" : "Professional"}
							</button>
						</div>

						<div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
							<h3 className="font-semibold text-gray-800 dark:text-white mb-2">
								Instructions:
							</h3>
							<ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
								<li>
									• Click the toggle button to switch between display modes
								</li>
								<li>• Professional mode uses the default Inter font</li>
								<li>• Gamified mode uses the Fredoka font</li>
								<li>• The header width matches the main content (max-w-4xl)</li>
								<li>• Settings are saved to localStorage automatically</li>
							</ul>
						</div>
					</div>
				</div>
			</main>
		</div>
	);
}
