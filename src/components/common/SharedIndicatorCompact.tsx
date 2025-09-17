"use client";

import { useAppSelector } from "@/store/hooks";
import {
	selectShareByHolidayKey,
	selectMemberProfiles,
} from "@/store/slices/sharesSlice";
import { createSelector } from "@reduxjs/toolkit";

interface SharedIndicatorCompactProps {
	holidayKey: string;
	className?: string;
}

// Create a memoized selector that handles the conditional logic for member profiles
const selectMemberProfilesForDisplay = createSelector(
	[
		(state: any, holidayKey: string) =>
			selectShareByHolidayKey(state, holidayKey),
		(state: any, holidayKey: string) => state,
	],
	(share, state) => {
		if (share) {
			return selectMemberProfiles(state, share.shareId);
		}
		return [];
	}
);

export default function SharedIndicatorCompact({
	holidayKey,
	className = "",
}: SharedIndicatorCompactProps) {
	console.log(
		"[SharedIndicatorCompact] Component rendered with holidayKey:",
		holidayKey
	);
	const share = useAppSelector((state) =>
		selectShareByHolidayKey(state, holidayKey)
	);
	const memberProfiles = useAppSelector((state) =>
		selectMemberProfilesForDisplay(state, holidayKey)
	);

	// Debug logging
	console.log("[SharedIndicatorCompact] holidayKey:", holidayKey);
	console.log("[SharedIndicatorCompact] share:", share);
	console.log("[SharedIndicatorCompact] memberProfiles:", memberProfiles);

	// Check shares state
	const sharesState = useAppSelector((state: any) => state.shares);
	console.log("[SharedIndicatorCompact] shares state:", sharesState);

	// Check if there are any shares at all
	const allShares = useAppSelector((state: any) => state.shares.shares);
	console.log("[SharedIndicatorCompact] all shares:", allShares);

	// Check if any share matches this holiday key
	const matchingShares = allShares.filter(
		(s: any) => s.holidayKey === holidayKey
	);
	console.log(
		"[SharedIndicatorCompact] matching shares for",
		holidayKey,
		":",
		matchingShares
	);

	if (!share) {
		console.log(
			"[SharedIndicatorCompact] No share found for holidayKey:",
			holidayKey
		);
		return null;
	}

	return (
		<div className={`flex items-center gap-1 ${className}`}>
			{/* Compact shared pill */}
			<span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
				<svg
					className="w-2.5 h-2.5 mr-0.5"
					fill="currentColor"
					viewBox="0 0 20 20"
				>
					<path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
				Shared
			</span>

			{/* Compact member avatars */}
			<div className="flex -space-x-1">
				{memberProfiles.slice(0, 2).map((member: any, index: number) => (
					<div
						key={member.userId}
						className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center text-xs font-medium text-gray-700 dark:text-gray-300 border border-white dark:border-gray-800 overflow-hidden"
						title={
							member.user.name || member.user.email || `Member ${index + 1}`
						}
					>
						{member.user.picture ? (
							<img
								src={member.user.picture}
								alt={
									member.user.name || member.user.email || `Member ${index + 1}`
								}
								className="w-full h-full object-cover rounded-full"
							/>
						) : (
							(member.user.name || member.user.email || member.userId)
								.charAt(0)
								.toUpperCase()
						)}
					</div>
				))}
				{memberProfiles.length > 2 && (
					<div
						className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-400 border border-white dark:border-gray-800"
						title={`${memberProfiles.length - 2} more members`}
					>
						+{memberProfiles.length - 2}
					</div>
				)}
			</div>
		</div>
	);
}
