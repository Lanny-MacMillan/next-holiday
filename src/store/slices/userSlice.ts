import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

export interface User {
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

// Async thunk to check if user exists in DB
export const checkUserInDb = createAsyncThunk(
	"user/checkUserInDb",
	async (userSub: string) => {
		// Simulate API call to check if user exists in DB
		const response = await new Promise<{
			isInDb: boolean;
			isFirstLogin: boolean;
		}>((resolve) => {
			setTimeout(() => {
				// Check localStorage for existing user data
				const existingUser = localStorage.getItem(`user_${userSub}`);
				if (existingUser) {
					resolve({ isInDb: true, isFirstLogin: false });
				} else {
					resolve({ isInDb: false, isFirstLogin: true });
				}
			}, 500);
		});
		return response;
	}
);

// Async thunk to add user to DB (first login)
export const addUserToDb = createAsyncThunk(
	"user/addUserToDb",
	async (userData: Omit<User, "isInDb" | "isFirstLogin" | "lastUpdated">) => {
		// Simulate API call to add user to DB
		const response = await new Promise<User>((resolve) => {
			setTimeout(() => {
				const newUser: User = {
					...userData,
					isInDb: true,
					isFirstLogin: false,
					lastUpdated: new Date().toISOString(),
				};

				// Save to localStorage for persistence
				localStorage.setItem(`user_${userData.sub}`, JSON.stringify(newUser));

				resolve(newUser);
			}, 500);
		});
		return response;
	}
);

// Async thunk to load existing user data
export const loadUserData = createAsyncThunk(
	"user/loadUserData",
	async (userSub: string) => {
		// Load user data from localStorage
		const existingUser = localStorage.getItem(`user_${userSub}`);
		if (existingUser) {
			return JSON.parse(existingUser) as User;
		}
		throw new Error("User data not found");
	}
);

// Async thunk to update user information
export const updateUserInfo = createAsyncThunk(
	"user/updateUserInfo",
	async (userData: Partial<User>) => {
		// Simulate API call to update user info
		const response = await new Promise<User>((resolve) => {
			setTimeout(() => {
				const updatedUser: User = {
					...userData,
					lastUpdated: new Date().toISOString(),
				} as User;

				// Update localStorage
				if (userData.sub) {
					localStorage.setItem(
						`user_${userData.sub}`,
						JSON.stringify(updatedUser)
					);
				}

				resolve(updatedUser);
			}, 500);
		});
		return response;
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
		updateUserName: (state, action: PayloadAction<string>) => {
			if (state.user) {
				state.user.name = action.payload;
				state.user.lastUpdated = new Date().toISOString();
				// Update localStorage
				localStorage.setItem(
					`user_${state.user.sub}`,
					JSON.stringify(state.user)
				);
			}
		},
		updateUserEmail: (state, action: PayloadAction<string>) => {
			if (state.user) {
				state.user.email = action.payload;
				state.user.lastUpdated = new Date().toISOString();
				// Update localStorage
				localStorage.setItem(
					`user_${state.user.sub}`,
					JSON.stringify(state.user)
				);
			}
		},
		updateUserPicture: (state, action: PayloadAction<string>) => {
			if (state.user) {
				state.user.picture = action.payload;
				state.user.lastUpdated = new Date().toISOString();
				// Update localStorage
				localStorage.setItem(
					`user_${state.user.sub}`,
					JSON.stringify(state.user)
				);
			}
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
				if (state.user) {
					state.user.isInDb = action.payload.isInDb;
					state.user.isFirstLogin = action.payload.isFirstLogin;
				}
			})
			.addCase(checkUserInDb.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to check user in DB";
			})
			// Add user to DB
			.addCase(addUserToDb.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(addUserToDb.fulfilled, (state, action) => {
				state.loading = false;
				state.user = action.payload;
			})
			.addCase(addUserToDb.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to add user to DB";
			})
			// Load user data
			.addCase(loadUserData.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(loadUserData.fulfilled, (state, action) => {
				state.loading = false;
				state.user = action.payload;
				state.initialized = true;
			})
			.addCase(loadUserData.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to load user data";
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

export const {
	setUser,
	clearUser,
	clearError,
	updateUserName,
	updateUserEmail,
	updateUserPicture,
} = userSlice.actions;
export default userSlice.reducer;
