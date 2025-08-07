"use client";

import Image from "next/image";
import Link from "next/link";
import CountdownTimer from "@/components/common/CountdownTimer";
import { useAppSelector } from "@/store/hooks";

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
}: HolidayCardProps) {
	// Get display mode from Redux settings (fallback to prop)
	const { settings } = useAppSelector((state: any) => state.theme);
	const isGamifiedMode = gamified || settings.displayMode === "gamified";

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
		return gradientMap[id] || "bg-gradient-to-br from-gray-400 to-gray-600";
	};

	if (isGamifiedMode) {
		// Gamified mode design
		return (
			<li>
				<div
					className={`relative card rounded-2xl p-5 transition hover:scale-[1.02] active:scale-100 overflow-hidden ${getGamifiedBackgroundColor()} text-white`}
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
						{/* Header with holiday name */}
						<div className="flex justify-between items-start mb-4">
							<div className="flex-1">
								<h3 className="text-xl font-bold text-white mb-1">{name}</h3>
								<p className="text-white opacity-90 text-sm">{description}</p>
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
							<div className="flex items-center gap-4">
								{/* Holiday icon */}
								<div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center backdrop-blur-sm">
									<HolidayIcon holidayId={id} />
								</div>

								{/* Progress info */}
								<div className="flex-1">
									<div className="w-full bg-white bg-opacity-20 rounded-full h-3 mb-2">
										<div
											className="bg-white h-3 rounded-full transition-all"
											style={{ width: `${progress * 100}%` }}
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

					{/* Countdown Timer - positioned outside Link coverage */}
					<div className="absolute top-4 right-4 z-20">
						<CountdownTimer className="text-white" holiday={name} />
					</div>
				</div>
			</li>
		);
	}

	// Professional mode (existing design)
	return (
		<li>
			<div className="relative card rounded-2xl p-5 flex items-center gap-4 transition hover:scale-[1.02] active:scale-100">
				<div className="relative w-16 h-16 flex-shrink-0">
					<>
						<Image
							src="/globe.svg"
							alt="Progress indicator"
							fill
							className="object-contain"
						/>
						<svg
							className="absolute top-0 left-0 w-16 h-16"
							viewBox="0 0 64 64"
						>
							<circle
								cx="32"
								cy="32"
								r="28"
								fill="none"
								stroke="#e5e7eb"
								strokeWidth="6"
								className="dark:stroke-gray-600"
							/>
							<circle
								cx="32"
								cy="32"
								r="28"
								fill="none"
								stroke={color.light}
								strokeWidth="6"
								strokeDasharray={2 * Math.PI * 28}
								strokeDashoffset={2 * Math.PI * 28 * (1 - progress)}
								strokeLinecap="round"
								style={{ transition: "stroke-dashoffset 0.5s" }}
								className={`dark:stroke-${color.dark}`}
							/>
						</svg>
					</>
				</div>

				<div className="flex-1">
					<div className="flex justify-between items-start">
						<div>
							<h3 className="text-lg font-bold text-gray-800 dark:text-white">
								{name}
							</h3>
							<p className="text-gray-600 dark:text-gray-400 text-sm">
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
						{/* Countdown Timer - positioned on the right */}
						<div className="flex flex-col items-end gap-2 z-20 relative">
							<CountdownTimer className="" holiday={name} />
							<span className="text-2xl text-gray-300 dark:text-gray-600">
								→
							</span>
						</div>
					</div>
					<div className="mt-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
						<div
							className={`${color.progress} h-2 rounded-full transition-all`}
							style={{ width: `${progress * 100}%` }}
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
