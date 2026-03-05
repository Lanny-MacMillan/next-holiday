import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface MothersDayTask {
  id: string;
  title: string;
  description?: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  isCompleted: boolean;
  completedDate?: string;
  dueDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface MothersDayTasksState {
  tasks: MothersDayTask[];
  loading: boolean;
  error: string | null;
  selectedTask: MothersDayTask | null;
  initialized: boolean;
}

const initialState: MothersDayTasksState = {
  tasks: [],
  loading: false,
  error: null,
  selectedTask: null,
  initialized: false,
};

// Async thunks
export const fetchMothersDayTasks = createAsyncThunk(
  'mothersDayTasks/fetchMothersDayTasks',
  async (_, { getState }) => {
    // Get current state to check if we already have data
    const state = getState() as any;
    const currentTasks = state.mothersDayTasks.tasks;
    const isInitialized = state.mothersDayTasks.initialized;

    // Only fetch if we haven't initialized yet
    if (isInitialized) {
      return currentTasks;
    }

    // Simulate API call
    const response = await new Promise<MothersDayTask[]>(resolve => {
      setTimeout(() => {
        resolve([
          {
            id: '1',
            title: 'Order Flowers',
            description: 'Order beautiful flowers for Mom',
            category: 'Events',
            priority: 'high',
            isCompleted: false,
            dueDate: '2024-05-12',
            notes: 'Order at least a week in advance',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ]);
      }, 1000);
    });
    return response;
  },
);

export const addMothersDayTask = createAsyncThunk(
  'mothersDayTasks/addMothersDayTask',
  async (task: Omit<MothersDayTask, 'id' | 'createdAt' | 'updatedAt'>) => {
    // Simulate API call
    const newTask: MothersDayTask = {
      ...task,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await new Promise(resolve => setTimeout(resolve, 500));
    return newTask;
  },
);

export const updateMothersDayTask = createAsyncThunk(
  'mothersDayTasks/updateMothersDayTask',
  async (task: MothersDayTask) => {
    // Simulate API call
    const updatedTask: MothersDayTask = {
      ...task,
      updatedAt: new Date().toISOString(),
    };

    await new Promise(resolve => setTimeout(resolve, 500));
    return updatedTask;
  },
);

export const deleteMothersDayTask = createAsyncThunk(
  'mothersDayTasks/deleteMothersDayTask',
  async (taskId: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    return taskId;
  },
);

export const toggleMothersDayTaskCompletion = createAsyncThunk(
  'mothersDayTasks/toggleMothersDayTaskCompletion',
  async (taskId: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    return taskId;
  },
);

const mothersDayTasksSlice = createSlice({
  name: 'mothersDayTasks',
  initialState,
  reducers: {
    setSelectedTask: (state, action: PayloadAction<MothersDayTask | null>) => {
      state.selectedTask = action.payload;
    },
    clearError: state => {
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchMothersDayTasks.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMothersDayTasks.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks = action.payload;
        state.initialized = true;
      })
      .addCase(fetchMothersDayTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch tasks';
      })
      .addCase(addMothersDayTask.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addMothersDayTask.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks.push(action.payload);
      })
      .addCase(addMothersDayTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to add task';
      })
      .addCase(updateMothersDayTask.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateMothersDayTask.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.tasks.findIndex(task => task.id === action.payload.id);
        if (index !== -1) {
          state.tasks[index] = action.payload;
        }
      })
      .addCase(updateMothersDayTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update task';
      })
      .addCase(deleteMothersDayTask.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteMothersDayTask.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks = state.tasks.filter(task => task.id !== action.payload);
      })
      .addCase(deleteMothersDayTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to delete task';
      })
      .addCase(toggleMothersDayTaskCompletion.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(toggleMothersDayTaskCompletion.fulfilled, (state, action) => {
        state.loading = false;
        const task = state.tasks.find(task => task.id === action.payload);
        if (task) {
          task.isCompleted = !task.isCompleted;
          task.completedDate = task.isCompleted
            ? new Date().toISOString()
            : undefined;
          task.updatedAt = new Date().toISOString();
        }
      })
      .addCase(toggleMothersDayTaskCompletion.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to toggle task completion';
      });
  },
});

export const { setSelectedTask, clearError } = mothersDayTasksSlice.actions;
export default mothersDayTasksSlice.reducer;
