import React from "react";
import { Guest } from "@/store/slices/thanksgivingGuestListSlice";

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
}: GuestCardItemProps) {
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

	return (
		<li
			key={guest.id}
			className={`${baseClasses} ${completedClasses}`}
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
					className={`${
						isCompleted
							? "line-through text-gray-400 dark:text-gray-500"
							: "text-gray-900 dark:text-white"
					}`}
				>
					{guest.name}
				</div>
				<div
					className={`text-sm ${
						isCompleted
							? "text-gray-400 dark:text-gray-500 line-through"
							: "text-gray-600 dark:text-gray-300"
					}`}
				>
					{guest.numberOfGuests}{" "}
					{guest.numberOfGuests === 1 ? "guest" : "guests"}
				</div>
				<div
					className={`text-sm ${
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
					className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
					disabled={loading}
				>
					Edit
				</button>
				<button
					onClick={(e) => {
						e.stopPropagation();
						onDelete(guest.id);
					}}
					className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm"
					disabled={loading}
				>
					Delete
				</button>
			</div>
		</li>
	);
}
