"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import {
	fetchInboxInvites,
	fetchOutgoingInvites,
	acceptInvite,
	declineInvite,
} from "@/store/slices/invitesSlice";
import { addShare, updateShareInState } from "@/store/slices/sharesSlice";
import { Invite } from "@/store/slices/invitesSlice";
import { migrateHolidayDataToShare } from "@/utils/shareMigration";
import { refreshHomeData } from "@/store/slices/homeSlice";

interface AlertsBellProps {
	className?: string;
}

export default function AlertsBell({ className = "" }: AlertsBellProps) {
	const { user } = useAuth0();
	const dispatch = useAppDispatch();
	const [showAlertsModal, setShowAlertsModal] = useState(false);
	const [activeTab, setActiveTab] = useState<"inbox" | "outgoing">("inbox");

	// Get invites from Redux state - simplified approach
	const allInvites = useAppSelector((state) => state.invites.invites);

	// Separate filtering functions for clarity
	const filterInboxInvites = (invite: any) => {
		return (
			invite.status === "pending" &&
			(invite.toEmail === user?.email || invite.toUserId === user?.sub)
		);
	};

	const filterOutgoingInvites = (invite: any) => {
		return (
			invite.fromUser?.email === user?.email && invite.status === "pending"
		);
	};

	const filterAllOutgoingInvites = (invite: any) => {
		return invite.fromUser?.email === user?.email;
	};

	// Apply filters
	const pendingInvites = allInvites.filter(filterInboxInvites);
	const outgoingInvites = allInvites.filter(filterOutgoingInvites);
	const allOutgoingInvites = allInvites.filter(filterAllOutgoingInvites);

	const pendingCount = pendingInvites.length;

	// Debug logging
	console.log("🔍 AlertsBell Debug:");
	console.log("  - user.email:", user?.email);
	console.log("  - user.sub:", user?.sub);
	console.log("  - allInvites count:", allInvites.length);
	console.log("  - allInvites:", allInvites);
	console.log("  - pendingInvites count:", pendingInvites.length);
	console.log("  - outgoingInvites count:", outgoingInvites.length);
	console.log("  - allOutgoingInvites count:", allOutgoingInvites.length);

	// Detailed invite structure logging
	allInvites.forEach((invite: any, index: number) => {
		console.log(`  📧 Invite ${index + 1}:`, {
			id: invite.id,
			status: invite.status,
			toEmail: invite.toEmail,
			toUserId: invite.toUserId,
			fromUser: invite.fromUser,
			fromUserId: invite.fromUserId,
			holidayKey: invite.holidayKey,
			message: invite.message,
		});
	});

	// Fetch invites when component mounts
	useEffect(() => {
		if (user?.sub) {
			dispatch(fetchInboxInvites(user.sub));
			dispatch(fetchOutgoingInvites(user.sub));
		}
	}, [user?.sub, dispatch]);

	// Helper function to refresh home data
	const refreshHomePageData = async () => {
		if (!user?.sub) return;

		try {
			const response = await fetch("/api/home", {
				headers: {
					"Content-Type": "application/json",
					"x-test-user": JSON.stringify({
						sub: user.sub,
						email: user.email,
						name: user.name,
						picture: user.picture,
					}),
				},
			});

			if (response.ok) {
				const result = await response.json();
				const data = result.data;
				dispatch(refreshHomeData(data));
			}
		} catch (error) {
			console.error("Failed to refresh home data:", error);
		}
	};

	const handleAcceptInvite = async (inviteId: string) => {
		try {
			const result = await dispatch(acceptInvite(inviteId)).unwrap();

			// Add the share to our state
			dispatch(addShare(result.share));

			// Migrate existing holiday data to the share
			await migrateHolidayDataToShare(
				result.invite.holidayKey,
				result.share.shareId,
				dispatch
			);

			// Refresh home data to reflect the newly shared holiday
			await refreshHomePageData();

			console.log("You're now sharing this holiday");
		} catch (error) {
			console.error("Failed to accept invite:", error);
		}
	};

	const handleDeclineInvite = async (inviteId: string) => {
		try {
			await dispatch(declineInvite(inviteId)).unwrap();
			console.log("Invite declined");
		} catch (error) {
			console.error("Failed to decline invite:", error);
		}
	};

	const getHolidayDisplayName = (holidayKey: string) => {
		const holidayMap: Record<string, string> = {
			christmas: "Christmas",
			thanksgiving: "Thanksgiving",
			halloween: "Halloween",
			easter: "Easter",
			valentines: "Valentine's Day",
			"new-year": "New Year",
			birthday: "Birthday",
			anniversary: "Anniversary",
			graduation: "Graduation",
			"baby-shower": "Baby Shower",
			"mothers-day": "Mother's Day",
			"fathers-day": "Father's Day",
			"fourth-of-july": "Fourth of July",
			hanukkah: "Hanukkah",
			kwanzaa: "Kwanzaa",
		};
		return holidayMap[holidayKey] || holidayKey;
	};

	const getStatusBadge = (status: string) => {
		const statusConfig = {
			pending: { text: "Pending", className: "bg-yellow-100 text-yellow-800" },
			accepted: { text: "Accepted", className: "bg-green-100 text-green-800" },
			declined: { text: "Declined", className: "bg-red-100 text-red-800" },
			expired: { text: "Expired", className: "bg-gray-100 text-gray-800" },
		};

		const config =
			statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
		return (
			<span
				className={`px-2 py-1 text-xs font-medium rounded-full ${config.className}`}
			>
				{config.text}
			</span>
		);
	};

	return (
		<>
			<button
				onClick={() => setShowAlertsModal(true)}
				className={`relative p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors ${className}`}
			>
				<svg
					className="h-6 w-6"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
					/>
				</svg>

				{/* Badge for pending invites */}
				{pendingInvites.length > 0 && (
					<span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
						{pendingInvites.length}
					</span>
				)}
			</button>

			{/* Alerts Modal */}
			{showAlertsModal &&
				createPortal(
					<div
						className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4"
						onClick={(e) => {
							if (e.target === e.currentTarget) {
								setShowAlertsModal(false);
							}
						}}
					>
						<div className="card rounded-lg p-4 sm:p-6 max-w-lg mx-auto w-full max-h-[90vh] overflow-y-auto">
							<div className="flex justify-between items-center mb-3 sm:mb-4">
								<h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
									Invites & Alerts
								</h3>
								<button
									onClick={() => setShowAlertsModal(false)}
									className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 text-lg sm:text-xl"
								>
									×
								</button>
							</div>

							{/* Tabs */}
							<div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
								<button
									onClick={() => setActiveTab("inbox")}
									className={`px-4 py-2 text-sm font-medium ${
										activeTab === "inbox"
											? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
											: "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
									}`}
								>
									Inbox ({pendingInvites.length})
								</button>
								<button
									onClick={() => setActiveTab("outgoing")}
									className={`px-4 py-2 text-sm font-medium ${
										activeTab === "outgoing"
											? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
											: "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
									}`}
								>
									Outgoing ({allOutgoingInvites.length})
								</button>
							</div>

							{/* Content */}
							<div className="max-h-96 overflow-y-auto">
								{activeTab === "inbox" && (
									<div className="space-y-3">
										{pendingInvites.length === 0 ? (
											<p className="text-gray-500 dark:text-gray-400 text-center py-4">
												No pending invites
											</p>
										) : (
											pendingInvites.map((invite: Invite) => (
												<div
													key={invite.id}
													className="border border-gray-200 dark:border-gray-700 rounded-lg p-3"
												>
													<div className="flex justify-between items-start mb-2">
														<div className="flex-1">
															<p className="text-sm font-medium text-gray-900 dark:text-white">
																{invite.fromUser?.name ||
																	invite.fromUser?.email ||
																	"Unknown User"}{" "}
																wants to share{" "}
																{getHolidayDisplayName(invite.holidayKey)}
															</p>
															{invite.message && (
																<p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
																	"{invite.message}"
																</p>
															)}
														</div>
													</div>
													<div className="flex space-x-2">
														<button
															onClick={() => handleAcceptInvite(invite.id)}
															className="px-3 py-1 text-xs rounded transition-all duration-200 font-medium invite-accept-btn"
														>
															Accept
														</button>
														<button
															onClick={() => handleDeclineInvite(invite.id)}
															className="px-3 py-1 text-xs rounded transition-all duration-200 font-medium invite-decline-btn"
														>
															Decline
														</button>
													</div>
												</div>
											))
										)}
									</div>
								)}

								{activeTab === "outgoing" && (
									<div className="space-y-3">
										{outgoingInvites.length === 0 ? (
											<p className="text-gray-500 dark:text-gray-400 text-center py-4">
												{allOutgoingInvites.length === 0
													? "No outgoing invites"
													: "No pending outgoing invites"}
											</p>
										) : (
											outgoingInvites.map((invite: Invite) => (
												<div
													key={invite.id}
													className="border border-gray-200 dark:border-gray-700 rounded-lg p-3"
												>
													<div className="flex justify-between items-start mb-2">
														<div className="flex-1">
															<p className="text-sm font-medium text-gray-900 dark:text-white">
																Invite to {invite.toEmail || "User"} for{" "}
																{getHolidayDisplayName(invite.holidayKey)}
															</p>
															{invite.message && (
																<p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
																	"{invite.message}"
																</p>
															)}
														</div>
														{getStatusBadge(invite.status)}
													</div>
												</div>
											))
										)}
									</div>
								)}
							</div>

							{/* Action Buttons */}
							<div className="flex gap-3 pt-2">
								<button
									type="button"
									onClick={() => setShowAlertsModal(false)}
									className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm sm:text-base text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
								>
									Close
								</button>
							</div>
						</div>
					</div>,
					document.body
				)}
		</>
	);
}
