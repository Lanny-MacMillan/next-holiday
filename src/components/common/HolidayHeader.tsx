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

	return (
		<header className="w-full max-w-4xl py-6">
			<div className="flex items-center justify-center relative">
				{showBackButton && (
					<Link
						href={backHref}
						className="absolute left-0 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-5xl"
					>
						←
					</Link>
				)}
				<div className="text-center">
					<h1
						className={`${
							isGamified ? "font-display" : "font-sans"
						} text-3xl font-bold mb-2 text-gray-800 dark:text-white ${
							isGamified ? "text-7xl tracking-wide" : ""
						}`}
						style={
							isGamified
								? {
										fontFamily: "var(--font-family-fredoka)",
								  }
								: {}
						}
					>
						{holidayName}
					</h1>
					<p className="text-center text-gray-600 dark:text-white">
						{description}
					</p>
				</div>
			</div>
		</header>
	);
}
