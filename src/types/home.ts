export interface HomeData {
	user: {
		id: string;
		email?: string | null;
		name?: string | null;
		picture?: string | null;
	} | null;
	account: {
		id: string;
		name: string;
		owner: {
			id: string;
			name: string | null;
			email: string | null;
		};
	} | null;
	holidayPreferences: Array<{
		holiday: string;
		holidayId: string;
		budget?: number;
		countdownTimer?: string;
	}> | null;
	needsUserSetup: boolean;
	needsHolidaySelection: boolean;
}
