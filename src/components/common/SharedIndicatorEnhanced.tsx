"use client";

import { useAppSelector } from "@/store/hooks";
import {
	selectShareByHolidayKey,
	ShareMember,
} from "@/store/slices/sharesSlice";
import { selectOutgoingInvites } from "@/store/slices/invitesSlice";
import { useAuth0 } from "@auth0/auth0-react";
import SharedUserList from "./SharedUserList";

interface SharedIndicatorEnhancedProps {
	holidayKey: string;
	className?: string;
	size?: "xs" | "sm" | "md" | "lg";
	maxVisibleMembers?: number;
	showLabel?: boolean;
}

export default function SharedIndicatorEnhanced({
	holidayKey,
	className = "",
	size = "sm",
	maxVisibleMembers = 2,
	showLabel = true,
}: SharedIndicatorEnhancedProps) {
	const { user } = useAuth0();
	const share = useAppSelector((state) =>
		selectShareByHolidayKey(state, holidayKey)
	);

	console.log('🔍 SharedIndicatorEnhanced Debug:', {
		holidayKey,
		share,
		hasShare: !!share,
		memberCount: share?.members?.length || share?.memberUserIds?.length || 0,
		shareHolidayKey: share?.holidayKey,
		keyMatch: share ? (share.holidayKey === holidayKey) : 'no share',
		members: share?.members || [],
		memberUserIds: share?.memberUserIds || []
	});

	if (!share) {
		console.log('❌ No share found for:', holidayKey);
		return null;
	}

	// Get members from the enhanced share data, fallback to memberUserIds for backward compatibility
	const members: ShareMember[] = share.members || 
		share.memberUserIds.map((userId: string) => ({
			userId,
			name: null,
			email: null,
			picture: null,
		}));

	console.log('👥 Members check:', {
		membersLength: members.length,
		members,
		willShow: members.length >= 1
	});

	// Show all shares that exist (even with just the owner)
	// This allows users to see shareable holidays and invite others
	if (members.length < 1) {
		console.log('⚠️ Not showing - no members found');
		return null;
	}

	console.log('✅ Rendering SharedIndicatorEnhanced with', members.length, 'members');

	return (
		<div className={`flex items-center gap-2 ${className}`}>
			{/* Shared label with icon */}
			{showLabel && (
				<span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border-2 ${
					members.length > 1 
						? "bg-green-500 text-white border-green-300" 
						: share.hasPendingInvites
							? "bg-blue-500 text-white border-blue-300"
							: "bg-gray-500 text-white border-gray-300"
				}`}>
					<svg
						className="w-2.5 h-2.5 mr-1"
						fill="currentColor"
						viewBox="0 0 20 20"
					>
						<path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
					{members.length > 1 
						? "Shared" 
						: share.hasPendingInvites 
							? "Invite Pending"
							: "Shareable"
					}
				</span>
			)}

			{/* User avatars list */}
			<SharedUserList
				members={members}
				maxVisible={maxVisibleMembers}
				size={size}
				showSharedIcon={!showLabel}
			/>

			{/* Member count info */}
			{members.length >= 1 && (
				<span className="text-xs text-white ml-1">
					{members.length} member{members.length !== 1 ? "s" : ""}
					{members.length === 1 && share.hasPendingInvites ? " (invite pending)" : ""}
				</span>
			)}
		</div>
	);
}