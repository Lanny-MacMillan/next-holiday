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
} from "@/store/slices/hanukkah/hanukkahCountdownSlice";
import {
	setKwanzaaCountdown,
	clearKwanzaaCountdown,
	updateKwanzaaCountdown,
} from "@/store/slices/kwanzaa/kwanzaaCountdownSlice";
import {
	setNewYearCountdown,
	clearNewYearCountdown,
	updateNewYearCountdown,
} from "@/store/slices/new-year/newYearCountdownSlice";
import {
	setValentinesCountdown,
	clearValentinesCountdown,
	updateValentinesCountdown,
} from "@/store/slices/valentines/valentinesCountdownSlice";
import {
	setEasterCountdown,
	clearEasterCountdown,
	updateEasterCountdown,
} from "@/store/slices/easter/easterCountdownSlice";
import {
	setHalloweenCountdown,
	clearHalloweenCountdown,
	updateHalloweenCountdown,
} from "@/store/slices/halloween/halloweenCountdownSlice";
import {
	setThanksgivingCountdown,
	clearThanksgivingCountdown,
	updateThanksgivingCountdown,
} from "@/store/slices/thanksgiving/thanksgivingCountdownSlice";
import {
	setGraduationCountdown,
	clearGraduationCountdown,
	updateGraduationCountdown,
} from "@/store/slices/graduation/graduationCountdownSlice";
import {
	setAnniversaryCountdown,
	clearAnniversaryCountdown,
	updateAnniversaryCountdown,
} from "@/store/slices/anniversary/anniversaryCountdownSlice";
import {
	setBirthdayCountdown,
	clearBirthdayCountdown,
	updateBirthdayCountdown,
} from "@/store/slices/birthday/birthdayCountdownSlice";
import {
	setFourthOfJulyCountdown,
	clearFourthOfJulyCountdown,
	updateFourthOfJulyCountdown,
} from "@/store/slices/fourth-of-july/fourthOfJulyCountdownSlice";
import {
	setFathersDayCountdown,
	clearFathersDayCountdown,
	updateFathersDayCountdown,
} from "@/store/slices/fathers-day/fathersDayCountdownSlice";
import {
	setMothersDayCountdown,
	clearMothersDayCountdown,
	updateMothersDayCountdown,
} from "@/store/slices/mothers-day/mothersDayCountdownSlice";
import {
	setChristmasCountdown,
	clearChristmasCountdown,
	updateChristmasCountdown,
} from "@/store/slices/christmas/christmasCountdownSlice";
import DatePickerModal from "../modals/DatePickerModal";

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
	const countdownState = useAppSelector((state) => {
		switch (holiday) {
			case "Hanukkah":
				return state.hanukkahCountdown;
			case "Kwanzaa":
				return state.kwanzaaCountdown;
			case "New Year":
				return state.newYearCountdown;
			case "Valentine's Day":
				return state.valentinesCountdown;
			case "Easter":
				return state.easterCountdown;
			case "Halloween":
				return state.halloweenCountdown;
			case "Thanksgiving":
				return state.thanksgivingCountdown;
			case "Graduation":
				return state.graduationCountdown;
			case "Anniversary":
				return state.anniversaryCountdown;
			case "Birthday":
				return state.birthdayCountdown;
			case "Fourth of July":
				return state.fourthOfJulyCountdown;
			case "Father's Day":
				return state.fathersDayCountdown;
			case "Mother's Day":
				return state.mothersDayCountdown;
			case "Christmas":
				return state.christmasCountdown;
			default:
				return state.countdown;
		}
	});

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

	// Helper function to dispatch set countdown action based on holiday
	const dispatchSetCountdown = (holiday: string | undefined, date: string) => {
		switch (holiday) {
			case "Hanukkah":
				return setHanukkahCountdown(date);
			case "Kwanzaa":
				return setKwanzaaCountdown(date);
			case "New Year":
				return setNewYearCountdown(date);
			case "Valentine's Day":
				return setValentinesCountdown(date);
			case "Easter":
				return setEasterCountdown(date);
			case "Halloween":
				return setHalloweenCountdown(date);
			case "Thanksgiving":
				return setThanksgivingCountdown(date);
			case "Graduation":
				return setGraduationCountdown(date);
			case "Anniversary":
				return setAnniversaryCountdown(date);
			case "Birthday":
				return setBirthdayCountdown(date);
			case "Fourth of July":
				return setFourthOfJulyCountdown(date);
			case "Father's Day":
				return setFathersDayCountdown(date);
			case "Mother's Day":
				return setMothersDayCountdown(date);
			case "Christmas":
				return setChristmasCountdown(date);
			default:
				return setCountdown(date);
		}
	};

	const handleSetCountdown = (date: string) => {
		dispatch(dispatchSetCountdown(holiday, date));
		setShowDatePicker(false);
	};

	// Helper function to dispatch update countdown action based on holiday
	const dispatchUpdateCountdown = (
		holiday: string | undefined,
		date: string
	) => {
		switch (holiday) {
			case "Hanukkah":
				return updateHanukkahCountdown(date);
			case "Kwanzaa":
				return updateKwanzaaCountdown(date);
			case "New Year":
				return updateNewYearCountdown(date);
			case "Valentine's Day":
				return updateValentinesCountdown(date);
			case "Easter":
				return updateEasterCountdown(date);
			case "Halloween":
				return updateHalloweenCountdown(date);
			case "Thanksgiving":
				return updateThanksgivingCountdown(date);
			case "Graduation":
				return updateGraduationCountdown(date);
			case "Anniversary":
				return updateAnniversaryCountdown(date);
			case "Birthday":
				return updateBirthdayCountdown(date);
			case "Fourth of July":
				return updateFourthOfJulyCountdown(date);
			case "Father's Day":
				return updateFathersDayCountdown(date);
			case "Mother's Day":
				return updateMothersDayCountdown(date);
			case "Christmas":
				return updateChristmasCountdown(date);
			default:
				return updateCountdown(date);
		}
	};

	const handleUpdateCountdown = (date: string) => {
		dispatch(dispatchUpdateCountdown(holiday, date));
		setShowDatePicker(false);
	};

	// Helper function to dispatch clear countdown action based on holiday
	const dispatchClearCountdown = (holiday: string | undefined) => {
		switch (holiday) {
			case "Hanukkah":
				return clearHanukkahCountdown();
			case "Kwanzaa":
				return clearKwanzaaCountdown();
			case "New Year":
				return clearNewYearCountdown();
			case "Valentine's Day":
				return clearValentinesCountdown();
			case "Easter":
				return clearEasterCountdown();
			case "Halloween":
				return clearHalloweenCountdown();
			case "Thanksgiving":
				return clearThanksgivingCountdown();
			case "Graduation":
				return clearGraduationCountdown();
			case "Anniversary":
				return clearAnniversaryCountdown();
			case "Birthday":
				return clearBirthdayCountdown();
			case "Fourth of July":
				return clearFourthOfJulyCountdown();
			case "Father's Day":
				return clearFathersDayCountdown();
			case "Mother's Day":
				return clearMothersDayCountdown();
			case "Christmas":
				return clearChristmasCountdown();
			default:
				return clearCountdown();
		}
	};

	const handleClearCountdown = () => {
		dispatch(dispatchClearCountdown(holiday));
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
			case "Kwanzaa":
				return "Kwanzaa is here! 🕯️";
			case "Christmas":
				return "Christmas is here! 🎄";
			case "New Year":
				return "New Year is here! 🎆";
			case "Valentine's Day":
				return "Valentine's Day is here! 💕";
			case "Easter":
				return "Easter is here! 🐰";
			case "Halloween":
				return "Halloween is here! 🎃";
			case "Thanksgiving":
				return "Thanksgiving is here! 🦃";
			case "Graduation":
				return "Graduation is here! 🎓";
			case "Anniversary":
				return "Anniversary is here! 💍";
			case "Birthday":
				return "Birthday is here! 🎂";
			case "Fourth of July":
				return "Fourth of July is here! 🇺🇸";
			case "Father's Day":
				return "Father's Day is here! 👨‍👧‍👦";
			case "Mother's Day":
				return "Mother's Day is here! 👩‍👧‍👦";
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
					className="text-xs text-white font-medium hover:text-gray-200 transition-colors"
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
