"use client";

import { useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";

interface HolidayDeleteConfirmationModalProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => void;
	holidayName: string;
	holidayId: string;
	accountId: string;
}

export default function HolidayDeleteConfirmationModal({
	isOpen,
	onClose,
	onConfirm,
	holidayName,
	holidayId,
	accountId,
}: HolidayDeleteConfirmationModalProps) {
	const { user } = useAuth0();
	const [confirmText, setConfirmText] = useState("");
	const [isDeleting, setIsDeleting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Expected confirmation text
	const expectedConfirmText = holidayName;

	const handleConfirm = async () => {
		if (confirmText !== expectedConfirmText) {
			setError(
				"Please type the holiday name exactly as shown to confirm deletion"
			);
			return;
		}

		setIsDeleting(true);
		setError(null);

		try {
			const response = await fetch(
				`/api/holidays/${holidayId}/delete-cascade`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						"x-test-user": JSON.stringify({
							sub: user?.sub,
							email: user?.email,
							name: user?.name,
							picture: user?.picture,
						}),
					},
					body: JSON.stringify({
						dryRun: false,
						force: false,
					}),
				}
			);

			if (!response.ok) {
				const errorResult = await response.json();
				throw new Error(
					errorResult.error ||
						`Failed to delete holiday: ${response.statusText}`
				);
			}

			const result = await response.json();

			if (result.success) {
				// Success - close modal and trigger parent callback
				onConfirm();
				onClose();
			} else {
				throw new Error(result.error || "Failed to delete holiday");
			}
		} catch (err) {
			console.error("Error deleting holiday:", err);
			setError(err instanceof Error ? err.message : "Failed to delete holiday");
		} finally {
			setIsDeleting(false);
		}
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
			<div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
				<div className="p-6">
					{/* Header */}
					<div className="flex items-center justify-between mb-4">
						<h2 className="text-xl font-bold text-black">
							🗑️ Delete Holiday
						</h2>
						<button
							onClick={onClose}
							className="text-gray-400 hover:text-gray-600"
							disabled={isDeleting}
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
									d="M6 18L18 6M6 6l12 12"
								/>
							</svg>
						</button>
					</div>

					{/* Warning Message */}
					<div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 mb-6">
						<div className="flex items-start">
							<div className="flex-shrink-0">
								<svg
									className="h-5 w-5 text-red-500"
									viewBox="0 0 20 20"
									fill="currentColor"
								>
									<path
										fillRule="evenodd"
										d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
										clipRule="evenodd"
									/>
								</svg>
							</div>
							<div className="ml-3">
								<h3 className="text-sm font-bold text-black">
									This action cannot be undone
								</h3>
								<div className="mt-2 text-sm text-black">
									<p>
										Deleting <strong className="font-bold">{holidayName}</strong> will permanently
										remove all associated data including tasks, gifts, cards, budgets, and more.
									</p>
								</div>
							</div>
						</div>
					</div>

					{/* Error Display */}
					{error && (
						<div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
							<p className="text-black text-sm">{error}</p>
						</div>
					)}

					{/* Confirmation Input */}
					<div className="mb-6">
						<label className="block text-sm font-bold text-black mb-2">
							To confirm deletion, type the holiday name exactly as shown:
						</label>
						<div className="bg-yellow-100 border-2 border-yellow-400 rounded-lg p-3 mb-3">
							<p className="text-black font-bold font-mono text-base">
								"{expectedConfirmText}"
							</p>
						</div>
						<input
							type="text"
							value={confirmText}
							onChange={(e) => setConfirmText(e.target.value)}
							placeholder="Type the holiday name here..."
							className="w-full px-3 py-2 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black bg-white font-medium"
							disabled={isDeleting}
						/>
					</div>

					{/* Action Buttons */}
					<div className="flex justify-end space-x-3">
						<button
							onClick={onClose}
							className="px-4 py-2 text-black font-medium bg-white border-2 border-gray-400 rounded-lg hover:bg-gray-100 transition-colors"
							disabled={isDeleting}
						>
							Cancel
						</button>
						<button
							onClick={handleConfirm}
							disabled={
								isDeleting ||
								confirmText !== expectedConfirmText
							}
							className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center"
						>
							{isDeleting && (
								<svg
									className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
									fill="none"
									viewBox="0 0 24 24"
								>
									<circle
										className="opacity-25"
										cx="12"
										cy="12"
										r="10"
										stroke="currentColor"
										strokeWidth="4"
									></circle>
									<path
										className="opacity-75"
										fill="currentColor"
										d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
									></path>
								</svg>
							)}
							{isDeleting ? "Deleting..." : "Delete Holiday"}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
