/**
 * Utility functions for consistent card drop shadows across the app
 */

export interface ShadowOptions {
	isDarkMode?: boolean;
	isGamified?: boolean;
	intensity?: "light" | "medium" | "heavy";
}

/**
 * Get the appropriate drop shadow filter for cards
 */
export const getCardDropShadow = (options: ShadowOptions = {}): string => {
	const {
		isDarkMode = false,
		isGamified = false,
		intensity = "medium",
	} = options;

	if (isDarkMode) {
		// Light splash for dark mode
		switch (intensity) {
			case "light":
				return "drop-shadow(1px 2px 4px rgba(255, 255, 255, 0.1)) drop-shadow(0px 1px 2px rgba(255, 255, 255, 0.05))";
			case "medium":
				return "drop-shadow(2px 3px 6px rgba(255, 255, 255, 0.15)) drop-shadow(0px 2px 4px rgba(255, 255, 255, 0.08))";
			case "heavy":
				return "drop-shadow(3px 5px 9px rgba(255, 255, 255, 0.2)) drop-shadow(1px 2px 4px rgba(255, 255, 255, 0.1))";
			default:
				return "drop-shadow(2px 3px 6px rgba(255, 255, 255, 0.15)) drop-shadow(0px 2px 4px rgba(255, 255, 255, 0.08))";
		}
	} else {
		// Dark shadow for light mode
		switch (intensity) {
			case "light":
				return "drop-shadow(1px 2px 4px rgba(0, 0, 0, 0.1)) drop-shadow(0px 1px 2px rgba(0, 0, 0, 0.05))";
			case "medium":
				return "drop-shadow(2px 4px 8px rgba(0, 0, 0, 0.15)) drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.08))";
			case "heavy":
				return isGamified
					? "drop-shadow(3px 5px 9px rgba(0, 0, 0, 0.5)) drop-shadow(1px 2px 4px rgba(0, 0, 0, 0.2))"
					: "drop-shadow(3px 5px 9px rgba(0, 0, 0, 0.25)) drop-shadow(1px 2px 4px rgba(0, 0, 0, 0.1))";
			default:
				return "drop-shadow(2px 4px 8px rgba(0, 0, 0, 0.15)) drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.08))";
		}
	}
};

/**
 * Get the appropriate CSS filter string for a card component
 */
export const getCardFilter = (
	options: ShadowOptions = {}
): { filter: string } => {
	return {
		filter: getCardDropShadow(options),
	};
};

/**
 * Get complete card styling including shadows and borders for dark mode
 */
export const getCardStyling = (
	options: ShadowOptions = {}
): {
	filter: string;
	border?: string;
	boxShadow?: string;
} => {
	const { isDarkMode = false, intensity = "medium" } = options;

	const baseStyles = {
		filter: getCardDropShadow(options),
	};

	if (isDarkMode) {
		// Add white outline for dark mode to make shadows pop
		const borderIntensity = {
			light: "1px solid rgba(255, 255, 255, 0.1)",
			medium: "1px solid rgba(255, 255, 255, 0.25)",
			heavy: "3px solid rgba(255, 255, 255, 1)",
		}[intensity];

		return {
			...baseStyles,
			border: borderIntensity,
		};
	}

	return baseStyles;
};

/**
 * Get Tailwind CSS classes for card shadows (fallback for components that prefer classes)
 */
export const getCardShadowClasses = (options: ShadowOptions = {}): string => {
	const { isDarkMode = false, intensity = "medium" } = options;

	if (isDarkMode) {
		switch (intensity) {
			case "light":
				return "shadow-sm shadow-white/10";
			case "medium":
				return "shadow-md shadow-white/20";
			case "heavy":
				return "shadow-lg shadow-white/30";
			default:
				return "shadow-md shadow-white/20";
		}
	} else {
		switch (intensity) {
			case "light":
				return "shadow-sm";
			case "medium":
				return "shadow-md";
			case "heavy":
				return "shadow-lg";
			default:
				return "shadow-md";
		}
	}
};
