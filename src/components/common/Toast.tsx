"use client";

import { useState, useEffect } from "react";

interface ToastProps {
	message: string;
	isVisible: boolean;
	onClose: () => void;
	type?: "success" | "error" | "info";
}

export default function Toast({
	message,
	isVisible,
	onClose,
	type = "success",
}: ToastProps) {
	useEffect(() => {
		if (isVisible) {
			const timer = setTimeout(() => {
				onClose();
			}, 3000); // Auto-hide after 3 seconds

			return () => clearTimeout(timer);
		}
	}, [isVisible, onClose]);

	if (!isVisible) return null;

	const bgColor =
		type === "success"
			? "bg-green-500"
			: type === "error"
			? "bg-red-500"
			: "bg-blue-500";
	const icon = type === "success" ? "✓" : type === "error" ? "✕" : "ℹ";

	return (
		<div className="fixed top-4 left-0 right-0 z-50 animate-in slide-in-from-top-2 duration-300 px-4">
			<div
				className={`${bgColor} text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2 mx-auto max-w-2xl`}
			>
				<span className="text-lg font-bold">{icon}</span>
				<span className="flex-1">{message}</span>
				<button
					onClick={onClose}
					className="text-white hover:text-gray-200 transition-colors"
				>
					✕
				</button>
			</div>
		</div>
	);
}
