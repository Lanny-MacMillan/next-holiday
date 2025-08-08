import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

export interface User {
	sub: string;
	email?: string;
	name?: string;
	picture?: string;
	isInDb: boolean;
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
		const response = await new Promise<{ isInDb: boolean }>((resolve) => {
			setTimeout(() => {
				// Simulate that user is not in DB (first login)
				resolve({ isInDb: false });
			}, 500);
		});
		return response;
	}
);

// Async thunk to add user to DB
export const addUserToDb = createAsyncThunk(
	"user/addUserToDb",
	async (userData: Omit<User, "isInDb">) => {
		// Simulate API call to add user to DB
		const response = await new Promise<User>((resolve) => {
			setTimeout(() => {
				resolve({ ...userData, isInDb: true });
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
			});
	},
});

export const { setUser, clearUser, clearError } = userSlice.actions;
export default userSlice.reducer;
