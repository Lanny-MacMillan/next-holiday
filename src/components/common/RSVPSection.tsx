import React from "react";
import { useAppSelector } from "@/store/hooks";
import { getCardStyling } from "@/utils/cardShadows";

interface RSVPSectionProps {
	title: string;
	items: any[];
	rsvpStatus: "pending" | "confirmed" | "declined";
	emptyMessage: string;
	renderItem: (item: any) => React.ReactNode;
	cardClassName?: string;
	borderColor?: string;
	customTitle?: string; // Optional custom title override
	gamified?: boolean; // New prop to control display mode
	holidayColor?: string; // New prop for background color in gamified mode
}

const RSVPSection: React.FC<RSVPSectionProps> = ({
	title,
	items,
	rsvpStatus,
	emptyMessage,
	renderItem,
	cardClassName = "",
	borderColor,
	customTitle,
	gamified = false,
	holidayColor,
}) => {
	// Get display mode from Redux settings (fallback to prop)
	const { settings } = useAppSelector((state: any) => state.theme);
	const isGamifiedMode = gamified || settings.displayMode === "gamified";
	const isDarkMode = settings.theme === "dark";

	const getTitleColor = () => {
		if (isGamifiedMode) {
			// In gamified mode, use dark text for light mode, white text for dark mode
			return "text-gray-800 dark:text-white";
		}
		// All RSVP statuses use black text in light mode, white in dark mode
		return "text-black dark:text-white";
	};

	const getEmptyMessageColor = () => {
		if (isGamifiedMode) {
			return "text-white opacity-80";
		}
		switch (rsvpStatus) {
			case "confirmed":
				return "text-green-300 dark:text-green-600";
			case "declined":
				return "text-red-300 dark:text-red-600";
			case "pending":
			default:
				return "text-yellow-300 dark:text-yellow-600";
		}
	};

	const getStatusLabel = () => {
		switch (rsvpStatus) {
			case "confirmed":
				return "RSVP: Confirmed";
			case "declined":
				return "RSVP: Declined";
			case "pending":
			default:
				return "RSVP: Not-Confirmed";
		}
	};

	if (isGamifiedMode) {
		// Gamified mode design
		return (
			<div>
				<h2
					className={`font-semibold mb-2 ${getTitleColor()}`}
					style={{ fontFamily: "var(--font-family-fredoka)" }}
				>
					{customTitle || getStatusLabel()} ({items.length})
				</h2>
				<div
					className={`card rounded-2xl p-4 transition-all duration-200 hover:scale-[1.02] active:scale-100 overflow-hidden text-white tracking-wide ${cardClassName} ${
						holidayColor || "bg-gradient-to-br from-amber-400 to-amber-600"
					}`}
					style={{
						...getCardStyling({
							isDarkMode,
							isGamified: true,
							intensity: "heavy",
						}),
						border: "2px solid white",
					}}
				>
					{/* Background texture overlay */}
					<div className="absolute inset-0 opacity-10 pointer-events-none">
						<div className="absolute top-4 left-4 w-6 h-6 rounded-full bg-white opacity-20 pointer-events-none"></div>
						<div className="absolute top-8 right-6 w-4 h-4 rounded-full bg-white opacity-15 pointer-events-none"></div>
						<div className="absolute bottom-6 left-8 w-5 h-5 rounded-full bg-white opacity-10 pointer-events-none"></div>
						<div className="absolute bottom-3 right-3 w-3 h-3 rounded-full bg-white opacity-20 pointer-events-none"></div>
					</div>

					{items.length === 0 ? (
						<div
							className={`px-4 py-3 ${getEmptyMessageColor()} text-center relative z-10`}
							style={{ fontFamily: "var(--font-family-fredoka)" }}
						>
							{emptyMessage}
						</div>
					) : (
						<div className="relative z-10">
							<ul className="divide-y divide-white divide-opacity-20">
								{items.map((item) => renderItem(item))}
							</ul>
						</div>
					)}
				</div>
			</div>
		);
	}

	// Professional mode (existing design)
	return (
		<div>
			<h2 className={`font-semibold mb-2 ${getTitleColor()}`}>
				{customTitle || getStatusLabel()} ({items.length})
			</h2>
			<div
				className={`card ${cardClassName} rounded shadow`}
				style={borderColor ? { borderLeft: `4px solid ${borderColor}` } : {}}
			>
				{items.length === 0 ? (
					<div className={`px-4 py-3 ${getEmptyMessageColor()} text-center`}>
						{emptyMessage}
					</div>
				) : (
					<ul className="divide-y divide-gray-200 dark:divide-gray-700">
						{items.map((item) => renderItem(item))}
					</ul>
				)}
			</div>
		</div>
	);
};

export default RSVPSection;
