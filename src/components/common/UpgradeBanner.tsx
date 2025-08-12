"use client";

import { useState, useEffect } from "react";
import UpgradeModal from "../modals/UpgradeModal";

export default function UpgradeBanner() {
	const [showUpgradeModal, setShowUpgradeModal] = useState(false);
	const [isDarkMode, setIsDarkMode] = useState(false);

	// Check if dark mode is enabled
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

	const handleUpgrade = () => {
		// TODO: Implement upgrade logic
		console.log("Upgrade clicked from banner");
		setShowUpgradeModal(false);
	};

	return (
		<>
			<div
				className="text-white shadow-lg w-full"
				style={{
					background: isDarkMode
						? "linear-gradient(to right, #9333ea, #2563eb)"
						: "linear-gradient(to right, #000000, #2563eb)",
				}}
			>
				<div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-2 sm:py-3">
					<div className="flex items-center justify-between">
						<div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
							<div className="text-lg sm:text-xl flex-shrink-0">✨</div>
							<div className="min-w-0 flex-1">
								<h3 className="text-sm sm:text-base font-semibold truncate">
									Upgrade to Plus
								</h3>
								<p className="text-gray-200 text-xs">
									Unlock all features and collaborate with family & friends
								</p>
							</div>
						</div>
						<button
							onClick={() => setShowUpgradeModal(true)}
							className="bg-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg font-medium hover:bg-gray-100 transition-colors text-xs sm:text-sm flex-shrink-0 ml-2"
							style={{ color: "#000000" }}
						>
							<span className="hidden sm:inline">Upgrade Now</span>
							<span className="sm:hidden">Upgrade</span>
						</button>
					</div>
				</div>
			</div>

			<UpgradeModal
				isOpen={showUpgradeModal}
				onClose={() => setShowUpgradeModal(false)}
				onUpgrade={handleUpgrade}
			/>
		</>
	);
}
