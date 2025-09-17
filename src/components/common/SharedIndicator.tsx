"use client";

import { useAppSelector } from "@/store/hooks";
import {
	selectShareByHolidayKey,
	selectMemberProfiles,
} from "@/store/slices/sharesSlice";

interface SharedIndicatorProps {
	holidayKey: string;
	className?: string;
}

export default function SharedIndicator({
	holidayKey,
	className = "",
}: SharedIndicatorProps) {
	const share = useAppSelector((state) =>
		selectShareByHolidayKey(state, holidayKey)
	);
	const memberProfiles = useAppSelector((state) =>
		share ? selectMemberProfiles(state, share.shareId) : []
	);

	if (!share) {
		return null;
	}

	return (
		<div className={`flex items-center gap-2 ${className}`}>
			{/* Shared pill */}
			<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
				<svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
					<path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
				Shared
			</span>

			{/* Member avatars */}
			<div className="flex -space-x-2">
				{memberProfiles.slice(0, 3).map((member: any, index: number) => (
					<div
						key={member.userId}
						className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center text-xs font-medium text-gray-700 dark:text-gray-300 border-2 border-white dark:border-gray-800 overflow-hidden"
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
				{memberProfiles.length > 3 && (
					<div
						className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-400 border-2 border-white dark:border-gray-800"
						title={`${memberProfiles.length - 3} more members`}
					>
						+{memberProfiles.length - 3}
					</div>
				)}
			</div>
		</div>
	);
}
