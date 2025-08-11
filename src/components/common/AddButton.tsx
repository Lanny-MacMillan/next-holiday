import React from "react";
import { usePathname } from "next/navigation";
import { getHolidayAccentColor } from "@/utils/holidayUtils";
import { getCardStyling } from "@/utils/cardShadows";
import { useAppSelector } from "@/store/hooks";

interface AddButtonProps {
	title: string;
	onClick: () => void;
	color?:
		| "red"
		| "green"
		| "blue"
		| "purple"
		| "pink"
		| "orange"
		| "yellow"
		| "amber"
		| "holiday";
	disabled?: boolean;
	holidayColor?: string;
}

const AddButton: React.FC<AddButtonProps> = ({
	title,
	onClick,
	color = "holiday",
	disabled = false,
	holidayColor,
}) => {
	const pathname = usePathname();
	const { settings } = useAppSelector((state: any) => state.theme);
	const isGamified = settings.displayMode === "gamified";

	const getColorClasses = () => {
		switch (color) {
			case "red":
				return "bg-red-500 hover:bg-red-600";
			case "green":
				return "bg-green-500 hover:bg-green-600";
			case "blue":
				return "bg-blue-500 hover:bg-blue-600";
			case "purple":
				return "bg-purple-300 hover:bg-purple-500";
			case "pink":
				return "bg-pink-300 hover:bg-pink-500";
			case "orange":
				return "bg-orange-500 hover:bg-orange-600";
			case "yellow":
				return "bg-yellow-500 hover:bg-yellow-600";
			case "amber":
				return "bg-amber-500 hover:bg-amber-600";
			case "holiday":
				return "hover:opacity-90";
			default:
				return "bg-red-500 hover:bg-red-600";
		}
	};

	const getColorStyle = () => {
		// For specific colors, let CSS classes handle the styling to allow hover effects
		if (color !== "holiday") {
			return { color: "white" };
		}
		// Only use inline background color for "holiday" which needs dynamic colors
		return {
			backgroundColor: getHolidayAccentColor(pathname),
			color: "white",
		};
	};

	// If gamified is true, render the playful design
	if (isGamified) {
		const isDarkMode = settings.theme === "dark";

		// For holiday color in gamified mode, use dynamic background
		if (color === "holiday") {
			const backgroundColor = holidayColor || getHolidayAccentColor(pathname);
			return (
				<button
					onClick={onClick}
					className={`hover:opacity-90 text-white px-4 py-2 rounded transition-colors tracking-wide border-2 border-white ${
						disabled ? "opacity-50 cursor-not-allowed" : ""
					}`}
					style={{
						backgroundColor,
						color: "white",
						fontFamily: "var(--font-family-fredoka)",
						...getCardStyling({
							isDarkMode,
							isGamified: true,
							intensity: "heavy",
						}),
					}}
					disabled={disabled}
				>
					Add New {title}
				</button>
			);
		}

		// For specific colors in gamified mode, use CSS classes only
		return (
			<button
				onClick={onClick}
				className={`${getColorClasses()} text-white px-4 py-2 rounded transition-colors tracking-wide border-2 border-white ${
					disabled ? "opacity-50 cursor-not-allowed" : ""
				}`}
				style={{
					fontFamily: "var(--font-family-fredoka)",
					...getCardStyling({
						isDarkMode,
						isGamified: true,
						intensity: "heavy",
					}),
				}}
				disabled={disabled}
			>
				Add New {title}
			</button>
		);
	}

	// Original clean, professional design
	if (color === "holiday") {
		return (
			<button
				onClick={onClick}
				className={`hover:opacity-90 text-white px-4 py-2 rounded transition-colors ${
					disabled ? "opacity-50 cursor-not-allowed" : ""
				}`}
				style={{
					backgroundColor: getHolidayAccentColor(pathname),
					color: "white",
				}}
				disabled={disabled}
			>
				Add New {title}
			</button>
		);
	}

	// For specific colors, use CSS classes only to allow hover effects
	return (
		<button
			onClick={onClick}
			className={`${getColorClasses()} text-white px-4 py-2 rounded transition-colors ${
				disabled ? "opacity-50 cursor-not-allowed" : ""
			}`}
			disabled={disabled}
		>
			Add New {title}
		</button>
	);
};

export default AddButton;
