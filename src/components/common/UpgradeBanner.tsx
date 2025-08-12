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
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
					<div className="flex items-center justify-between">
						<div className="flex items-center space-x-3">
							<div className="text-xl">✨</div>
							<div>
								<h3 className="text-base font-semibold">Upgrade to Plus</h3>
								<p className="text-gray-200 text-xs">
									Unlock all features and collaborate with family & friends
								</p>
							</div>
						</div>
						<button
							onClick={() => setShowUpgradeModal(true)}
							className="bg-white px-3 py-1.5 rounded-lg font-medium hover:bg-gray-100 transition-colors text-sm"
							style={{ color: "#000000" }}
						>
							Upgrade Now
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
