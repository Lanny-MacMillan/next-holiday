"use client";

import { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { setHanukkahCountdown } from "@/store/slices/hanukkahCountdownSlice";

interface TimeLeft {
	days: number;
	hours: number;
	minutes: number;
	seconds: number;
}

export default function HanukkahCountdownTimer({
	className = "",
}: {
	className?: string;
}) {
	const dispatch = useAppDispatch();
	const { targetDate, isActive } = useAppSelector(
		(state: any) => state.hanukkahCountdown
	);
	const [timeLeft, setTimeLeft] = useState<TimeLeft>({
		days: 0,
		hours: 0,
		minutes: 0,
		seconds: 0,
	});

	// Set default Hanukkah date if not set (first night of Hanukkah 2024)
	useEffect(() => {
		if (!targetDate && !isActive) {
			// Hanukkah 2024 starts on December 25, 2024
			const hanukkahDate = new Date("2024-12-25T18:00:00");
			dispatch(setHanukkahCountdown(hanukkahDate.toISOString()));
		}
	}, [targetDate, isActive, dispatch]);

	useEffect(() => {
		if (!targetDate) return;

		const calculateTimeLeft = () => {
			const difference = new Date(targetDate).getTime() - new Date().getTime();

			if (difference > 0) {
				setTimeLeft({
					days: Math.floor(difference / (1000 * 60 * 60 * 24)),
					hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
					minutes: Math.floor((difference / 1000 / 60) % 60),
					seconds: Math.floor((difference / 1000) % 60),
				});
			} else {
				setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
			}
		};

		calculateTimeLeft();
		const timer = setInterval(calculateTimeLeft, 1000);

		return () => clearInterval(timer);
	}, [targetDate]);

	if (!targetDate || !isActive) {
		return (
			<div className={`text-sm text-gray-500 dark:text-gray-400 ${className}`}>
				Hanukkah countdown not set
			</div>
		);
	}

	return (
		<div className={`text-xs text-gray-600 dark:text-gray-400 ${className}`}>
			{timeLeft.days > 0 && (
				<span className="mr-1">
					{timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m
				</span>
			)}
			{timeLeft.days === 0 && timeLeft.hours > 0 && (
				<span className="mr-1">
					{timeLeft.hours}h {timeLeft.minutes}m
				</span>
			)}
			{timeLeft.days === 0 && timeLeft.hours === 0 && (
				<span className="mr-1">
					{timeLeft.minutes}m {timeLeft.seconds}s
				</span>
			)}
			{timeLeft.days === 0 &&
				timeLeft.hours === 0 &&
				timeLeft.minutes === 0 &&
				timeLeft.seconds === 0 && <span>Hanukkah is here! 🕯️</span>}
		</div>
	);
}
