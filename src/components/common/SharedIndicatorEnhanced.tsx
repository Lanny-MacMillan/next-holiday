"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useAppSelector } from "@/store/hooks";
import {
	selectShareByHolidayKey,
	ShareMember,
} from "@/store/slices/sharesSlice";
import { selectOutgoingInvites } from "@/store/slices/invitesSlice";
import { useAuth0 } from "@auth0/auth0-react";
import SharedUserList from "./SharedUserList";
import UserAvatar from "./UserAvatar";

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
	maxVisibleMembers = 5,
	showLabel = true,
}: SharedIndicatorEnhancedProps) {
	const { user } = useAuth0();
	const [showMembersModal, setShowMembersModal] = useState(false);
	
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

	const handleContainerClick = (e: React.MouseEvent) => {
		e.stopPropagation();
		setShowMembersModal(true);
	};

	return (
		<>
			<button
				onClick={handleContainerClick}
				className={`flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity flex-row-reverse ${className}`}
				title="Click to view all shared members"
			>
				{/* Member count info - positioned on the right */}
				{members.length >= 1 && (
					<span className="text-xs text-white ml-1 flex-shrink-0">
						{members.length} member{members.length !== 1 ? "s" : ""}
						{members.length === 1 && share.hasPendingInvites ? " (invite pending)" : ""}
					</span>
				)}

				{/* User avatars list - will expand to the left */}
				<SharedUserList
					members={members}
					maxVisible={maxVisibleMembers}
					size={size}
					showSharedIcon={!showLabel}
					onOpenModal={() => setShowMembersModal(true)}
					className="flex-row-reverse"
				/>

				{/* Shared label with icon - positioned on the left */}
				{showLabel && (
					<span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border-2 flex-shrink-0 ${
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
			</button>

			{/* Members Modal */}
			{showMembersModal && typeof window !== "undefined" && createPortal(
				<div 
					className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]" 
					onClick={() => setShowMembersModal(false)}
				>
					<div 
						className="card rounded-lg p-4 sm:p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto" 
						onClick={(e) => e.stopPropagation()}
					>
						<div className="flex justify-between items-center mb-4">
							<h3 className="text-lg font-semibold text-gray-900 dark:text-white">
								Shared Members ({members.length})
							</h3>
							<button
								onClick={() => setShowMembersModal(false)}
								className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
							>
								<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						</div>
						<div className="space-y-3">
							{members.map((member) => (
								<div key={member.userId} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
									<UserAvatar
										userId={member.userId}
										name={member.name}
										email={member.email}
										picture={member.picture}
										size="md"
										showTooltip={false}
									/>
									<div className="flex-1 min-w-0">
										<p className="text-sm font-medium text-gray-900 dark:text-white truncate">
											{member.name || "Unknown User"}
										</p>
										{member.email && (
											<p className="text-xs text-gray-500 dark:text-gray-400 truncate">
												{member.email}
											</p>
										)}
										{member.joinedAt && (
											<p className="text-xs text-gray-400 dark:text-gray-500">
												Joined {new Date(member.joinedAt).toLocaleDateString()}
											</p>
										)}
									</div>
								</div>
							))}
						</div>
					</div>
				</div>,
				document.body
			)}
		</>
	);
}