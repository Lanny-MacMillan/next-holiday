import React from "react";

interface RSVPSectionProps {
	title: string;
	items: any[];
	rsvpStatus: "pending" | "confirmed" | "declined";
	emptyMessage: string;
	renderItem: (item: any) => React.ReactNode;
	cardClassName?: string;
	borderColor?: string;
	customTitle?: string; // Optional custom title override
}

const RSVPSection: React.FC<RSVPSectionProps> = ({
	title,
	items,
	rsvpStatus,
	emptyMessage,
	renderItem,
	cardClassName = "",
	borderColor,
	customTitle,
}) => {
	const getTitleColor = () => {
		switch (rsvpStatus) {
			case "confirmed":
				return "text-green-600 dark:text-green-500";
			case "declined":
				return "text-red-600 dark:text-red-500";
			case "pending":
			default:
				return "text-yellow-600 dark:text-yellow-500";
		}
	};

	const getEmptyMessageColor = () => {
		switch (rsvpStatus) {
			case "confirmed":
				return "text-green-300 dark:text-green-600";
			case "declined":
				return "text-red-300 dark:text-red-600";
			case "pending":
			default:
				return "text-yellow-300 dark:text-yellow-600";
		}
	};

	const getStatusLabel = () => {
		switch (rsvpStatus) {
			case "confirmed":
				return "RSVP: Confirmed";
			case "declined":
				return "RSVP: Declined";
			case "pending":
			default:
				return "RSVP: Not-Confirmed";
		}
	};

	return (
		<div>
			<h2 className={`font-semibold mb-2 ${getTitleColor()}`}>
				{customTitle || getStatusLabel()} ({items.length})
			</h2>
			<div
				className={`card ${cardClassName} rounded shadow`}
				style={borderColor ? { borderLeft: `4px solid ${borderColor}` } : {}}
			>
				{items.length === 0 ? (
					<div className={`px-4 py-3 ${getEmptyMessageColor()} text-center`}>
						{emptyMessage}
					</div>
				) : (
					<ul className="divide-y divide-gray-200 dark:divide-gray-700">
						{items.map((item) => renderItem(item))}
					</ul>
				)}
			</div>
		</div>
	);
};

export default RSVPSection;
