"use client";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { toggleTheme } from "@/store/slices/themeSlice";

export default function ThemeToggle() {
	const dispatch = useAppDispatch();
	const { theme } = useAppSelector((state: any) => state.theme.settings);

	const handleToggle = () => {
		console.log("Theme toggle clicked, current theme:", theme);
		dispatch(toggleTheme());
	};

	return (
		<button
			onClick={handleToggle}
			className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors"
			aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
		>
			{theme === "light" ? (
				// Moon icon for dark mode
				<svg
					className="h-5 w-5"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
					/>
				</svg>
			) : (
				// Sun icon for light mode
				<svg
					className="h-5 w-5"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M12 3v1m0 16v1m9-9h-1M4 12H3m6.75-6.75l.75.75M6.75 6.75l-.75.75m0 10.5l.75.75m0-10.5l-.75.75M12 7a5 5 0 11-10 0 5 5 0 0110 0z"
					/>
				</svg>
			)}
		</button>
	);
}
