import React from "react";
import { Gift } from "@/store/slices/giftListSlice";
import { useAppSelector } from "@/store/hooks";
import { getCardStyling } from "@/utils/cardShadows";
import { getGiftGamifiedBackgroundColor } from "@/utils/gamifiedUtils";

export interface GiftCardItemProps {
	gift: Gift;
	isCompleted?: boolean;
	onToggle: (giftId: string) => void;
	onEdit: (gift: Gift) => void;
	onDelete: (giftId: string) => void;
	loading?: boolean;
	theme?: {
		accentColor?: string;
		hoverColor?: string;
	};
	borderColor?: string; // Border color for the left border
	gamified?: boolean; // New prop to control display mode
	gamifiedBackgroundColor?: string; // New prop for background color
}

// Gift-themed icons for gamified mode
const GiftIcon = ({
	price,
	className = "",
}: {
	price: number;
	className?: string;
}) => {
	const getIcon = (price: number) => {
		if (price >= 100) return "💎";
		if (price >= 50) return "🎁";
		if (price >= 25) return "🎀";
		return "🎈";
	};

	return (
		<div className={`text-xl sm:text-2xl ${className}`}>{getIcon(price)}</div>
	);
};

export default function GiftCardItem({
	gift,
	isCompleted = false,
	onToggle,
	onEdit,
	onDelete,
	loading = false,
	theme = {},
	borderColor,
	gamified = false,
	gamifiedBackgroundColor,
}: GiftCardItemProps) {
	// Get display mode from Redux settings (fallback to prop)
	const { settings } = useAppSelector((state: any) => state.theme);
	const isGamifiedMode = gamified || settings.displayMode === "gamified";
	const isDarkMode = settings.theme === "dark";

	const accentColor = theme.accentColor;
	const hoverColor =
		theme.hoverColor || "hover:bg-yellow-50 dark:hover:bg-yellow-900/20";

	const baseClasses = `flex items-center px-3 py-3 sm:px-4 sm:py-3 cursor-pointer ${hoverColor}`;
	const completedClasses = isCompleted ? "opacity-60" : "";

	// Apply border color if provided
	const borderStyle = borderColor
		? { borderLeft: `4px solid ${borderColor}` }
		: {};

	const backgroundColor =
		gamifiedBackgroundColor || getGiftGamifiedBackgroundColor(gift.price);

	if (isGamifiedMode) {
		// Gamified mode design
		return (
			<li
				key={gift.id}
				className={`relative card rounded-2xl p-3 sm:p-4 cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-100 overflow-hidden ${backgroundColor} text-white tracking-wide  ${completedClasses}`}
				style={getCardStyling({
					isDarkMode,
					isGamified: true,
					intensity: "heavy",
				})}
				onClick={() => onToggle(gift.id)}
			>
				{/* Background texture overlay */}
				<div className="absolute inset-0 opacity-10 pointer-events-none">
					<div className="absolute top-4 left-4 w-6 h-6 rounded-full bg-white opacity-20 pointer-events-none"></div>
					<div className="absolute top-8 right-6 w-4 h-4 rounded-full bg-white opacity-15 pointer-events-none"></div>
					<div className="absolute bottom-6 left-8 w-5 h-5 rounded-full bg-white opacity-10 pointer-events-none"></div>
					<div className="absolute bottom-3 right-3 w-3 h-3 rounded-full bg-white opacity-20 pointer-events-none"></div>
				</div>

				{/* Delete Button - Top Right Corner */}
				<div
					className="absolute top-2 right-2 z-50"
					onClick={(e) => {
						e.stopPropagation();
					}}
				>
					<button
						onClick={(e) => {
							e.preventDefault();
							e.stopPropagation();
							onDelete(gift.id);
						}}
						className="text-red-700 hover:text-red-900 text-xl sm:text-2xl font-bold w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full hover:bg-red-100 transition-colors cursor-pointer"
						title="Delete gift"
						style={{
							pointerEvents: "auto",
						}}
					>
						<span className="text-2xl sm:text-3xl font-bold select-none">
							×
						</span>
					</button>
				</div>

				<div className="relative z-10">
					<div className="flex items-start space-x-3">
						{/* Gift Icon */}
						<div className="w-10 h-10 sm:w-12 sm:h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center backdrop-blur-sm flex-shrink-0">
							<GiftIcon price={gift.price} />
						</div>

						{/* Gift Content */}
						<div
							className="flex-1 min-w-0"
							style={{ fontFamily: "var(--font-family-fredoka)" }}
						>
							<div
								className={`font-semibold text-white text-sm sm:text-base ${
									isCompleted ? "line-through opacity-60" : ""
								}`}
							>
								{gift.name}
							</div>
							{gift.recipient && gift.recipient !== "Unknown" && (
								<div
									className={`text-xs sm:text-sm text-white opacity-90 ${
										isCompleted ? "line-through opacity-60" : ""
									}`}
								>
									For: {gift.recipient}
								</div>
							)}
							{gift.description && (
								<div
									className={`text-xs text-white opacity-90 mt-1 ${
										isCompleted ? "line-through opacity-60" : ""
									}`}
								>
									{gift.description}
								</div>
							)}
							<div className="flex gap-2 sm:gap-4 text-xs text-white opacity-80 mt-1">
								{typeof gift.price === "number" && gift.price > 0 && (
									<span>${gift.price.toFixed(2)}</span>
								)}
								{gift.store && <span>Store: {gift.store}</span>}
							</div>
							{gift.notes && (
								<div
									className={`text-xs mt-1 text-white opacity-90 ${
										isCompleted ? "line-through opacity-60" : ""
									}`}
								>
									{gift.notes}
								</div>
							)}
							{gift.completedDate && isCompleted && (
								<div className="text-xs text-green-200 mt-1">
									Completed: {new Date(gift.completedDate).toLocaleDateString()}
								</div>
							)}
						</div>
					</div>

					<div className="flex flex-col gap-1 mt-3">
						{gift.productLink && (
							<a
								href={gift.productLink}
								target="_blank"
								rel="noopener noreferrer"
								onClick={(e) => e.stopPropagation()}
								className="text-white hover:text-red-200 text-xs bg-white bg-opacity-20 px-2 py-1 rounded transition-colors"
							>
								🔗 Link
							</a>
						)}
						<button
							onClick={(e) => {
								e.stopPropagation();
								onEdit(gift);
							}}
							className="text-white border border-yellow-300 hover:bg-yellow-300 hover:text-white text-xs sm:text-sm px-2 py-1 rounded transition-colors"
							disabled={loading}
						>
							Edit
						</button>
					</div>
				</div>
			</li>
		);
	}

	// Professional mode (existing design)
	return (
		<li
			key={gift.id}
			className={`${baseClasses} ${completedClasses}`}
			style={borderStyle}
			onClick={() => onToggle(gift.id)}
		>
			<input
				type="checkbox"
				checked={gift.isCompleted}
				readOnly
				className="mr-3"
				style={{ accentColor }}
			/>
			<div className="flex-1">
				<div
					className={`text-sm sm:text-base ${
						isCompleted
							? "line-through text-gray-400 dark:text-gray-500"
							: "text-gray-900 dark:text-white"
					}`}
				>
					{gift.name}
				</div>
				{gift.recipient && gift.recipient !== "Unknown" && (
					<div
						className={`text-xs sm:text-sm ${
							isCompleted
								? "text-gray-400 dark:text-gray-500 line-through"
								: "text-gray-600 dark:text-gray-300"
						}`}
					>
						For: {gift.recipient}
					</div>
				)}
				{gift.description && (
					<div
						className={`text-xs ${
							isCompleted
								? "text-gray-400 dark:text-gray-500 line-through"
								: "text-gray-500 dark:text-gray-400"
						}`}
					>
						{gift.description}
					</div>
				)}
				<div className="flex gap-2 sm:gap-4 text-xs text-gray-500 dark:text-gray-400 mt-1">
					{typeof gift.price === "number" && gift.price > 0 && (
						<span>${gift.price.toFixed(2)}</span>
					)}
					{gift.store && <span>Store: {gift.store}</span>}
				</div>
				{gift.notes && (
					<div
						className={`text-xs mt-1 ${
							isCompleted
								? "text-gray-400 dark:text-gray-500 line-through"
								: "text-gray-500 dark:text-gray-400"
						}`}
					>
						{gift.notes}
					</div>
				)}
				{gift.completedDate && isCompleted && (
					<div className="text-xs text-green-600 dark:text-green-400 mt-1">
						Completed: {new Date(gift.completedDate).toLocaleDateString()}
					</div>
				)}
			</div>
			<div className="flex flex-col gap-1">
				{gift.productLink && (
					<a
						href={gift.productLink}
						target="_blank"
						rel="noopener noreferrer"
						onClick={(e) => e.stopPropagation()}
						className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-xs"
					>
						🔗 Link
					</a>
				)}
				<button
					onClick={(e) => {
						e.stopPropagation();
						onEdit(gift);
					}}
					className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-xs sm:text-sm"
					disabled={loading}
				>
					Edit
				</button>
				<button
					onClick={(e) => {
						e.stopPropagation();
						onDelete(gift.id);
					}}
					className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-xs sm:text-sm"
					disabled={loading}
				>
					Delete
				</button>
			</div>
		</li>
	);
}
