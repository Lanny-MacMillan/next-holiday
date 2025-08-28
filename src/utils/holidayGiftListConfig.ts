// Configuration for holiday-specific gift list data and display text
export interface HolidayGiftListConfig {
	sliceName: string;
	displayText: string;
}

export const HOLIDAY_GIFT_LIST_CONFIG: Record<string, HolidayGiftListConfig> = {
	Christmas: {
		sliceName: "giftList",
		displayText: "Gift List",
	},
	Hanukkah: {
		sliceName: "hanukkahGiftList",
		displayText: "Gift List",
	},
	"Valentine's Day": {
		sliceName: "valentinesGiftList",
		displayText: "Gift List",
	},
	Halloween: {
		sliceName: "halloweenGiftList",
		displayText: "Gift List",
	},
	Thanksgiving: {
		sliceName: "thanksgivingGiftList",
		displayText: "Shopping List",
	},
	Easter: {
		sliceName: "easterGiftList",
		displayText: "Gift List",
	},
	Kwanzaa: {
		sliceName: "kwanzaaGiftList",
		displayText: "Gift List",
	},
	"New Year": {
		sliceName: "gifts", // Now using RTK Query
		displayText: "Supplies List",
	},
	"Mother's Day": {
		sliceName: "mothersDayGiftList",
		displayText: "Gift List",
	},
	"Father's Day": {
		sliceName: "fathersDayGiftList",
		displayText: "Gift List",
	},
	Birthday: {
		sliceName: "birthdayGiftList",
		displayText: "Gift List",
	},
	Anniversary: {
		sliceName: "anniversaryGiftList",
		displayText: "Gift List",
	},
	Graduation: {
		sliceName: "graduationGiftList",
		displayText: "Gift List",
	},
	"Baby Shower": {
		sliceName: "babyShowerGiftList",
		displayText: "Gift List",
	},
};

// Helper function to get holiday configuration
export function getHolidayGiftListConfig(
	holiday?: string
): HolidayGiftListConfig {
	if (!holiday) {
		return {
			sliceName: "giftList",
			displayText: "Gift List",
		};
	}

	return (
		HOLIDAY_GIFT_LIST_CONFIG[holiday] || {
			sliceName: "giftList",
			displayText: "Gift List",
		}
	);
}
