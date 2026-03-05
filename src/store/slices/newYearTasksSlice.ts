import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  isCompleted: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

interface NewYearTasksState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
}

const initialState: NewYearTasksState = {
  tasks: [],
  loading: false,
  error: null,
};

const newYearTasksSlice = createSlice({
  name: 'newYearTasks',
  initialState,
  reducers: {
    setNewYearTasks: (state, action: PayloadAction<Task[]>) => {
      state.tasks = action.payload;
      state.loading = false;
      state.error = null;
    },
    addNewYearTask: (state, action: PayloadAction<Task>) => {
      state.tasks.push(action.payload);
    },
    updateNewYearTask: (state, action: PayloadAction<Task>) => {
      const index = state.tasks.findIndex(task => task.id === action.payload.id);
      if (index !== -1) {
        state.tasks[index] = action.payload;
      }
    },
    deleteNewYearTask: (state, action: PayloadAction<string>) => {
      state.tasks = state.tasks.filter(task => task.id !== action.payload);
    },
    toggleNewYearTaskCompletion: (state, action: PayloadAction<string>) => {
      const task = state.tasks.find(task => task.id === action.payload);
      if (task) {
        task.isCompleted = !task.isCompleted;
        task.updatedAt = new Date().toISOString();
      }
    },
    setNewYearTasksLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setNewYearTasksError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const {
  setNewYearTasks,
  addNewYearTask,
  updateNewYearTask,
  deleteNewYearTask,
  toggleNewYearTaskCompletion,
  setNewYearTasksLoading,
  setNewYearTasksError,
} = newYearTasksSlice.actions;

// Async thunk for fetching New Year tasks
export const fetchNewYearTasks = () => async (dispatch: any) => {
  dispatch(setNewYearTasksLoading(true));
  try {
    // Simulate API call - replace with actual API endpoint
    const response = await fetch('/api/new-year-tasks');
    if (!response.ok) {
      throw new Error('Failed to fetch New Year tasks');
    }
    const tasks = await response.json();
    dispatch(setNewYearTasks(tasks));
  } catch (error) {
    dispatch(
      setNewYearTasksError(error instanceof Error ? error.message : 'Unknown error'),
    );
  }
};

// Async thunk for creating a new New Year task
export const createNewYearTask =
  (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) =>
  async (dispatch: any) => {
    try {
      const newTask: Task = {
        ...taskData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      dispatch(addNewYearTask(newTask));
    } catch (error) {
      dispatch(
        setNewYearTasksError(
          error instanceof Error ? error.message : 'Unknown error',
        ),
      );
    }
  };

// Async thunk for updating a New Year task
export const updateNewYearTaskAsync = (taskData: Task) => async (dispatch: any) => {
  try {
    const updatedTask: Task = {
      ...taskData,
      updatedAt: new Date().toISOString(),
    };
    dispatch(updateNewYearTask(updatedTask));
  } catch (error) {
    dispatch(
      setNewYearTasksError(error instanceof Error ? error.message : 'Unknown error'),
    );
  }
};

// Async thunk for deleting a New Year task
export const deleteNewYearTaskAsync = (taskId: string) => async (dispatch: any) => {
  try {
    dispatch(deleteNewYearTask(taskId));
  } catch (error) {
    dispatch(
      setNewYearTasksError(error instanceof Error ? error.message : 'Unknown error'),
    );
  }
};

export default newYearTasksSlice.reducer;
