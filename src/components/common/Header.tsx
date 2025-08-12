"use client";

import { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useRouter } from "next/navigation";
import ThemeToggle from "../ThemeToggle";
import UpgradeModal from "../modals/UpgradeModal";
import UpgradeBanner from "./UpgradeBanner";

export default function Header() {
	const { logout } = useAuth0();
	const router = useRouter();
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [isDarkMode, setIsDarkMode] = useState(false);
	const [showUpgradeModal, setShowUpgradeModal] = useState(false);

	useEffect(() => {
		const checkTheme = () => {
			setIsDarkMode(document.documentElement.classList.contains("dark"));
		};

		checkTheme();
		const observer = new MutationObserver(checkTheme);
		observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ["class"],
		});

		return () => observer.disconnect();
	}, []);

	const handleLogout = () => {
		logout({ logoutParams: { returnTo: window.location.origin } });
		setIsMenuOpen(false);
	};

	const handleSettings = () => {
		router.push("/settings");
		setIsMenuOpen(false);
	};

	const handleAddressBook = () => {
		router.push("/address-book");
		setIsMenuOpen(false);
	};

	const handleUpgrade = () => {
		// TODO: Implement upgrade logic
		console.log("Upgrade clicked");
		setShowUpgradeModal(false);
	};

	return (
		<>
			<header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between items-center h-16">
						{/* Left side - App title */}
						<div className="flex items-center">
							<h1 className="text-xl font-bold text-gray-800 dark:text-white">
								Next Holiday
							</h1>
						</div>

						{/* Right side - Theme toggle and burger menu */}
						<div className="flex items-center space-x-2">
							<ThemeToggle />

							<div className="relative">
								<button
									onClick={() => setIsMenuOpen(!isMenuOpen)}
									className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors"
									aria-expanded={isMenuOpen}
									aria-haspopup="true"
								>
									<span className="sr-only">Open menu</span>
									{/* Burger icon */}
									<svg
										className="h-6 w-6"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										aria-hidden="true"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M4 6h16M4 12h16M4 18h16"
										/>
									</svg>
								</button>

								{/* Dropdown menu */}
								{isMenuOpen && (
									<div
										className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-xl border border-gray-200 dark:border-gray-700 focus:outline-none z-50"
										style={{
											backgroundColor: isDarkMode
												? "rgb(20, 20, 20)"
												: "rgb(255, 255, 255)",
											backdropFilter: "none",
											opacity: "1",
										}}
									>
										<div className="py-1">
											<button
												onClick={handleSettings}
												className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors"
											>
												Settings
											</button>
											<button
												onClick={handleAddressBook}
												className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors"
											>
												Address Book
											</button>
											<button
												onClick={() => {
													setShowUpgradeModal(true);
													setIsMenuOpen(false);
												}}
												className="block w-full text-left px-4 py-2 text-sm font-medium animate-pulse transition-all duration-200"
												style={{
													color: isDarkMode ? "#ffffff" : "#000000",
													background:
														"linear-gradient(to right, #a855f7, #3b82f6)",
													backgroundClip: "text",
													WebkitBackgroundClip: "text",
													WebkitTextFillColor: "transparent",
												}}
												onMouseEnter={(e) => {
													e.currentTarget.style.background =
														"linear-gradient(to right, #c084fc, #60a5fa)";
													e.currentTarget.style.WebkitBackgroundClip = "text";
													e.currentTarget.style.backgroundClip = "text";
												}}
												onMouseLeave={(e) => {
													e.currentTarget.style.background =
														"linear-gradient(to right, #a855f7, #3b82f6)";
													e.currentTarget.style.WebkitBackgroundClip = "text";
													e.currentTarget.style.backgroundClip = "text";
												}}
											>
												✨ Upgrade Now
											</button>
											<button
												onClick={handleLogout}
												className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors"
											>
												Logout
											</button>
										</div>
									</div>
								)}
							</div>
						</div>
					</div>
				</div>

				{/* Overlay to close menu when clicking outside */}
				{isMenuOpen && (
					<div
						className="fixed inset-0 z-40"
						onClick={() => setIsMenuOpen(false)}
					/>
				)}
			</header>
			<UpgradeBanner />

			<UpgradeModal
				isOpen={showUpgradeModal}
				onClose={() => setShowUpgradeModal(false)}
				onUpgrade={handleUpgrade}
			/>
		</>
	);
}
