"use client";

import { useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { createShare } from "@/store/slices/sharesSlice";
import { createInvite } from "@/store/slices/invitesSlice";
import {
	selectShareByHolidayKey,
	selectIsUserInShare,
} from "@/store/slices/sharesSlice";
import FormModal from "../modals/FormModal";

interface InviteButtonProps {
	holidayKey: string;
	holidayName: string;
	className?: string;
}

export default function InviteButton({
	holidayKey,
	holidayName,
	className = "",
}: InviteButtonProps) {
	const { user } = useAuth0();
	const dispatch = useAppDispatch();
	const [showInviteModal, setShowInviteModal] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	// Get current user's share for this holiday
	const share = useAppSelector((state) =>
		selectShareByHolidayKey(state, holidayKey)
	);
	const isUserInShare = useAppSelector((state) =>
		share ? selectIsUserInShare(state, share.shareId, user?.sub || "") : false
	);

	const handleInviteClick = () => {
		setShowInviteModal(true);
	};

	const handleSendInvite = async (values: Record<string, any>) => {
		if (!user?.sub) return;

		setIsLoading(true);
		try {
			let currentShare = share;

			// If no share exists, create one
			if (!currentShare) {
				const shareResult = await dispatch(
					createShare({
						holidayKey,
						ownerUserId: user.sub,
						memberUserIds: [user.sub],
					})
				).unwrap();
				currentShare = shareResult;
			}

			// Create invite
			await dispatch(
				createInvite({
					shareId: currentShare.shareId,
					fromUserId: user.sub,
					toEmail: values.email,
					holidayKey,
					message: values.message || "",
				})
			).unwrap();

			setShowInviteModal(false);
			// Show success toast (you can implement this)
			console.log("Invite sent");
		} catch (error) {
			console.error("Failed to send invite:", error);
		} finally {
			setIsLoading(false);
		}
	};

	// Don't show invite button if user is not in the share
	if (share && !isUserInShare) {
		return null;
	}

	const inviteFields = [
		{
			id: "email",
			type: "email" as const,
			label: "Invite by email or user ID",
			placeholder: "Enter email address or user ID",
			required: true,
		},
		{
			id: "message",
			type: "textarea" as const,
			label: "Message (optional)",
			placeholder: "Add a personal message to your invite...",
			rows: 3,
		},
	];

	return (
		<>
			<button
				onClick={handleInviteClick}
				className={`px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors ${className}`}
				disabled={isLoading}
			>
				{isLoading ? "Sending..." : "Invite"}
			</button>

			<FormModal
				isOpen={showInviteModal}
				title="Share this holiday"
				fields={inviteFields}
				onSubmit={handleSendInvite}
				onClose={() => setShowInviteModal(false)}
				loading={isLoading}
				submitText="Send Invite"
				cancelText="Cancel"
			/>
		</>
	);
}
