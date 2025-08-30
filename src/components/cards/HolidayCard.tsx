"use client";

import Link from "next/link";
import CountdownTimer from "@/components/common/CountdownTimer";
import CountdownWithInviteCompact from "@/components/common/CountdownWithInviteCompact";
import SharedIndicatorCompact from "@/components/common/SharedIndicatorCompact";
import { useAppSelector } from "@/store/hooks";
import { getCardStyling } from "@/utils/cardShadows";
import { getGamifiedBackgroundColor } from "@/utils/gamifiedUtils";
import {
	IconChristmas,
	IconHanukkah,
	IconKwanzaa,
	IconNewYear,
	IconValentines,
	IconEaster,
	IconThanksgiving,
	IconHalloween,
	IconMothersDay,
	IconFathersDay,
	IconFourthOfJuly,
	IconBirthday,
	IconAnniversary,
	IconGraduation,
	IconBabyShower,
	HolidayIcons,
} from "../../../public/holiday-icons";

interface HolidayCardProps {
	id: string;
	name: string;
	description: string;
	route: string;
	color: {
		light: string;
		dark: string;
		progress: string;
	};
	progress: number;
	completedItems: number;
	totalItems: number;
	customBlobSvg?: string; // Optional custom SVG for the blob/germ
	gamified?: boolean; // New prop to control display mode
	gamifiedBackgroundColor?: string; // New prop for background color
	holidayId?: string; // New prop for API-based countdown
	countdownTimer?: string | null; // New prop for countdown timer
}

// Default blob SVG component
const DefaultBlob = ({ className = "" }: { className?: string }) => (
	<svg
		viewBox="0 0 100 100"
		className={`w-full h-full ${className}`}
		fill="currentColor"
	>
		<path d="M50 10C30 10 15 25 15 45C15 65 30 80 50 80C70 80 85 65 85 45C85 25 70 10 50 10ZM50 70C35 70 25 60 25 45C25 30 35 20 50 20C65 20 75 30 75 45C75 60 65 70 50 70Z" />
		<circle cx="35" cy="35" r="3" />
		<circle cx="65" cy="35" r="3" />
		<path
			d="M40 55C40 55 45 60 50 55C55 50 60 55 60 55"
			stroke="currentColor"
			strokeWidth="2"
			fill="none"
		/>
	</svg>
);

// Holiday-themed icons for gamified mode
const HolidayIcon = ({
	holidayId,
	className = "",
}: {
	holidayId: string;
	className?: string;
}) => {
	const iconMap: { [key: string]: string } = {
		christmas: "🎄",
		hanukkah: "🕎",
		kwanzaa: "🕯️",
		"new-year": "🎆",
		valentines: "💝",
		easter: "🥚",
		halloween: "🎃",
		thanksgiving: "🦃",
		"mothers-day": "🌷",
		"fathers-day": "👔",
		"fourth-of-july": "🎆",
		birthday: "🎂",
		anniversary: "💕",
		graduation: "🎓",
		"baby-shower": "👶",
	};

	return (
		<div className={`text-4xl ${className}`}>{iconMap[holidayId] || "🎉"}</div>
	);
};

// Function to get the appropriate holiday SVG icon for professional mode
const getHolidaySvgIcon = (holidayId: string) => {
	const iconMap: { [key: string]: React.ComponentType<any> } = {
		christmas: IconChristmas,
		hanukkah: IconHanukkah,
		kwanzaa: IconKwanzaa,
		"new-year": IconNewYear,
		valentines: IconValentines,
		easter: IconEaster,
		thanksgiving: IconThanksgiving,
		halloween: IconHalloween,
		"mothers-day": IconMothersDay,
		"fathers-day": IconFathersDay,
		"fourth-of-july": IconFourthOfJuly,
		birthday: IconBirthday,
		anniversary: IconAnniversary,
		graduation: IconGraduation,
		"baby-shower": IconBabyShower,
	};

	return iconMap[holidayId] || IconChristmas; // Fallback to Christmas icon
};

// Animated blob component for gamified mode
const AnimatedBlob = ({
	className = "",
	animationDelay = "0s",
	scale = 1,
	style = {},
}: {
	className?: string;
	animationDelay?: string;
	scale?: number;
	style?: React.CSSProperties;
}) => (
	<div
		className={`absolute animate-pulse ${className}`}
		style={{
			animationDelay,
			transform: `scale(${scale})`,
			...style,
		}}
	>
		<svg viewBox="0 0 100 100" className="w-4 h-4" fill="currentColor">
			<path d="M50 10C30 10 15 25 15 45C15 65 30 80 50 80C70 80 85 65 85 45C85 25 70 10 50 10ZM50 70C35 70 25 60 25 45C25 30 35 20 50 20C65 20 75 30 75 45C75 60 65 70 50 70Z" />
		</svg>
	</div>
);

export default function HolidayCard({
	id,
	name,
	description,
	route,
	color,
	progress,
	completedItems,
	totalItems,
	customBlobSvg,
	gamified = false,
	gamifiedBackgroundColor,
	holidayId,
	countdownTimer,
}: HolidayCardProps) {
	// Get display mode from Redux settings and user preferences (fallback to prop)
	const { settings } = useAppSelector((state: any) => state.theme);
	const { preferences } = useAppSelector((state: any) => state.userPreferences);
	const isGamifiedMode =
		gamified ||
		preferences?.displayMode === "gamified" ||
		settings.displayMode === "gamified";
	const isDarkMode = preferences?.theme === "dark" || settings.theme === "dark";

	const incompleteItems = totalItems - completedItems;

	// Generate blob positions for gamified mode
	const generateBlobPositions = (count: number) => {
		const positions = [];
		for (let i = 0; i < count; i++) {
			positions.push({
				top: `${Math.random() * 60 + 10}%`,
				left: `${Math.random() * 60 + 10}%`,
				animationDelay: `${Math.random() * 2}s`,
				scale: 0.8 + Math.random() * 0.4,
			});
		}
		return positions;
	};

	const blobPositions = generateBlobPositions(incompleteItems);

	// Use provided background color, holiday-specific gradient, or fallback to default
	const backgroundColor =
		gamifiedBackgroundColor ||
		getGamifiedBackgroundColor(id) ||
		"bg-gradient-to-br from-gray-400 to-gray-600";

	if (isGamifiedMode) {
		// Gamified mode design
		return (
			<li>
				<div
					className={`relative card rounded-2xl p-3 sm:p-5 transition hover:scale-[1.02] active:scale-100 overflow-hidden ${backgroundColor} text-white`}
					style={getCardStyling({
						isDarkMode,
						isGamified: true,
						intensity: "heavy",
					})}
				>
					{/* Background texture overlay */}
					<div className="absolute inset-0 opacity-10">
						<div className="absolute top-4 left-4 w-8 h-8 rounded-full bg-white opacity-20"></div>
						<div className="absolute top-12 right-8 w-6 h-6 rounded-full bg-white opacity-15"></div>
						<div className="absolute bottom-8 left-12 w-10 h-10 rounded-full bg-white opacity-10"></div>
						<div className="absolute bottom-4 right-4 w-4 h-4 rounded-full bg-white opacity-20"></div>
					</div>

					{/* Task blobs scattered across the card */}
					{blobPositions.map((pos, index) => (
						<AnimatedBlob
							key={index}
							className="text-white opacity-70"
							animationDelay={pos.animationDelay}
							scale={pos.scale}
							style={{
								top: pos.top,
								left: pos.left,
							}}
						/>
					))}

					<div className="relative z-10">
						{/* Header with holiday name and shared indicator */}
						<div className="flex justify-between items-start mb-3 sm:mb-4">
							<div className="flex-1">
								<div className="flex items-center gap-2 mb-1">
									<h3 className="text-base sm:text-lg font-bold text-white">
										{name}
									</h3>
									<SharedIndicatorCompact holidayKey={id} />
								</div>
								<p className="text-white opacity-90 text-xs sm:text-sm">
									{description}
								</p>
								{incompleteItems > 0 && (
									<p className="text-xs text-white opacity-80 mt-2">
										{incompleteItems} task{incompleteItems !== 1 ? "s" : ""}{" "}
										remaining!
										{incompleteItems > 5 && " Let's clean up those tasks!"}
									</p>
								)}
							</div>
						</div>

						{/* Holiday icon and progress */}
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-3 sm:gap-4">
								{/* Holiday icon */}
								<div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center backdrop-blur-sm">
									<HolidayIcon holidayId={id} />
								</div>

								{/* Progress info */}
								<div className="flex-1">
									<div className="w-full bg-white bg-opacity-20 rounded-full h-2 sm:h-3 mb-2">
										<div
											className="h-2 sm:h-3 rounded-full transition-all"
											style={{
												width: `${progress * 100}%`,
												backgroundColor: color.light,
											}}
										/>
									</div>
									<div className="flex justify-between items-center text-xs text-white opacity-80">
										<span>{Math.round(progress * 100)}% complete</span>
										<span>
											{completedItems}/{totalItems} items
										</span>
									</div>
								</div>
							</div>
						</div>
					</div>

					<Link
						href={route}
						className="absolute inset-0 z-10"
						aria-label={`Go to ${name} page`}
					>
						<span className="sr-only">Go to {name} page</span>
					</Link>

					{/* Countdown Timer with Invite Button - positioned outside Link coverage */}
					<div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20">
						<CountdownWithInviteCompact
							className="text-white"
							holiday={name}
							holidayKey={id}
							holidayId={holidayId}
							countdownTimer={countdownTimer}
						/>
					</div>
				</div>
			</li>
		);
	}

	// Professional mode (existing design)
	return (
		<li>
			<div
				className="relative card rounded-2xl p-3 sm:p-5 flex items-center gap-3 sm:gap-4 transition hover:scale-[1.02] active:scale-100 group"
				style={
					{
						...getCardStyling({
							isDarkMode,
							isGamified: false,
							intensity: "medium",
						}),
						"--holiday-color": color.light,
					} as React.CSSProperties
				}
			>
				<div className="relative w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 flex-shrink-0">
					<>
						{/* Holiday SVG Icon */}
						<div className="absolute inset-0 flex items-center justify-center">
							{(() => {
								const HolidayIconComponent = getHolidaySvgIcon(id);
								return (
									<HolidayIconComponent
										size={48}
										color={color.light}
										className="dark:text-gray-300 w-8 h-8 sm:w-12 sm:h-12 lg:w-[60px] lg:h-[60px]"
									/>
								);
							})()}
						</div>
						{/* Progress circle overlay */}
						<svg className="absolute inset-0 w-full h-full" viewBox="0 0 80 80">
							<circle
								cx="40"
								cy="40"
								r="36"
								fill="none"
								stroke="#e5e7eb"
								strokeWidth="6"
								className="dark:stroke-gray-600"
							/>
							<circle
								cx="40"
								cy="40"
								r="36"
								fill="none"
								stroke={color.light}
								strokeWidth="6"
								strokeDasharray={2 * Math.PI * 36}
								strokeDashoffset={2 * Math.PI * 36 * (1 - progress)}
								strokeLinecap="round"
								style={{ transition: "stroke-dashoffset 0.5s" }}
								className={`dark:stroke-${color.dark}`}
							/>
						</svg>
					</>
				</div>

				<div className="flex-1 min-w-0">
					<div className="flex justify-between items-start">
						<div className="flex-1 min-w-0">
							<div className="flex items-center gap-2 mb-1">
								<h3 className="text-base sm:text-lg font-bold text-gray-800 dark:text-white truncate">
									{name}
								</h3>
								<SharedIndicatorCompact holidayKey={id} />
							</div>
							<p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm line-clamp-2">
								{description}
							</p>
							{isGamifiedMode && incompleteItems > 0 && (
								<p className="text-xs text-red-500 dark:text-red-400 mt-1">
									{incompleteItems} task{incompleteItems !== 1 ? "s" : ""}{" "}
									remaining!
									{incompleteItems > 5 && " Let's clean up those tasks!"}
								</p>
							)}
						</div>
						{/* Countdown Timer with Invite Button - positioned on the right */}
						<div className="flex flex-col items-end gap-2 z-30 relative flex-shrink-0 ml-2">
							<CountdownWithInviteCompact
								className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm"
								holiday={name}
								holidayKey={id}
								holidayId={holidayId}
								countdownTimer={countdownTimer}
							/>
							<span className="text-lg sm:text-xl lg:text-2xl text-gray-300 dark:text-gray-600 transition-colors duration-200 group-hover:text-[var(--holiday-color)]">
								→
							</span>
						</div>
					</div>
					<div className="mt-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
						<div
							className="h-2 rounded-full transition-all"
							style={{
								width: `${Math.max(progress * 100, 0)}%`,
								backgroundColor: color.light,
							}}
						/>
					</div>
					<div className="flex justify-between items-center mt-1">
						<span className="text-xs text-gray-500 dark:text-gray-500">
							{Math.round(progress * 100)}% complete
						</span>
						<span className="text-xs text-gray-500 dark:text-gray-500">
							{completedItems}/{totalItems} items
						</span>
					</div>
				</div>
				<Link
					href={route}
					className="absolute inset-0 z-10"
					aria-label={`Go to ${name} page`}
				>
					<span className="sr-only">Go to {name} page</span>
				</Link>
			</div>
		</li>
	);
}
