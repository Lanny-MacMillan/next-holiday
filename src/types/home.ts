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
		gifts?: any[];
		cards?: any[];
		tasks?: any[];
		// Filtered task categories for specific holidays
		events?: any[];
		decorations?: any[];
		kwanzaaPrinciples?: any[];
	}> | null;
	contacts: Array<{
		id: string;
		name: string;
		email?: string | null;
		phone?: string | null;
		streetAddress?: string | null;
		city?: string | null;
		state?: string | null;
		postalCode?: string | null;
		relationship?: string | null;
		notes?: string | null;
		createdAt: Date;
		updatedAt: Date;
	}> | null;
	needsUserSetup: boolean;
	needsHolidaySelection: boolean;
}
