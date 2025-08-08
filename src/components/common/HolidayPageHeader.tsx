import React from "react";
import Link from "next/link";
import { useAppSelector } from "@/store/hooks";

interface HolidayPageHeaderProps {
	title: string;
	backHref: string;
	onSortClick?: () => void;
	sortTitle?: string;
	error?: string | null;
	description?: string;
	holidayColor?: string;
}

const HolidayPageHeader: React.FC<HolidayPageHeaderProps> = ({
	title,
	backHref,
	onSortClick,
	sortTitle = "Sort",
	error,
	description,
	holidayColor,
}) => {
	const { displayMode } = useAppSelector((state: any) => state.theme.settings);
	const { theme } = useAppSelector((state: any) => state.theme.settings);
	const isGamified = displayMode === "gamified";

	console.log("holidayColor", holidayColor);
	const textColor = theme === "dark" ? "white" : "black";
	const defaultColor = "#000000"; // Default color

	// Convert Tailwind classes to actual colors
	const getHoverColor = () => {
		if (!holidayColor) return defaultColor;

		// If it's already a hex color, use it directly
		if (holidayColor.startsWith("#")) {
			return holidayColor;
		}

		// Convert common Tailwind colors to hex values
		const colorMap: { [key: string]: string } = {
			"red-500": "#ef4444",
			"red-600": "#dc2626",
			"red-400": "#f87171",
			"blue-500": "#3b82f6",
			"blue-600": "#2563eb",
			"green-500": "#22c55e",
			"green-600": "#16a34a",
			"yellow-500": "#eab308",
			"yellow-600": "#ca8a04",
			"purple-500": "#8b5cf6",
			"purple-600": "#7c3aed",
			"pink-500": "#ec4899",
			"pink-600": "#db2777",
			"orange-500": "#f97316",
			"orange-600": "#ea580c",
			"amber-500": "#f59e0b",
			"amber-600": "#d97706",
			"cyan-500": "#06b6d4",
			"cyan-600": "#0891b2",
		};

		// Check if it's a simple color class
		if (colorMap[holidayColor]) {
			return colorMap[holidayColor];
		}

		// For gradient classes, extract the first color
		if (holidayColor.includes("from-")) {
			const fromMatch = holidayColor.match(/from-(\w+)-(\d+)/);
			if (fromMatch) {
				const colorName = fromMatch[1];
				const shade = fromMatch[2];
				const key = `${colorName}-${shade}`;
				return colorMap[key] || defaultColor;
			}
		}

		return defaultColor;
	};

	const hoverColor = getHoverColor();

	if (isGamified) {
		return (
			<header className="w-full max-w-4xl py-6">
				<div className="flex items-center justify-center relative">
					<Link
						href={backHref}
						className="absolute left-0 text-5xl transition-all duration-200 hover:scale-110"
						style={{
							color: defaultColor,
						}}
						onMouseEnter={(e) => {
							e.currentTarget.style.color = hoverColor;
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.color = defaultColor;
						}}
					>
						←
					</Link>
					<div className="text-center">
						<div className="relative inline-block">
							<div
								className="absolute top-0 left-0 w-full h-full rounded-2xl blur-lg opacity-70"
								style={{
									transform: "scale(1.2, 1.4)",
									zIndex: 0,
								}}
							/>
							<h1
								className="font-display text-7xl tracking-wide relative z-10 font-bold mb-2"
								style={{
									fontFamily: "var(--font-family-fredoka)",
									color: textColor,
									filter: "drop-shadow(3px 5px 9px rgba(0, 0, 0, 0.5))",
								}}
							>
								{title}
							</h1>
						</div>
						{description && (
							<p
								className="text-center text-gray-600 dark:text-white"
								style={{
									fontFamily: "var(--font-family-fredoka)",
								}}
							>
								{description}
							</p>
						)}
					</div>
					{onSortClick && (
						<button
							onClick={onSortClick}
							className="absolute right-0 text-5xl transition-all duration-200 hover:scale-110"
							title={sortTitle}
							style={{
								color: defaultColor,
							}}
							onMouseEnter={(e) => {
								e.currentTarget.style.color = hoverColor;
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.color = defaultColor;
							}}
						>
							<div className="flex flex-col gap-1">
								<div className="w-6 h-1 bg-current"></div>
								<div className="w-4 h-1 bg-current ml-1"></div>
								<div className="w-2 h-1 bg-current ml-2"></div>
							</div>
						</button>
					)}
				</div>

				{error && (
					<div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-2 rounded mb-4">
						{error}
					</div>
				)}
			</header>
		);
	}

	// Original clean, professional design
	return (
		<header className="w-full max-w-md py-6">
			<div className="flex items-center justify-center relative">
				<Link
					href={backHref}
					className="absolute left-0 text-xl transition-all duration-200 hover:scale-110"
					style={{
						color: defaultColor,
					}}
					onMouseEnter={(e) => {
						e.currentTarget.style.color = hoverColor;
					}}
					onMouseLeave={(e) => {
						e.currentTarget.style.color = defaultColor;
					}}
				>
					←
				</Link>
				<div className="text-center">
					<h1 className="text-2xl font-bold text-gray-800 dark:text-white">
						{title}
					</h1>
					{description && (
						<p
							className="text-center text-gray-600 dark:text-white mt-1"
							style={{
								fontFamily: "var(--font-family-fredoka)",
							}}
						>
							{description}
						</p>
					)}
				</div>
				{onSortClick && (
					<button
						onClick={onSortClick}
						className="absolute right-0 text-xl transition-all duration-200 hover:scale-110"
						title={sortTitle}
						style={{
							color: defaultColor,
						}}
						onMouseEnter={(e) => {
							e.currentTarget.style.color = hoverColor;
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.color = defaultColor;
						}}
					>
						<div className="flex flex-col gap-0.5">
							<div className="w-4 h-0.5 bg-current"></div>
							<div className="w-3 h-0.5 bg-current ml-1"></div>
							<div className="w-2 h-0.5 bg-current ml-2"></div>
						</div>
					</button>
				)}
			</div>
			{error && (
				<div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-2 rounded mb-4">
					{error}
				</div>
			)}
		</header>
	);
};

export default HolidayPageHeader;
