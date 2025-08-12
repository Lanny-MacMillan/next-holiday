import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

export interface HanukkahTask {
	id: string;
	title: string;
	description?: string;
	priority: "low" | "medium" | "high";
	assignedTo?: string;
	category?: string;
	dueDate?: string;
	isCompleted: boolean;
	completedDate?: string;
	createdAt: string;
	updatedAt: string;
}

interface HanukkahTasksState {
	tasks: HanukkahTask[];
	loading: boolean;
	error: string | null;
	selectedTask: HanukkahTask | null;
	initialized: boolean;
}

const initialState: HanukkahTasksState = {
	tasks: [],
	loading: false,
	error: null,
	selectedTask: null,
	initialized: false,
};

// Async thunks
export const fetchHanukkahTasks = createAsyncThunk(
	"hanukkahTasks/fetchHanukkahTasks",
	async (_, { getState }) => {
		// Get current state to check if we already have data
		const state = getState() as any;
		const currentTasks = state.hanukkahTasks.tasks;
		const isInitialized = state.hanukkahTasks.initialized;

		// Only fetch if we haven't initialized yet
		if (isInitialized) {
			return currentTasks;
		}

		// Simulate API call
		const response = await new Promise<HanukkahTask[]>((resolve) => {
			setTimeout(() => {
				resolve([
					{
						id: "1",
						title: "Set up Menorah",
						description: "Place the menorah in a prominent location",
						priority: "high",
						category: "Decorations",
						isCompleted: false,
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					},
					// Preload default candle lighting tasks
					{
						id: "candle_1",
						title: "Light 1st Candle",
						description: "First night of Hanukkah",
						priority: "high",
						category: "Candle Lighting",
						isCompleted: false,
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					},
					{
						id: "candle_2",
						title: "Light 2nd Candle",
						description: "Second night of Hanukkah",
						priority: "high",
						category: "Candle Lighting",
						isCompleted: false,
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					},
					{
						id: "candle_3",
						title: "Light 3rd Candle",
						description: "Third night of Hanukkah",
						priority: "high",
						category: "Candle Lighting",
						isCompleted: false,
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					},
					{
						id: "candle_4",
						title: "Light 4th Candle",
						description: "Fourth night of Hanukkah",
						priority: "high",
						category: "Candle Lighting",
						isCompleted: false,
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					},
					{
						id: "candle_5",
						title: "Light 5th Candle",
						description: "Fifth night of Hanukkah",
						priority: "high",
						category: "Candle Lighting",
						isCompleted: false,
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					},
					{
						id: "candle_6",
						title: "Light 6th Candle",
						description: "Sixth night of Hanukkah",
						priority: "high",
						category: "Candle Lighting",
						isCompleted: false,
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					},
					{
						id: "candle_7",
						title: "Light 7th Candle",
						description: "Seventh night of Hanukkah",
						priority: "high",
						category: "Candle Lighting",
						isCompleted: false,
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					},
					{
						id: "candle_8",
						title: "Light 8th Candle",
						description: "Eighth night of Hanukkah",
						priority: "high",
						category: "Candle Lighting",
						isCompleted: false,
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					},
					{
						id: "candle_shamash",
						title: "Light Shamash",
						description: "Light the helper candle each night",
						priority: "high",
						category: "Candle Lighting",
						isCompleted: false,
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					},
				]);
			}, 1000);
		});
		return response;
	}
);

export const addHanukkahTask = createAsyncThunk(
	"hanukkahTasks/addHanukkahTask",
	async (task: Omit<HanukkahTask, "id" | "createdAt" | "updatedAt">) => {
		// Simulate API call
		const newTask: HanukkahTask = {
			...task,
			id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};

		await new Promise((resolve) => setTimeout(resolve, 500));
		return newTask;
	}
);

export const updateHanukkahTask = createAsyncThunk(
	"hanukkahTasks/updateHanukkahTask",
	async (task: HanukkahTask) => {
		// Simulate API call
		const updatedTask: HanukkahTask = {
			...task,
			updatedAt: new Date().toISOString(),
		};

		await new Promise((resolve) => setTimeout(resolve, 500));
		return updatedTask;
	}
);

export const deleteHanukkahTask = createAsyncThunk(
	"hanukkahTasks/deleteHanukkahTask",
	async (taskId: string) => {
		// Simulate API call
		await new Promise((resolve) => setTimeout(resolve, 500));
		return taskId;
	}
);

export const toggleHanukkahTaskCompletion = createAsyncThunk(
	"hanukkahTasks/toggleHanukkahTaskCompletion",
	async (taskId: string) => {
		// Simulate API call
		await new Promise((resolve) => setTimeout(resolve, 300));
		return taskId;
	}
);

const hanukkahTasksSlice = createSlice({
	name: "hanukkahTasks",
	initialState,
	reducers: {
		setSelectedHanukkahTask: (
			state,
			action: PayloadAction<HanukkahTask | null>
		) => {
			state.selectedTask = action.payload;
		},
		clearHanukkahTaskError: (state) => {
			state.error = null;
		},
	},
	extraReducers: (builder) => {
		builder
			// Fetch Hanukkah tasks
			.addCase(fetchHanukkahTasks.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchHanukkahTasks.fulfilled, (state, action) => {
				state.loading = false;
				state.tasks = action.payload;
				state.initialized = true; // Set initialized to true on successful fetch
			})
			.addCase(fetchHanukkahTasks.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to fetch Hanukkah tasks";
			})
			// Add Hanukkah task
			.addCase(addHanukkahTask.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(addHanukkahTask.fulfilled, (state, action) => {
				state.loading = false;
				state.tasks.push(action.payload);
			})
			.addCase(addHanukkahTask.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to add Hanukkah task";
			})
			// Update Hanukkah task
			.addCase(updateHanukkahTask.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(updateHanukkahTask.fulfilled, (state, action) => {
				state.loading = false;
				const index = state.tasks.findIndex(
					(task) => task.id === action.payload.id
				);
				if (index !== -1) {
					state.tasks[index] = action.payload;
				}
			})
			.addCase(updateHanukkahTask.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to update Hanukkah task";
			})
			// Delete Hanukkah task
			.addCase(deleteHanukkahTask.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(deleteHanukkahTask.fulfilled, (state, action) => {
				state.loading = false;
				state.tasks = state.tasks.filter((task) => task.id !== action.payload);
			})
			.addCase(deleteHanukkahTask.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to delete Hanukkah task";
			})
			// Mark Hanukkah task as completed
			.addCase(toggleHanukkahTaskCompletion.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(toggleHanukkahTaskCompletion.fulfilled, (state, action) => {
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
			.addCase(toggleHanukkahTaskCompletion.rejected, (state, action) => {
				state.loading = false;
				state.error =
					action.error.message || "Failed to toggle Hanukkah task completion";
			});
	},
});

export const { setSelectedHanukkahTask, clearHanukkahTaskError } =
	hanukkahTasksSlice.actions;
export default hanukkahTasksSlice.reducer;
