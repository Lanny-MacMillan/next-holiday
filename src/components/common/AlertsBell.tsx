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
import { selectHolidayPreferences } from "@/store/selectors/home";

interface AlertsBellProps {
	className?: string;
}

export default function AlertsBell({ className = "" }: AlertsBellProps) {
	const { user } = useAuth0();
	const dispatch = useAppDispatch();
	const [showAlertsModal, setShowAlertsModal] = useState(false);
	const [activeTab, setActiveTab] = useState<"inbox" | "outgoing">("inbox");
	const [confirmInvite, setConfirmInvite] = useState<{
		invite: Invite;
		hasExistingHoliday: boolean;
	} | null>(null);

	// Get invites from Redux state - simplified approach
	const allInvites = useAppSelector((state) => state.invites.invites);
	const holidayPreferences = useAppSelector(selectHolidayPreferences);

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

	const filterDeclinedOutgoingInvites = (invite: any) => {
		return (
			invite.fromUser?.email === user?.email && invite.status === "declined"
		);
	};

	// Apply filters
	const pendingInvites = allInvites.filter(filterInboxInvites);
	const outgoingInvites = allInvites.filter(filterOutgoingInvites);
	const allOutgoingInvites = allInvites.filter(filterAllOutgoingInvites);
	const declinedOutgoingInvites = allInvites.filter(
		filterDeclinedOutgoingInvites,
	);

	const pendingCount = pendingInvites.length;
	const alertCount = pendingCount + declinedOutgoingInvites.length;

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

	// Helper to check if user already has this holiday
	const checkExistingHoliday = (holidayKey: string): boolean => {
		const holidayDisplayName = getHolidayDisplayName(holidayKey);
		return holidayPreferences.some(
			(pref) => pref.holiday === holidayDisplayName,
		);
	};

	// Handle accept button click - check for existing holiday first
	const handleAcceptClick = (invite: Invite) => {
		const hasExisting = checkExistingHoliday(invite.holidayKey);
		setConfirmInvite({ invite, hasExistingHoliday: hasExisting });
	};

	// Actually accept the invite after confirmation
	const handleConfirmAccept = async (deleteExisting: boolean = false) => {
		if (!confirmInvite) return;

		try {
			// If user chose to delete their existing data, do that first
			if (deleteExisting && confirmInvite.hasExistingHoliday) {
				const holidayDisplayName = getHolidayDisplayName(
					confirmInvite.invite.holidayKey,
				);

				// Find the user's existing holiday for this type
				const existingHoliday = holidayPreferences.find(
					(pref) => pref.holiday === holidayDisplayName,
				);

				if (existingHoliday?.holidayId) {
					console.log("Deleting existing holiday:", existingHoliday.holidayId);

					// Call the delete API
					const deleteResponse = await fetch(
						`/api/holidays/${existingHoliday.holidayId}`,
						{
							method: "DELETE",
							headers: {
								"Content-Type": "application/json",
								"x-test-user": JSON.stringify({
									sub: user?.sub,
									email: user?.email,
									name: user?.name,
									picture: user?.picture,
								}),
							},
						},
					);

					if (!deleteResponse.ok) {
						throw new Error("Failed to delete existing holiday");
					}

					console.log("Existing holiday deleted successfully");
				}
			}

			// Now accept the invite
			const result = await dispatch(
				acceptInvite({ inviteId: confirmInvite.invite.id, auth0User: user }),
			).unwrap();

			// Add the share to our state
			dispatch(addShare(result.share));

			// Migrate existing holiday data to the share (currently a placeholder)
			await migrateHolidayDataToShare(
				result.invite.holidayKey,
				result.share.shareId,
				dispatch,
			);

			setConfirmInvite(null);
			console.log("You're now sharing this holiday");

			// Reload the page to refresh all data
			window.location.reload();
		} catch (error) {
			console.error("Failed to accept invite:", error);
			alert("Failed to accept invite. Please try again.");
		}
	};

	const handleAcceptInvite = async (inviteId: string) => {
		try {
			const result = await dispatch(
				acceptInvite({ inviteId, auth0User: user }),
			).unwrap();

			// Add the share to our state
			dispatch(addShare(result.share));

			// Migrate existing holiday data to the share
			await migrateHolidayDataToShare(
				result.invite.holidayKey,
				result.share.shareId,
				dispatch,
			);

			console.log("You're now sharing this holiday");
		} catch (error) {
			console.error("Failed to accept invite:", error);
		}
	};

	const handleDeclineInvite = async (inviteId: string) => {
		try {
			await dispatch(declineInvite({ inviteId, auth0User: user })).unwrap();
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

				{/* Badge for pending invites and declined outgoing invites */}
				{alertCount > 0 && (
					<span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
						{alertCount}
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
									className={`px-4 py-2 text-sm font-medium relative ${
										activeTab === "outgoing"
											? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
											: "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
									}`}
								>
									Outgoing ({allOutgoingInvites.length})
									{declinedOutgoingInvites.length > 0 && (
										<span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
											{declinedOutgoingInvites.length}
										</span>
									)}
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
															onClick={() => handleAcceptClick(invite)}
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
									<div className="space-y-4">
										{/* Declined Invites Section - Show First */}
										{declinedOutgoingInvites.length > 0 && (
											<div>
												<h4 className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase mb-2 flex items-center">
													<svg
														className="w-4 h-4 mr-1"
														fill="none"
														viewBox="0 0 24 24"
														stroke="currentColor"
													>
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															strokeWidth={2}
															d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
														/>
													</svg>
													Declined ({declinedOutgoingInvites.length})
												</h4>
												<div className="space-y-3">
													{declinedOutgoingInvites.map((invite: Invite) => (
														<div
															key={invite.id}
															className="border-2 border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 rounded-lg p-3"
														>
															<div className="flex justify-between items-start mb-2">
																<div className="flex-1">
																	<p className="text-sm font-medium text-gray-900 dark:text-white">
																		<span className="text-red-600 dark:text-red-400">
																			❌
																		</span>{" "}
																		{invite.toEmail || "User"} declined your
																		invite
																	</p>
																	<p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
																		Holiday:{" "}
																		{getHolidayDisplayName(invite.holidayKey)}
																	</p>
																	{invite.message && (
																		<p className="text-xs text-gray-600 dark:text-gray-400 mt-1 italic">
																			Your message: "{invite.message}"
																		</p>
																	)}
																</div>
																{getStatusBadge(invite.status)}
															</div>
														</div>
													))}
												</div>
											</div>
										)}

										{/* Pending Outgoing Invites */}
										{outgoingInvites.length > 0 && (
											<div>
												{declinedOutgoingInvites.length > 0 && (
													<h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase mb-2">
														Pending ({outgoingInvites.length})
													</h4>
												)}
												<div className="space-y-3">
													{outgoingInvites.map((invite: Invite) => (
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
													))}
												</div>
											</div>
										)}

										{/* Empty State */}
										{outgoingInvites.length === 0 &&
											declinedOutgoingInvites.length === 0 && (
												<p className="text-gray-500 dark:text-gray-400 text-center py-4">
													{allOutgoingInvites.length === 0
														? "No outgoing invites"
														: "No pending or declined invites"}
												</p>
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
					document.body,
				)}

			{/* Confirmation Modal for Accepting Invite */}
			{confirmInvite &&
				createPortal(
					<div
						className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-3 sm:p-4"
						onClick={(e) => {
							if (e.target === e.currentTarget) {
								setConfirmInvite(null);
							}
						}}
					>
						<div className="card rounded-lg p-4 sm:p-6 max-w-md mx-auto w-full">
							<div className="flex justify-between items-center mb-3 sm:mb-4">
								<h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
									{confirmInvite.hasExistingHoliday
										? "Replace Existing Holiday?"
										: "Accept Invite?"}
								</h3>
								<button
									onClick={() => setConfirmInvite(null)}
									className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 text-lg sm:text-xl"
								>
									×
								</button>
							</div>

							<div className="mb-4">
								<p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
									{confirmInvite.hasExistingHoliday ? (
										<>
											You already have{" "}
											<strong>
												{getHolidayDisplayName(confirmInvite.invite.holidayKey)}
											</strong>{" "}
											with your own data (tasks, gifts, etc.).
										</>
									) : (
										<>
											Accept the invite to share{" "}
											<strong>
												{getHolidayDisplayName(confirmInvite.invite.holidayKey)}
											</strong>{" "}
											with{" "}
											<strong>
												{confirmInvite.invite.fromUser?.name ||
													confirmInvite.invite.fromUser?.email}
											</strong>
											?
										</>
									)}
								</p>

								{confirmInvite.hasExistingHoliday && (
									<div className="bg-gray-400 dark:bg-gray-400/30 border border-gray-700 dark:border-gray-700 rounded-lg p-4 mb-3">
										<p className="text-sm text-yellow-900 dark:text-yellow-100 font-semibold mb-3">
											⚠️ Choose what to do:
										</p>
										<div className="space-y-2">
											<div className="text-sm text-yellow-900 dark:text-yellow-100">
												<strong>Accept & Replace:</strong>
												<p className="ml-4 mt-1 text-yellow-800 dark:text-yellow-200">
													Your current holiday data will be deleted and you'll
													use the shared holiday
												</p>
											</div>
											<div className="text-sm text-yellow-900 dark:text-yellow-100">
												<strong>Decline:</strong>
												<p className="ml-4 mt-1 text-yellow-800 dark:text-yellow-200">
													Keep your own holiday and don't join the share
												</p>
											</div>
										</div>
									</div>
								)}
							</div>

							<div className="flex flex-col gap-2">
								{confirmInvite.hasExistingHoliday ? (
									<>
										<button
											onClick={() => handleConfirmAccept(true)}
											className="w-full px-4 py-2 bg-green-700 hover:brightness-75 dark:bg-green-700 dark:hover:brightness-75 text-white rounded transition-colors font-medium text-sm shadow-sm"
										>
											Accept & Replace My Data
										</button>
										<button
											onClick={async () => {
												await handleDeclineInvite(confirmInvite.invite.id);
												setConfirmInvite(null);
											}}
											className="w-full px-4 py-2 bg-red-600 hover:brightness-75 dark:bg-red-600 dark:hover:brightness-75 text-white rounded transition-all font-medium text-sm shadow-sm"
										>
											Decline
										</button>
										<button
											onClick={() => setConfirmInvite(null)}
											className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium"
										>
											Cancel
										</button>
									</>
								) : (
									<>
										<button
											onClick={() => handleConfirmAccept(false)}
											className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-white rounded transition-colors font-medium text-sm shadow-sm"
										>
											Accept Invite
										</button>
										<button
											onClick={() => setConfirmInvite(null)}
											className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
										>
											Cancel
										</button>
									</>
								)}
							</div>
						</div>
					</div>,
					document.body,
				)}
		</>
	);
}
