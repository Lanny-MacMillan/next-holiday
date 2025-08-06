import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

export interface HalloweenTask {
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

interface HalloweenTasksState {
	tasks: HalloweenTask[];
	loading: boolean;
	error: string | null;
	selectedTask: HalloweenTask | null;
	initialized: boolean;
}

const initialState: HalloweenTasksState = {
	tasks: [],
	loading: false,
	error: null,
	selectedTask: null,
	initialized: false,
};

// Async thunks
export const fetchHalloweenTasks = createAsyncThunk(
	"halloweenTasks/fetchHalloweenTasks",
	async (_, { getState }) => {
		const state = getState() as any;
		const currentTasks = state.halloweenTasks.tasks;
		const isInitialized = state.halloweenTasks.initialized;

		if (isInitialized) {
			return currentTasks;
		}

		const response = await new Promise<HalloweenTask[]>((resolve) => {
			setTimeout(() => {
				resolve([
					{
						id: "1",
						title: "Buy Halloween Candy",
						description: "Stock up on candy for trick-or-treaters",
						priority: "high",
						category: "Trick-or-Treat Prep",
						isCompleted: false,
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					},
					{
						id: "2",
						title: "Decorate Front Yard",
						description: "Set up spooky decorations outside",
						priority: "high",
						category: "Decorations Checklist",
						isCompleted: false,
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					},
					{
						id: "3",
						title: "Plan Costume",
						description: "Decide on Halloween costume",
						priority: "medium",
						category: "Costume Ideas",
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

export const addHalloweenTask = createAsyncThunk(
	"halloweenTasks/addHalloweenTask",
	async (task: Omit<HalloweenTask, "id" | "createdAt" | "updatedAt">) => {
		const response = await new Promise<HalloweenTask>((resolve) => {
			setTimeout(() => {
				const newTask: HalloweenTask = {
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

export const updateHalloweenTask = createAsyncThunk(
	"halloweenTasks/updateHalloweenTask",
	async (task: HalloweenTask) => {
		const response = await new Promise<HalloweenTask>((resolve) => {
			setTimeout(() => {
				const updatedTask: HalloweenTask = {
					...task,
					updatedAt: new Date().toISOString(),
				};
				resolve(updatedTask);
			}, 500);
		});

		return response;
	}
);

export const deleteHalloweenTask = createAsyncThunk(
	"halloweenTasks/deleteHalloweenTask",
	async (taskId: string) => {
		await new Promise<void>((resolve) => {
			setTimeout(() => {
				resolve();
			}, 500);
		});

		return taskId;
	}
);

export const toggleHalloweenTaskCompletion = createAsyncThunk(
	"halloweenTasks/toggleHalloweenTaskCompletion",
	async (taskId: string) => {
		await new Promise<void>((resolve) => {
			setTimeout(() => {
				resolve();
			}, 500);
		});

		return taskId;
	}
);

const halloweenTasksSlice = createSlice({
	name: "halloweenTasks",
	initialState,
	reducers: {
		setSelectedTask: (state, action: PayloadAction<HalloweenTask | null>) => {
			state.selectedTask = action.payload;
		},
		clearError: (state) => {
			state.error = null;
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchHalloweenTasks.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchHalloweenTasks.fulfilled, (state, action) => {
				state.loading = false;
				state.tasks = action.payload;
				state.initialized = true;
			})
			.addCase(fetchHalloweenTasks.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to fetch tasks";
			})
			.addCase(addHalloweenTask.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(addHalloweenTask.fulfilled, (state, action) => {
				state.loading = false;
				state.tasks.push(action.payload);
			})
			.addCase(addHalloweenTask.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to add task";
			})
			.addCase(updateHalloweenTask.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(updateHalloweenTask.fulfilled, (state, action) => {
				state.loading = false;
				const index = state.tasks.findIndex(
					(task) => task.id === action.payload.id
				);
				if (index !== -1) {
					state.tasks[index] = action.payload;
				}
			})
			.addCase(updateHalloweenTask.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to update task";
			})
			.addCase(deleteHalloweenTask.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(deleteHalloweenTask.fulfilled, (state, action) => {
				state.loading = false;
				state.tasks = state.tasks.filter((task) => task.id !== action.payload);
			})
			.addCase(deleteHalloweenTask.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to delete task";
			})
			.addCase(toggleHalloweenTaskCompletion.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(toggleHalloweenTaskCompletion.fulfilled, (state, action) => {
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
			.addCase(toggleHalloweenTaskCompletion.rejected, (state, action) => {
				state.loading = false;
				state.error =
					action.error.message || "Failed to toggle task completion";
			});
	},
});

export const { setSelectedTask, clearError } = halloweenTasksSlice.actions;
export default halloweenTasksSlice.reducer;
