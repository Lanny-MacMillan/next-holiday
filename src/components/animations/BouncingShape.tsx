"use client";

import React, { useEffect, useRef, useState } from "react";
import { generateRandomBouncingAnimation, cleanupOldAnimations } from "@/utils/randomAnimations";
import { HolidayShapes, HolidayShapeProps } from "@/data/holidayShapes";

// Task type shapes (alternative to holiday shapes)
const TaskShapes = {
	gift: ({ className }: HolidayShapeProps) => (
		<svg viewBox="0 0 24 24" className={className} fill="currentColor">
			<path d="M12 2L2 7v10c0 5.55 3.84 7.74 9 8.86C16.16 24.74 20 22.55 20 17V7l-8-5z" />
		</svg>
	),
	card: ({ className }: HolidayShapeProps) => (
		<svg viewBox="0 0 24 24" className={className} fill="currentColor">
			<rect x="3" y="6" width="18" height="12" rx="2" />
			<path d="M3 8l9 4 9-4" stroke="white" strokeWidth="1" fill="none" />
		</svg>
	),
	task: ({ className }: HolidayShapeProps) => (
		<svg viewBox="0 0 24 24" className={className} fill="currentColor">
			<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
		</svg>
	),
	decoration: ({ className }: HolidayShapeProps) => (
		<svg viewBox="0 0 24 24" className={className} fill="currentColor">
			<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
		</svg>
	),
};

// Random chaos animations - each shape gets a unique, unpredictable animation
// No more predictable patterns!

interface BouncingShapeProps {
	holidayId?: string;
	taskType?: 'gift' | 'card' | 'task' | 'decoration';
	className?: string;
	animationDelay?: string;
	scale?: number;
	style?: React.CSSProperties;
	position?: {
		top: string;
		left: string;
	};
	animationPattern?: string;
	color?: string;
	debug?: boolean; // Add debug prop
}

const BouncingShape: React.FC<BouncingShapeProps> = ({
	holidayId = 'default',
	taskType,
	scale = 1,
	style = {},
	position,
	debug = false,
}) => {
	// Generate random position if none provided
	const randomPosition = position || {
		top: `${10 + Math.random() * 70}%`,
		left: `${10 + Math.random() * 70}%`,
	};
	
	// State for the random animation
	const [randomAnimation, setRandomAnimation] = useState<{
		animationName: string;
		duration: number;
		delay: number;
		timingFunction: string;
	} | null>(null);
	
	const shapeRef = useRef<HTMLDivElement>(null);
	
	// Generate a random bouncing animation for this instance (like original but unpredictable)
	useEffect(() => {
		const animation = generateRandomBouncingAnimation(scale);
		
		// Set up the keyframes in the document
		animation.setupKeyframes();
		
		// Store the animation config
		setRandomAnimation({
			animationName: animation.animationName,
			duration: animation.duration,
			delay: animation.delay,
			timingFunction: animation.timingFunction,
		});
		
		// Cleanup old animations periodically
		const cleanup = setTimeout(() => {
			cleanupOldAnimations();
		}, 5000);
		
		return () => {
			clearTimeout(cleanup);
		};
	}, []); // Only run once per component instance
	
	// Holiday-specific contrasting colors
	const getHolidayColor = (id: string) => {
		const holidayColors: { [key: string]: string } = {
			'christmas': '#22c55e', // Green for trees
			'hanukkah': '#3b82f6', // Blue
			'kwanzaa': '#dc2626', // Red
			'new-year': '#dc2626', // Bright red for fireworks
			'newyear': '#dc2626', // Bright red for fireworks (normalized)
			'valentines': '#dc2626', // Red for hearts
			'easter': '#8b5cf6', // Purple
			'halloween': '#ea580c', // Dark orange for pumpkins
			'thanksgiving': '#a16207', // Brown for turkeys
			'mothers-day': '#eab308', // Yellow for flowers
			'mothersday': '#eab308', // Yellow for flowers (normalized)
			'fathers-day': '#1f2937', // Black for ties
			'fathersday': '#1f2937', // Black for ties (normalized)
			'fourth-of-july': '#dc2626', // Red
			'fourthofjuly': '#dc2626', // Red (normalized)
			'birthday': '#f59e0b', // Gold/amber for candles
			'anniversary': '#dc2626', // Red for hearts
			'graduation': '#1f2937', // Black for graduation caps
			'baby-shower': '#ec4899', // Pink
			'babyshower': '#ec4899', // Pink (normalized)
		};
		
		return holidayColors[id] || '#6b7280'; // Default gray
	};
	
	// Choose shape based on task type or holiday
	const getShapeComponent = () => {
		if (taskType && TaskShapes[taskType]) {
			return TaskShapes[taskType];
		}
		
		// First try the original holiday ID
		if (holidayId && HolidayShapes[holidayId as keyof typeof HolidayShapes]) {
			return HolidayShapes[holidayId as keyof typeof HolidayShapes] as unknown as React.ComponentType<HolidayShapeProps>;
		}
		
		// Then try the normalized version (remove non-letters)
		const normalizedHolidayId = holidayId.toLowerCase().replace(/[^a-z]/g, '');
		if (HolidayShapes[normalizedHolidayId as keyof typeof HolidayShapes]) {
			return HolidayShapes[normalizedHolidayId as keyof typeof HolidayShapes] as unknown as React.ComponentType<HolidayShapeProps>;
		}
		
		return HolidayShapes.christmas as unknown as React.ComponentType<HolidayShapeProps>;
	};

	const ShapeComponent = getShapeComponent();
	
	// Always use holiday-specific color, ignore passed color prop
	const shapeColor = debug ? "#ff0000" : getHolidayColor(holidayId);
	
	// Build the style with gentle random animation (like original speed/style)
	const finalStyle = {
		top: randomPosition.top,
		left: randomPosition.left,
		zIndex: debug ? 999 : 50, // Higher z-index to ensure visibility
		color: shapeColor,
		// Apply the random animation if it's ready
		...(randomAnimation ? {
			animationName: randomAnimation.animationName,
			animationDuration: `${randomAnimation.duration}s`,
			animationDelay: `${randomAnimation.delay}s`,
			animationTimingFunction: randomAnimation.timingFunction,
			animationIterationCount: 'infinite',
			animationFillMode: 'both',
		} : {
			// Fallback style while animation loads
			transform: `scale(${scale})`,
		}),
		...style,
		...(debug ? {
			border: "2px solid red",
			backgroundColor: "rgba(255,0,0,0.2)",
			padding: "4px"
		} : {})
	};

		return (
		<div
			ref={shapeRef}
			className={`absolute pointer-events-none ${debug ? 'random-debug' : 'random-bouncing'}`}
			style={{
				...finalStyle,
				// Add containment to keep animations within bounds
				contain: 'layout style paint',
			}}
		>
			<div className={`w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 transition-opacity drop-shadow-lg ${debug ? 'opacity-100 border-2 border-blue-500' : 'opacity-100'}`}>
				<ShapeComponent className="w-full h-full filter drop-shadow-xl" />
			</div>
			{debug && (
				<div className="absolute -bottom-6 left-0 text-xs text-red-600 font-bold whitespace-nowrap bg-white px-1">
					{holidayId || taskType} - RANDOM
				</div>
			)}
		</div>
	);
};

export default BouncingShape;