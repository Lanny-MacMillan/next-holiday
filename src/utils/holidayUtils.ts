export type HolidayTheme =
	| "christmas"
	| "valentines"
	| "easter"
	| "halloween"
	| "thanksgiving"
	| "hanukkah"
	| "kwanzaa"
	| "new-year";

export interface HolidayColors {
	primary: string;
	secondary: string;
	accent: string;
	background: string;
}

const holidayColorMap: Record<HolidayTheme, HolidayColors> = {
	christmas: {
		primary: "#dc2626", // red-600
		secondary: "#059669", // emerald-600
		accent: "#dc2626", // red-600
		background: "christmas-gradient",
	},
	valentines: {
		primary: "#ec4899", // pink-500
		secondary: "#be185d", // pink-700
		accent: "#ec4899", // pink-500
		background: "valentines-gradient",
	},
	easter: {
		primary: "#8b5cf6", // violet-500
		secondary: "#7c3aed", // violet-600
		accent: "#8b5cf6", // violet-500
		background: "easter-gradient",
	},
	halloween: {
		primary: "#f97316", // orange-500
		secondary: "#ea580c", // orange-600
		accent: "#f97316", // orange-500
		background: "halloween-gradient",
	},
	thanksgiving: {
		primary: "#d97706", // amber-600
		secondary: "#b45309", // amber-700
		accent: "#d97706", // amber-600
		background: "thanksgiving-gradient",
	},
	hanukkah: {
		primary: "#3b82f6", // blue-500
		secondary: "#2563eb", // blue-600
		accent: "#3b82f6", // blue-500
		background: "hanukkah-cards-gradient",
	},
	kwanzaa: {
		primary: "#059669", // emerald-600
		secondary: "#047857", // emerald-700
		accent: "#059669", // emerald-600
		background: "kwanzaa-gradient",
	},
	"new-year": {
		primary: "#eab308", // yellow-500
		secondary: "#ca8a04", // yellow-600
		accent: "#eab308", // yellow-500
		background: "new-year-gradient",
	},
};

export function detectHolidayTheme(pathname: string): HolidayTheme {
	if (pathname.includes("/christmas")) return "christmas";
	if (pathname.includes("/valentines")) return "valentines";
	if (pathname.includes("/easter")) return "easter";
	if (pathname.includes("/halloween")) return "halloween";
	if (pathname.includes("/thanksgiving")) return "thanksgiving";
	if (pathname.includes("/hanukkah")) return "hanukkah";
	if (pathname.includes("/kwanzaa")) return "kwanzaa";
	if (pathname.includes("/new-year")) return "new-year";

	// Default to christmas if no holiday is detected
	return "christmas";
}

export function getHolidayColors(pathname: string): HolidayColors {
	const theme = detectHolidayTheme(pathname);
	return holidayColorMap[theme];
}

export function getHolidayAccentColor(pathname: string): string {
	const colors = getHolidayColors(pathname);
	return colors.accent;
}

// Function to calculate countdown time for a holiday
export const getHolidayCountdownTime = (
	holidayName: string,
	state: any
): number => {
	// Get the appropriate countdown state based on holiday name
	let countdownState;

	switch (holidayName) {
		case "Hanukkah":
			countdownState = state.hanukkahCountdown;
			break;
		case "Kwanzaa":
			countdownState = state.kwanzaaCountdown;
			break;
		case "New Year":
			countdownState = state.newYearCountdown;
			break;
		case "Valentine's Day":
			countdownState = state.valentinesCountdown;
			break;
		case "Easter":
			countdownState = state.easterCountdown;
			break;
		case "Halloween":
			countdownState = state.halloweenCountdown;
			break;
		case "Thanksgiving":
			countdownState = state.thanksgivingCountdown;
			break;
		default:
			countdownState = state.countdown;
			break;
	}

	// If no countdown is set or not active, return Infinity (will be sorted last)
	if (!countdownState.targetDate || !countdownState.isActive) {
		return Infinity;
	}

	// Calculate time remaining in milliseconds
	const now = new Date().getTime();
	const target = new Date(countdownState.targetDate).getTime();
	const difference = target - now;

	// If the date has passed, return 0 (will be sorted first)
	if (difference <= 0) {
		return 0;
	}

	return difference;
};
