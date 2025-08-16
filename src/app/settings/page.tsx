"use client";

import { useAuth0 } from "@auth0/auth0-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { updateSettings } from "@/store/slices/themeSlice";
import { updateUserInfo } from "@/store/slices/userSlice";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Toast from "@/components/common/Toast";
import { getCardStyling } from "@/utils/cardShadows";
import UpgradeModal from "@/components/modals/UpgradeModal";

export default function SettingsPage() {
	const { user: auth0User } = useAuth0();
	const dispatch = useAppDispatch();
	const { settings } = useAppSelector((state: any) => state.theme);
	const {
		user: reduxUser,
		initialized: userInitialized,
		loading: userLoading,
	} = useAppSelector((state: any) => state.user);
	const [localSettings, setLocalSettings] = useState(settings);
	const [imageError, setImageError] = useState(false);
	const [showToast, setShowToast] = useState(false);
	const [toastMessage, setToastMessage] = useState("");
	const [toastType, setToastType] = useState<"success" | "error">("success");
	const [showUpgradeModal, setShowUpgradeModal] = useState(false);

	// Use Redux user data if available, otherwise fall back to Auth0
	const user = reduxUser || auth0User;

	// Editing states
	const [editingName, setEditingName] = useState(false);
	const [editingPicture, setEditingPicture] = useState(false);
	const [tempName, setTempName] = useState(user?.name || "");
	const [tempPicture, setTempPicture] = useState(user?.picture || "");
	const [savingName, setSavingName] = useState(false);
	const [savingPicture, setSavingPicture] = useState(false);

	// File input ref for image upload
	const fileInputRef = useRef<HTMLInputElement>(null);

	// Sync localSettings with Redux store when settings change
	useEffect(() => {
		setLocalSettings(settings);
	}, [settings]);

	// Reset image error when user changes
	useEffect(() => {
		setImageError(false);
	}, [user?.picture]);

	// Update temp values when user changes
	useEffect(() => {
		setTempName(user?.name || "");
		setTempPicture(user?.picture || "");
	}, [user]);

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

	const handleSettingChange = (key: string, value: any) => {
		const newSettings = { ...localSettings };

		if (key.includes(".")) {
			const [parent, child] = key.split(".");
			newSettings[parent] = { ...newSettings[parent], [child]: value };
		} else {
			newSettings[key] = value;
		}

		setLocalSettings(newSettings);
		dispatch(updateSettings(newSettings));
	};

	const handleSave = () => {
		dispatch(updateSettings(localSettings));
		setToastMessage("Settings saved successfully!");
		setToastType("success");
		setShowToast(true);
	};

	const handleUpgrade = () => {
		// TODO: Implement upgrade logic
		console.log("Upgrade clicked");
		setShowUpgradeModal(false);
	};

	// User editing handlers
	const handleSaveName = async () => {
		if (tempName.trim() && tempName !== user?.name) {
			setSavingName(true);
			try {
				const result = await dispatch(
					updateUserInfo({ name: tempName.trim(), auth0Sub: user?.sub || "" })
				).unwrap();
				// Only update local state and show toast if the API call was successful
				setTempName(tempName.trim());
				setToastMessage("Name updated successfully!");
				setToastType("success");
				setShowToast(true);
				console.log("Name updated successfully:", result);
			} catch (error) {
				console.error("Failed to update name:", error);
				// Reset temp name to original value if update failed
				setTempName(user?.name || "");
				setToastMessage("Failed to update name. Please try again.");
				setToastType("error");
				setShowToast(true);
			} finally {
				setSavingName(false);
			}
		}
		setEditingName(false);
	};

	const handleSavePicture = async () => {
		if (tempPicture && tempPicture !== user?.picture) {
			setSavingPicture(true);
			try {
				const result = await dispatch(
					updateUserInfo({ picture: tempPicture, auth0Sub: user?.sub || "" })
				).unwrap();
				// Only update local state and show toast if the API call was successful
				setTempPicture(tempPicture);
				setToastMessage("Profile picture updated successfully!");
				setToastType("success");
				setShowToast(true);
				console.log("Picture updated successfully:", result);
			} catch (error) {
				console.error("Failed to update picture:", error);
				// Reset temp picture to original value if update failed
				setTempPicture(user?.picture || "");
				setToastMessage("Failed to update profile picture. Please try again.");
				setToastType("error");
				setShowToast(true);
			} finally {
				setSavingPicture(false);
			}
		}
		setEditingPicture(false);
	};

	const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = (e) => {
				const result = e.target?.result as string;
				setTempPicture(result);
			};
			reader.readAsDataURL(file);
		}
	};

	const handleCancelEdit = (field: "name" | "picture") => {
		switch (field) {
			case "name":
				setTempName(user?.name || "");
				setEditingName(false);
				break;
			case "picture":
				setTempPicture(user?.picture || "");
				setEditingPicture(false);
				break;
		}
	};

	// Check if gamified mode is enabled
	const isGamified = localSettings.displayMode === "gamified";
	const isDarkMode = localSettings.theme === "dark";

	// Get gamified styling for cards
	const getGamifiedCardStyle = () => {
		if (!isGamified) return {};

		return getCardStyling({
			isDarkMode,
			isGamified: true,
			intensity: "heavy",
		});
	};

	// Get conditional card classes based on gamified mode
	const getCardClasses = () => {
		const baseClasses = "card rounded-lg p-6";

		if (isGamified) {
			// In gamified mode, use white border for dark mode, same as professional for light mode
			if (isDarkMode) {
				return `${baseClasses} border-l-4 border-white`;
			} else {
				return `${baseClasses} card-settings`;
			}
		} else {
			// Professional mode - use existing card-settings class
			return `${baseClasses} card-settings`;
		}
	};
	// Show loading state while user data is being initialized
	if (!userInitialized) {
		return (
			<div className="min-h-screen christmas-settings-gradient flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
					<p className="text-gray-600 dark:text-gray-300">
						Loading user data...
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen christmas-settings-gradient flex flex-col font-sans">
			{/* Main Content */}
			<div className="flex flex-col items-center p-4 sm:p-8 flex-1">
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
					<div className={getCardClasses()} style={getGamifiedCardStyle()}>
						<h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
							👤 User Information
						</h2>
						<div className="space-y-4">
							<div className="flex items-center space-x-4">
								<div className="relative">
									{editingPicture ? (
										<div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0 border-2 border-blue-500">
											<input
												ref={fileInputRef}
												type="file"
												accept="image/*"
												onChange={handleImageUpload}
												className="hidden"
											/>
											<button
												onClick={() => fileInputRef.current?.click()}
												className="text-blue-600 dark:text-blue-300 text-xs text-center"
											>
												Click to upload
											</button>
										</div>
									) : (
										<>
											{tempPicture && !imageError ? (
												<img
													src={tempPicture}
													alt="Profile"
													className="w-16 h-16 rounded-full"
													onError={() => setImageError(true)}
												/>
											) : (
												<div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
													<span className="text-blue-600 dark:text-blue-300 font-semibold text-lg">
														{getInitials(tempName || user?.name || "User")}
													</span>
												</div>
											)}
										</>
									)}
									<button
										onClick={() => setEditingPicture(!editingPicture)}
										className="absolute -top-1 -right-1 p-1 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
									>
										<svg
											className="w-3 h-3"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
											/>
										</svg>
									</button>
								</div>
								<div className="flex-1">
									<p className="text-sm text-gray-800 dark:text-gray-400">
										Profile Picture
									</p>
									{editingPicture && (
										<div className="flex space-x-2 mt-2">
											<button
												onClick={handleSavePicture}
												disabled={savingPicture}
												className={`px-3 py-1 text-xs bg-blue-500 text-white rounded transition-colors ${
													savingPicture
														? "opacity-50 cursor-not-allowed"
														: "hover:bg-blue-600"
												}`}
											>
												{savingPicture ? "Saving..." : "Save"}
											</button>
											<button
												onClick={() => handleCancelEdit("picture")}
												className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
											>
												Cancel
											</button>
										</div>
									)}
								</div>
							</div>
							<div>
								<div className="flex items-center justify-between">
									<label className="block text-sm font-medium text-gray-800 dark:text-gray-300">
										Name
									</label>
									<button
										onClick={() => setEditingName(!editingName)}
										className="p-1 text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
									>
										<svg
											className="w-4 h-4"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
											/>
										</svg>
									</button>
								</div>
								{editingName ? (
									<div className="mt-1">
										<div className="flex space-x-2">
											<input
												type="text"
												value={tempName}
												onChange={(e) => setTempName(e.target.value)}
												className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
												placeholder="Enter your name"
											/>
											<button
												onClick={handleSaveName}
												disabled={savingName}
												className={`px-4 py-2 text-sm bg-blue-500 text-white rounded transition-colors ${
													savingName
														? "opacity-50 cursor-not-allowed"
														: "hover:bg-blue-600"
												}`}
											>
												{savingName ? "Saving..." : "Save"}
											</button>
										</div>
										<div className="flex justify-end mt-1">
											<button
												onClick={() => handleCancelEdit("name")}
												className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
											>
												Cancel
											</button>
										</div>
									</div>
								) : (
									<p className="mt-1 text-sm text-gray-800 dark:text-white">
										{tempName || user?.name || "Not provided"}
									</p>
								)}
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-800 dark:text-gray-300">
									Email
								</label>
								<p className="mt-1 text-sm text-gray-800 dark:text-white">
									{user?.email || "Not provided"}
								</p>
								<p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
									Email changes should be made through your Auth0 profile
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
							{reduxUser && (
								<div>
									<label className="block text-sm font-medium text-gray-800 dark:text-gray-300">
										Last Updated
									</label>
									<p className="mt-1 text-sm text-gray-800 dark:text-gray-400">
										{new Date(reduxUser.lastUpdated).toLocaleString()}
									</p>
								</div>
							)}
						</div>
					</div>

					{/* Theme Settings */}
					<div className={getCardClasses()} style={getGamifiedCardStyle()}>
						<h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
							🎨 Theme
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
											localSettings.theme === "light" ? "dark" : "light"
										)
									}
									className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
										localSettings.theme === "dark"
											? "bg-blue-600"
											: "bg-gray-400"
									}`}
								>
									<span
										className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
											localSettings.theme === "dark"
												? "translate-x-6"
												: "translate-x-1"
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
										Switch between professional and gamified UI
									</p>
								</div>
								<button
									onClick={() =>
										handleSettingChange(
											"displayMode",
											localSettings.displayMode === "professional"
												? "gamified"
												: "professional"
										)
									}
									className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
										localSettings.displayMode === "gamified"
											? "bg-blue-600"
											: "bg-gray-400"
									}`}
								>
									<span
										className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
											localSettings.displayMode === "gamified"
												? "translate-x-6"
												: "translate-x-1"
										}`}
									/>
								</button>
							</div>
						</div>
					</div>

					{/* Holiday Settings */}
					<div className={getCardClasses()} style={getGamifiedCardStyle()}>
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
										const isSelected = localSettings.holidayChoices?.some(
											(choice: { holiday: string; budget: number }) =>
												choice.holiday === holiday
										);
										const selectedChoice = localSettings.holidayChoices?.find(
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
																const currentChoices =
																	localSettings.holidayChoices || [];
																let newChoices;
																if (e.target.checked) {
																	newChoices = [
																		...currentChoices,
																		{ holiday, budget: 500 },
																	];
																} else {
																	newChoices = currentChoices.filter(
																		(choice: {
																			holiday: string;
																			budget: number;
																		}) => choice.holiday !== holiday
																	);
																}
																handleSettingChange(
																	"holidayChoices",
																	newChoices
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
																	const newBudget =
																		parseInt(e.target.value) || 0;
																	const currentChoices =
																		localSettings.holidayChoices || [];
																	const newChoices = currentChoices.map(
																		(choice: {
																			holiday: string;
																			budget: number;
																		}) =>
																			choice.holiday === holiday
																				? { ...choice, budget: newBudget }
																				: choice
																	);
																	handleSettingChange(
																		"holidayChoices",
																		newChoices
																	);
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
					<div className={getCardClasses()} style={getGamifiedCardStyle()}>
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
											!localSettings.notifications.reminders
										)
									}
									className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
										localSettings.notifications.reminders
											? "bg-blue-600"
											: "bg-gray-400"
									}`}
								>
									<span
										className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
											localSettings.notifications.reminders
												? "translate-x-6"
												: "translate-x-1"
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
											!localSettings.notifications.shippingAlerts
										)
									}
									className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
										localSettings.notifications.shippingAlerts
											? "bg-blue-600"
											: "bg-gray-400"
									}`}
								>
									<span
										className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
											localSettings.notifications.shippingAlerts
												? "translate-x-6"
												: "translate-x-1"
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
											!localSettings.notifications.upcomingEvents
										)
									}
									className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
										localSettings.notifications.upcomingEvents
											? "bg-blue-600"
											: "bg-gray-400"
									}`}
								>
									<span
										className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
											localSettings.notifications.upcomingEvents
												? "translate-x-6"
												: "translate-x-1"
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

				<Toast
					message={toastMessage}
					isVisible={showToast}
					onClose={() => setShowToast(false)}
					type={toastType}
				/>

				<UpgradeModal
					isOpen={showUpgradeModal}
					onClose={() => setShowUpgradeModal(false)}
					onUpgrade={handleUpgrade}
				/>
			</div>
		</div>
	);
}
