import React from "react";
import { Gift } from "@/store/slices/giftListSlice";

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
}

export default function GiftCardItem({
	gift,
	isCompleted = false,
	onToggle,
	onEdit,
	onDelete,
	loading = false,
	theme = {},
	borderColor,
}: GiftCardItemProps) {
	const accentColor = theme.accentColor;
	const hoverColor =
		theme.hoverColor || "hover:bg-yellow-50 dark:hover:bg-yellow-900/20";

	const baseClasses = `flex items-center px-4 py-3 cursor-pointer ${hoverColor}`;
	const completedClasses = isCompleted ? "opacity-60" : "";

	// Apply border color if provided
	const borderStyle = borderColor
		? { borderLeft: `4px solid ${borderColor}` }
		: {};

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
					className={`${
						isCompleted
							? "line-through text-gray-400 dark:text-gray-500"
							: "text-gray-900 dark:text-white"
					}`}
				>
					{gift.name}
				</div>
				<div
					className={`text-sm ${
						isCompleted
							? "text-gray-400 dark:text-gray-500 line-through"
							: "text-gray-600 dark:text-gray-300"
					}`}
				>
					For: {gift.recipient}
				</div>
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
				<div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400 mt-1">
					{gift.price > 0 && <span>${gift.price.toFixed(2)}</span>}
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
					className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
					disabled={loading}
				>
					Edit
				</button>
				<button
					onClick={(e) => {
						e.stopPropagation();
						onDelete(gift.id);
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
