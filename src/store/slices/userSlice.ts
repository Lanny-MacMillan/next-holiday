import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

export interface User {
	id: string;
	sub: string;
	email?: string;
	name?: string;
	picture?: string;
	isInDb: boolean;
	isFirstLogin: boolean;
	lastUpdated: string;
}

interface UserState {
	user: User | null;
	loading: boolean;
	error: string | null;
	initialized: boolean;
}

const initialState: UserState = {
	user: null,
	loading: false,
	error: null,
	initialized: false,
};

// Async thunk to check if user exists in database
export const checkUserInDb = createAsyncThunk(
	"user/checkUserInDb",
	async (auth0Sub: string) => {
		try {
			// Try to get user from the users endpoint
			const response = await fetch("/api/users/me", {
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ auth0Sub }),
			});

			if (response.ok) {
				const userData = await response.json();
				return { isInDb: true, user: userData };
			} else if (response.status === 404) {
				return { isInDb: false, user: null };
			} else {
				throw new Error("Failed to check user in database");
			}
		} catch (error) {
			// If there's an error, assume user is not in DB
			return { isInDb: false, user: null };
		}
	}
);

// Async thunk to add user to database
export const addUserToDb = createAsyncThunk(
	"user/addUserToDb",
	async (userData: {
		sub: string;
		email?: string;
		name?: string;
		picture?: string;
	}) => {
		const response = await fetch("/api/users", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				auth0Sub: userData.sub,
				email: userData.email,
				name: userData.name,
				picture: userData.picture,
			}),
		});

		if (!response.ok) {
			throw new Error("Failed to add user to database");
		}

		const newUser = await response.json();
		return newUser;
	}
);

// Async thunk to get current user from API
export const getCurrentUser = createAsyncThunk(
	"user/getCurrentUser",
	async () => {
		const response = await fetch("/api/users/me");
		if (!response.ok) {
			throw new Error("Failed to fetch current user");
		}
		const userData = await response.json();
		return userData;
	}
);

// Async thunk to update user information
export const updateUserInfo = createAsyncThunk(
	"user/updateUserInfo",
	async (userData: { name?: string; picture?: string; auth0Sub: string }) => {
		// Only send name and picture as those are the only fields the API accepts
		const { name, picture, auth0Sub } = userData;
		const response = await fetch("/api/users/me", {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ name, picture, auth0Sub }),
		});

		if (!response.ok) {
			throw new Error("Failed to update user info");
		}

		const updatedUser = await response.json();
		return updatedUser;
	}
);

const userSlice = createSlice({
	name: "user",
	initialState,
	reducers: {
		setUser: (state, action: PayloadAction<User | null>) => {
			state.user = action.payload;
			state.initialized = true;
		},
		clearUser: (state) => {
			state.user = null;
			state.initialized = true;
		},
		clearError: (state) => {
			state.error = null;
		},
	},
	extraReducers: (builder) => {
		builder
			// Check user in DB
			.addCase(checkUserInDb.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(checkUserInDb.fulfilled, (state, action) => {
				state.loading = false;
				if (action.payload.isInDb && action.payload.user) {
					state.user = action.payload.user;
				} else if (state.user) {
					state.user.isInDb = false;
				}
			})
			.addCase(checkUserInDb.rejected, (state, action) => {
				state.loading = false;
				state.error =
					action.error.message || "Failed to check user in database";
			})
			// Add user to DB
			.addCase(addUserToDb.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(addUserToDb.fulfilled, (state, action) => {
				state.loading = false;
				if (state.user) {
					state.user = { ...state.user, ...action.payload, isInDb: true };
				}
			})
			.addCase(addUserToDb.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to add user to database";
			})
			// Get current user
			.addCase(getCurrentUser.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(getCurrentUser.fulfilled, (state, action) => {
				state.loading = false;
				state.user = action.payload;
				state.initialized = true;
			})
			.addCase(getCurrentUser.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to get current user";
			})
			// Update user info
			.addCase(updateUserInfo.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(updateUserInfo.fulfilled, (state, action) => {
				state.loading = false;
				if (state.user) {
					state.user = { ...state.user, ...action.payload };
				}
			})
			.addCase(updateUserInfo.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to update user info";
			});
	},
});

export const { setUser, clearUser, clearError } = userSlice.actions;
export default userSlice.reducer;
