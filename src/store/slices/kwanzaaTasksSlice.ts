import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface KwanzaaTask {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  assignedTo?: string;
  category?: string;
  dueDate?: string;
  isCompleted: boolean;
  completedDate?: string;
  createdAt: string;
  updatedAt: string;
}

interface KwanzaaTasksState {
  tasks: KwanzaaTask[];
  loading: boolean;
  error: string | null;
  selectedTask: KwanzaaTask | null;
  initialized: boolean;
}

const initialState: KwanzaaTasksState = {
  tasks: [],
  loading: false,
  error: null,
  selectedTask: null,
  initialized: false,
};

// Async thunks
export const fetchKwanzaaTasks = createAsyncThunk(
  'kwanzaaTasks/fetchKwanzaaTasks',
  async (_, { getState }) => {
    // Get current state to check if we already have data
    const state = getState() as any;
    const currentTasks = state.kwanzaaTasks.tasks;
    const isInitialized = state.kwanzaaTasks.initialized;

    // Only fetch if we haven't initialized yet
    if (isInitialized) {
      return currentTasks;
    }

    // Simulate API call
    const response = await new Promise<KwanzaaTask[]>(resolve => {
      setTimeout(() => {
        resolve([
          {
            id: '1',
            title: 'Set up Kinara',
            description: 'Place the kinara in a prominent location',
            priority: 'high',
            category: 'Decorations',
            isCompleted: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          // Preload default principle tracking tasks
          {
            id: 'principle_1',
            title: 'Umoja (Unity)',
            description: 'First day of Kwanzaa - focus on unity',
            priority: 'high',
            category: 'Daily Principles',
            isCompleted: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'principle_2',
            title: 'Kujichagulia (Self-Determination)',
            description: 'Second day of Kwanzaa - focus on self-determination',
            priority: 'high',
            category: 'Daily Principles',
            isCompleted: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'principle_3',
            title: 'Ujima (Collective Work and Responsibility)',
            description: 'Third day of Kwanzaa - focus on collective work',
            priority: 'high',
            category: 'Daily Principles',
            isCompleted: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'principle_4',
            title: 'Ujamaa (Cooperative Economics)',
            description: 'Fourth day of Kwanzaa - focus on cooperative economics',
            priority: 'high',
            category: 'Daily Principles',
            isCompleted: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'principle_5',
            title: 'Nia (Purpose)',
            description: 'Fifth day of Kwanzaa - focus on purpose',
            priority: 'high',
            category: 'Daily Principles',
            isCompleted: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'principle_6',
            title: 'Kuumba (Creativity)',
            description: 'Sixth day of Kwanzaa - focus on creativity',
            priority: 'high',
            category: 'Daily Principles',
            isCompleted: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'principle_7',
            title: 'Imani (Faith)',
            description: 'Seventh day of Kwanzaa - focus on faith',
            priority: 'high',
            category: 'Daily Principles',
            isCompleted: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'decorations_1',
            title: 'Set up Mkeka',
            description: 'Place the straw mat as the foundation',
            priority: 'high',
            category: 'Decorations',
            isCompleted: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'decorations_2',
            title: 'Arrange Kwanzaa Symbols',
            description: 'Place corn, fruits, and other symbols',
            priority: 'medium',
            category: 'Decorations',
            isCompleted: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ]);
      }, 1000);
    });
    return response;
  },
);

export const addKwanzaaTask = createAsyncThunk(
  'kwanzaaTasks/addKwanzaaTask',
  async (task: Omit<KwanzaaTask, 'id' | 'createdAt' | 'updatedAt'>) => {
    // Simulate API call
    const newTask: KwanzaaTask = {
      ...task,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await new Promise(resolve => setTimeout(resolve, 500));
    return newTask;
  },
);

export const updateKwanzaaTask = createAsyncThunk(
  'kwanzaaTasks/updateKwanzaaTask',
  async (task: KwanzaaTask) => {
    // Simulate API call
    const updatedTask: KwanzaaTask = {
      ...task,
      updatedAt: new Date().toISOString(),
    };

    await new Promise(resolve => setTimeout(resolve, 500));
    return updatedTask;
  },
);

export const deleteKwanzaaTask = createAsyncThunk(
  'kwanzaaTasks/deleteKwanzaaTask',
  async (taskId: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    return taskId;
  },
);

export const toggleKwanzaaTaskCompletion = createAsyncThunk(
  'kwanzaaTasks/toggleKwanzaaTaskCompletion',
  async (taskId: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 300));
    return taskId;
  },
);

const kwanzaaTasksSlice = createSlice({
  name: 'kwanzaaTasks',
  initialState,
  reducers: {
    setSelectedKwanzaaTask: (state, action: PayloadAction<KwanzaaTask | null>) => {
      state.selectedTask = action.payload;
    },
    clearKwanzaaTaskError: state => {
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      // Fetch Kwanzaa tasks
      .addCase(fetchKwanzaaTasks.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchKwanzaaTasks.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks = action.payload;
        state.initialized = true; // Set initialized to true on successful fetch
      })
      .addCase(fetchKwanzaaTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch Kwanzaa tasks';
      })
      // Add Kwanzaa task
      .addCase(addKwanzaaTask.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addKwanzaaTask.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks.push(action.payload);
      })
      .addCase(addKwanzaaTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to add Kwanzaa task';
      })
      // Update Kwanzaa task
      .addCase(updateKwanzaaTask.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateKwanzaaTask.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.tasks.findIndex(task => task.id === action.payload.id);
        if (index !== -1) {
          state.tasks[index] = action.payload;
        }
      })
      .addCase(updateKwanzaaTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update Kwanzaa task';
      })
      // Delete Kwanzaa task
      .addCase(deleteKwanzaaTask.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteKwanzaaTask.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks = state.tasks.filter(task => task.id !== action.payload);
      })
      .addCase(deleteKwanzaaTask.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to delete Kwanzaa task';
      })
      // Mark Kwanzaa task as completed
      .addCase(toggleKwanzaaTaskCompletion.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(toggleKwanzaaTaskCompletion.fulfilled, (state, action) => {
        state.loading = false;
        const task = state.tasks.find(t => t.id === action.payload);
        if (task) {
          task.isCompleted = !task.isCompleted;
          if (task.isCompleted) {
            task.completedDate = new Date().toISOString();
          } else {
            task.completedDate = undefined;
          }
        }
      })
      .addCase(toggleKwanzaaTaskCompletion.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.error.message || 'Failed to toggle Kwanzaa task completion';
      });
  },
});

export const { setSelectedKwanzaaTask, clearKwanzaaTaskError } =
  kwanzaaTasksSlice.actions;
export default kwanzaaTasksSlice.reducer;
