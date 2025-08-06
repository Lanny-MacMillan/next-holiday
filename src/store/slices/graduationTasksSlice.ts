import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

export interface GraduationTask {
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

interface GraduationTasksState {
	tasks: GraduationTask[];
	loading: boolean;
	error: string | null;
	selectedTask: GraduationTask | null;
	initialized: boolean;
}

const initialState: GraduationTasksState = {
	tasks: [],
	loading: false,
	error: null,
	selectedTask: null,
	initialized: false,
};

// Async thunks
export const fetchGraduationTasks = createAsyncThunk(
	"graduationTasks/fetchGraduationTasks",
	async (_, { getState }) => {
		// Get current state to check if we already have data
		const state = getState() as any;
		const currentTasks = state.graduationTasks.tasks;
		const isInitialized = state.graduationTasks.initialized;

		// Only fetch if we haven't initialized yet
		if (isInitialized) {
			return currentTasks;
		}

		// Simulate API call
		const response = await new Promise<GraduationTask[]>((resolve) => {
			setTimeout(() => {
				resolve([
					{
						id: "1",
						title: "Plan Graduation Party",
						description: "Organize graduation celebration",
						isCompleted: false,
						priority: "high",
						category: "Events",
						notes: "Book venue and send invitations",
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					},
				]);
			}, 1000);
		});
		return response;
	}
);

export const addGraduationTask = createAsyncThunk(
	"graduationTasks/addGraduationTask",
	async (task: Omit<GraduationTask, "id" | "createdAt" | "updatedAt">) => {
		// Simulate API call
		const newTask: GraduationTask = {
			...task,
			id: Date.now().toString(),
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};

		await new Promise((resolve) => setTimeout(resolve, 500));
		return newTask;
	}
);

export const updateGraduationTask = createAsyncThunk(
	"graduationTasks/updateGraduationTask",
	async (task: GraduationTask) => {
		// Simulate API call
		const updatedTask: GraduationTask = {
			...task,
			updatedAt: new Date().toISOString(),
		};

		await new Promise((resolve) => setTimeout(resolve, 500));
		return updatedTask;
	}
);

export const deleteGraduationTask = createAsyncThunk(
	"graduationTasks/deleteGraduationTask",
	async (taskId: string) => {
		// Simulate API call
		await new Promise((resolve) => setTimeout(resolve, 500));
		return taskId;
	}
);

const graduationTasksSlice = createSlice({
	name: "graduationTasks",
	initialState,
	reducers: {
		setSelectedTask: (state, action: PayloadAction<GraduationTask | null>) => {
			state.selectedTask = action.payload;
		},
		clearError: (state) => {
			state.error = null;
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchGraduationTasks.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchGraduationTasks.fulfilled, (state, action) => {
				state.loading = false;
				state.tasks = action.payload;
				state.initialized = true;
			})
			.addCase(fetchGraduationTasks.rejected, (state, action) => {
				state.loading = false;
				state.error =
					action.error.message || "Failed to fetch graduation tasks";
			})
			.addCase(addGraduationTask.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(addGraduationTask.fulfilled, (state, action) => {
				state.loading = false;
				state.tasks.push(action.payload);
			})
			.addCase(addGraduationTask.rejected, (state, action) => {
				state.loading = false;
				state.error = action.error.message || "Failed to add graduation task";
			})
			.addCase(updateGraduationTask.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(updateGraduationTask.fulfilled, (state, action) => {
				state.loading = false;
				const index = state.tasks.findIndex(
					(task) => task.id === action.payload.id
				);
				if (index !== -1) {
					state.tasks[index] = action.payload;
				}
			})
			.addCase(updateGraduationTask.rejected, (state, action) => {
				state.loading = false;
				state.error =
					action.error.message || "Failed to update graduation task";
			})
			.addCase(deleteGraduationTask.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(deleteGraduationTask.fulfilled, (state, action) => {
				state.loading = false;
				state.tasks = state.tasks.filter((task) => task.id !== action.payload);
			})
			.addCase(deleteGraduationTask.rejected, (state, action) => {
				state.loading = false;
				state.error =
					action.error.message || "Failed to delete graduation task";
			});
	},
});

export const { setSelectedTask, clearError } = graduationTasksSlice.actions;
export default graduationTasksSlice.reducer;
