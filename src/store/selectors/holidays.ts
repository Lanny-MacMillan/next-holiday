// Holiday selectors for filtering data with _visibility annotation

export interface HolidayDTO {
	id: string;
	name: string;
	holidayType: string;
	accountId: string;
	createdBy: string;
	createdAt: string;
	updatedAt: string;
	_visibility: "mine" | "shared";
}

/**
 * Select holidays created by the current user
 */
export const selectMyHolidays = (items: HolidayDTO[]): HolidayDTO[] =>
	items.filter((h) => h._visibility === "mine");

/**
 * Select holidays created by other users (shared with me)
 */
export const selectSharedHolidays = (items: HolidayDTO[]): HolidayDTO[] =>
	items.filter((h) => h._visibility === "shared");

/**
 * Select all holidays (no filtering)
 */
export const selectAllHolidays = (items: HolidayDTO[]): HolidayDTO[] => items;

