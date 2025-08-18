/**
 * Utility functions for managing cached data and debugging cache issues
 */

/**
 * Clear all cached holiday preferences from localStorage
 * This is useful for debugging and ensuring fresh data is loaded
 */
export function clearHolidayPreferencesCache(): void {
	if (typeof window === "undefined") return;

	try {
		// Clear the entire userSettings from localStorage
		localStorage.removeItem("userSettings");
		console.log("Cleared holiday preferences cache from localStorage");
	} catch (error) {
		console.error("Error clearing holiday preferences cache:", error);
	}
}

/**
 * Get current cached holiday preferences from localStorage
 * This is useful for debugging cache issues
 */
export function getCachedHolidayPreferences(): any {
	if (typeof window === "undefined") return null;

	try {
		const savedSettings = localStorage.getItem("userSettings");
		if (savedSettings) {
			const parsedSettings = JSON.parse(savedSettings);
			return parsedSettings.holidayChoices || null;
		}
		return null;
	} catch (error) {
		console.error("Error getting cached holiday preferences:", error);
		return null;
	}
}

/**
 * Log current cache state for debugging
 */
export function logCacheState(): void {
	if (typeof window === "undefined") return;

	console.log("=== Cache Debug Info ===");
	console.log("userSettings:", localStorage.getItem("userSettings"));
	console.log("theme:", localStorage.getItem("theme"));
	console.log("Cached holiday preferences:", getCachedHolidayPreferences());
	console.log("========================");
}

/**
 * Clear all app-related cache data
 * Use this when switching between users or for debugging
 */
export function clearAllAppCache(): void {
	if (typeof window === "undefined") return;

	try {
		localStorage.removeItem("userSettings");
		localStorage.removeItem("theme");
		console.log("Cleared all app cache data");
	} catch (error) {
		console.error("Error clearing app cache:", error);
	}
}
