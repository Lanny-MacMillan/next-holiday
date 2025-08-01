"use client";

import { useAuth0 } from "@auth0/auth0-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { updateSettings } from "@/store/slices/themeSlice";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function SettingsPage() {
	const { user } = useAuth0();
	const dispatch = useAppDispatch();
	const { settings } = useAppSelector((state: any) => state.theme);
	const [localSettings, setLocalSettings] = useState(settings);
	const [imageError, setImageError] = useState(false);

	// Reset image error when user changes
	useEffect(() => {
		setImageError(false);
	}, [user?.picture]);

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
	};

	return (
		<div className="min-h-screen christmas-settings-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
			<header className="w-full max-w-2xl py-6 flex flex-col items-center">
				<h1 className="text-3xl font-bold mb-2 text-gray-800 dark:text-white">
					Settings
				</h1>
				<p className="text-center text-gray-800 dark:text-gray-400">
					Manage your account and preferences
				</p>
				<Link href="/" className="mt-2 text-blue-600 text-sm hover:underline">
					← Back to Home
				</Link>
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
										localSettings.theme === "light" ? "dark" : "light"
									)
								}
								className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
									localSettings.theme === "dark" ? "bg-blue-600" : "bg-gray-400"
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
								Default Holiday
							</label>
							<select
								value={localSettings.defaultHoliday}
								onChange={(e) =>
									handleSettingChange("defaultHoliday", e.target.value)
								}
								className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
							>
								<option value="Christmas">Christmas</option>
								<option value="Hanukkah">Hanukkah</option>
								<option value="Kwanzaa">Kwanzaa</option>
								<option value="New Year">New Year</option>
								<option value="Valentine's Day">Valentine's Day</option>
								<option value="Easter">Easter</option>
								<option value="Thanksgiving">Thanksgiving</option>
							</select>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-800 dark:text-gray-300">
								Gift Budget Limit ($)
							</label>
							<input
								type="number"
								value={localSettings.giftBudgetLimit}
								onChange={(e) =>
									handleSettingChange(
										"giftBudgetLimit",
										parseInt(e.target.value)
									)
								}
								className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
								min="0"
								step="50"
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-800 dark:text-gray-300">
								Preferred Greeting Style
							</label>
							<select
								value={localSettings.greetingStyle}
								onChange={(e) =>
									handleSettingChange("greetingStyle", e.target.value)
								}
								className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
							>
								<option value="formal">Formal</option>
								<option value="informal">Informal</option>
							</select>
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
		</div>
	);
}
