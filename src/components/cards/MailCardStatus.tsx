import { useAppSelector } from "@/store/hooks";
import { getCardStyling } from "@/utils/cardShadows";

interface MailCardStatusProps {
	totalCards: number;
	completedCards: number;
	incompleteCards: number;
	gamified?: boolean;
	holidayColor?: string;
}

export default function MailCardStatus({
	totalCards,
	completedCards,
	incompleteCards,
	gamified,
	holidayColor,
}: MailCardStatusProps) {
	const progressPercentage =
		totalCards > 0 ? Math.round((completedCards / totalCards) * 100) : 0;

	// Get display mode from Redux settings (fallback to prop)
	const { settings } = useAppSelector((state: any) => state.theme);
	const isGamifiedMode = gamified || settings.displayMode === "gamified";
	const isDarkMode = settings.theme === "dark";

	if (isGamifiedMode) {
		// Gamified mode design
		const backgroundColor =
			holidayColor || "bg-gradient-to-br from-pink-400 to-pink-600";

		return (
			<div
				className={`relative card rounded-2xl p-3 sm:p-4 cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-100 overflow-hidden tracking-widest text-white border-2 border-white ${backgroundColor}`}
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
					<div className="grid grid-cols-2 gap-3 sm:gap-4 text-center">
						<div>
							<p
								className="text-xs sm:text-sm text-white opacity-90"
								style={{ fontFamily: "var(--font-family-fredoka)" }}
							>
								Total Cards
							</p>
							<p
								className="text-xl sm:text-2xl font-bold text-white"
								style={{ fontFamily: "var(--font-family-fredoka)" }}
							>
								{totalCards}
							</p>
						</div>
						<div>
							<p
								className="text-xs sm:text-sm text-white opacity-90"
								style={{ fontFamily: "var(--font-family-fredoka)" }}
							>
								Sent
							</p>
							<p
								className="text-xl sm:text-2xl font-bold text-white"
								style={{ fontFamily: "var(--font-family-fredoka)" }}
							>
								{completedCards}
							</p>
						</div>
						<div>
							<p
								className="text-xs sm:text-sm text-white opacity-90"
								style={{ fontFamily: "var(--font-family-fredoka)" }}
							>
								To Send
							</p>
							<p
								className="text-base sm:text-lg font-bold text-white"
								style={{ fontFamily: "var(--font-family-fredoka)" }}
							>
								{incompleteCards}
							</p>
						</div>
						<div>
							<p
								className="text-xs sm:text-sm text-white opacity-90"
								style={{ fontFamily: "var(--font-family-fredoka)" }}
							>
								Progress
							</p>
							<p
								className="text-base sm:text-lg font-bold text-white"
								style={{ fontFamily: "var(--font-family-fredoka)" }}
							>
								{progressPercentage}%
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
			<div className="grid grid-cols-2 gap-3 sm:gap-4 text-center">
				<div>
					<p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
						Total Cards
					</p>
					<p className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
						{totalCards}
					</p>
				</div>
				<div>
					<p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
						Sent
					</p>
					<p className="text-xl sm:text-2xl font-bold text-pink-600 dark:text-pink-400">
						{completedCards}
					</p>
				</div>
				<div>
					<p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
						To Send
					</p>
					<p className="text-base sm:text-lg font-bold text-gray-800 dark:text-white">
						{incompleteCards}
					</p>
				</div>
				<div>
					<p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
						Progress
					</p>
					<p className="text-base sm:text-lg font-bold text-pink-600 dark:text-pink-400">
						{progressPercentage}%
					</p>
				</div>
			</div>
		</div>
	);
}
