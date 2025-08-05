import React from "react";
import { usePathname } from "next/navigation";
import { getHolidayAccentColor } from "@/utils/holidayUtils";

interface AddButtonProps {
	title: string;
	onClick: () => void;
	color?: "red" | "green" | "blue" | "purple" | "orange" | "yellow" | "holiday";
	disabled?: boolean;
}

const AddButton: React.FC<AddButtonProps> = ({
	title,
	onClick,
	color = "holiday",
	disabled = false,
}) => {
	const pathname = usePathname();
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
			case "holiday":
				return {
					backgroundColor: getHolidayAccentColor(pathname),
					color: "white",
				};
			default:
				return { backgroundColor: "#ef4444", color: "white" };
		}
	};

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
