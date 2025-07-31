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
				// Sun icon for light mode (click to switch to dark)
				<svg
					className="h-5 w-5"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					{/* Central circle */}
					<circle cx="12" cy="12" r="3" strokeWidth={2} />
					{/* 8 rays extending outward */}
					<path
						strokeLinecap="round"
						strokeWidth={2}
						d="M12 2v2M12 20v2M22 12h-2M4 12H2M19.78 4.22l-1.42 1.42M6.34 6.34L4.92 4.92M19.78 19.78l-1.42-1.42M6.34 17.66L4.92 19.08"
					/>
				</svg>
			) : (
				// Moon icon for dark mode (click to switch to light)
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
			)}
		</button>
	);
}
