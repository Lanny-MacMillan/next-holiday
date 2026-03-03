"use client";

import { useAuth0 } from "@auth0/auth0-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { updateSettings } from "@/store/slices/themeSlice";
import { updateUserPreferences } from "@/store/slices/userPreferencesSlice";
import { saveHolidayPreferences } from "@/store/slices/holidayPreferencesSlice";
import { setHomeData } from "@/store/slices/homeSlice";
import { useState, useEffect } from "react";
import Link from "next/link";
import HolidayDeleteConfirmationModal from "@/components/modals/HolidayDeleteConfirmationModal";
import CancelSubscriptionModal from "@/components/modals/CancelSubscriptionModal";
import UpgradeModal from "@/components/modals/UpgradeModal";

export default function SettingsPage() {
	const { user } = useAuth0();
	const dispatch = useAppDispatch();
	const { settings } = useAppSelector((state: any) => state.theme);
	const { preferences } = useAppSelector((state: any) => state.userPreferences);
	const { data: homeData } = useAppSelector((state: any) => state.home);
	const [localSettings, setLocalSettings] = useState(settings);
	const [localHolidayPreferences, setLocalHolidayPreferences] = useState<any[]>(
		[]
	);
	const [imageError, setImageError] = useState(false);

	// Cascade delete modal state
	const [deleteModalOpen, setDeleteModalOpen] = useState(false);
	const [holidayToDelete, setHolidayToDelete] = useState<{
		name: string;
		id: string;
	} | null>(null);

	// Subscription cancellation modal state
	const [cancelModalOpen, setCancelModalOpen] = useState(false);
	
	// Upgrade modal state
	const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
	
	// Get user subscription status from Redux
	const userState = useAppSelector((state) => state.user);
	const currentUser = userState?.user;

	// Reset image error when user changes
	useEffect(() => {
		setImageError(false);
	}, [user?.picture]);

	// Update local settings when preferences are loaded
	useEffect(() => {
		if (preferences) {
			setLocalSettings({
				...localSettings,
				theme: preferences.theme || settings.theme,
				displayMode: preferences.displayMode || settings.displayMode,
				notifications: {
					reminders:
						preferences.reminderNotifications ??
						settings.notifications.reminders,
					shippingAlerts:
						preferences.pushNotifications ??
						settings.notifications.shippingAlerts,
					upcomingEvents:
						preferences.holidayCountdownAlerts ??
						settings.notifications.upcomingEvents,
				},
			});
		}
	}, [preferences]);

	// Fetch home data if not already loaded
	useEffect(() => {
		async function fetchHomeData() {
			if (!user?.sub || homeData) return;

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
					// Dispatch to Redux store
					dispatch(setHomeData(data));
				}
			} catch (error) {
				console.error("Failed to fetch home data:", error);
			}
		}

		fetchHomeData();
	}, [user, homeData, dispatch]);

	// Update local holiday preferences when home data is loaded
	useEffect(() => {
		if (homeData?.holidayPreferences) {
			setLocalHolidayPreferences(homeData.holidayPreferences);
		}
	}, [homeData?.holidayPreferences]);

	function getInitials(name: string): string {
		const words = name
			.trim()
			.split(" ")
			.filter((word) => word.length > 0);
		if (words.length === 0) return "";
		if (words.length === 1) return words[0].charAt(0).toUpperCase();
		return (
			words[0].charAt(0) + words[words.length - 1].charAt(0)
		).toUpperCase();
	}

	const handleSettingChange = async (key: string, value: any) => {
		const newSettings = { ...localSettings };

		if (key.includes(".")) {
			const [parent, child] = key.split(".");
			newSettings[parent] = { ...newSettings[parent], [child]: value };
		} else {
			newSettings[key] = value;
		}

		setLocalSettings(newSettings);
		dispatch(updateSettings(newSettings));

		// Update database preferences
		if (user?.sub && preferences) {
			try {
				let preferencesData: any = {};

				if (key === "theme") {
					preferencesData.theme = value;
				} else if (key === "displayMode") {
					preferencesData.displayMode = value;
				} else if (key === "notifications.reminders") {
					preferencesData.reminderNotifications = value;
				} else if (key === "notifications.shippingAlerts") {
					preferencesData.pushNotifications = value;
				} else if (key === "notifications.upcomingEvents") {
					preferencesData.holidayCountdownAlerts = value;
				}

				if (Object.keys(preferencesData).length > 0) {
					await dispatch(
						updateUserPreferences({
							preferencesData,
							auth0Sub: user.sub,
						})
					).unwrap();
				}
			} catch (error) {
				console.error("Failed to update preferences in database:", error);
			}
		}
	};

	const handleHolidayPreferenceChange = async (
		holiday: string,
		isSelected: boolean,
		budget: number = 500
	) => {
		// If deselecting a holiday, show cascade delete confirmation
		if (!isSelected) {
			// Find the holiday ID from the existing preferences
			const existingPreference = localHolidayPreferences.find(
				(p) => p.holiday === holiday
			);

			if (existingPreference?.holidayId) {
				// Show cascade delete confirmation modal
				setHolidayToDelete({
					name: holiday,
					id: existingPreference.holidayId,
				});
				setDeleteModalOpen(true);
				return; // Don't proceed with normal deselection
			}
		}

		let newPreferences = [...localHolidayPreferences];

		if (isSelected) {
			// Add or update holiday preference
			const existingIndex = newPreferences.findIndex(
				(p) => p.holiday === holiday
			);
			if (existingIndex >= 0) {
				newPreferences[existingIndex] = {
					...newPreferences[existingIndex],
					budget,
				};
			} else {
				newPreferences.push({ holiday, budget });
			}
		} else {
			// Remove holiday preference (this should only happen for holidays without holidayId)
			newPreferences = newPreferences.filter((p) => p.holiday !== holiday);
		}

		setLocalHolidayPreferences(newPreferences);

		// Save to database
		if (user?.sub && homeData?.account?.id) {
			try {
				// Send only essential data - holiday type and budget
				const cleanPreferences = newPreferences.map(pref => ({
					holiday: pref.holiday,
					budget: pref.budget || 500
				}));
				
				await dispatch(
					saveHolidayPreferences({
						accountId: homeData.account.id,
						preferences: cleanPreferences,
						auth0User: user,
					})
				).unwrap();
			} catch (error) {
				console.error("Failed to save holiday preferences:", error);
			}
		}
	};

	const handleBudgetChange = async (holiday: string, newBudget: number) => {
		const newPreferences = localHolidayPreferences.map((pref) =>
			pref.holiday === holiday ? { ...pref, budget: newBudget } : pref
		);

		setLocalHolidayPreferences(newPreferences);

		// Save to database
		if (user?.sub && homeData?.account?.id) {
			try {
				// Send only essential data - holiday type and budget
				const cleanPreferences = newPreferences.map(pref => ({
					holiday: pref.holiday,
					budget: pref.budget || 500
				}));
				
				await dispatch(
					saveHolidayPreferences({
						accountId: homeData.account.id,
						preferences: cleanPreferences,
						auth0User: user,
					})
				).unwrap();
			} catch (error) {
				console.error("Failed to save holiday preferences:", error);
			}
		}
	};

	const handleSave = () => {
		dispatch(updateSettings(localSettings));
	};

	// Cascade delete modal handlers
	const handleDeleteModalClose = () => {
		setDeleteModalOpen(false);
		setHolidayToDelete(null);
	};

	const handleDeleteConfirm = async () => {
		// This function is called ONLY after the user has successfully confirmed
		// the deletion by typing the holiday name and clicking "Delete Holiday" 
		// in the modal. The cascade delete has completed successfully by this point.
		
		// Now remove the holiday from local preferences and save to database
		const newPreferences = localHolidayPreferences.filter(
			(p) => p.holiday !== holidayToDelete?.name
		);
		setLocalHolidayPreferences(newPreferences);

		// Save to database
		if (user?.sub && homeData?.account?.id) {
			try {
				// Send only essential data - holiday type and budget
				const cleanPreferences = newPreferences.map(pref => ({
					holiday: pref.holiday,
					budget: pref.budget || 500
				}));
				
				await dispatch(
					saveHolidayPreferences({
						accountId: homeData.account.id,
						preferences: cleanPreferences,
						auth0User: user,
					})
				).unwrap();
			} catch (error) {
				console.error(
					"Failed to save holiday preferences after deletion:",
					error
				);
			}
		}

		// Close the modal
		handleDeleteModalClose();
	};

	// Use preferences from database if available, otherwise fall back to local settings
	const currentTheme = preferences?.theme || localSettings.theme;
	const currentDisplayMode =
		preferences?.displayMode || localSettings.displayMode;
	const currentReminders =
		preferences?.reminderNotifications ?? localSettings.notifications.reminders;
	const currentShippingAlerts =
		preferences?.pushNotifications ??
		localSettings.notifications.shippingAlerts;
	const currentUpcomingEvents =
		preferences?.holidayCountdownAlerts ??
		localSettings.notifications.upcomingEvents;

	return (
		<div className="min-h-screen christmas-settings-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<header className="w-full max-w-2xl py-6 flex flex-col items-center relative">
				<Link
					href="/"
					className="absolute left-0 top-10 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
				>
					<svg
						className="w-6 h-6"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M15 19l-7-7 7-7"
						/>
					</svg>
				</Link>
				<h1 className="text-3xl font-bold mb-2 text-gray-800 dark:text-white">
					Settings
				</h1>
				<p className="text-center text-gray-800 dark:text-gray-400">
					Manage your account and preferences
				</p>
			</header>

			<main className="w-full max-w-2xl flex flex-col gap-8">
				{/* User Information */}
				<div className="card card-settings rounded-lg p-6">
					<h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
						👤 User Information
					</h2>
					<div className="space-y-4">
						<div className="flex items-center space-x-4">
							{user?.picture && !imageError ? (
								<img
									src={user.picture}
									alt="Profile"
									className="w-16 h-16 rounded-full"
									onError={() => setImageError(true)}
								/>
							) : (
								<div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
									<span className="text-blue-600 dark:text-blue-300 font-semibold text-lg">
										{getInitials(user?.name || "User")}
									</span>
								</div>
							)}
							<div>
								<p className="text-sm text-gray-800 dark:text-gray-400">
									Profile Picture
								</p>
							</div>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-800 dark:text-gray-300">
								Name
							</label>
							<p className="mt-1 text-sm text-gray-800 dark:text-white">
								{user?.name || "Not provided"}
							</p>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-800 dark:text-gray-300">
								Email
							</label>
							<p className="mt-1 text-sm text-gray-800 dark:text-white">
								{user?.email || "Not provided"}
							</p>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-800 dark:text-gray-300">
								User ID
							</label>
							<p className="mt-1 text-sm text-gray-800 dark:text-gray-400 font-mono">
								{user?.sub || "Not available"}
							</p>
						</div>
					</div>
				</div>

				{/* Subscription Management */}
				<div className="card card-settings rounded-lg p-6">
					<h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
						💎 Subscription
					</h2>
					<div className="space-y-4">
						{currentUser?.subscriptionPlan === "plus" ? (
							<>
								{/* Plus Member Status */}
								<div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4">
									<div className="flex items-center justify-between">
										<div>
											<div className="flex items-center gap-2">
												<span className="text-purple-600 dark:text-purple-400 font-semibold">
													✨ Plus Member
												</span>
											</div>
											<div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
												$2.99/month • Active subscription
											</div>
											{currentUser.subscriptionEndDate && (
												<div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
													Next billing: {new Date(currentUser.subscriptionEndDate).toLocaleDateString()}
												</div>
											)}
										</div>
										<button
											onClick={() => setCancelModalOpen(true)}
											className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium transition-colors duration-200"
										>
											Cancel Subscription
										</button>
									</div>
								</div>
								
								{/* Plus Benefits */}
								<div>
									<div className="text-sm font-medium text-gray-800 dark:text-gray-300 mb-2">
										Your Plus Benefits
									</div>
									<ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
										<li className="flex items-center gap-2">
											<span className="text-green-500">✓</span>
											Unlimited holiday invites
										</li>
										<li className="flex items-center gap-2">
											<span className="text-green-500">✓</span>
											Advanced sharing & collaboration
										</li>
										<li className="flex items-center gap-2">
											<span className="text-green-500">✓</span>
											Premium holiday templates
										</li>
										<li className="flex items-center gap-2">
											<span className="text-green-500">✓</span>
											Priority customer support
										</li>
									</ul>
								</div>
							</>
						) : (
							<>
								{/* Free Member Status */}
								<div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
									<div className="flex items-center justify-between">
										<div>
											<div className="flex items-center gap-2">
												<span className="text-gray-600 dark:text-gray-400 font-semibold">
													Free Member
												</span>
											</div>
											<div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
												Limited features available
											</div>
										</div>
									</div>
								</div>
								
								{/* Upgrade Prompt */}
								<div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/10 dark:to-blue-900/10 border border-purple-200 dark:border-purple-700 rounded-lg p-4">
									<div className="text-center">
										<div className="text-purple-600 dark:text-purple-400 font-semibold mb-1">
											Upgrade to Plus
										</div>
										<div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
											Get unlimited invites, premium templates, and more for just $2.99/month
										</div>
										<button 
											onClick={() => setUpgradeModalOpen(true)}
											className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 transition-opacity duration-200"
										>
											Upgrade Now
										</button>
									</div>
								</div>
							</>
						)}
					</div>
				</div>

				{/* Theme Settings */}
				<div className="card card-settings rounded-lg p-6">
					<h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
						🎨 Appearance
					</h2>
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<div>
								<label className="text-sm font-medium text-gray-800 dark:text-gray-300">
									Dark Mode
								</label>
								<p className="text-xs text-gray-800 dark:text-gray-400">
									Switch between light and dark themes
								</p>
							</div>
							<button
								onClick={() =>
									handleSettingChange(
										"theme",
										currentTheme === "light" ? "dark" : "light"
									)
								}
								className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
									currentTheme === "dark" ? "bg-blue-600" : "bg-gray-400"
								}`}
							>
								<span
									className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
										currentTheme === "dark" ? "translate-x-6" : "translate-x-1"
									}`}
								/>
							</button>
						</div>
						<div className="flex items-center justify-between">
							<div>
								<label className="text-sm font-medium text-gray-800 dark:text-gray-300">
									Display Mode
								</label>
								<p className="text-xs text-gray-800 dark:text-gray-400">
									Choose between professional and gamified card styles
								</p>
							</div>
							<button
								onClick={() =>
									handleSettingChange(
										"displayMode",
										currentDisplayMode === "professional"
											? "gamified"
											: "professional"
									)
								}
								className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
									currentDisplayMode === "gamified"
										? "bg-blue-600"
										: "bg-gray-400"
								}`}
							>
								<span
									className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
										currentDisplayMode === "gamified"
											? "translate-x-6"
											: "translate-x-1"
									}`}
								/>
							</button>
						</div>
					</div>
				</div>

				{/* Holiday Settings */}
				<div className="card card-settings rounded-lg p-6">
					<h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
						🎄 Holiday Preferences
					</h2>
					<div className="space-y-4">
						<div>
							<label className="block text-sm font-medium text-gray-800 dark:text-gray-300">
								Holiday Choices & Budgets
							</label>
							<p className="text-xs text-gray-800 dark:text-gray-400 mb-2">
								Select holidays and set individual budget limits
							</p>
							<div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto">
								{[
									"Christmas",
									"Hanukkah",
									"Kwanzaa",
									"New Year",
									"Valentine's Day",
									"Easter",
									"Thanksgiving",
									"Halloween",
									"Mother's Day",
									"Father's Day",
									"Birthday",
									"Anniversary",
									"Fourth of July",
									"Graduation",
									"Baby Shower",

								].map((holiday) => {
									const isSelected = localHolidayPreferences.some(
										(choice: { holiday: string; budget: number }) =>
											choice.holiday === holiday
									);
									const selectedChoice = localHolidayPreferences.find(
										(choice: { holiday: string; budget: number }) =>
											choice.holiday === holiday
									);
									const budget = selectedChoice?.budget || 500;

									return (
										<div
											key={holiday}
											className={`p-3 rounded border transition-colors ${
												isSelected
													? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
													: "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
											}`}
										>
											<div className="flex items-center justify-between">
												<div className="flex items-center space-x-3">
													<input
														type="checkbox"
														checked={isSelected}
														onChange={(e) => {
															handleHolidayPreferenceChange(
																holiday,
																e.target.checked,
																budget
															);
														}}
														className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
													/>
													<span className="text-sm font-medium text-gray-800 dark:text-white">
														{holiday}
													</span>
												</div>
												{isSelected && (
													<div className="flex items-center space-x-2">
														<span className="text-xs text-gray-600 dark:text-gray-400">
															Budget:
														</span>
														<input
															type="number"
															value={budget}
															onChange={(e) => {
																const newBudget = parseInt(e.target.value) || 0;
																handleBudgetChange(holiday, newBudget);
															}}
															className="w-20 text-xs rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white px-2 py-1"
															min="0"
															step="50"
														/>
														<span className="text-xs text-gray-600 dark:text-gray-400">
															$
														</span>
													</div>
												)}
											</div>
										</div>
									);
								})}
							</div>
						</div>
					</div>
				</div>

				{/* Notification Settings */}
				<div className="card card-settings rounded-lg p-6">
					<h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
						🔔 Notification Preferences
					</h2>
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<div>
								<label className="text-sm font-medium text-gray-800 dark:text-gray-300">
									Reminders
								</label>
								<p className="text-xs text-gray-800 dark:text-gray-400">
									Get reminded about upcoming tasks and events
								</p>
							</div>
							<button
								onClick={() =>
									handleSettingChange(
										"notifications.reminders",
										!currentReminders
									)
								}
								className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
									currentReminders ? "bg-blue-600" : "bg-gray-400"
								}`}
							>
								<span
									className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
										currentReminders ? "translate-x-6" : "translate-x-1"
									}`}
								/>
							</button>
						</div>
						<div className="flex items-center justify-between">
							<div>
								<label className="text-sm font-medium text-gray-800 dark:text-gray-300">
									Shipping Alerts
								</label>
								<p className="text-xs text-gray-800 dark:text-gray-400">
									Get notified about gift shipping status
								</p>
							</div>
							<button
								onClick={() =>
									handleSettingChange(
										"notifications.shippingAlerts",
										!currentShippingAlerts
									)
								}
								className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
									currentShippingAlerts ? "bg-blue-600" : "bg-gray-400"
								}`}
							>
								<span
									className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
										currentShippingAlerts ? "translate-x-6" : "translate-x-1"
									}`}
								/>
							</button>
						</div>
						<div className="flex items-center justify-between">
							<div>
								<label className="text-sm font-medium text-gray-800 dark:text-gray-300">
									Upcoming Events
								</label>
								<p className="text-xs text-gray-800 dark:text-gray-400">
									Get notified about upcoming holiday events
								</p>
							</div>
							<button
								onClick={() =>
									handleSettingChange(
										"notifications.upcomingEvents",
										!currentUpcomingEvents
									)
								}
								className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
									currentUpcomingEvents ? "bg-blue-600" : "bg-gray-400"
								}`}
							>
								<span
									className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
										currentUpcomingEvents ? "translate-x-6" : "translate-x-1"
									}`}
								/>
							</button>
						</div>
					</div>
				</div>

				{/* Save Button */}
				<div className="flex justify-center">
					<button
						onClick={handleSave}
						className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
					>
						Save Settings
					</button>
				</div>
			</main>

			{/* Cascade Delete Confirmation Modal */}
			{holidayToDelete && (
				<HolidayDeleteConfirmationModal
					isOpen={deleteModalOpen}
					onClose={handleDeleteModalClose}
					onConfirm={handleDeleteConfirm}
					holidayName={holidayToDelete.name}
					holidayId={holidayToDelete.id}
					accountId={homeData?.account?.id || ""}
				/>
			)}

			{/* Cancel Subscription Modal */}
			<CancelSubscriptionModal
				isOpen={cancelModalOpen}
				onClose={() => setCancelModalOpen(false)}
				onCancel={() => {
					// Refresh user data or show success message
					console.log("Subscription cancelled successfully");
				}}
			/>

			{/* Upgrade Modal */}
			<UpgradeModal
				isOpen={upgradeModalOpen}
				onClose={() => setUpgradeModalOpen(false)}
				onUpgrade={() => {
					// Refresh user data or show success message
					console.log("Upgrade successful!");
					// Could dispatch a refresh of user state here
				}}
			/>
		</div>
	);
}
