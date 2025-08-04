import React from "react";
import Link from "next/link";

export interface TaskCardProps {
	holidayName: string;
	sectionName: string;
	description: string;
	href: string;
	totalItems: number;
	completedItems: number;
	theme?: {
		primaryColor?: string;
		accentColor?: string;
		backgroundColor?: string;
		progressColor?: string;
	};
	className?: string;
}

export default function TaskCard({
	holidayName,
	sectionName,
	description,
	href,
	totalItems,
	completedItems,
	theme = {},
	className = "",
}: TaskCardProps) {
	const {
		primaryColor = "#22c55e", // Default green
		accentColor = "#eab308", // Default yellow
		backgroundColor = "white",
		progressColor = "#22c55e", // Default green for progress bar
	} = theme;

	const progress = totalItems > 0 ? completedItems / totalItems : 0;
	const progressPercentage = progress * 100;

	return (
		<Link
			href={href}
			className={`block card card-cards rounded-2xl p-5 transition hover:scale-[1.02] active:scale-100 ${className}`}
			style={{ backgroundColor }}
		>
			<div className="flex items-center justify-between mb-1">
				<h3 className="text-lg font-bold text-gray-800 dark:text-white">
					{sectionName}
				</h3>
				<span
					className="text-xs font-medium px-2.5 py-0.5 rounded-full"
					style={{
						backgroundColor: `${primaryColor}20`,
						color: primaryColor,
					}}
				>
					{totalItems}
				</span>
			</div>
			<p className="text-gray-600 dark:text-gray-400 text-sm">{description}</p>
			{/* Progress bar */}
			<div className="mt-3 w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
				<div
					className="h-2 rounded-full transition-all"
					style={{
						width: `${progressPercentage}%`,
						backgroundColor: progressColor,
					}}
				/>
			</div>
			{/* Progress text */}
			<div className="flex justify-between items-center mt-1">
				<span className="text-xs text-gray-500 dark:text-gray-500">
					{Math.round(progressPercentage)}% complete
				</span>
				<span className="text-xs text-gray-500 dark:text-gray-500">
					{completedItems}/{totalItems} items
				</span>
			</div>
		</Link>
	);
}
