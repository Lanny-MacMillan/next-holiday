import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

export interface ThanksgivingTask {
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

interface ThanksgivingTasksState {
	tasks: ThanksgivingTask[];
	loading: boolean;
	error: string | null;
	selectedTask: ThanksgivingTask | null;
	initialized: boolean;
}

const initialState: ThanksgivingTasksState = {
	tasks: [],
	loading: false,
	error: null,
	selectedTask: null,
	initialized: false,
};

// Async thunks
export const fetchThanksgivingTasks = createAsyncThunk(
	"thanksgivingTasks/fetchThanksgivingTasks",
	async (_, { getState }) => {
		const state = getState() as any;
		const currentTasks = state.thanksgivingTasks.tasks;
		const isInitialized = state.thanksgivingTasks.initialized;

		if (isInitialized) {
			return currentTasks;
		}

		const response = await new Promise<ThanksgivingTask[]>((resolve) => {
			setTimeout(() => {
				resolve([
					{
						id: "1",
						title: "Plan Thanksgiving Menu",
						description: "Decide on main dishes and sides",
						priority: "high",
						category: "Meal Planning",
						isCompleted: false,
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					},
					{
						id: "2",
						title: "Create Shopping List",
						description: "List all ingredients needed",
						priority: "high",
						category: "Shopping List",
						isCompleted: false,
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					},
					{
						id: "3",
						title: "Confirm Guest List",
						description: "Finalize who's coming to dinner",
						priority: "high",
						category: "Guest List",
						isCompleted: false,
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					},
					{
						id: "4",
						title: "Set Table Decorations",
						description: "Decorate the dining table",
						priority: "medium",
						category: "Decorations Checklist",
						isCompleted: false,
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					},
					{
						id: "5",
						title: "Buy Turkey",
						description: "Purchase the main turkey",
						priority: "high",
						category: "Shopping List",
						isCompleted: false,
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					},
					{
						id: "6",
						title: "Prepare Side Dishes",
						description: "Make mashed potatoes, stuffing, etc.",
						priority: "medium",
						category: "Meal Planning",
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

export const addThanksgivingTask = createAsyncThunk(
	"thanksgivingTasks/addThanksgivingTask",
	async (task: Omit<ThanksgivingTask, "id" | "createdAt" | "updatedAt">) => {
		const response = await new Promise<ThanksgivingTask>((resolve) => {
			setTimeout(() => {
				const newTask: ThanksgivingTask = {
					...task,
					id: Date.now().toString(),
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				};
				resolve(newTask);
			}, 500);
		});

		return response;
	}
);

export const updateThanksgivingTask = createAsyncThunk(
	"thanksgivingTasks/updateThanksgivingTask",
	async (task: ThanksgivingTask) => {
		const response = await new Promise<ThanksgivingTask>((resolve) => {
			setTimeout(() => {
				const updatedTask: ThanksgivingTask = {
					...task,
					updatedAt: new Date().toISOString(),
				};
				resolve(updatedTask);
			}, 500);
		});

		return response;
	}
);

export const deleteThanksgivingTask = createAsyncThunk(
	"thanksgivingTasks/deleteThanksgivingTask",
	async (taskId: string) => {
		await new Promise<void>((resolve) => {
			setTimeout(() => {
				resolve();
			}, 500);
		});

		return taskId;
	}
);

export const toggleThanksgivingTaskCompletion = createAsyncThunk(
	"thanksgivingTasks/toggleThanksgivingTaskCompletion",
	async (taskId: string) => {
		await new Promise<void>((resolve) => {
			setTimeout(() => {
				resolve();
			}, 500);
		});

		return taskId;
	}
);

const thanksgivingTasksSlice = createSlice({
	name: "thanksgivingTasks",
	initialState,
	reducers: {
		setSelectedTask: (
			state,
			action: PayloadAction<ThanksgivingTask | null>
		) => {
			state.selectedTask = action.payload;
		},
		clearError: (state) => {
			state.error = null;
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchThanksgivingTasks.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchThanksgivingTasks.fulfilled, (state, action) => {
				state.loading = false;
				state.tasks = action.payload;
				state.initialized = true;
			})
			.addCase(fetchThanksgivingTasks.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to fetch tasks";
			})
			.addCase(addThanksgivingTask.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(addThanksgivingTask.fulfilled, (state, action) => {
				state.loading = false;
				state.tasks.push(action.payload);
			})
			.addCase(addThanksgivingTask.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to add task";
			})
			.addCase(updateThanksgivingTask.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(updateThanksgivingTask.fulfilled, (state, action) => {
				state.loading = false;
				const index = state.tasks.findIndex(
					(task) => task.id === action.payload.id
				);
				if (index !== -1) {
					state.tasks[index] = action.payload;
				}
			})
			.addCase(updateThanksgivingTask.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to update task";
			})
			.addCase(deleteThanksgivingTask.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(deleteThanksgivingTask.fulfilled, (state, action) => {
				state.loading = false;
				state.tasks = state.tasks.filter((task) => task.id !== action.payload);
			})
			.addCase(deleteThanksgivingTask.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to delete task";
			})
			.addCase(toggleThanksgivingTaskCompletion.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(toggleThanksgivingTaskCompletion.fulfilled, (state, action) => {
				state.loading = false;
				const task = state.tasks.find((task) => task.id === action.payload);
				if (task) {
					task.isCompleted = !task.isCompleted;
					task.completedDate = task.isCompleted
						? new Date().toISOString()
						: undefined;
					task.updatedAt = new Date().toISOString();
				}
			})
			.addCase(toggleThanksgivingTaskCompletion.rejected, (state, action) => {
				state.loading = false;
				state.error =
					action.error.message || "Failed to toggle task completion";
			});
	},
});

export const { setSelectedTask, clearError } = thanksgivingTasksSlice.actions;
export default thanksgivingTasksSlice.reducer;
