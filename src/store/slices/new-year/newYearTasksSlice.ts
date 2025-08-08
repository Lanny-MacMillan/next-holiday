import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

export interface NewYearTask {
	id: string;
	title: string;
	description?: string;
	isCompleted: boolean;
	completedDate?: string;
	priority: "low" | "medium" | "high";
	category: string;
	dueDate?: string;
	notes?: string;
	createdAt: string;
	updatedAt: string;
}

interface NewYearTasksState {
	tasks: NewYearTask[];
	loading: boolean;
	error: string | null;
	selectedTask: NewYearTask | null;
	initialized: boolean;
}

const initialState: NewYearTasksState = {
	tasks: [],
	loading: false,
	error: null,
	selectedTask: null,
	initialized: false,
};

// Async thunks
export const fetchNewYearTasks = createAsyncThunk(
	"newYearTasks/fetchNewYearTasks",
	async (_, { getState }) => {
		// Get current state to check if we already have data
		const state = getState() as any;
		const currentTasks = state.newYearTasks.tasks;
		const isInitialized = state.newYearTasks.initialized;

		// Only fetch if we haven't initialized yet
		if (isInitialized) {
			return currentTasks;
		}

		// Simulate API call
		const response = await new Promise<NewYearTask[]>((resolve) => {
			setTimeout(() => {
				resolve([
					{
						id: "1",
						title: "Make New Year Resolutions",
						description:
							"Create a list of personal resolutions for the new year",
						isCompleted: false,
						priority: "high",
						category: "Resolutions",
						notes: "Focus on achievable goals",
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					},
					{
						id: "2",
						title: "Buy Party Supplies",
						description:
							"Get decorations, snacks, and drinks for New Year party",
						isCompleted: false,
						priority: "medium",
						category: "Supplies",
						notes: "Don't forget champagne and party hats",
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					},
					{
						id: "3",
						title: "Plan New Year Party",
						description: "Organize guest list and party details",
						isCompleted: false,
						priority: "high",
						category: "Events",
						notes: "Send invitations early",
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					},
					{
						id: "4",
						title: "Decorate House",
						description: "Put up New Year decorations and lights",
						isCompleted: false,
						priority: "medium",
						category: "Decorations",
						notes: "Focus on gold and silver theme",
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					},
				]);
			}, 1000);
		});
		return response;
	}
);

export const addNewYearTask = createAsyncThunk(
	"newYearTasks/addNewYearTask",
	async (task: Omit<NewYearTask, "id" | "createdAt" | "updatedAt">) => {
		// Simulate API call
		const newTask: NewYearTask = {
			...task,
			id: Date.now().toString(),
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};

		await new Promise((resolve) => setTimeout(resolve, 500));
		return newTask;
	}
);

export const updateNewYearTask = createAsyncThunk(
	"newYearTasks/updateNewYearTask",
	async (task: NewYearTask) => {
		// Simulate API call
		const updatedTask: NewYearTask = {
			...task,
			updatedAt: new Date().toISOString(),
		};

		await new Promise((resolve) => setTimeout(resolve, 500));
		return updatedTask;
	}
);

export const deleteNewYearTask = createAsyncThunk(
	"newYearTasks/deleteNewYearTask",
	async (id: string) => {
		// Simulate API call
		await new Promise((resolve) => setTimeout(resolve, 500));
		return id;
	}
);

export const toggleNewYearTaskCompletion = createAsyncThunk(
	"newYearTasks/toggleNewYearTaskCompletion",
	async (id: string) => {
		// Simulate API call
		await new Promise((resolve) => setTimeout(resolve, 500));
		return id;
	}
);

const newYearTasksSlice = createSlice({
	name: "newYearTasks",
	initialState,
	reducers: {
		setSelectedTask: (state, action: PayloadAction<NewYearTask | null>) => {
			state.selectedTask = action.payload;
		},
		clearError: (state) => {
			state.error = null;
		},
	},
	extraReducers: (builder) => {
		builder
			// Fetch tasks
			.addCase(fetchNewYearTasks.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchNewYearTasks.fulfilled, (state, action) => {
				state.loading = false;
				state.tasks = action.payload;
				state.initialized = true;
			})
			.addCase(fetchNewYearTasks.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to fetch tasks";
			})
			// Add task
			.addCase(addNewYearTask.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(addNewYearTask.fulfilled, (state, action) => {
				state.loading = false;
				state.tasks.push(action.payload);
			})
			.addCase(addNewYearTask.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to add task";
			})
			// Update task
			.addCase(updateNewYearTask.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(updateNewYearTask.fulfilled, (state, action) => {
				state.loading = false;
				const index = state.tasks.findIndex(
					(task) => task.id === action.payload.id
				);
				if (index !== -1) {
					state.tasks[index] = action.payload;
				}
			})
			.addCase(updateNewYearTask.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to update task";
			})
			// Delete task
			.addCase(deleteNewYearTask.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(deleteNewYearTask.fulfilled, (state, action) => {
				state.loading = false;
				state.tasks = state.tasks.filter((task) => task.id !== action.payload);
			})
			.addCase(deleteNewYearTask.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to delete task";
			})
			// Toggle completion
			.addCase(toggleNewYearTaskCompletion.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(toggleNewYearTaskCompletion.fulfilled, (state, action) => {
				state.loading = false;
				const task = state.tasks.find((task) => task.id === action.payload);
				if (task) {
					task.isCompleted = !task.isCompleted;
					task.completedDate = task.isCompleted
						? new Date().toISOString()
						: undefined;
				}
			})
			.addCase(toggleNewYearTaskCompletion.rejected, (state, action) => {
				state.loading = false;
				state.error =
					action.error.message || "Failed to toggle task completion";
			});
	},
});

export const { setSelectedTask, clearError } = newYearTasksSlice.actions;
export default newYearTasksSlice.reducer;
