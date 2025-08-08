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

	// Get outline color based on holiday (similar to HolidayHeader)
	const getOutlineColor = () => {
		if (holidayColor) return holidayColor;

		const outlineColorMap: { [key: string]: string } = {
			christmas: "#dc2626", // red-600
			hanukkah: "#2563eb", // blue-600
			kwanzaa: "#dc2626", // red-600
			"new-year": "#d97706", // amber-600
			"new year": "#d97706", // amber-600
			valentines: "#db2777", // pink-600
			"valentine's day": "#db2777", // pink-600
			easter: "#9333ea", // purple-600
			halloween: "#ea580c", // orange-600
			"🎃 halloween": "#ea580c", // orange-600 (with emoji)
			thanksgiving: "#d97706", // amber-600
			"🦃 thanksgiving": "#d97706", // amber-600 (with emoji)
			"mothers-day": "#db2777", // pink-600
			"mother's day": "#db2777", // pink-600
			"🌸 mother's day": "#db2777", // pink-600 (with emoji)
			"fathers-day": "#2563eb", // blue-600
			"father's day": "#2563eb", // blue-600
			"👨 father's day": "#2563eb", // blue-600 (with emoji)
			"fourth-of-july": "#dc2626", // red-600
			"fourth of july": "#dc2626", // red-600
			"🎆 fourth of july": "#dc2626", // red-600 (with emoji)
			birthday: "#eab308", // yellow-500
			anniversary: "#db2777", // pink-600
			graduation: "#9333ea", // purple-600
			"baby-shower": "#0891b2", // cyan-600
			"baby shower": "#0891b2", // cyan-600
		};
		return outlineColorMap[title.toLowerCase()] || "#2563eb"; // default to blue
	};

	const textColor = theme === "dark" ? "white" : "black";

	if (isGamified) {
		return (
			<header className="w-full max-w-4xl py-6">
				<div className="flex items-center justify-center relative">
					<Link
						href={backHref}
						className="absolute left-0 text-blue-600 dark:text-blue-400 text-5xl transition-colors duration-200"
						onMouseEnter={(e) => {
							e.currentTarget.style.color = getOutlineColor();
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.color = "";
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
							className="absolute right-0 text-blue-600 dark:text-blue-400 text-5xl transition-colors duration-200"
							title={sortTitle}
							onMouseEnter={(e) => {
								e.currentTarget.style.color = getOutlineColor();
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.color = "";
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
					className="absolute left-0 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-xl"
					onMouseEnter={(e) => {
						e.currentTarget.style.color = getOutlineColor();
					}}
					onMouseLeave={(e) => {
						e.currentTarget.style.color = "";
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
						className="absolute right-0 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-xl"
						title={sortTitle}
						onMouseEnter={(e) => {
							e.currentTarget.style.color = getOutlineColor();
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.color = "";
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
