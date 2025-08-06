import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

export interface EasterTask {
	id: string;
	title: string;
	description?: string;
	isCompleted: boolean;
	completedDate?: string;
	priority: "low" | "medium" | "high";
	category?: string;
	dueDate?: string;
	notes?: string;
	createdAt: string;
	updatedAt: string;
}

interface EasterTasksState {
	tasks: EasterTask[];
	loading: boolean;
	error: string | null;
	selectedTask: EasterTask | null;
	initialized: boolean;
}

const initialState: EasterTasksState = {
	tasks: [],
	loading: false,
	error: null,
	selectedTask: null,
	initialized: false,
};

// Async thunks
export const fetchEasterTasks = createAsyncThunk(
	"easterTasks/fetchEasterTasks",
	async (_, { getState }) => {
		// Get current state to check if we already have data
		const state = getState() as any;
		const currentTasks = state.easterTasks.tasks;
		const isInitialized = state.easterTasks.initialized;

		// Only fetch if we haven't initialized yet
		if (isInitialized) {
			return currentTasks;
		}

		// Simulate API call
		const response = await new Promise<EasterTask[]>((resolve) => {
			setTimeout(() => {
				resolve([
					{
						id: "1",
						title: "Buy Easter eggs",
						description: "Purchase chocolate eggs and candy for baskets",
						isCompleted: false,
						priority: "high",
						category: "Shopping",
						dueDate: new Date(
							Date.now() + 7 * 24 * 60 * 60 * 1000
						).toISOString(),
						notes: "Check local stores for best deals",
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					},
					{
						id: "2",
						title: "Decorate Easter baskets",
						description: "Set up and decorate Easter baskets for children",
						isCompleted: false,
						priority: "medium",
						category: "Decorations",
						dueDate: new Date(
							Date.now() + 1 * 24 * 60 * 60 * 1000
						).toISOString(),
						notes: "Use pastel colors and spring themes",
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					},
					{
						id: "3",
						title: "Plan Easter egg hunt",
						description: "Organize Easter egg hunt activities",
						isCompleted: false,
						priority: "high",
						category: "Events",
						dueDate: new Date(
							Date.now() + 3 * 24 * 60 * 60 * 1000
						).toISOString(),
						notes: "Include both indoor and outdoor areas",
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					},
				]);
			}, 1000);
		});
		return response;
	}
);

export const addEasterTask = createAsyncThunk(
	"easterTasks/addEasterTask",
	async (task: Omit<EasterTask, "id" | "createdAt" | "updatedAt">) => {
		// Simulate API call
		const newTask: EasterTask = {
			...task,
			id: Date.now().toString(),
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};

		await new Promise((resolve) => setTimeout(resolve, 500));
		return newTask;
	}
);

export const updateEasterTask = createAsyncThunk(
	"easterTasks/updateEasterTask",
	async (task: EasterTask) => {
		// Simulate API call
		const updatedTask: EasterTask = {
			...task,
			updatedAt: new Date().toISOString(),
		};

		await new Promise((resolve) => setTimeout(resolve, 500));
		return updatedTask;
	}
);

export const deleteEasterTask = createAsyncThunk(
	"easterTasks/deleteEasterTask",
	async (taskId: string) => {
		// Simulate API call
		await new Promise((resolve) => setTimeout(resolve, 500));
		return taskId;
	}
);

export const toggleEasterTaskCompletion = createAsyncThunk(
	"easterTasks/toggleEasterTaskCompletion",
	async (taskId: string) => {
		// Simulate API call
		await new Promise((resolve) => setTimeout(resolve, 300));
		return taskId;
	}
);

const easterTasksSlice = createSlice({
	name: "easterTasks",
	initialState,
	reducers: {
		setSelectedEasterTask: (
			state,
			action: PayloadAction<EasterTask | null>
		) => {
			state.selectedTask = action.payload;
		},
		clearEasterTaskError: (state) => {
			state.error = null;
		},
	},
	extraReducers: (builder) => {
		builder
			// Fetch Easter tasks
			.addCase(fetchEasterTasks.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchEasterTasks.fulfilled, (state, action) => {
				state.loading = false;
				state.tasks = action.payload;
				state.initialized = true; // Set initialized to true on successful fetch
			})
			.addCase(fetchEasterTasks.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to fetch Easter tasks";
			})
			// Add Easter task
			.addCase(addEasterTask.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(addEasterTask.fulfilled, (state, action) => {
				state.loading = false;
				state.tasks.push(action.payload);
			})
			.addCase(addEasterTask.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to add Easter task";
			})
			// Update Easter task
			.addCase(updateEasterTask.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(updateEasterTask.fulfilled, (state, action) => {
				state.loading = false;
				const index = state.tasks.findIndex(
					(task) => task.id === action.payload.id
				);
				if (index !== -1) {
					state.tasks[index] = action.payload;
				}
			})
			.addCase(updateEasterTask.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to update Easter task";
			})
			// Delete Easter task
			.addCase(deleteEasterTask.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(deleteEasterTask.fulfilled, (state, action) => {
				state.loading = false;
				state.tasks = state.tasks.filter((task) => task.id !== action.payload);
			})
			.addCase(deleteEasterTask.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to delete Easter task";
			})
			// Mark Easter task as completed
			.addCase(toggleEasterTaskCompletion.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(toggleEasterTaskCompletion.fulfilled, (state, action) => {
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
			.addCase(toggleEasterTaskCompletion.rejected, (state, action) => {
				state.loading = false;
				state.error =
					action.error.message || "Failed to toggle Easter task completion";
			});
	},
});

export const { setSelectedEasterTask, clearEasterTaskError } =
	easterTasksSlice.actions;
export default easterTasksSlice.reducer;
