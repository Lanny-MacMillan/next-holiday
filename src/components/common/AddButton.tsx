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
				return "bg-purple-500 hover:bg-purple-600";
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
		switch (color) {
			case "red":
				return { backgroundColor: "#ef4444", color: "white" };
			case "green":
				return { backgroundColor: "#22c55e", color: "white" };
			case "blue":
				return { backgroundColor: "#3b82f6", color: "white" };
			case "purple":
				return { backgroundColor: "#8b5cf6", color: "white" };
			case "orange":
				return { backgroundColor: "#f97316", color: "white" };
			case "yellow":
				return { backgroundColor: "#eab308", color: "white" };
			case "amber":
				return { backgroundColor: "#f59e0b", color: "white" };
			case "holiday":
				return {
					backgroundColor: getHolidayAccentColor(pathname),
					color: "white",
				};
			default:
				return { backgroundColor: "#ef4444", color: "white" };
		}
	};

	// If gamified is true, render the playful design
	if (isGamified) {
		const backgroundColor = holidayColor || getHolidayAccentColor(pathname);

		return (
			<button
				onClick={onClick}
				className={`${getColorClasses()} text-white px-4 py-2 rounded transition-colors  tracking-wide  ${
					disabled ? "opacity-50 cursor-not-allowed" : ""
				}`}
				style={
					(getColorStyle(),
					{
						fontFamily: "var(--font-family-fredoka)",
					})
				}
				disabled={disabled}
			>
				Add New {title}
			</button>
		);
	}

	// Original clean, professional design
	return (
		<button
			onClick={onClick}
			className={`${getColorClasses()} text-white px-4 py-2 rounded transition-colors ${
				disabled ? "opacity-50 cursor-not-allowed" : ""
			}`}
			style={getColorStyle()}
			disabled={disabled}
		>
			Add New {title}
		</button>
	);
};

export default AddButton;
