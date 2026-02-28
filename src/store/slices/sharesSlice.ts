import {
	createSlice,
	createAsyncThunk,
	PayloadAction,
	createSelector,
} from "@reduxjs/toolkit";

export interface ShareMember {
	userId: string;
	name?: string | null;
	email?: string | null;
	picture?: string | null;
	joinedAt?: string;
}

export interface HolidayShare {
	shareId: string;
	holidayKey: string;
	ownerUserId: string;
	memberUserIds: string[]; // Keep for backward compatibility
	members?: ShareMember[]; // Enhanced member info with user details
	hasPendingInvites?: boolean; // Whether this share has pending invites
	pendingInviteCount?: number; // Number of pending invites
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

		const data = await response.json();
		console.log('📥 Fetched Shares Data:', {
			userId,
			responseOk: response.ok,
			dataLength: data?.length || 0,
			data
		});

		return data;
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
				console.log('✅ Redux: Shares stored in state:', {
					sharesCount: action.payload?.length || 0,
					shares: action.payload,
					stateShares: state.shares
				});
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
	(state: any) => state.shares.shares,
	(state: any, holidayKey: string) => holidayKey,
	(shares, holidayKey) => {
		// Normalize holiday key for comparison (handle "new-year" vs "New Year")
		const normalizeKey = (key: string | null | undefined) => {
			if (!key || typeof key !== 'string') return '';
			return key.toLowerCase().replace(/[-\s]/g, '').replace(/'/g, '');
		};
		
		const normalizedSearchKey = normalizeKey(holidayKey);
		console.log('🔍 Redux Selector Debug:', {
			searchingFor: holidayKey,
			normalizedSearch: normalizedSearchKey,
			totalSharesInState: shares?.length || 0,
			sharesArray: shares,
			availableShares: shares?.map((s: any) => ({
				holidayKey: s.holidayKey,
				normalized: normalizeKey(s.holidayKey),
				matches: normalizeKey(s.holidayKey) === normalizedSearchKey
			})) || []
		});
		
		const found = shares?.find((share: HolidayShare) => {
			const normalizedShareKey = normalizeKey(share.holidayKey);
			return normalizedShareKey === normalizedSearchKey;
		});
		
		console.log('🎯 Found share:', found ? 'YES' : 'NO', found);
		return found;
	},
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
	(state: any) => state.shares.shares,
	(state: any, holidayKey: string) => holidayKey,
	(shares, holidayKey) => {
		// Normalize holiday key for comparison (handle "new-year" vs "New Year")
		const normalizeKey = (key: string | null | undefined) => {
			if (!key || typeof key !== 'string') return '';
			return key.toLowerCase().replace(/[-\s]/g, '').replace(/'/g, '');
		};
		
		const normalizedSearchKey = normalizeKey(holidayKey);
		
		const isShared = shares?.some((share: HolidayShare) => {
			const normalizedShareKey = normalizeKey(share.holidayKey);
			return normalizedShareKey === normalizedSearchKey;
		});
		
		console.log('🎯 selectIsHolidayShared:', {
			holidayKey,
			normalizedSearchKey,
			sharesCount: shares?.length || 0,
			isShared
		});
		
		return isShared || false;
	},
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
