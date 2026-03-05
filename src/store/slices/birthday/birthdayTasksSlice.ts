import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface BirthdayTask {
  id: string;
  title: string;
  description?: string;
  isCompleted: boolean;
  completedDate?: string;
  dueDate?: string;
  priority: 'low' | 'medium' | 'high';
  category?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface BirthdayTasksState {
  tasks: BirthdayTask[];
  loading: boolean;
  error: string | null;
  selectedTask: BirthdayTask | null;
  initialized: boolean;
}

const initialState: BirthdayTasksState = {
  tasks: [],
  loading: false,
  error: null,
  selectedTask: null,
  initialized: false,
};

// Async thunks
export const fetchBirthdayTasks = createAsyncThunk(
  'birthdayTasks/fetchBirthdayTasks',
  async (_, { getState }) => {
    // Get current state to check if we already have data
    const state = getState() as any;
    const currentTasks = state.birthdayTasks.tasks;
    const isInitialized = state.birthdayTasks.initialized;

    // Only fetch if we haven't initialized yet
    if (isInitialized) {
      return currentTasks;
    }

    // Simulate API call
    const response = await new Promise<BirthdayTask[]>(resolve => {
      setTimeout(() => {
        resolve([
          {
            id: '1',
            title: 'Plan Birthday Party',
            description: 'Organize birthday celebration',
            isCompleted: false,
            priority: 'high',
            category: 'Events',
            notes: 'Book venue and send invitations',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ]);
      }, 1000);
    });
    return response;
  },
);

export const addBirthdayTask = createAsyncThunk(
  'birthdayTasks/addBirthdayTask',
  async (task: Omit<BirthdayTask, 'id' | 'createdAt' | 'updatedAt'>) => {
    // Simulate API call
    const newTask: BirthdayTask = {
      ...task,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await new Promise(resolve => setTimeout(resolve, 500));
    return newTask;
  },
);

export const updateBirthdayTask = createAsyncThunk(
  'birthdayTasks/updateBirthdayTask',
  async (task: BirthdayTask) => {
    // Simulate API call
    const updatedTask: BirthdayTask = {
      ...task,
      updatedAt: new Date().toISOString(),
    };

    await new Promise(resolve => setTimeout(resolve, 500));
    return updatedTask;
  },
);

export const deleteBirthdayTask = createAsyncThunk(
  'birthdayTasks/deleteBirthdayTask',
  async (taskId: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    return taskId;
  },
);

export const toggleBirthdayTaskCompletion = createAsyncThunk(
  'birthdayTasks/toggleBirthdayTaskCompletion',
  async (taskId: string, { getState }) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    return taskId;
  },
);

const birthdayTasksSlice = createSlice({
  name: 'birthdayTasks',
  initialState,
  reducers: {
    setSelectedTask: (state, action: PayloadAction<BirthdayTask | null>) => {
      state.selectedTask = action.payload;
    },
    clearError: state => {
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchBirthdayTasks.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBirthdayTasks.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks = action.payload;
        state.initialized = true;
      })
      .addCase(fetchBirthdayTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch birthday tasks';
      })
      .addCase(addBirthdayTask.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addBirthdayTask.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks.push(action.payload);
      })
      .addCase(addBirthdayTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to add birthday task';
      })
      .addCase(updateBirthdayTask.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateBirthdayTask.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.tasks.findIndex(task => task.id === action.payload.id);
        if (index !== -1) {
          state.tasks[index] = action.payload;
        }
      })
      .addCase(updateBirthdayTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update birthday task';
      })
      .addCase(deleteBirthdayTask.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteBirthdayTask.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks = state.tasks.filter(task => task.id !== action.payload);
      })
      .addCase(deleteBirthdayTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to delete birthday task';
      })
      .addCase(toggleBirthdayTaskCompletion.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(toggleBirthdayTaskCompletion.fulfilled, (state, action) => {
        state.loading = false;
        const task = state.tasks.find(t => t.id === action.payload);
        if (task) {
          task.isCompleted = !task.isCompleted;
          task.completedDate = task.isCompleted
            ? new Date().toISOString()
            : undefined;
        }
      })
      .addCase(toggleBirthdayTaskCompletion.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.error.message || 'Failed to toggle birthday task completion';
      });
  },
});

export const { setSelectedTask, clearError } = birthdayTasksSlice.actions;
export const clearBirthdayTaskError = clearError;
export default birthdayTasksSlice.reducer;
