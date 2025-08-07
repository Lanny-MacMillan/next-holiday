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
}: HolidayCardProps) {
	// Get display mode from Redux settings
	const { settings } = useAppSelector((state: any) => state.theme);
	const isGamifiedMode = settings.displayMode === "gamified";

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

	return (
		<li>
			<div className="relative card rounded-2xl p-5 flex items-center gap-4 transition hover:scale-[1.02] active:scale-100">
				{/* Progress visual: floating tasks in gamified mode, regular progress in professional mode */}
				<div className="relative w-16 h-16 flex-shrink-0">
					{isGamifiedMode ? (
						// Gamified mode with blobs/tasks
						<div className="relative w-16 h-16">
							{/* Base circle */}
							<div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
								{/* Show blobs for incomplete items */}
								{blobPositions.map((pos, index) => (
									<div
										key={index}
										className="absolute animate-bounce"
										style={{
											top: pos.top,
											left: pos.left,
											animationDelay: pos.animationDelay,
											transform: `scale(${pos.scale})`,
										}}
									>
										{customBlobSvg ? (
											<Image
												src={customBlobSvg}
												alt="Task blob"
												width={12}
												height={12}
												className="opacity-70"
											/>
										) : (
											<DefaultBlob className="w-3 h-3 text-red-400 dark:text-red-300" />
										)}
									</div>
								))}
							</div>
							{/* Progress ring overlay */}
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
									strokeWidth="4"
									className="dark:stroke-gray-600"
								/>
								<circle
									cx="32"
									cy="32"
									r="28"
									fill="none"
									stroke={color.light}
									strokeWidth="4"
									strokeDasharray={2 * Math.PI * 28}
									strokeDashoffset={2 * Math.PI * 28 * (1 - progress)}
									strokeLinecap="round"
									style={{ transition: "stroke-dashoffset 0.5s" }}
									className={`dark:stroke-${color.dark}`}
								/>
							</svg>
						</div>
					) : (
						// Professional mode with regular progress
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
					)}
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
