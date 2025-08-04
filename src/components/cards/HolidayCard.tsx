"use client";

import Image from "next/image";
import Link from "next/link";
import CountdownTimer from "@/components/CountdownTimer";

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
}

export default function HolidayCard({
	id,
	name,
	description,
	route,
	color,
	progress,
	completedItems,
	totalItems,
}: HolidayCardProps) {
	return (
		<li>
			<div className="relative card rounded-2xl p-5 flex items-center gap-4 transition hover:scale-[1.02] active:scale-100">
				{/* Progress visual: floating germs (placeholder: globe.svg) */}
				<div className="relative w-16 h-16 flex-shrink-0">
					<Image
						src="/globe.svg"
						alt="Progress germs"
						fill
						className="object-contain animate-bounce"
					/>
					{/* Progress ring */}
					<svg
						className="absolute top-0 left-0 w-16 h-16 animate-bounce"
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
