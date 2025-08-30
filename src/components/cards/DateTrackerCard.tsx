import { useAppSelector } from "@/store/hooks";
import { getCardStyling } from "@/utils/cardShadows";

interface DateTrackerCardProps {
	totalIdeas: number;
	completedIdeas: number;
	highPriorityIdeas: number;
	dueSoonIdeas: number;
	gamified?: boolean;
	holidayColor?: string;
}

export default function DateTrackerCard({
	totalIdeas,
	completedIdeas,
	highPriorityIdeas,
	dueSoonIdeas,
	gamified,
	holidayColor,
}: DateTrackerCardProps) {
	// Get display mode from Redux settings and user preferences (fallback to prop)
	const { settings } = useAppSelector((state: any) => state.theme);
	const { preferences } = useAppSelector((state: any) => state.userPreferences);
	const isGamifiedMode =
		gamified ||
		preferences?.displayMode === "gamified" ||
		settings.displayMode === "gamified";
	const isDarkMode = preferences?.theme === "dark" || settings.theme === "dark";

	if (isGamifiedMode) {
		// Gamified mode design
		return (
			<div
				className={`relative card rounded-2xl p-3 sm:p-4 cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-100 overflow-hidden tracking-widest text-white ${
					holidayColor || "bg-gradient-to-br from-pink-400 to-pink-600"
				}`}
				style={getCardStyling({
					isDarkMode,
					isGamified: true,
					intensity: "heavy",
				})}
			>
				{/* Background texture overlay */}
				<div className="absolute inset-0 opacity-10 pointer-events-none">
					<div className="absolute top-4 left-4 w-6 h-6 rounded-full bg-white opacity-20 pointer-events-none"></div>
					<div className="absolute top-8 right-6 w-4 h-4 rounded-full bg-white opacity-15 pointer-events-none"></div>
					<div className="absolute bottom-6 left-8 w-5 h-5 rounded-full bg-white opacity-10 pointer-events-none"></div>
					<div className="absolute bottom-3 right-3 w-3 h-3 rounded-full bg-white opacity-20 pointer-events-none"></div>
				</div>

				<div className="relative z-10">
					<div className="grid grid-cols-2 gap-4 text-center">
						<div>
							<p
								className="text-xs sm:text-sm text-white opacity-90"
								style={{ fontFamily: "var(--font-family-fredoka)" }}
							>
								Total Ideas
							</p>
							<p
								className="text-xl sm:text-2xl font-bold text-white"
								style={{ fontFamily: "var(--font-family-fredoka)" }}
							>
								{totalIdeas}
							</p>
						</div>
						<div>
							<p
								className="text-xs sm:text-sm text-white opacity-90"
								style={{ fontFamily: "var(--font-family-fredoka)" }}
							>
								Completed
							</p>
							<p
								className="text-xl sm:text-2xl font-bold text-white"
								style={{ fontFamily: "var(--font-family-fredoka)" }}
							>
								{completedIdeas}
							</p>
						</div>
						<div>
							<p
								className="text-xs sm:text-sm text-white opacity-90"
								style={{ fontFamily: "var(--font-family-fredoka)" }}
							>
								High Priority
							</p>
							<p
								className="text-base sm:text-lg font-bold text-white"
								style={{ fontFamily: "var(--font-family-fredoka)" }}
							>
								{highPriorityIdeas}
							</p>
						</div>
						<div>
							<p
								className="text-xs sm:text-sm text-white opacity-90"
								style={{ fontFamily: "var(--font-family-fredoka)" }}
							>
								Due Soon
							</p>
							<p
								className="text-base sm:text-lg font-bold text-white"
								style={{ fontFamily: "var(--font-family-fredoka)" }}
							>
								{dueSoonIdeas}
							</p>
						</div>
					</div>
				</div>
			</div>
		);
	}

	// Professional mode (existing design)
	return (
		<div className="card card-valentines rounded-2xl p-3 sm:p-4">
			<div className="grid grid-cols-2 gap-4 text-center">
				<div>
					<p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
						Total Ideas
					</p>
					<p className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
						{totalIdeas}
					</p>
				</div>
				<div>
					<p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
						Completed
					</p>
					<p className="text-xl sm:text-2xl font-bold text-pink-600 dark:text-pink-400">
						{completedIdeas}
					</p>
				</div>
				<div>
					<p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
						High Priority
					</p>
					<p className="text-base sm:text-lg font-bold text-red-600 dark:text-red-400">
						{highPriorityIdeas}
					</p>
				</div>
				<div>
					<p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
						Due Soon
					</p>
					<p className="text-base sm:text-lg font-bold text-yellow-600 dark:text-yellow-400">
						{dueSoonIdeas}
					</p>
				</div>
			</div>
		</div>
	);
}
