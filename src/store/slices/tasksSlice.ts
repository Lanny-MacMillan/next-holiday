import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

export interface Task {
	id: string;
	title: string;
	description?: string;
	priority: "low" | "medium" | "high";
	isCompleted: boolean;
	completedDate?: string;
	dueDate?: string;
	category?: string;
	assignedTo?: string;
	createdAt: string;
	updatedAt: string;
}

interface TasksState {
	tasks: Task[];
	loading: boolean;
	error: string | null;
	selectedTask: Task | null;
	initialized: boolean;
}

const initialState: TasksState = {
	tasks: [],
	loading: false,
	error: null,
	selectedTask: null,
	initialized: false,
};

// Async thunks
export const fetchTasks = createAsyncThunk(
	"tasks/fetchTasks",
	async (_, { getState }) => {
		// Get current state to check if we already have data
		const state = getState() as any;
		const currentTasks = state.tasks.tasks;
		const isInitialized = state.tasks.initialized;

		// Only fetch if we haven't initialized yet
		if (isInitialized) {
			return currentTasks;
		}

		// Simulate API call
		const response = await new Promise<Task[]>((resolve) => {
			setTimeout(() => {
				resolve([
					{
						id: "1",
						title: "Buy Christmas tree",
						description: "Get a 7ft artificial tree",
						priority: "high",
						isCompleted: false,
						dueDate: "2024-12-15",
						category: "shopping",
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					},
					{
						id: "2",
						title: "Wrap presents",
						description: "Wrap all purchased gifts",
						priority: "medium",
						isCompleted: false,
						dueDate: "2024-12-24",
						category: "other",
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					},
				]);
			}, 1000);
		});
		return response;
	}
);

export const addTask = createAsyncThunk(
	"tasks/addTask",
	async (task: Omit<Task, "id" | "createdAt" | "updatedAt">) => {
		// Simulate API call
		const newTask: Task = {
			...task,
			id: Date.now().toString(),
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};

		await new Promise((resolve) => setTimeout(resolve, 500));
		return newTask;
	}
);

export const updateTask = createAsyncThunk(
	"tasks/updateTask",
	async (task: Task) => {
		// Simulate API call
		const updatedTask: Task = {
			...task,
			updatedAt: new Date().toISOString(),
		};

		await new Promise((resolve) => setTimeout(resolve, 500));
		return updatedTask;
	}
);

export const deleteTask = createAsyncThunk(
	"tasks/deleteTask",
	async (taskId: string) => {
		// Simulate API call
		await new Promise((resolve) => setTimeout(resolve, 500));
		return taskId;
	}
);

export const toggleTaskCompletion = createAsyncThunk(
	"tasks/toggleTaskCompletion",
	async (taskId: string) => {
		// Simulate API call
		await new Promise((resolve) => setTimeout(resolve, 300));
		return taskId;
	}
);

const tasksSlice = createSlice({
	name: "tasks",
	initialState,
	reducers: {
		setSelectedTask: (state, action: PayloadAction<Task | null>) => {
			state.selectedTask = action.payload;
		},
		clearError: (state) => {
			state.error = null;
		},
	},
	extraReducers: (builder) => {
		builder
			// Fetch tasks
			.addCase(fetchTasks.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchTasks.fulfilled, (state, action) => {
				state.loading = false;
				state.tasks = action.payload;
				state.initialized = true; // Set initialized to true after successful fetch
			})
			.addCase(fetchTasks.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to fetch tasks";
			})
			// Add task
			.addCase(addTask.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(addTask.fulfilled, (state, action) => {
				state.loading = false;
				state.tasks.push(action.payload);
			})
			.addCase(addTask.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to add task";
			})
			// Update task
			.addCase(updateTask.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(updateTask.fulfilled, (state, action) => {
				state.loading = false;
				const index = state.tasks.findIndex(
					(task) => task.id === action.payload.id
				);
				if (index !== -1) {
					state.tasks[index] = action.payload;
				}
			})
			.addCase(updateTask.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to update task";
			})
			// Delete task
			.addCase(deleteTask.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(deleteTask.fulfilled, (state, action) => {
				state.loading = false;
				state.tasks = state.tasks.filter((task) => task.id !== action.payload);
			})
			.addCase(deleteTask.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to delete task";
			})
			// Toggle task completion
			.addCase(toggleTaskCompletion.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(toggleTaskCompletion.fulfilled, (state, action) => {
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
			.addCase(toggleTaskCompletion.rejected, (state, action) => {
				state.loading = false;
				state.error =
					action.error.message || "Failed to toggle task completion";
			});
	},
});

export const { setSelectedTask, clearError } = tasksSlice.actions;
export default tasksSlice.reducer;
