import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

export interface AnniversaryTask {
	id: string;
	title: string;
	description?: string;
	isCompleted: boolean;
	completedDate?: string;
	dueDate?: string;
	priority: "low" | "medium" | "high";
	category?: string;
	notes?: string;
	createdAt: string;
	updatedAt: string;
}

interface AnniversaryTasksState {
	tasks: AnniversaryTask[];
	loading: boolean;
	error: string | null;
	selectedTask: AnniversaryTask | null;
	initialized: boolean;
}

const initialState: AnniversaryTasksState = {
	tasks: [],
	loading: false,
	error: null,
	selectedTask: null,
	initialized: false,
};

// Async thunks
export const fetchAnniversaryTasks = createAsyncThunk(
	"anniversaryTasks/fetchAnniversaryTasks",
	async (_, { getState }) => {
		// Get current state to check if we already have data
		const state = getState() as any;
		const currentTasks = state.anniversaryTasks.tasks;
		const isInitialized = state.anniversaryTasks.initialized;

		// Only fetch if we haven't initialized yet
		if (isInitialized) {
			return currentTasks;
		}

		// Simulate API call
		const response = await new Promise<AnniversaryTask[]>((resolve) => {
			setTimeout(() => {
				resolve([
					{
						id: "1",
						title: "Plan Romantic Date",
						description: "Organize special anniversary date",
						isCompleted: false,
						priority: "high",
						category: "Planning",
						notes: "Book restaurant and activities",
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					},
				]);
			}, 1000);
		});
		return response;
	}
);

export const addAnniversaryTask = createAsyncThunk(
	"anniversaryTasks/addAnniversaryTask",
	async (task: Omit<AnniversaryTask, "id" | "createdAt" | "updatedAt">) => {
		// Simulate API call
		const newTask: AnniversaryTask = {
			...task,
			id: Date.now().toString(),
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};

		await new Promise((resolve) => setTimeout(resolve, 500));
		return newTask;
	}
);

export const updateAnniversaryTask = createAsyncThunk(
	"anniversaryTasks/updateAnniversaryTask",
	async (task: AnniversaryTask) => {
		// Simulate API call
		const updatedTask: AnniversaryTask = {
			...task,
			updatedAt: new Date().toISOString(),
		};

		await new Promise((resolve) => setTimeout(resolve, 500));
		return updatedTask;
	}
);

export const deleteAnniversaryTask = createAsyncThunk(
	"anniversaryTasks/deleteAnniversaryTask",
	async (taskId: string) => {
		// Simulate API call
		await new Promise((resolve) => setTimeout(resolve, 500));
		return taskId;
	}
);

const anniversaryTasksSlice = createSlice({
	name: "anniversaryTasks",
	initialState,
	reducers: {
		setSelectedTask: (state, action: PayloadAction<AnniversaryTask | null>) => {
			state.selectedTask = action.payload;
		},
		clearError: (state) => {
			state.error = null;
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchAnniversaryTasks.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchAnniversaryTasks.fulfilled, (state, action) => {
				state.loading = false;
				state.tasks = action.payload;
				state.initialized = true;
			})
			.addCase(fetchAnniversaryTasks.rejected, (state, action) => {
				state.loading = false;
				state.error =
					action.error.message || "Failed to fetch anniversary tasks";
			})
			.addCase(addAnniversaryTask.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(addAnniversaryTask.fulfilled, (state, action) => {
				state.loading = false;
				state.tasks.push(action.payload);
			})
			.addCase(addAnniversaryTask.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to add anniversary task";
			})
			.addCase(updateAnniversaryTask.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(updateAnniversaryTask.fulfilled, (state, action) => {
				state.loading = false;
				const index = state.tasks.findIndex(
					(task) => task.id === action.payload.id
				);
				if (index !== -1) {
					state.tasks[index] = action.payload;
				}
			})
			.addCase(updateAnniversaryTask.rejected, (state, action) => {
				state.loading = false;
				state.error =
					action.error.message || "Failed to update anniversary task";
			})
			.addCase(deleteAnniversaryTask.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(deleteAnniversaryTask.fulfilled, (state, action) => {
				state.loading = false;
				state.tasks = state.tasks.filter((task) => task.id !== action.payload);
			})
			.addCase(deleteAnniversaryTask.rejected, (state, action) => {
				state.loading = false;
				state.error =
					action.error.message || "Failed to delete anniversary task";
			});
	},
});

export const { setSelectedTask, clearError } = anniversaryTasksSlice.actions;
export default anniversaryTasksSlice.reducer;
