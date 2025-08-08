import React from "react";
import Link from "next/link";
import { useAppSelector } from "@/store/hooks";
import { getCardStyling } from "@/utils/cardShadows";

interface GuestListCardProps {
	holiday: string;
	href: string;
	theme: {
		primaryColor: string;
		accentColor: string;
	};
}

const GuestListCard: React.FC<GuestListCardProps> = ({
	holiday,
	href,
	theme,
}) => {
	const { settings } = useAppSelector((state: any) => state.theme);
	const isDarkMode = settings.theme === "dark";
	const guests = useAppSelector((state: any) => {
		// Get the appropriate guest list based on holiday
		switch (holiday.toLowerCase()) {
			case "thanksgiving":
				return state.thanksgivingGuestList.guests;
			case "christmas":
				return state.christmasGuestList?.guests || [];
			case "easter":
				return state.easterGuestList?.guests || [];
			case "hanukkah":
				return state.hanukkahGuestList?.guests || [];
			case "kwanzaa":
				return state.kwanzaaGuestList?.guests || [];
			case "new-year":
				return state.newYearGuestList?.guests || [];
			case "valentines":
				return state.valentinesGuestList?.guests || [];
			default:
				return [];
		}
	});

	// Calculate RSVP statistics
	const totalGuests = guests.length;
	const confirmedGuests = guests.filter(
		(guest: any) => guest.rsvpStatus === "confirmed"
	).length;
	const pendingGuests = guests.filter(
		(guest: any) => guest.rsvpStatus === "pending"
	).length;
	const declinedGuests = guests.filter(
		(guest: any) => guest.rsvpStatus === "declined"
	).length;

	// Calculate total people (including +1s)
	const totalPeople = guests.reduce(
		(sum: number, guest: any) => sum + guest.numberOfGuests,
		0
	);

	// Calculate +1s (people beyond the primary guest)
	const totalPlusOnes = totalPeople - totalGuests;

	return (
		<Link href={href} className="block group">
			<div
				className="card rounded-lg p-6 transition-all duration-200 border-l-4"
				style={{
					borderLeftColor: theme.primaryColor,
					...getCardStyling({
						isDarkMode,
						isGamified: false,
						intensity: "medium",
					}),
				}}
			>
				<div className="flex justify-between items-start mb-4">
					<div>
						<h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
							Guest List
						</h3>
						<p className="text-gray-600 dark:text-gray-400 text-sm">
							Manage your {holiday} guest list and RSVPs
						</p>
					</div>
					<div className="text-right">
						<div className="text-2xl font-bold text-gray-900 dark:text-white">
							{totalGuests}
						</div>
						<div className="text-xs text-gray-500 dark:text-gray-400">
							guests
						</div>
					</div>
				</div>

				{/* RSVP Status Breakdown */}
				<div className="space-y-2 mb-4">
					<div className="flex justify-between items-center text-sm">
						<span className="text-gray-600 dark:text-gray-400">Confirmed:</span>
						<span className="font-medium text-green-600 dark:text-green-500">
							{confirmedGuests}
						</span>
					</div>
					<div className="flex justify-between items-center text-sm">
						<span className="text-gray-600 dark:text-gray-400">Pending:</span>
						<span className="font-medium text-yellow-600 dark:text-yellow-500">
							{pendingGuests}
						</span>
					</div>
					<div className="flex justify-between items-center text-sm">
						<span className="text-gray-600 dark:text-gray-400">Declined:</span>
						<span className="font-medium text-red-600 dark:text-red-500">
							{declinedGuests}
						</span>
					</div>
				</div>

				{/* Total People Count */}
				<div className="pt-3 border-t border-gray-200 dark:border-gray-700">
					<div className="flex justify-between items-center">
						<span className="text-sm text-gray-600 dark:text-gray-400">
							Total People:
						</span>
						<span className="font-semibold text-gray-900 dark:text-white">
							{totalPeople}
						</span>
					</div>
					{totalPlusOnes > 0 && (
						<div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
							(includes +1s)
						</div>
					)}
				</div>

				{/* Progress indicator */}
				<div className="mt-4">
					<div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
						<span>RSVP Response Rate</span>
						<span>
							{totalGuests > 0
								? Math.round(
										((confirmedGuests + declinedGuests) / totalGuests) * 100
								  )
								: 0}
							%
						</span>
					</div>
					<div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
						<div
							className="h-2 rounded-full transition-all duration-300"
							style={{
								backgroundColor: theme.primaryColor,
								width: `${
									totalGuests > 0
										? ((confirmedGuests + declinedGuests) / totalGuests) * 100
										: 0
								}%`,
							}}
						/>
					</div>
				</div>
			</div>
		</Link>
	);
};

export default GuestListCard;
