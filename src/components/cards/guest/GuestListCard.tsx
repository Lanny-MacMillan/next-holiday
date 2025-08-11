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
	gamified?: boolean;
	holidayColor?: string;
}

const GuestListCard: React.FC<GuestListCardProps> = ({
	holiday,
	href,
	theme,
	gamified = false,
	holidayColor,
}) => {
	const { settings } = useAppSelector((state: any) => state.theme);
	const isDarkMode = settings.theme === "dark";
	const isGamifiedMode = gamified || settings.displayMode === "gamified";
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
			case "fourth of july":
				return state.fourthOfJulyGuestList?.guests || [];
			case "birthday":
				return state.birthdayGuestList?.guests || [];
			case "baby shower":
				return state.babyShowerGuestList?.guests || [];
			case "graduation":
				return state.graduationGuestList?.guests || [];
			case "halloween":
				return state.halloweenGuestList?.guests || [];
			default:
				return [];
		}
	});

	// Calculate RSVP statistics
	const totalGuests = guests.length;
	const confirmedParties = guests.filter(
		(guest: any) => guest.rsvpStatus === "confirmed"
	).length;
	const pendingParties = guests.filter(
		(guest: any) => guest.rsvpStatus === "pending"
	).length;
	const declinedParties = guests.filter(
		(guest: any) => guest.rsvpStatus === "declined"
	).length;

	// Calculate total guests for each status
	const confirmedGuests = guests
		.filter((guest: any) => guest.rsvpStatus === "confirmed")
		.reduce((sum: number, guest: any) => sum + guest.numberOfGuests, 0);
	const pendingGuests = guests
		.filter((guest: any) => guest.rsvpStatus === "pending")
		.reduce((sum: number, guest: any) => sum + guest.numberOfGuests, 0);
	const declinedGuests = guests
		.filter((guest: any) => guest.rsvpStatus === "declined")
		.reduce((sum: number, guest: any) => sum + guest.numberOfGuests, 0);

	// Calculate total people (including +1s)
	const totalPeople = guests.reduce(
		(sum: number, guest: any) => sum + guest.numberOfGuests,
		0
	);

	// Calculate +1s (people beyond the primary guest)
	const totalPlusOnes = totalPeople - totalGuests;

	// Guest-themed icons for gamified mode
	const GuestIcon = ({
		count,
		className = "",
	}: {
		count: number;
		className?: string;
	}) => {
		const getIcon = (count: number) => {
			if (count >= 20) return "🎉";
			if (count >= 10) return "👥";
			if (count >= 5) return "👨‍👩‍👧‍👦";
			return "👤";
		};

		return <div className={`text-2xl ${className}`}>{getIcon(count)}</div>;
	};

	if (isGamifiedMode) {
		// Gamified mode design
		const backgroundColor =
			holidayColor ||
			`bg-gradient-to-br from-${theme.primaryColor} to-${theme.accentColor}`;

		return (
			<Link href={href} className="block group">
				<div
					className={`relative card rounded-2xl p-4 cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-100 overflow-hidden tracking-widest text-white border-2 border-white ${backgroundColor}`}
					style={getCardStyling({
						isDarkMode,
						isGamified: true,
						intensity: "heavy",
					})}
				>
					{/* Background texture overlay */}
					<div className="absolute inset-0 opacity-10 pointer-events-none">
						<div className="absolute top-4 left-4 w-6 h-6 rounded-full bg-white opacity-20 pointer-events-none"></div>
						<div className="absolute top-8 right-6 w-4 h-4 rounded-full bg-white opacity-15 pointer-events-none"></div>
						<div className="absolute bottom-6 left-8 w-5 h-5 rounded-full bg-white opacity-10 pointer-events-none"></div>
						<div className="absolute bottom-3 right-3 w-3 h-3 rounded-full bg-white opacity-20 pointer-events-none"></div>
					</div>

					<div className="relative z-10">
						<div className="flex justify-between items-start mb-4">
							<div>
								<h3
									className="text-xl font-semibold text-white mb-2"
									style={{ fontFamily: "var(--font-family-fredoka)" }}
								>
									Guest List
								</h3>
								<p
									className="text-white opacity-90 text-sm"
									style={{ fontFamily: "var(--font-family-fredoka)" }}
								>
									Manage your {holiday} guest list and RSVPs
								</p>
							</div>
							<div className="text-right">
								<div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center backdrop-blur-sm">
									<GuestIcon count={totalGuests} />
								</div>
								<div
									className="text-2xl font-bold text-white mt-2"
									style={{ fontFamily: "var(--font-family-fredoka)" }}
								>
									{totalGuests}
								</div>
								<div
									className="text-xs text-white opacity-90"
									style={{ fontFamily: "var(--font-family-fredoka)" }}
								>
									invites
								</div>
							</div>
						</div>

						{/* RSVP Status Breakdown */}
						<div className="space-y-2 mb-4">
							<div className="flex justify-between items-center text-sm">
								<span
									className="text-white opacity-90"
									style={{ fontFamily: "var(--font-family-fredoka)" }}
								>
									Confirmed:
								</span>
								<span
									className="font-medium text-green-200"
									style={{ fontFamily: "var(--font-family-fredoka)" }}
								>
									{confirmedParties} party{confirmedParties !== 1 ? "ies" : ""},{" "}
									{confirmedGuests} guests
								</span>
							</div>
							<div className="flex justify-between items-center text-sm">
								<span
									className="text-white opacity-90"
									style={{ fontFamily: "var(--font-family-fredoka)" }}
								>
									Pending:
								</span>
								<span
									className="font-medium text-yellow-200"
									style={{ fontFamily: "var(--font-family-fredoka)" }}
								>
									{pendingParties} party{pendingParties !== 1 ? "ies" : ""},{" "}
									{pendingGuests} guests
								</span>
							</div>
							<div className="flex justify-between items-center text-sm">
								<span
									className="text-white opacity-90"
									style={{ fontFamily: "var(--font-family-fredoka)" }}
								>
									Declined:
								</span>
								<span
									className="font-medium text-red-200"
									style={{ fontFamily: "var(--font-family-fredoka)" }}
								>
									{declinedParties} part{declinedParties > 1 ? "ies" : "y"},{" "}
									{declinedGuests} guests
								</span>
							</div>
						</div>

						{/* Total People Count */}
						<div className="pt-3 border-t border-white border-opacity-30">
							<div className="flex justify-between items-center">
								<span
									className="text-sm text-white opacity-90"
									style={{ fontFamily: "var(--font-family-fredoka)" }}
								>
									Total People:
								</span>
								<span
									className="font-semibold text-white"
									style={{ fontFamily: "var(--font-family-fredoka)" }}
								>
									{totalPeople}
								</span>
							</div>
							{totalPlusOnes > 0 && (
								<div
									className="text-xs text-white opacity-80 mt-1"
									style={{ fontFamily: "var(--font-family-fredoka)" }}
								>
									(includes +1s)
								</div>
							)}
						</div>

						{/* Progress indicator */}
						<div className="mt-4">
							<div className="flex justify-between text-xs mb-1">
								<span
									className="text-white opacity-90"
									style={{ fontFamily: "var(--font-family-fredoka)" }}
								>
									RSVP Response Rate
								</span>
								<span
									className="text-white opacity-90"
									style={{ fontFamily: "var(--font-family-fredoka)" }}
								>
									{totalGuests > 0
										? Math.round(
												((confirmedParties + declinedParties) / totalGuests) *
													100
										  )
										: 0}
									%
								</span>
							</div>
							<div className="w-full bg-white bg-opacity-20 rounded-full h-2 border border-white border-opacity-30">
								<div
									className="h-2 rounded-full transition-all duration-300"
									style={{
										backgroundColor: theme.primaryColor,
										width: `${
											totalGuests > 0
												? ((confirmedParties + declinedParties) / totalGuests) *
												  100
												: 0
										}%`,
									}}
								/>
							</div>
						</div>
					</div>
				</div>
			</Link>
		);
	}

	// Professional mode (existing design)
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
							{confirmedParties} party{confirmedParties !== 1 ? "ies" : ""},{" "}
							{confirmedGuests} guests
						</span>
					</div>
					<div className="flex justify-between items-center text-sm">
						<span className="text-gray-600 dark:text-gray-400">Pending:</span>
						<span className="font-medium text-yellow-600 dark:text-yellow-500">
							{pendingParties} party{pendingParties !== 1 ? "ies" : ""},{" "}
							{pendingGuests} guests
						</span>
					</div>
					<div className="flex justify-between items-center text-sm">
						<span className="text-gray-600 dark:text-gray-400">Declined:</span>
						<span className="font-medium text-red-600 dark:text-red-500">
							{declinedParties} party{declinedParties !== 1 ? "ies" : ""},{" "}
							{declinedGuests} guests
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
										((confirmedParties + declinedParties) / totalGuests) * 100
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
										? ((confirmedParties + declinedParties) / totalGuests) * 100
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
