import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

export interface FathersDayTask {
	id: string;
	title: string;
	description?: string;
	category: string;
	priority: "low" | "medium" | "high";
	isCompleted: boolean;
	completedDate?: string;
	dueDate?: string;
	notes?: string;
	createdAt: string;
	updatedAt: string;
}

interface FathersDayTasksState {
	tasks: FathersDayTask[];
	loading: boolean;
	error: string | null;
	selectedTask: FathersDayTask | null;
	initialized: boolean;
}

const initialState: FathersDayTasksState = {
	tasks: [],
	loading: false,
	error: null,
	selectedTask: null,
	initialized: false,
};

// Async thunks
export const fetchFathersDayTasks = createAsyncThunk(
	"fathersDayTasks/fetchFathersDayTasks",
	async (_, { getState }) => {
		// Get current state to check if we already have data
		const state = getState() as any;
		const currentTasks = state.fathersDayTasks.tasks;
		const isInitialized = state.fathersDayTasks.initialized;

		// Only fetch if we haven't initialized yet
		if (isInitialized) {
			return currentTasks;
		}

		// Simulate API call
		const response = await new Promise<FathersDayTask[]>((resolve) => {
			setTimeout(() => {
				resolve([
					{
						id: "1",
						title: "Plan BBQ",
						description: "Organize Father's Day BBQ celebration",
						category: "Events",
						priority: "high",
						isCompleted: false,
						dueDate: "2024-06-16",
						notes: "Invite family and friends",
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					},
				]);
			}, 1000);
		});
		return response;
	}
);

export const addFathersDayTask = createAsyncThunk(
	"fathersDayTasks/addFathersDayTask",
	async (task: Omit<FathersDayTask, "id" | "createdAt" | "updatedAt">) => {
		// Simulate API call
		const newTask: FathersDayTask = {
			...task,
			id: Date.now().toString(),
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};

		await new Promise((resolve) => setTimeout(resolve, 500));
		return newTask;
	}
);

export const updateFathersDayTask = createAsyncThunk(
	"fathersDayTasks/updateFathersDayTask",
	async (task: FathersDayTask) => {
		// Simulate API call
		const updatedTask: FathersDayTask = {
			...task,
			updatedAt: new Date().toISOString(),
		};

		await new Promise((resolve) => setTimeout(resolve, 500));
		return updatedTask;
	}
);

export const deleteFathersDayTask = createAsyncThunk(
	"fathersDayTasks/deleteFathersDayTask",
	async (taskId: string) => {
		// Simulate API call
		await new Promise((resolve) => setTimeout(resolve, 500));
		return taskId;
	}
);

const fathersDayTasksSlice = createSlice({
	name: "fathersDayTasks",
	initialState,
	reducers: {
		setSelectedTask: (state, action: PayloadAction<FathersDayTask | null>) => {
			state.selectedTask = action.payload;
		},
		clearError: (state) => {
			state.error = null;
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchFathersDayTasks.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchFathersDayTasks.fulfilled, (state, action) => {
				state.loading = false;
				state.tasks = action.payload;
				state.initialized = true;
			})
			.addCase(fetchFathersDayTasks.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to fetch tasks";
			})
			.addCase(addFathersDayTask.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(addFathersDayTask.fulfilled, (state, action) => {
				state.loading = false;
				state.tasks.push(action.payload);
			})
			.addCase(addFathersDayTask.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to add task";
			})
			.addCase(updateFathersDayTask.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(updateFathersDayTask.fulfilled, (state, action) => {
				state.loading = false;
				const index = state.tasks.findIndex(
					(task) => task.id === action.payload.id
				);
				if (index !== -1) {
					state.tasks[index] = action.payload;
				}
			})
			.addCase(updateFathersDayTask.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to update task";
			})
			.addCase(deleteFathersDayTask.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(deleteFathersDayTask.fulfilled, (state, action) => {
				state.loading = false;
				state.tasks = state.tasks.filter((task) => task.id !== action.payload);
			})
			.addCase(deleteFathersDayTask.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to delete task";
			});
	},
});

export const { setSelectedTask, clearError } = fathersDayTasksSlice.actions;
export default fathersDayTasksSlice.reducer;
