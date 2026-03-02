"use client";

import { useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { createShare, ShareMember } from "@/store/slices/sharesSlice";
import {
	createInvite,
	fetchOutgoingInvites,
} from "@/store/slices/invitesSlice";
import {
	selectShareByHolidayKey,
	selectIsUserInShare,
	selectIsOwnerByHolidayKey,
} from "@/store/slices/sharesSlice";
import FormModal from "../modals/FormModal";
import Toast from "./Toast";
import { createPortal } from "react-dom";

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
	const [toastMessage, setToastMessage] = useState("");
	const [showToast, setShowToast] = useState(false);
	const [toastType, setToastType] = useState<"success" | "error" | "info">("error");

	// Get current user's share for this holiday
	const share = useAppSelector((state) =>
		selectShareByHolidayKey(state, holidayKey),
	);
	const isUserInShare = useAppSelector((state) =>
		share ? selectIsUserInShare(state, share.shareId, user?.sub || "") : false,
	);
	const isUserOwner = useAppSelector((state) =>
		selectIsOwnerByHolidayKey(state, holidayKey, user?.sub || ""),
	);

	const handleInviteClick = () => {
		setShowInviteModal(true);
	};

	const handleSendInvite = async (values: Record<string, any>) => {
		if (!user?.sub) return;

		const inviteEmail = values.email.trim().toLowerCase();

		// Helper function to show toast messages
		const showToastMessage = (message: string, type: "success" | "error" | "info" = "error") => {
			// Close modal first, then show toast for better visibility
			setShowInviteModal(false);
			setTimeout(() => {
				setToastMessage(message);
				setToastType(type);
				setShowToast(true);
			}, 100); // Small delay to let modal close first
		};

		// Validation 1: Prevent self-invite by email
		if (user.email && inviteEmail === user.email.toLowerCase()) {
			showToastMessage("You cannot invite yourself!");
			return;
		}

		// Validation 2: Prevent self-invite by user ID (if they enter their Auth0 sub)
		if (inviteEmail === user.sub) {
			showToastMessage("You cannot invite yourself!");
			return;
		}

		// Validation 3: Prevent inviting existing members
		if (share?.members) {
			const existingMemberByEmail = share.members.find(
				(member: ShareMember) => member.email?.toLowerCase() === inviteEmail
			);
			if (existingMemberByEmail) {
				showToastMessage("This person is already a member of this holiday!");
				return;
			}

			// Also check by userId for Auth0 sub invitations
			const existingMemberByUserId = share.members.find(
				(member: ShareMember) => member.userId === inviteEmail
			);
			if (existingMemberByUserId) {
				showToastMessage("This person is already a member of this holiday!");
				return;
			}
		}

		// Additional fallback: Check against memberUserIds array for backward compatibility
		if (share?.memberUserIds) {
			if (share.memberUserIds.includes(inviteEmail)) {
				showToastMessage("This person is already a member of this holiday!");
				return;
			}
			if (share.memberUserIds.includes(user.sub)) {
				// Prevent inviting self via memberUserIds
				if (inviteEmail === user.sub) {
					showToastMessage("You cannot invite yourself!");
					return;
				}
			}
		}

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
					}),
				).unwrap();
				currentShare = shareResult;
			}

			// Create invite
			await dispatch(
				createInvite({
					shareId: currentShare.id || currentShare.shareId, // Handle both field names
					fromUserId: user.sub,
					toEmail: values.email,
					holidayKey,
					message: values.message || "",
				}),
			).unwrap();

			// Refetch outgoing invites to update the alerts bell
			await dispatch(fetchOutgoingInvites(user.sub));

			setShowInviteModal(false);
			// Show success toast
			showToastMessage(`Invite sent to ${values.email} successfully!`, "success");
		} catch (error) {
			console.error("Failed to send invite:", error);
			showToastMessage("Failed to send invite. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	// Only show invite button if user is the owner (or no share exists yet)
	if (!isUserOwner) {
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

			{/* Modern Toast Notifications - Rendered via Portal to escape parent containers */}
			{typeof window !== "undefined" && createPortal(
				<Toast
					message={toastMessage}
					isVisible={showToast}
					onClose={() => setShowToast(false)}
					type={toastType}
				/>,
				document.body
			)}
		</>
	);
}
