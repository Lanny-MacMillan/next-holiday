import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

export interface FourthOfJulyTask {
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

interface FourthOfJulyTasksState {
	tasks: FourthOfJulyTask[];
	loading: boolean;
	error: string | null;
	selectedTask: FourthOfJulyTask | null;
	initialized: boolean;
}

const initialState: FourthOfJulyTasksState = {
	tasks: [],
	loading: false,
	error: null,
	selectedTask: null,
	initialized: false,
};

// Async thunks
export const fetchFourthOfJulyTasks = createAsyncThunk(
	"fourthOfJulyTasks/fetchFourthOfJulyTasks",
	async (_, { getState }) => {
		// Get current state to check if we already have data
		const state = getState() as any;
		const currentTasks = state.fourthOfJulyTasks.tasks;
		const isInitialized = state.fourthOfJulyTasks.initialized;

		// Only fetch if we haven't initialized yet
		if (isInitialized) {
			return currentTasks;
		}

		// Simulate API call
		const response = await new Promise<FourthOfJulyTask[]>((resolve) => {
			setTimeout(() => {
				resolve([
					{
						id: "1",
						title: "Buy Fireworks",
						description: "Purchase fireworks for celebration",
						category: "Events",
						priority: "high",
						isCompleted: false,
						dueDate: "2024-07-04",
						notes: "Check local regulations",
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					},
				]);
			}, 1000);
		});
		return response;
	}
);

export const addFourthOfJulyTask = createAsyncThunk(
	"fourthOfJulyTasks/addFourthOfJulyTask",
	async (task: Omit<FourthOfJulyTask, "id" | "createdAt" | "updatedAt">) => {
		// Simulate API call
		const newTask: FourthOfJulyTask = {
			...task,
			id: Date.now().toString(),
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};

		await new Promise((resolve) => setTimeout(resolve, 500));
		return newTask;
	}
);

export const updateFourthOfJulyTask = createAsyncThunk(
	"fourthOfJulyTasks/updateFourthOfJulyTask",
	async (task: FourthOfJulyTask) => {
		// Simulate API call
		const updatedTask: FourthOfJulyTask = {
			...task,
			updatedAt: new Date().toISOString(),
		};

		await new Promise((resolve) => setTimeout(resolve, 500));
		return updatedTask;
	}
);

export const deleteFourthOfJulyTask = createAsyncThunk(
	"fourthOfJulyTasks/deleteFourthOfJulyTask",
	async (taskId: string) => {
		// Simulate API call
		await new Promise((resolve) => setTimeout(resolve, 500));
		return taskId;
	}
);

export const toggleFourthOfJulyTaskCompletion = createAsyncThunk(
	"fourthOfJulyTasks/toggleFourthOfJulyTaskCompletion",
	async (taskId: string, { getState }) => {
		const state = getState() as any;
		const task = state.fourthOfJulyTasks.tasks.find(
			(t: FourthOfJulyTask) => t.id === taskId
		);

		if (!task) {
			throw new Error("Task not found");
		}

		// Simulate API call
		const response = await new Promise<FourthOfJulyTask>((resolve) => {
			setTimeout(() => {
				const updatedTask: FourthOfJulyTask = {
					...task,
					isCompleted: !task.isCompleted,
					completedDate: !task.isCompleted
						? new Date().toISOString()
						: undefined,
					updatedAt: new Date().toISOString(),
				};
				resolve(updatedTask);
			}, 500);
		});
		return response;
	}
);

const fourthOfJulyTasksSlice = createSlice({
	name: "fourthOfJulyTasks",
	initialState,
	reducers: {
		setSelectedTask: (
			state,
			action: PayloadAction<FourthOfJulyTask | null>
		) => {
			state.selectedTask = action.payload;
		},
		clearError: (state) => {
			state.error = null;
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchFourthOfJulyTasks.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchFourthOfJulyTasks.fulfilled, (state, action) => {
				state.loading = false;
				state.tasks = action.payload;
				state.initialized = true;
			})
			.addCase(fetchFourthOfJulyTasks.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to fetch tasks";
			})
			.addCase(addFourthOfJulyTask.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(addFourthOfJulyTask.fulfilled, (state, action) => {
				state.loading = false;
				state.tasks.push(action.payload);
			})
			.addCase(addFourthOfJulyTask.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to add task";
			})
			.addCase(updateFourthOfJulyTask.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(updateFourthOfJulyTask.fulfilled, (state, action) => {
				state.loading = false;
				const index = state.tasks.findIndex(
					(task) => task.id === action.payload.id
				);
				if (index !== -1) {
					state.tasks[index] = action.payload;
				}
			})
			.addCase(updateFourthOfJulyTask.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to update task";
			})
			.addCase(deleteFourthOfJulyTask.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(deleteFourthOfJulyTask.fulfilled, (state, action) => {
				state.loading = false;
				state.tasks = state.tasks.filter((task) => task.id !== action.payload);
			})
			.addCase(deleteFourthOfJulyTask.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to delete task";
			})
			// Toggle task completion
			.addCase(toggleFourthOfJulyTaskCompletion.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(toggleFourthOfJulyTaskCompletion.fulfilled, (state, action) => {
				state.loading = false;
				const index = state.tasks.findIndex(
					(task) => task.id === action.payload.id
				);
				if (index !== -1) {
					state.tasks[index] = action.payload;
				}
			})
			.addCase(toggleFourthOfJulyTaskCompletion.rejected, (state, action) => {
				state.loading = false;
				state.error =
					action.error.message || "Failed to toggle task completion";
			});
	},
});

export const { setSelectedTask, clearError } = fourthOfJulyTasksSlice.actions;
export default fourthOfJulyTasksSlice.reducer;
