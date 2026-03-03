"use client";

import { useState, useEffect } from "react";
import UpgradeModal from "../modals/UpgradeModal";

export default function UpgradeBanner() {
	const [showUpgradeModal, setShowUpgradeModal] = useState(false);
	const [isDarkMode, setIsDarkMode] = useState(false);
	const [isDismissed, setIsDismissed] = useState(false);

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

		setShowUpgradeModal(false);
	};

	// Don't render if dismissed
	if (isDismissed) {
		return null;
	}

	return (
		<>
			<div
				className="text-white shadow-lg w-full relative"
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
						<div className="flex items-center space-x-2">
							<button
								onClick={() => setShowUpgradeModal(true)}
								className="bg-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg font-medium hover:bg-gray-100 transition-colors text-xs sm:text-sm flex-shrink-0"
								style={{ color: "#000000" }}
							>
								<span className="hidden sm:inline">Upgrade Now</span>
								<span className="sm:hidden">Upgrade</span>
							</button>
							{/* Close Button */}
							<button
								onClick={() => setIsDismissed(true)}
								className="text-gray-200 hover:text-white transition-colors duration-200 p-1"
								aria-label="Close upgrade banner"
							>
								<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						</div>
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
