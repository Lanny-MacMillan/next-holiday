import React from "react";
import { Guest } from "@/store/slices/thanksgiving/thanksgivingGuestListSlice";
import { useAppSelector } from "@/store/hooks";
import { getCardStyling } from "@/utils/cardShadows";

export interface GuestCardItemProps {
	guest: Guest;
	isCompleted?: boolean;
	onToggle: (guestId: string) => void;
	onEdit: (guest: Guest) => void;
	onDelete: (guestId: string) => void;
	loading?: boolean;
	theme?: {
		accentColor?: string;
		hoverColor?: string;
	};
	borderColor?: string; // Border color for the left border
	gamified?: boolean; // New prop to control display mode
}

export default function GuestCardItem({
	guest,
	isCompleted = false,
	onToggle,
	onEdit,
	onDelete,
	loading = false,
	theme = {},
	borderColor,
	gamified = false,
}: GuestCardItemProps) {
	// Get display mode from Redux settings (fallback to prop)
	const { settings } = useAppSelector((state: any) => state.theme);
	const isGamifiedMode = gamified || settings.displayMode === "gamified";
	const isDarkMode = settings.theme === "dark";

	const accentColor = theme.accentColor;
	const hoverColor =
		theme.hoverColor || "hover:bg-orange-50 dark:hover:bg-orange-900/20";

	const baseClasses = `flex items-center px-4 py-3 cursor-pointer ${hoverColor}`;
	const completedClasses = isCompleted ? "opacity-60" : "";

	// Apply border color if provided
	const borderStyle = borderColor
		? { borderLeft: `4px solid ${borderColor}` }
		: {};

	// RSVP status colors
	const getRsvpColor = (status: string) => {
		switch (status) {
			case "confirmed":
				return "text-green-600 dark:text-green-400";
			case "declined":
				return "text-red-600 dark:text-red-400";
			case "pending":
				return "text-yellow-600 dark:text-yellow-400";
			default:
				return "text-gray-600 dark:text-gray-400";
		}
	};

	if (isGamifiedMode) {
		// Gamified mode design
		return (
			<li
				key={guest.id}
				// className={`relative card rounded-2xl p-4 cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-100 overflow-hidden text-white tracking-wide ${completedClasses}`}
				style={getCardStyling({
					isDarkMode,
					isGamified: true,
					intensity: "heavy",
				})}
				onClick={() => onToggle(guest.id)}
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
							onDelete(guest.id);
						}}
						className="text-red-700 hover:text-red-900 text-2xl font-bold w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full hover:bg-red-100 transition-colors cursor-pointer"
						title="Delete guest"
						style={{
							pointerEvents: "auto",
						}}
					>
						<span className="text-2xl sm:text-3xl font-bold select-none">
							×
						</span>
					</button>
				</div>

				<div className="relative z-10 p-3 sm:p-4">
					<div className="flex items-start space-x-3">
						{/* Guest Icon */}
						<div className="w-10 h-10 sm:w-12 sm:h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center backdrop-blur-sm flex-shrink-0">
							<div className="text-xl sm:text-2xl">👤</div>
						</div>

						{/* Guest Content */}
						<div
							className="flex-1 min-w-0"
							style={{ fontFamily: "var(--font-family-fredoka)" }}
						>
							<div
								className={`font-bold text-white text-base sm:text-lg ${
									isCompleted ? "line-through opacity-60" : ""
								}`}
							>
								{guest.name}
							</div>
							<div
								className={`text-xs sm:text-sm text-white opacity-90 ${
									isCompleted ? "line-through opacity-60" : ""
								}`}
							>
								{guest.numberOfGuests}{" "}
								{guest.numberOfGuests === 1 ? "guest" : "guests"}
							</div>
							<div
								className={`text-xs sm:text-sm text-white opacity-90 ${
									isCompleted ? "line-through opacity-60" : ""
								}`}
							>
								RSVP:{" "}
								{guest.rsvpStatus.charAt(0).toUpperCase() +
									guest.rsvpStatus.slice(1)}
							</div>
							{guest.email && (
								<div
									className={`text-xs text-white opacity-90 mt-1 ${
										isCompleted ? "line-through opacity-60" : ""
									}`}
								>
									{guest.email}
								</div>
							)}
							{guest.phone && (
								<div
									className={`text-xs text-white opacity-90 mt-1 ${
										isCompleted ? "line-through opacity-60" : ""
									}`}
								>
									{guest.phone}
								</div>
							)}
							{guest.address && (
								<div
									className={`text-xs text-white opacity-90 mt-1 ${
										isCompleted ? "line-through opacity-60" : ""
									}`}
								>
									{guest.address}
								</div>
							)}
							{guest.dietaryRestrictions && (
								<div
									className={`text-xs text-white opacity-90 mt-1 ${
										isCompleted ? "line-through opacity-60" : ""
									}`}
								>
									Dietary: {guest.dietaryRestrictions}
								</div>
							)}
							{guest.bringingDish && (
								<div
									className={`text-xs text-white opacity-90 mt-1 ${
										isCompleted ? "line-through opacity-60" : ""
									}`}
								>
									Bringing: {guest.bringingDish}
								</div>
							)}
							{guest.notes && (
								<div
									className={`text-xs mt-1 text-white opacity-90 ${
										isCompleted ? "line-through opacity-60" : ""
									}`}
								>
									{guest.notes}
								</div>
							)}
							{guest.completedDate && isCompleted && (
								<div className="text-xs text-green-200 mt-1">
									Completed:{" "}
									{new Date(guest.completedDate).toLocaleDateString()}
								</div>
							)}
						</div>
					</div>

					<div className="flex flex-col gap-1 mt-3">
						<button
							onClick={(e) => {
								e.stopPropagation();
								onEdit(guest);
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
			key={guest.id}
			className={`${baseClasses} ${completedClasses} px-3 sm:px-4 py-3 sm:py-4`}
			style={borderStyle}
			onClick={() => onToggle(guest.id)}
		>
			<input
				type="checkbox"
				checked={guest.isCompleted}
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
					{guest.name}
				</div>
				<div
					className={`text-xs sm:text-sm ${
						isCompleted
							? "text-gray-400 dark:text-gray-500 line-through"
							: "text-gray-600 dark:text-gray-300"
					}`}
				>
					{guest.numberOfGuests}{" "}
					{guest.numberOfGuests === 1 ? "guest" : "guests"}
				</div>
				<div
					className={`text-xs sm:text-sm ${
						isCompleted
							? "text-gray-400 dark:text-gray-500 line-through"
							: getRsvpColor(guest.rsvpStatus)
					}`}
				>
					RSVP:{" "}
					{guest.rsvpStatus.charAt(0).toUpperCase() + guest.rsvpStatus.slice(1)}
				</div>
				{guest.email && (
					<div
						className={`text-xs ${
							isCompleted
								? "text-gray-400 dark:text-gray-500 line-through"
								: "text-gray-500 dark:text-gray-400"
						}`}
					>
						{guest.email}
					</div>
				)}
				{guest.phone && (
					<div
						className={`text-xs ${
							isCompleted
								? "text-gray-400 dark:text-gray-500 line-through"
								: "text-gray-500 dark:text-gray-400"
						}`}
					>
						{guest.phone}
					</div>
				)}
				{guest.address && (
					<div
						className={`text-xs ${
							isCompleted
								? "text-gray-400 dark:text-gray-500 line-through"
								: "text-gray-500 dark:text-gray-400"
						}`}
					>
						{guest.address}
					</div>
				)}
				{guest.dietaryRestrictions && (
					<div
						className={`text-xs ${
							isCompleted
								? "text-gray-400 dark:text-gray-500 line-through"
								: "text-orange-600 dark:text-orange-400"
						}`}
					>
						Dietary: {guest.dietaryRestrictions}
					</div>
				)}
				{guest.bringingDish && (
					<div
						className={`text-xs ${
							isCompleted
								? "text-gray-400 dark:text-gray-500 line-through"
								: "text-green-600 dark:text-green-400"
						}`}
					>
						Bringing: {guest.bringingDish}
					</div>
				)}
				{guest.notes && (
					<div
						className={`text-xs mt-1 ${
							isCompleted
								? "text-gray-400 dark:text-gray-500 line-through"
								: "text-gray-500 dark:text-gray-400"
						}`}
					>
						{guest.notes}
					</div>
				)}
				{guest.completedDate && isCompleted && (
					<div className="text-xs text-green-600 dark:text-green-400 mt-1">
						Completed: {new Date(guest.completedDate).toLocaleDateString()}
					</div>
				)}
			</div>
			<div className="flex flex-col gap-1">
				<button
					onClick={(e) => {
						e.stopPropagation();
						onEdit(guest);
					}}
					className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-xs sm:text-sm"
					disabled={loading}
				>
					Edit
				</button>
				<button
					onClick={(e) => {
						e.stopPropagation();
						onDelete(guest.id);
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
