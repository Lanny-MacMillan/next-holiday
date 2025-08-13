"use client";

import { useState } from "react";

export type SortOption = string;

interface SortModalProps {
	isOpen: boolean;
	onClose: () => void;
	sortBy: SortOption;
	onSortChange: (sortOption: string) => void;
	sortOptions: Array<{
		value: SortOption;
		label: string;
	}>;
	title: string;
}

export default function SortModal({
	isOpen,
	onClose,
	sortBy,
	onSortChange,
	sortOptions,
	title,
}: SortModalProps) {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
			<div className="card rounded-lg p-4 sm:p-6 max-w-sm mx-auto w-full">
				<div className="flex justify-between items-center mb-3 sm:mb-4">
					<h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
						{title}
					</h3>
					<button
						onClick={onClose}
						className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 text-lg sm:text-xl"
					>
						×
					</button>
				</div>
				<div className="space-y-2">
					{sortOptions.map((option) => (
						<button
							key={option.value}
							onClick={() => {
								onSortChange(option.value);
								onClose();
							}}
							className={`w-full text-left px-3 sm:px-4 py-2 sm:py-3 rounded-lg transition-colors text-sm sm:text-base ${
								sortBy === option.value
									? "bg-yellow-500 text-white"
									: "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
							}`}
						>
							{option.label}
						</button>
					))}
				</div>
			</div>
		</div>
	);
}
