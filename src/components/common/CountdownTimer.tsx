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

	const handleSetCountdown = (date: string) => {
		if (holiday === "Hanukkah") {
			dispatch(setHanukkahCountdown(date));
		} else if (holiday === "Kwanzaa") {
			dispatch(setKwanzaaCountdown(date));
		} else if (holiday === "New Year") {
			dispatch(setNewYearCountdown(date));
		} else if (holiday === "Valentine's Day") {
			dispatch(setValentinesCountdown(date));
		} else if (holiday === "Easter") {
			dispatch(setEasterCountdown(date));
		} else if (holiday === "Halloween") {
			dispatch(setHalloweenCountdown(date));
		} else if (holiday === "Thanksgiving") {
			dispatch(setThanksgivingCountdown(date));
		} else if (holiday === "Graduation") {
			dispatch(setGraduationCountdown(date));
		} else if (holiday === "Anniversary") {
			dispatch(setAnniversaryCountdown(date));
		} else if (holiday === "Birthday") {
			dispatch(setBirthdayCountdown(date));
		} else if (holiday === "Fourth of July") {
			dispatch(setFourthOfJulyCountdown(date));
		} else if (holiday === "Father's Day") {
			dispatch(setFathersDayCountdown(date));
		} else if (holiday === "Mother's Day") {
			dispatch(setMothersDayCountdown(date));
		} else if (holiday === "Christmas") {
			dispatch(setChristmasCountdown(date));
		} else {
			dispatch(setCountdown(date));
		}
		setShowDatePicker(false);
	};

	const handleUpdateCountdown = (date: string) => {
		if (holiday === "Hanukkah") {
			dispatch(updateHanukkahCountdown(date));
		} else if (holiday === "Kwanzaa") {
			dispatch(updateKwanzaaCountdown(date));
		} else if (holiday === "New Year") {
			dispatch(updateNewYearCountdown(date));
		} else if (holiday === "Valentine's Day") {
			dispatch(updateValentinesCountdown(date));
		} else if (holiday === "Easter") {
			dispatch(updateEasterCountdown(date));
		} else if (holiday === "Halloween") {
			dispatch(updateHalloweenCountdown(date));
		} else if (holiday === "Thanksgiving") {
			dispatch(updateThanksgivingCountdown(date));
		} else if (holiday === "Graduation") {
			dispatch(updateGraduationCountdown(date));
		} else if (holiday === "Anniversary") {
			dispatch(updateAnniversaryCountdown(date));
		} else if (holiday === "Birthday") {
			dispatch(updateBirthdayCountdown(date));
		} else if (holiday === "Fourth of July") {
			dispatch(updateFourthOfJulyCountdown(date));
		} else if (holiday === "Father's Day") {
			dispatch(updateFathersDayCountdown(date));
		} else if (holiday === "Mother's Day") {
			dispatch(updateMothersDayCountdown(date));
		} else if (holiday === "Christmas") {
			dispatch(updateChristmasCountdown(date));
		} else {
			dispatch(updateCountdown(date));
		}
		setShowDatePicker(false);
	};

	const handleClearCountdown = () => {
		if (holiday === "Hanukkah") {
			dispatch(clearHanukkahCountdown());
		} else if (holiday === "Kwanzaa") {
			dispatch(clearKwanzaaCountdown());
		} else if (holiday === "New Year") {
			dispatch(clearNewYearCountdown());
		} else if (holiday === "Valentine's Day") {
			dispatch(clearValentinesCountdown());
		} else if (holiday === "Easter") {
			dispatch(clearEasterCountdown());
		} else if (holiday === "Halloween") {
			dispatch(clearHalloweenCountdown());
		} else if (holiday === "Thanksgiving") {
			dispatch(clearThanksgivingCountdown());
		} else if (holiday === "Graduation") {
			dispatch(clearGraduationCountdown());
		} else if (holiday === "Anniversary") {
			dispatch(clearAnniversaryCountdown());
		} else if (holiday === "Birthday") {
			dispatch(clearBirthdayCountdown());
		} else if (holiday === "Fourth of July") {
			dispatch(clearFourthOfJulyCountdown());
		} else if (holiday === "Father's Day") {
			dispatch(clearFathersDayCountdown());
		} else if (holiday === "Mother's Day") {
			dispatch(clearMothersDayCountdown());
		} else if (holiday === "Christmas") {
			dispatch(clearChristmasCountdown());
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
