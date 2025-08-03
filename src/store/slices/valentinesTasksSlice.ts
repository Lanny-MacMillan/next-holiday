import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

export interface ValentinesTask {
	id: string;
	title: string;
	description?: string;
	isCompleted: boolean;
	completedDate?: string;
	priority: "low" | "medium" | "high";
	category: "Date Ideas" | "Reservations" | "Decorations" | "General";
	dueDate?: string;
	notes?: string;
	createdAt: string;
	updatedAt: string;
}

interface ValentinesTasksState {
	tasks: ValentinesTask[];
	loading: boolean;
	error: string | null;
	selectedTask: ValentinesTask | null;
	initialized: boolean;
}

const initialState: ValentinesTasksState = {
	tasks: [],
	loading: false,
	error: null,
	selectedTask: null,
	initialized: false,
};

// Async thunks
export const fetchValentinesTasks = createAsyncThunk(
	"valentinesTasks/fetchValentinesTasks",
	async (_, { getState }) => {
		// Get current state to check if we already have data
		const state = getState() as any;
		const currentTasks = state.valentinesTasks.tasks;
		const isInitialized = state.valentinesTasks.initialized;

		// Only fetch if we haven't initialized yet
		if (isInitialized) {
			return currentTasks;
		}

		// Simulate API call
		const response = await new Promise<ValentinesTask[]>((resolve) => {
			setTimeout(() => {
				resolve([
					{
						id: "1",
						title: "Book romantic dinner reservation",
						description:
							"Make reservation at favorite restaurant for Valentine's Day",
						isCompleted: false,
						priority: "high",
						category: "Reservations",
						dueDate: new Date(
							Date.now() + 7 * 24 * 60 * 60 * 1000
						).toISOString(), // 1 week from now
						notes: "Call at least 2 weeks in advance",
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					},
					{
						id: "2",
						title: "Plan movie night",
						description: "Choose romantic movie and prepare snacks",
						isCompleted: false,
						priority: "medium",
						category: "Date Ideas",
						notes: "Consider partner's favorite genre",
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					},
				]);
			}, 1000);
		});
		return response;
	}
);

export const addValentinesTask = createAsyncThunk(
	"valentinesTasks/addValentinesTask",
	async (task: Omit<ValentinesTask, "id" | "createdAt" | "updatedAt">) => {
		// Simulate API call
		const newTask: ValentinesTask = {
			...task,
			id: Date.now().toString(),
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};

		await new Promise((resolve) => setTimeout(resolve, 500));
		return newTask;
	}
);

export const updateValentinesTask = createAsyncThunk(
	"valentinesTasks/updateValentinesTask",
	async (task: ValentinesTask) => {
		// Simulate API call
		const updatedTask: ValentinesTask = {
			...task,
			updatedAt: new Date().toISOString(),
		};

		await new Promise((resolve) => setTimeout(resolve, 500));
		return updatedTask;
	}
);

export const deleteValentinesTask = createAsyncThunk(
	"valentinesTasks/deleteValentinesTask",
	async (taskId: string) => {
		// Simulate API call
		await new Promise((resolve) => setTimeout(resolve, 500));
		return taskId;
	}
);

export const toggleValentinesTaskCompletion = createAsyncThunk(
	"valentinesTasks/toggleValentinesTaskCompletion",
	async (taskId: string) => {
		// Simulate API call
		await new Promise((resolve) => setTimeout(resolve, 300));
		return taskId;
	}
);

const valentinesTasksSlice = createSlice({
	name: "valentinesTasks",
	initialState,
	reducers: {
		setSelectedValentinesTask: (
			state,
			action: PayloadAction<ValentinesTask | null>
		) => {
			state.selectedTask = action.payload;
		},
		clearValentinesError: (state) => {
			state.error = null;
		},
	},
	extraReducers: (builder) => {
		builder
			// Fetch Valentine's tasks
			.addCase(fetchValentinesTasks.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchValentinesTasks.fulfilled, (state, action) => {
				state.loading = false;
				state.tasks = action.payload;
				state.initialized = true; // Set initialized to true on successful fetch
			})
			.addCase(fetchValentinesTasks.rejected, (state, action) => {
				state.loading = false;
				state.error =
					action.error.message || "Failed to fetch Valentine's tasks";
			})
			// Add Valentine's task
			.addCase(addValentinesTask.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(addValentinesTask.fulfilled, (state, action) => {
				state.loading = false;
				state.tasks.push(action.payload);
			})
			.addCase(addValentinesTask.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to add Valentine's task";
			})
			// Update Valentine's task
			.addCase(updateValentinesTask.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(updateValentinesTask.fulfilled, (state, action) => {
				state.loading = false;
				const index = state.tasks.findIndex(
					(task) => task.id === action.payload.id
				);
				if (index !== -1) {
					state.tasks[index] = action.payload;
				}
			})
			.addCase(updateValentinesTask.rejected, (state, action) => {
				state.loading = false;
				state.error =
					action.error.message || "Failed to update Valentine's task";
			})
			// Delete Valentine's task
			.addCase(deleteValentinesTask.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(deleteValentinesTask.fulfilled, (state, action) => {
				state.loading = false;
				state.tasks = state.tasks.filter((task) => task.id !== action.payload);
			})
			.addCase(deleteValentinesTask.rejected, (state, action) => {
				state.loading = false;
				state.error =
					action.error.message || "Failed to delete Valentine's task";
			})
			// Mark Valentine's task as completed
			.addCase(toggleValentinesTaskCompletion.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(toggleValentinesTaskCompletion.fulfilled, (state, action) => {
				state.loading = false;
				const task = state.tasks.find((t) => t.id === action.payload);
				if (task) {
					task.isCompleted = !task.isCompleted;
					if (task.isCompleted) {
						task.completedDate = new Date().toISOString();
					} else {
						task.completedDate = undefined;
					}
				}
			})
			.addCase(toggleValentinesTaskCompletion.rejected, (state, action) => {
				state.loading = false;
				state.error =
					action.error.message ||
					"Failed to toggle Valentine's task completion";
			});
	},
});

export const { setSelectedValentinesTask, clearValentinesError } =
	valentinesTasksSlice.actions;
export default valentinesTasksSlice.reducer;
