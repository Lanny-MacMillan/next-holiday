import React from "react";

export interface DeleteModalProps {
	isOpen: boolean;
	title?: string;
	message?: string;
	itemName?: string;
	onConfirm: () => void;
	onCancel: () => void;
	loading?: boolean;
	cardClassName?: string;
	confirmText?: string;
	cancelText?: string;
	confirmButtonColor?: string;
}

export default function DeleteModal({
	isOpen,
	title = "Confirm Delete",
	message = "Are you sure you want to delete this item? This action cannot be undone.",
	itemName,
	onConfirm,
	onCancel,
	loading = false,
	cardClassName = "card",
	confirmText = "Delete",
	cancelText = "Cancel",
	confirmButtonColor = "#ef4444",
}: DeleteModalProps) {
	if (!isOpen) return null;

	const displayMessage = itemName
		? `Are you sure you want to delete "${itemName}"? This action cannot be undone.`
		: message;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
			<div
				className={`${cardClassName} bg-white rounded-lg p-4 sm:p-6 max-w-sm mx-auto w-full`}
			>
				<h3
					className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-900 dark:text-white"
					style={{ color: "#111827" }}
				>
					{title}
				</h3>
				<p
					className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-4 sm:mb-6"
					style={{ color: "#4b5563" }}
				>
					{displayMessage}
				</p>
				<div className="flex gap-3">
					<button
						onClick={onCancel}
						className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm sm:text-base text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
						style={{ color: "#374151", borderColor: "#d1d5db" }}
						disabled={loading}
					>
						{cancelText}
					</button>
					<button
						onClick={onConfirm}
						className="flex-1 px-3 sm:px-4 py-2 text-white rounded hover:opacity-90 transition-colors text-sm sm:text-base"
						style={{ backgroundColor: confirmButtonColor, color: "white" }}
						disabled={loading}
					>
						{loading ? "Deleting..." : confirmText}
					</button>
				</div>
			</div>
		</div>
	);
}
