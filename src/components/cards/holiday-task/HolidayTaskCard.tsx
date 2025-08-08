import React from "react";
import Link from "next/link";
import { useAppSelector } from "@/store/hooks";

export interface HolidayTaskCardProps {
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

export default function HolidayTaskCard({
	holidayName,
	sectionName,
	description,
	href,
	totalItems,
	completedItems,
	theme = {},
	className = "",
}: HolidayTaskCardProps) {
	const {
		primaryColor = "#22c55e", // Default green
		accentColor = "#eab308", // Default yellow
		backgroundColor = "white",
		progressColor = "#22c55e", // Default green for progress bar
	} = theme;

	// Get display mode from Redux settings
	const { settings } = useAppSelector((state: any) => state.theme);
	const isGamifiedMode = settings.displayMode === "gamified";

	const progress = totalItems > 0 ? completedItems / totalItems : 0;
	const progressPercentage = progress * 100;

	// Get gamified background gradient based on holiday
	const getGamifiedBackgroundColor = () => {
		const gradientMap: { [key: string]: string } = {
			christmas: "bg-gradient-to-br from-red-400 to-red-600",
			hanukkah: "bg-gradient-to-br from-blue-400 to-blue-600",
			kwanzaa: "bg-gradient-to-br from-red-400 to-red-600",
			"new-year": "bg-gradient-to-br from-yellow-400 to-yellow-600",
			valentines: "bg-gradient-to-br from-pink-300 to-pink-500",
			easter: "bg-gradient-to-br from-purple-300 to-purple-500",
			halloween: "bg-gradient-to-br from-orange-400 to-orange-600",
			thanksgiving: "bg-gradient-to-br from-amber-400 to-amber-600",
			"mothers-day": "bg-gradient-to-br from-pink-300 to-pink-500",
			"fathers-day": "bg-gradient-to-br from-blue-300 to-blue-500",
			"fourth-of-july": "bg-gradient-to-br from-red-400 to-red-600",
			birthday: "bg-gradient-to-br from-yellow-300 to-yellow-500",
			anniversary: "bg-gradient-to-br from-pink-300 to-pink-500",
			graduation: "bg-gradient-to-br from-purple-300 to-purple-500",
			"baby-shower": "bg-gradient-to-br from-cyan-300 to-cyan-500",
		};
		return (
			gradientMap[holidayName.toLowerCase()] ||
			"bg-gradient-to-br from-gray-400 to-gray-600"
		);
	};

	if (isGamifiedMode) {
		// Gamified mode design - NO green border
		return (
			<Link
				href={href}
				className={`block card card-cards rounded-2xl p-5 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] overflow-hidden ${getGamifiedBackgroundColor()} text-white ${className}`}
				style={{
					// Explicitly ensure no border in gamified mode
					border: "none",
					borderLeft: "none",
				}}
			>
				{/* Background texture overlay */}
				<div className="absolute inset-0 opacity-10 pointer-events-none">
					<div className="absolute top-4 left-4 w-8 h-8 rounded-full bg-white opacity-20"></div>
					<div className="absolute top-12 right-8 w-6 h-6 rounded-full bg-white opacity-15"></div>
					<div className="absolute bottom-8 left-12 w-10 h-10 rounded-full bg-white opacity-10"></div>
					<div className="absolute bottom-4 right-4 w-4 h-4 rounded-full bg-white opacity-20"></div>
				</div>

				<div className="relative z-10">
					<div className="flex items-center justify-between mb-1">
						<h3 className="text-lg font-bold text-white">{sectionName}</h3>
						<span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-white bg-opacity-20 text-white">
							{totalItems}
						</span>
					</div>
					<p className="text-white opacity-90 text-sm">{description}</p>
					{/* Progress bar */}
					<div className="mt-3 w-full bg-white bg-opacity-20 rounded-full h-2">
						<div
							className="bg-white h-2 rounded-full transition-all"
							style={{
								width: `${progressPercentage}%`,
							}}
						/>
					</div>
					{/* Progress text */}
					<div className="flex justify-between items-center mt-1">
						<span className="text-xs text-white opacity-80">
							{Math.round(progressPercentage)}% complete
						</span>
						<span className="text-xs text-white opacity-80">
							{completedItems}/{totalItems} items
						</span>
					</div>
				</div>
			</Link>
		);
	}

	// Professional mode (existing design) - WITH green border
	return (
		<Link
			href={href}
			className={`block card card-cards rounded-2xl p-5 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] ${className}`}
			style={{
				backgroundColor,
				borderLeft: `4px solid ${primaryColor}`, // Colored line on left edge
			}}
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
