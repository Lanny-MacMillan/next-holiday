import { useAppSelector } from "@/store/hooks";
import { getCardStyling } from "@/utils/cardShadows";

interface Card {
	id: string;
	recipient: string;
	message?: string;
	address?: string;
	notes?: string;
	isCompleted: boolean;
}

interface MailCardProps {
	card: Card;
	onToggleCompletion: (cardId: string) => void;
	onEditCard: (card: Card) => void;
	onDeleteCard: (cardId: string) => void;
	gamified?: boolean;
	holidayColor?: string;
}

export default function MailCard({
	card,
	onToggleCompletion,
	onEditCard,
	onDeleteCard,
	gamified,
	holidayColor,
}: MailCardProps) {
	// Get display mode from Redux settings (fallback to prop)
	const { settings } = useAppSelector((state: any) => state.theme);
	const isGamifiedMode = gamified || settings.displayMode === "gamified";
	const isDarkMode = settings.theme === "dark";

	// Helper function to get message background color based on holiday color
	const getMessageBackgroundColor = () => {
		if (!holidayColor) return "bg-pink-300 dark:bg-pink-900/20";

		// Extract color from gradient or solid color
		if (holidayColor.includes("pink")) return "bg-pink-300 dark:bg-pink-900/20";
		if (holidayColor.includes("red")) return "bg-red-300 dark:bg-red-900/20";
		if (holidayColor.includes("yellow"))
			return "bg-yellow-300 dark:bg-yellow-900/20";
		if (holidayColor.includes("blue")) return "bg-blue-300 dark:bg-blue-900/20";
		if (holidayColor.includes("purple"))
			return "bg-purple-300 dark:bg-purple-900/20";

		return "bg-pink-300 dark:bg-pink-900/20"; // fallback
	};

	if (isGamifiedMode) {
		// Gamified mode design
		const backgroundColor =
			holidayColor || "bg-gradient-to-br from-pink-300 to-pink-600";

		return (
			<div
				className={`relative card rounded-2xl p-3 sm:p-4 cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-100 overflow-hidden tracking-widest text-white border-2 border-white ${backgroundColor} ${
					card.isCompleted ? "opacity-75" : ""
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
					<div className="flex items-start justify-between mb-2">
						<div className="flex-1">
							<div className="flex items-center gap-2 mb-1">
								<h3
									className={`font-bold text-white text-base sm:text-lg ${
										card.isCompleted ? "line-through opacity-60" : ""
									}`}
									style={{ fontFamily: "var(--font-family-fredoka)" }}
								>
									{card.recipient}
								</h3>
								{card.isCompleted && (
									<span className="bg-white bg-opacity-20 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
										Sent
									</span>
								)}
							</div>
							{card.message && (
								<div className="mt-2 p-3 bg-white bg-opacity-20 rounded-lg backdrop-blur-sm">
									<p
										className="text-xs sm:text-sm text-black italic"
										style={{ fontFamily: "var(--font-family-fredoka)" }}
									>
										"{card.message}"
									</p>
								</div>
							)}
							{card.address && (
								<div className="mt-2 p-2 bg-white bg-opacity-10 rounded-lg backdrop-blur-sm">
									<p
										className="text-xs text-white opacity-90"
										style={{ fontFamily: "var(--font-family-fredoka)" }}
									>
										📍 {card.address}
									</p>
								</div>
							)}
						</div>
						<div className="flex flex-col gap-2 ml-4">
							<button
								onClick={() => onToggleCompletion(card.id)}
								className={`px-2 sm:px-3 py-1 rounded text-xs sm:text-sm font-medium transition-colors border border-opacity-30 ${
									card.isCompleted
										? "border border-green-500 text-green-500 hover:bg-green-300"
										: "border border-green-500 text-green-500 hover:bg-green-200"
								}`}
								style={{ fontFamily: "var(--font-family-fredoka)" }}
							>
								{card.isCompleted ? "Sent" : "Mark Sent"}
							</button>
							<button
								onClick={() => onEditCard(card)}
								className="px-2 sm:px-3 py-1 text-white border border-yellow-300 hover:bg-yellow-300 hover:text-white rounded text-xs sm:text-sm font-medium transition-colors"
								style={{ fontFamily: "var(--font-family-fredoka)" }}
							>
								Edit
							</button>
							<button
								onClick={() => onDeleteCard(card.id)}
								className="px-2 sm:px-3 py-1 bg-red-500 bg-opacity-20 text-white hover:bg-red-500 hover:bg-opacity-30 rounded text-xs sm:text-sm font-medium transition-colors border border-red-300 border-opacity-30"
								style={{ fontFamily: "var(--font-family-fredoka)" }}
							>
								Delete
							</button>
						</div>
					</div>
				</div>
			</div>
		);
	}

	// Professional mode (existing design)
	return (
		<div
			className={`card card-valentines rounded-2xl p-3 sm:p-4 transition-all ${
				card.isCompleted ? "opacity-75" : ""
			}`}
		>
			<div>
				<div className="flex items-start justify-between mb-2">
					<div className="flex-1">
						<div className="flex items-center gap-2 mb-1">
							<h3
								className={`font-bold text-gray-800 dark:text-white text-base sm:text-lg ${
									card.isCompleted ? "line-through" : ""
								}`}
							>
								{card.recipient}
							</h3>
							{card.isCompleted && (
								<span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs px-2 py-1 rounded-full">
									Sent
								</span>
							)}
						</div>
						{card.message && (
							<div
								className={`mt-2 p-3 ${getMessageBackgroundColor()} rounded-lg`}
							>
								<p className="text-xs sm:text-sm text-white dark:text-gray-300 italic">
									"{card.message}"
								</p>
							</div>
						)}
						{card.address && (
							<div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
								<p className="text-xs text-gray-600 dark:text-gray-400">
									📍 {card.address}
								</p>
							</div>
						)}
					</div>
					<div className="flex flex-col gap-2 ml-4">
						<button
							onClick={() => onToggleCompletion(card.id)}
							className={`px-2 sm:px-3 py-1 rounded text-xs sm:text-sm font-medium transition-colors border ${
								card.isCompleted
									? "border-green-500 text-green-500 hover:bg-green-100 dark:hover:bg-green-900/30"
									: "border-green-500 text-green-500 hover:bg-green-100 dark:hover:bg-green-900/30"
							}`}
						>
							{card.isCompleted ? "Sent" : "Mark Sent"}
						</button>
						<button
							onClick={() => onEditCard(card)}
							className="px-2 sm:px-3 py-1 border border-yellow-500 text-yellow-500 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 rounded text-xs sm:text-sm font-medium transition-colors"
						>
							Edit
						</button>
						<button
							onClick={() => onDeleteCard(card.id)}
							className="px-2 sm:px-3 py-1 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 rounded text-xs sm:text-sm font-medium transition-colors"
						>
							Delete
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
