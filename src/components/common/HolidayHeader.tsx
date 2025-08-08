"use client";

import Link from "next/link";
import { useAppSelector } from "@/store/hooks";

interface HolidayHeaderProps {
	holidayName: string;
	description?: string;
	showBackButton?: boolean;
	backHref?: string;
}

export default function HolidayHeader({
	holidayName,
	description = "Plan your holiday with ease!",
	showBackButton = true,
	backHref = "/",
}: HolidayHeaderProps) {
	const { displayMode } = useAppSelector((state: any) => state.theme.settings);

	const isGamified = displayMode === "gamified";

	// Get outline color based on holiday
	const getOutlineColor = () => {
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
		return outlineColorMap[holidayName.toLowerCase()] || ""; // default fallback
	};

	// Get emoji for holiday
	const getHolidayEmoji = () => {
		const emojiMap: { [key: string]: string } = {
			christmas: "🎄",
			hanukkah: "🕎",
			kwanzaa: "🕯️",
			"new-year": "🎊",
			"new year": "🎊",
			valentines: "💕",
			"valentine's day": "💕",
			easter: "🐰",
			halloween: "🎃",
			thanksgiving: "🦃",
			"mothers-day": "🌸",
			"mother's day": "🌸",
			"fathers-day": "👨",
			"father's day": "👨",
			"fourth-of-july": "🎆",
			"fourth of july": "🎆",
			birthday: "🎂",
			anniversary: "💖",
			graduation: "🎓",
			"baby-shower": "👶",
			"baby shower": "👶",
		};
		return emojiMap[holidayName.toLowerCase()] || "🎉";
	};

	// Clean holiday name (remove existing emojis and extra spaces)
	const getCleanHolidayName = () => {
		return holidayName
			.replace(/[🎄🕎🕯️🎊💕🐰🎃🦃🌸👨🎆🎂💖🎓👶🎉]/g, "") // Remove emojis
			.trim(); // Remove extra spaces
	};

	return (
		<header className="w-full max-w-4xl py-6">
			<div className="flex items-center justify-center relative">
				{showBackButton && (
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
				)}
				<div className="text-center">
					<div className={isGamified ? "relative inline-block" : ""}>
						{isGamified && (
							<div
								className="absolute top-0 left-0 w-full h-full rounded-2xl blur-lg opacity-70"
								style={{
									// backgroundColor: getOutlineColor(),
									transform: "scale(1.2, 1.4)",
									zIndex: 0,
								}}
							/>
						)}
						<h1
							className={`${
								isGamified ? "font-display" : "font-sans"
							} text-3xl font-bold mb-2 text-gray-800 dark:text-white ${
								isGamified ? "text-7xl tracking-wide relative z-10" : ""
							}`}
							style={
								isGamified
									? {
											fontFamily: "var(--font-family-fredoka)",
											color: "white",
											filter: "drop-shadow(3px 5px 9px rgba(0, 0, 0, 0.5))",
									  }
									: {}
							}
						>
							{getHolidayEmoji()} {getCleanHolidayName()}
						</h1>
					</div>
					<p className="text-center text-gray-600 dark:text-white">
						{description}
					</p>
				</div>
			</div>
		</header>
	);
}
