import {
	createSlice,
	createAsyncThunk,
	PayloadAction,
	createSelector,
} from "@reduxjs/toolkit";

export interface HolidayShare {
	shareId: string;
	holidayKey: string;
	ownerUserId: string;
	memberUserIds: string[];
	createdAt: string;
	updatedAt: string;
}

interface SharesState {
	shares: HolidayShare[];
	loading: boolean;
	error: string | null;
	initialized: boolean;
}

const initialState: SharesState = {
	shares: [],
	loading: false,
	error: null,
	initialized: false,
};

// Async thunks
export const fetchShares = createAsyncThunk(
	"shares/fetchShares",
	async (userId: string, { getState }) => {
		const state = getState() as any;
		const currentShares = state.shares.shares;
		const isInitialized = state.shares.initialized;

		if (isInitialized) {
			return currentShares;
		}

		// Fetch shares from API
		const response = await fetch(`/api/shares?userId=${userId}`);

		if (!response.ok) {
			throw new Error("Failed to fetch shares");
		}

		return await response.json();
	},
);

export const createShare = createAsyncThunk(
	"shares/createShare",
	async (
		shareData: Omit<HolidayShare, "shareId" | "createdAt" | "updatedAt">,
	) => {
		const response = await fetch("/api/shares", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(shareData),
		});

		if (!response.ok) {
			throw new Error("Failed to create share");
		}

		return await response.json();
	},
);

export const updateShare = createAsyncThunk(
	"shares/updateShare",
	async (share: HolidayShare) => {
		const response = await fetch(`/api/shares/${share.shareId}`, {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(share),
		});

		if (!response.ok) {
			throw new Error("Failed to update share");
		}

		return await response.json();
	},
);

export const addMemberToShare = createAsyncThunk(
	"shares/addMemberToShare",
	async ({ shareId, userId }: { shareId: string; userId: string }) => {
		const response = await fetch(`/api/shares/${shareId}/members`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ userId }),
		});

		if (!response.ok) {
			throw new Error("Failed to add member to share");
		}

		return await response.json();
	},
);

const sharesSlice = createSlice({
	name: "shares",
	initialState,
	reducers: {
		clearError: (state) => {
			state.error = null;
		},
		addShare: (state, action: PayloadAction<HolidayShare>) => {
			state.shares.push(action.payload);
		},
		updateShareInState: (state, action: PayloadAction<HolidayShare>) => {
			const index = state.shares.findIndex(
				(share) => share.shareId === action.payload.shareId,
			);
			if (index !== -1) {
				state.shares[index] = action.payload;
			}
		},
	},
	extraReducers: (builder) => {
		builder
			// Fetch shares
			.addCase(fetchShares.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchShares.fulfilled, (state, action) => {
				state.loading = false;
				state.shares = action.payload;
				state.initialized = true;
			})
			.addCase(fetchShares.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to fetch shares";
			})
			// Create share
			.addCase(createShare.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(createShare.fulfilled, (state, action) => {
				state.loading = false;
				state.shares.push(action.payload);
			})
			.addCase(createShare.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to create share";
			})
			// Update share
			.addCase(updateShare.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(updateShare.fulfilled, (state, action) => {
				state.loading = false;
				const index = state.shares.findIndex(
					(share) => share.shareId === action.payload.shareId,
				);
				if (index !== -1) {
					state.shares[index] = action.payload;
				}
			})
			.addCase(updateShare.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to update share";
			})
			// Add member to share
			.addCase(addMemberToShare.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(addMemberToShare.fulfilled, (state, action) => {
				state.loading = false;
				const index = state.shares.findIndex(
					(share) => share.shareId === action.payload.shareId,
				);
				if (index !== -1) {
					state.shares[index] = action.payload;
				}
			})
			.addCase(addMemberToShare.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to add member to share";
			});
	},
});

export const { clearError, addShare, updateShareInState } = sharesSlice.actions;
export default sharesSlice.reducer;

// Selectors
export const selectShareByHolidayKey = createSelector(
	(state: any, holidayKey: string) => state.shares.shares,
	(holidayKey: string) => holidayKey,
	(shares, holidayKey) =>
		shares.find((share: HolidayShare) => share.holidayKey === holidayKey),
);

export const selectShareById = createSelector(
	(state: any, shareId: string) => state.shares.shares,
	(shareId: string) => shareId,
	(shares, shareId) =>
		shares.find((share: HolidayShare) => share.shareId === shareId),
);

export const selectMembers = createSelector(
	(state: any, shareId: string) =>
		state.shares.shares.find((s: HolidayShare) => s.shareId === shareId),
	(share) => (share ? share.memberUserIds : []),
);

export const selectHolidayShareId = createSelector(
	(state: any, holidayKey: string, userId: string) => state.shares.shares,
	(holidayKey: string, userId: string) => ({ holidayKey, userId }),
	(shares, { holidayKey, userId }) => {
		const share = shares.find(
			(s: HolidayShare) =>
				s.holidayKey === holidayKey &&
				(s.ownerUserId === userId || s.memberUserIds.includes(userId)),
		);
		return share ? share.shareId : undefined;
	},
);

export const selectIsHolidayShared = createSelector(
	(state: any, holidayKey: string) => state.shares.shares,
	(holidayKey: string) => holidayKey,
	(shares, holidayKey) =>
		shares.some((share: HolidayShare) => share.holidayKey === holidayKey),
);

export const selectIsUserInShare = createSelector(
	(state: any, shareId: string, userId: string) => state.shares.shares,
	(shareId: string, userId: string) => ({ shareId, userId }),
	(shares, { shareId, userId }) => {
		const share = shares.find((s: HolidayShare) => s.shareId === shareId);
		return share
			? share.ownerUserId === userId || share.memberUserIds.includes(userId)
			: false;
	},
);
