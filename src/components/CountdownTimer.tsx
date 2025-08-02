"use client";

import { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import {
	setCountdown,
	clearCountdown,
	updateCountdown,
} from "@/store/slices/countdownSlice";
import {
	setHanukkahCountdown,
	clearHanukkahCountdown,
	updateHanukkahCountdown,
} from "@/store/slices/hanukkahCountdownSlice";
import DatePickerModal from "./DatePickerModal";

interface CountdownTimerProps {
	className?: string;
	holiday?: string;
}

export default function CountdownTimer({
	className = "",
	holiday,
}: CountdownTimerProps) {
	const dispatch = useAppDispatch();

	// Determine which countdown slice to use based on holiday
	const countdownState = useAppSelector((state) =>
		holiday === "Hanukkah" ? state.hanukkahCountdown : state.countdown
	);
	const { targetDate, isActive } = countdownState;

	const [timeLeft, setTimeLeft] = useState<{
		days: number;
		hours: number;
		minutes: number;
		seconds: number;
	} | null>(null);
	const [showDatePicker, setShowDatePicker] = useState(false);

	// Calculate time remaining
	useEffect(() => {
		if (!targetDate || !isActive) {
			setTimeLeft(null);
			return;
		}

		const timer = setInterval(() => {
			const now = new Date().getTime();
			const target = new Date(targetDate).getTime();
			const difference = target - now;

			if (difference <= 0) {
				setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
				clearInterval(timer);
				return;
			}

			const days = Math.floor(difference / (1000 * 60 * 60 * 24));
			const hours = Math.floor(
				(difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
			);
			const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
			const seconds = Math.floor((difference % (1000 * 60)) / 1000);

			setTimeLeft({ days, hours, minutes, seconds });
		}, 1000);

		return () => clearInterval(timer);
	}, [targetDate, isActive]);

	// Determine color based on time remaining
	const getCountdownColor = () => {
		if (!timeLeft) return "text-gray-500 dark:text-gray-400";

		const totalHours = timeLeft.days * 24 + timeLeft.hours;

		if (totalHours <= 0) {
			// Time is over
			return "text-red-500";
		} else if (totalHours <= 24) {
			// Within 24 hours
			return "text-yellow-500";
		} else {
			// More than 24 hours - active
			return "text-green-500";
		}
	};

	const handleSetCountdown = (date: string) => {
		if (holiday === "Hanukkah") {
			dispatch(setHanukkahCountdown(date));
		} else {
			dispatch(setCountdown(date));
		}
		setShowDatePicker(false);
	};

	const handleUpdateCountdown = (date: string) => {
		if (holiday === "Hanukkah") {
			dispatch(updateHanukkahCountdown(date));
		} else {
			dispatch(updateCountdown(date));
		}
		setShowDatePicker(false);
	};

	const handleClearCountdown = () => {
		if (holiday === "Hanukkah") {
			dispatch(clearHanukkahCountdown());
		} else {
			dispatch(clearCountdown());
		}
		setShowDatePicker(false);
	};

	const handleCountdownClick = (e: React.MouseEvent) => {
		e.stopPropagation();
		if (isActive) {
			setShowDatePicker(true);
		}
	};

	// Get holiday-specific completion message
	const getCompletionMessage = () => {
		if (
			!timeLeft ||
			timeLeft.days > 0 ||
			timeLeft.hours > 0 ||
			timeLeft.minutes > 0 ||
			timeLeft.seconds > 0
		) {
			return null;
		}

		switch (holiday) {
			case "Hanukkah":
				return "Hanukkah is here! 🕯️";
			case "Christmas":
				return "Christmas is here! 🎄";
			default:
				return "The holiday is here!";
		}
	};

	if (!isActive) {
		return (
			<div className={`${className} relative z-20`}>
				<button
					onClick={(e) => {
						e.stopPropagation();
						setShowDatePicker(true);
					}}
					className="text-xs text-blue-500 dark:text-blue-400 font-medium"
				>
					Set Countdown
				</button>
				<DatePickerModal
					isOpen={showDatePicker}
					onClose={() => setShowDatePicker(false)}
					onDateSelect={handleSetCountdown}
					title="Set Countdown Date"
				/>
			</div>
		);
	}

	if (!timeLeft) {
		return (
			<div
				className={`${className} text-xs text-gray-500 dark:text-gray-400 relative z-20`}
			>
				Calculating...
			</div>
		);
	}

	const completionMessage = getCompletionMessage();
	const isExpired =
		timeLeft.days === 0 &&
		timeLeft.hours === 0 &&
		timeLeft.minutes === 0 &&
		timeLeft.seconds === 0;

	// Show completion message but still allow editing
	if (completionMessage) {
		return (
			<div className={`${className} relative z-20`}>
				<button
					onClick={handleCountdownClick}
					className="text-xs text-red-500 cursor-pointer transition-colors font-medium"
					title="Click to edit or delete countdown"
				>
					{completionMessage}
				</button>
				<DatePickerModal
					isOpen={showDatePicker}
					onClose={() => setShowDatePicker(false)}
					onDateSelect={handleUpdateCountdown}
					title="Update Countdown Date"
					currentDate={targetDate || ""}
					onDelete={handleClearCountdown}
				/>
			</div>
		);
	}

	return (
		<div className={`${className} relative z-20`}>
			<button
				onClick={handleCountdownClick}
				className={`text-xs ${getCountdownColor()} cursor-pointer transition-colors font-medium`}
				title="Click to edit or delete countdown"
			>
				{timeLeft.days > 0 && `${timeLeft.days}d `}
				{timeLeft.hours > 0 && `${timeLeft.hours}h `}
				{timeLeft.minutes > 0 && `${timeLeft.minutes}m `}
				{timeLeft.seconds}s
			</button>
			<DatePickerModal
				isOpen={showDatePicker}
				onClose={() => setShowDatePicker(false)}
				onDateSelect={handleUpdateCountdown}
				title="Update Countdown Date"
				currentDate={targetDate || ""}
				onDelete={handleClearCountdown}
			/>
		</div>
	);
}
