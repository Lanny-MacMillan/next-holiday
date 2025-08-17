"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

interface DatePickerModalProps {
	isOpen: boolean;
	onClose: () => void;
	onDateSelect: (date: string) => void;
	title?: string;
	currentDate?: string;
	onDelete?: () => void;
}

export default function DatePickerModal({
	isOpen,
	onClose,
	onDateSelect,
	title = "Set Countdown Date",
	currentDate = "",
	onDelete,
}: DatePickerModalProps) {
	const [selectedDate, setSelectedDate] = useState(currentDate);
	const [mounted, setMounted] = useState(false);

	// Ensure component is mounted (for SSR)
	useEffect(() => {
		setMounted(true);
	}, []);

	// Reset selected date when modal opens
	useEffect(() => {
		if (isOpen) {
			setSelectedDate(currentDate);
		}
	}, [isOpen, currentDate]);

	if (!isOpen || !mounted) return null;

	const handleSubmit = () => {
		if (selectedDate) {
			onDateSelect(selectedDate);
			onClose();
		}
	};

	const handleCancel = () => {
		setSelectedDate(currentDate);
		onClose();
	};

	const handleDelete = () => {
		if (onDelete) {
			onDelete();
			onClose();
		}
	};

	const isEditing = currentDate !== "";

	const modalContent = (
		<div
			className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4"
			style={{
				transform: "translateZ(0)",
			}}
		>
			<div
				className="card rounded-lg p-4 sm:p-6 max-w-sm mx-auto w-full"
				style={{
					transform: "translateZ(0)",
				}}
			>
				<div className="flex justify-between items-center mb-3 sm:mb-4">
					<h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
						{title}
					</h3>
					<button
						onClick={handleCancel}
						className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 text-lg sm:text-xl"
					>
						×
					</button>
				</div>
				<div className="space-y-3 sm:space-y-4">
					<div>
						<label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
							Select Date & Time
						</label>
						<input
							type="datetime-local"
							value={selectedDate}
							onChange={(e) => setSelectedDate(e.target.value)}
							className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm sm:text-base text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent [&::-webkit-calendar-picker-indicator]:dark:invert"
						/>
					</div>
					<div className="flex gap-2">
						<button
							onClick={handleSubmit}
							disabled={!selectedDate}
							className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
						>
							{isEditing ? "Update Countdown" : "Set Countdown"}
						</button>
						<button
							onClick={handleCancel}
							className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm sm:text-base"
						>
							Cancel
						</button>
					</div>
					{isEditing && onDelete && (
						<div className="pt-2 border-t border-gray-200 dark:border-gray-700">
							<button
								onClick={handleDelete}
								className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors text-sm sm:text-base"
							>
								Delete Countdown
							</button>
						</div>
					)}
				</div>
			</div>
		</div>
	);

	return typeof window !== "undefined"
		? createPortal(modalContent, document.body)
		: null;
}
