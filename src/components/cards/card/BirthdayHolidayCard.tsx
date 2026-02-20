import React from "react";
import { BirthdayCard } from "@/store/slices/birthday/birthdayCardsSlice";

interface BirthdayHolidayCardProps {
	card: BirthdayCard;
	onToggle: (cardId: string) => void;
	onEdit: (card: BirthdayCard) => void;
	onDelete: (cardId: string) => void;
	loading?: boolean;
	theme?: {
		accentColor?: string;
		hoverColor?: string;
	};
	borderColor?: string;
}

const BirthdayHolidayCard: React.FC<BirthdayHolidayCardProps> = ({
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
		theme.hoverColor || "hover:bg-amber-50 dark:hover:bg-amber-900/20";
	const borderStyle: React.CSSProperties = borderColor
		? { 
			borderLeftWidth: '4px',
			borderLeftStyle: 'solid',
			borderLeftColor: borderColor
		}
		: {};

	return (
		<li
			className={`flex items-center px-3 sm:px-4 py-3 sm:py-4 cursor-pointer ${hoverColor} ${
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
					className={`text-sm sm:text-base text-gray-800 dark:text-white ${
						card.isCompleted
							? "line-through text-gray-400 dark:text-gray-500"
							: ""
					}`}
				>
					To: {card.recipient}
				</div>
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
				{card.notes && (
					<div
						className={`text-xs mt-1 ${
							card.isCompleted
								? "text-gray-400 dark:text-gray-500 line-through"
								: "text-gray-500 dark:text-gray-500"
						}`}
					>
						📝 {card.notes}
					</div>
				)}
				{card.isCompleted && card.completedDate && (
					<div className="text-xs text-amber-600 dark:text-amber-400 mt-1">
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
					className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-xs sm:text-sm"
					disabled={loading}
				>
					Edit
				</button>
				<button
					onClick={(e) => {
						e.stopPropagation();
						onDelete(card.id);
					}}
					className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-xs sm:text-sm"
					disabled={loading}
				>
					Delete
				</button>
			</div>
		</li>
	);
};

export default BirthdayHolidayCard;
