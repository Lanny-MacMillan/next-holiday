import {
	createSlice,
	createAsyncThunk,
	PayloadAction,
	createSelector,
} from "@reduxjs/toolkit";

export interface Invite {
	id: string;
	shareId: string;
	fromUserId: string;
	toUserId?: string;
	toEmail?: string;
	holidayKey: string;
	status: "pending" | "accepted" | "declined" | "expired";
	message?: string;
	createdAt: string;
	respondedAt?: string;
	fromUser?: {
		name: string;
		email: string;
	};
}

interface InvitesState {
	invites: Invite[];
	loading: boolean;
	error: string | null;
	initialized: boolean;
}

const initialState: InvitesState = {
	invites: [],
	loading: false,
	error: null,
	initialized: false,
};

// Async thunks
export const fetchInvites = createAsyncThunk(
	"invites/fetchInvites",
	async (_, { getState }) => {
		const state = getState() as any;
		const currentInvites = state.invites.invites;
		const isInitialized = state.invites.initialized;

		if (isInitialized) {
			return currentInvites;
		}

		// Simulate API call
		const response = await new Promise<Invite[]>((resolve) => {
			setTimeout(() => {
				resolve([]);
			}, 500);
		});
		return response;
	}
);

export const fetchInboxInvites = createAsyncThunk(
	"invites/fetchInboxInvites",
	async (userId: string) => {
		const response = await fetch(`/api/invites?inbox=1&userId=${userId}`);

		if (!response.ok) {
			throw new Error("Failed to fetch inbox invites");
		}

		return await response.json();
	}
);

export const createInvite = createAsyncThunk(
	"invites/createInvite",
	async (
		inviteData: Omit<
			Invite,
			"inviteId" | "status" | "createdAt" | "respondedAt"
		>
	) => {
		const response = await fetch("/api/invites", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(inviteData),
		});

		if (!response.ok) {
			throw new Error("Failed to create invite");
		}

		return await response.json();
	}
);

export const acceptInvite = createAsyncThunk(
	"invites/acceptInvite",
	async (inviteId: string) => {
		const response = await fetch(`/api/invites/${inviteId}/accept`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
		});

		if (!response.ok) {
			throw new Error("Failed to accept invite");
		}

		return await response.json();
	}
);

export const declineInvite = createAsyncThunk(
	"invites/declineInvite",
	async (inviteId: string) => {
		const response = await fetch(`/api/invites/${inviteId}/decline`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
		});

		if (!response.ok) {
			throw new Error("Failed to decline invite");
		}

		return await response.json();
	}
);

const invitesSlice = createSlice({
	name: "invites",
	initialState,
	reducers: {
		clearError: (state) => {
			state.error = null;
		},
		addInvite: (state, action: PayloadAction<Invite>) => {
			state.invites.push(action.payload);
		},
		updateInviteInState: (state, action: PayloadAction<Invite>) => {
			const index = state.invites.findIndex(
				(invite) => invite.inviteId === action.payload.inviteId
			);
			if (index !== -1) {
				state.invites[index] = action.payload;
			}
		},
		removeInvite: (state, action: PayloadAction<string>) => {
			state.invites = state.invites.filter(
				(invite) => invite.inviteId !== action.payload
			);
		},
	},
	extraReducers: (builder) => {
		builder
			// Fetch invites
			.addCase(fetchInvites.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchInvites.fulfilled, (state, action) => {
				state.loading = false;
				state.invites = action.payload;
				state.initialized = true;
			})
			.addCase(fetchInvites.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to fetch invites";
			})
			// Fetch inbox invites
			.addCase(fetchInboxInvites.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchInboxInvites.fulfilled, (state, action) => {
				state.loading = false;
				// Merge new invites with existing ones, avoiding duplicates
				const newInvites = action.payload;
				const existingIds = new Set(
					state.invites.map((invite) => invite.inviteId)
				);
				const uniqueNewInvites = newInvites.filter(
					(invite: Invite) => !existingIds.has(invite.inviteId)
				);
				state.invites = [...state.invites, ...uniqueNewInvites];
			})
			.addCase(fetchInboxInvites.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to fetch inbox invites";
			})
			// Create invite
			.addCase(createInvite.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(createInvite.fulfilled, (state, action) => {
				state.loading = false;
				state.invites.push(action.payload);
			})
			.addCase(createInvite.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to create invite";
			})
			// Accept invite
			.addCase(acceptInvite.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(acceptInvite.fulfilled, (state, action) => {
				state.loading = false;
				const index = state.invites.findIndex(
					(invite) => invite.inviteId === action.payload.inviteId
				);
				if (index !== -1) {
					state.invites[index] = action.payload;
				}
			})
			.addCase(acceptInvite.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to accept invite";
			})
			// Decline invite
			.addCase(declineInvite.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(declineInvite.fulfilled, (state, action) => {
				state.loading = false;
				const index = state.invites.findIndex(
					(invite) => invite.inviteId === action.payload.inviteId
				);
				if (index !== -1) {
					state.invites[index] = action.payload;
				}
			})
			.addCase(declineInvite.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to decline invite";
			});
	},
});

export const { clearError, addInvite, updateInviteInState, removeInvite } =
	invitesSlice.actions;
export default invitesSlice.reducer;

// Selectors
export const selectPendingInvites = createSelector(
	(state: any, userId: string, userEmail?: string) => state.invites.invites,
	(userId: string, userEmail?: string) => ({ userId, userEmail }),
	(invites, { userId, userEmail }) => {
		console.log("🔍 Selector Debug:", {
			invites,
			userId,
			userEmail,
			inviteCount: invites.length,
		});

		const filtered = invites.filter((invite: Invite) => {
			const matches =
				(invite.toUserId === userId ||
					invite.toEmail === userId ||
					(userEmail && invite.toEmail === userEmail)) &&
				invite.status === "pending";

			console.log("🔍 Invite Filter:", {
				inviteId: invite.inviteId,
				inviteToUserId: invite.toUserId,
				inviteToEmail: invite.toEmail,
				inviteStatus: invite.status,
				userId,
				userEmail,
				matches,
			});

			return matches;
		});

		console.log("🔍 Selector Result:", filtered);
		return filtered;
	}
);

export const selectOutgoingInvites = createSelector(
	(state: any, userId: string) => state.invites.invites,
	(userId: string) => userId,
	(invites, userId) =>
		invites.filter((invite: Invite) => invite.fromUserId === userId)
);

export const selectInviteById = createSelector(
	(state: any, inviteId: string) => state.invites.invites,
	(inviteId: string) => inviteId,
	(invites, inviteId) =>
		invites.find((invite: Invite) => invite.inviteId === inviteId)
);

export const selectInvitesByShareId = createSelector(
	(state: any, shareId: string) => state.invites.invites,
	(shareId: string) => shareId,
	(invites, shareId) =>
		invites.filter((invite: Invite) => invite.shareId === shareId)
);

export const selectPendingInvitesCount = createSelector(
	(state: any, userId: string) => state.invites.invites,
	(userId: string) => userId,
	(invites, userId) =>
		invites.filter(
			(invite: Invite) =>
				(invite.toUserId === userId || invite.toEmail === userId) &&
				invite.status === "pending"
		).length
);
