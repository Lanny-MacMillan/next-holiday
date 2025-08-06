import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

export interface BabyShowerTask {
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

interface BabyShowerTasksState {
	tasks: BabyShowerTask[];
	loading: boolean;
	error: string | null;
	selectedTask: BabyShowerTask | null;
	initialized: boolean;
}

const initialState: BabyShowerTasksState = {
	tasks: [],
	loading: false,
	error: null,
	selectedTask: null,
	initialized: false,
};

// Async thunks
export const fetchBabyShowerTasks = createAsyncThunk(
	"babyShowerTasks/fetchBabyShowerTasks",
	async (_, { getState }) => {
		// Get current state to check if we already have data
		const state = getState() as any;
		const currentTasks = state.babyShowerTasks.tasks;
		const isInitialized = state.babyShowerTasks.initialized;

		// Only fetch if we haven't initialized yet
		if (isInitialized) {
			return currentTasks;
		}

		// Simulate API call
		const response = await new Promise<BabyShowerTask[]>((resolve) => {
			setTimeout(() => {
				resolve([
					{
						id: "1",
						title: "Plan Baby Shower Games",
						description: "Organize fun baby shower activities",
						isCompleted: false,
						priority: "high",
						category: "Events",
						notes: "Include prizes for winners",
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					},
				]);
			}, 1000);
		});
		return response;
	}
);

export const addBabyShowerTask = createAsyncThunk(
	"babyShowerTasks/addBabyShowerTask",
	async (task: Omit<BabyShowerTask, "id" | "createdAt" | "updatedAt">) => {
		// Simulate API call
		const newTask: BabyShowerTask = {
			...task,
			id: Date.now().toString(),
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};

		await new Promise((resolve) => setTimeout(resolve, 500));
		return newTask;
	}
);

export const updateBabyShowerTask = createAsyncThunk(
	"babyShowerTasks/updateBabyShowerTask",
	async (task: BabyShowerTask) => {
		// Simulate API call
		const updatedTask: BabyShowerTask = {
			...task,
			updatedAt: new Date().toISOString(),
		};

		await new Promise((resolve) => setTimeout(resolve, 500));
		return updatedTask;
	}
);

export const deleteBabyShowerTask = createAsyncThunk(
	"babyShowerTasks/deleteBabyShowerTask",
	async (taskId: string) => {
		// Simulate API call
		await new Promise((resolve) => setTimeout(resolve, 500));
		return taskId;
	}
);

const babyShowerTasksSlice = createSlice({
	name: "babyShowerTasks",
	initialState,
	reducers: {
		setSelectedTask: (state, action: PayloadAction<BabyShowerTask | null>) => {
			state.selectedTask = action.payload;
		},
		clearError: (state) => {
			state.error = null;
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchBabyShowerTasks.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchBabyShowerTasks.fulfilled, (state, action) => {
				state.loading = false;
				state.tasks = action.payload;
				state.initialized = true;
			})
			.addCase(fetchBabyShowerTasks.rejected, (state, action) => {
				state.loading = false;
				state.error =
					action.error.message || "Failed to fetch baby shower tasks";
			})
			.addCase(addBabyShowerTask.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(addBabyShowerTask.fulfilled, (state, action) => {
				state.loading = false;
				state.tasks.push(action.payload);
			})
			.addCase(addBabyShowerTask.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to add baby shower task";
			})
			.addCase(updateBabyShowerTask.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(updateBabyShowerTask.fulfilled, (state, action) => {
				state.loading = false;
				const index = state.tasks.findIndex(
					(task) => task.id === action.payload.id
				);
				if (index !== -1) {
					state.tasks[index] = action.payload;
				}
			})
			.addCase(updateBabyShowerTask.rejected, (state, action) => {
				state.loading = false;
				state.error =
					action.error.message || "Failed to update baby shower task";
			})
			.addCase(deleteBabyShowerTask.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(deleteBabyShowerTask.fulfilled, (state, action) => {
				state.loading = false;
				state.tasks = state.tasks.filter((task) => task.id !== action.payload);
			})
			.addCase(deleteBabyShowerTask.rejected, (state, action) => {
				state.loading = false;
				state.error =
					action.error.message || "Failed to delete baby shower task";
			});
	},
});

export const { setSelectedTask, clearError } = babyShowerTasksSlice.actions;
export default babyShowerTasksSlice.reducer;
