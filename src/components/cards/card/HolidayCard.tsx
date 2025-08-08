import React from "react";
import { Card } from "@/store/slices/cardsSlice";

interface HolidayCardProps {
	card: Card;
	onToggle: (cardId: string) => void;
	onEdit: (card: Card) => void;
	onDelete: (cardId: string) => void;
	loading?: boolean;
	theme?: {
		accentColor?: string;
		hoverColor?: string;
	};
	borderColor?: string; // Border color for the left border
}

const HolidayCard: React.FC<HolidayCardProps> = ({
	card,
	onToggle,
	onEdit,
	onDelete,
	loading = false,
	theme = {},
	borderColor,
}) => {
	const accentColor = theme.accentColor;
	const hoverColor =
		theme.hoverColor || "hover:bg-green-50 dark:hover:bg-green-900/20";

	// Apply border color if provided
	const borderStyle = borderColor
		? { borderLeft: `4px solid ${borderColor}` }
		: {};

	return (
		<li
			className={`flex items-center px-4 py-3 cursor-pointer ${hoverColor} ${
				card.isCompleted ? "opacity-60" : ""
			}`}
			style={borderStyle}
			onClick={() => onToggle(card.id)}
		>
			<input
				type="checkbox"
				checked={card.isCompleted}
				readOnly
				className="mr-3"
				style={{ accentColor }}
			/>
			<div className="flex-1">
				<div
					className={`text-gray-800 dark:text-white ${
						card.isCompleted
							? "line-through text-gray-400 dark:text-gray-500"
							: ""
					}`}
				>
					To: {card.recipient}
				</div>
				{card.address && (
					<div
						className={`text-xs mt-1 ${
							card.isCompleted
								? "text-gray-400 dark:text-gray-500 line-through"
								: "text-gray-500 dark:text-gray-500"
						}`}
					>
						📍 {card.address}
					</div>
				)}
				{card.message && (
					<div
						className={`text-xs mt-1 ${
							card.isCompleted
								? "text-gray-400 dark:text-gray-500 line-through"
								: "text-gray-600 dark:text-gray-400"
						}`}
					>
						{card.message}
					</div>
				)}
				{card.isCompleted && card.completedDate && (
					<div className="text-xs text-green-600 dark:text-green-400 mt-1">
						Completed: {new Date(card.completedDate).toLocaleDateString()}
					</div>
				)}
			</div>
			<div className="flex gap-2">
				<button
					onClick={(e) => {
						e.stopPropagation();
						onEdit(card);
					}}
					className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
					disabled={loading}
				>
					Edit
				</button>
				<button
					onClick={(e) => {
						e.stopPropagation();
						onDelete(card.id);
					}}
					className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm"
					disabled={loading}
				>
					Delete
				</button>
			</div>
		</li>
	);
};

export default HolidayCard;
