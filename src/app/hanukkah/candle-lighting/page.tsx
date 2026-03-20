'use client';

import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useHolidayPageData } from '@/hooks/useHolidayPageData';
import { useHolidayMutations } from '@/hooks/useHolidayMutations';
import { useRefreshHomeData } from '@/hooks/useRefreshHomeData';
import { fetchContacts } from '@/store/slices/addressBookSlice';
import {
  updateTaskInHomeData,
  addTaskToHomeData,
  removeTaskFromHomeData,
  setHomeData,
} from '@/store/slices/homeSlice';
import { selectIsHolidayShared } from '@/store/slices/sharesSlice';
import SortModal from '@/components/modals/SortModal';
import FormModal from '@/components/modals/FormModal';
import HolidayPageHeader from '@/components/common/HolidayPageHeader';
import AddButton from '@/components/common/AddButton';
import TaskSection from '@/components/common/TaskSection';
import ToDoCard from '@/components/cards/to-do/ToDoCard';

type SortOption = 'priority' | 'dateDue' | 'assignedTo' | 'category' | 'none';

const defaultCandleTasks = [
  {
    title: 'Light 1st Candle',
    description: 'First night of Hanukkah - Light the shamash and first candle',
    category: 'Candle Lighting',
    priority: 'high' as const,
  },
  {
    title: 'Light 2nd Candle',
    description: 'Second night of Hanukkah - Light the shamash and two candles',
    category: 'Candle Lighting',
    priority: 'high' as const,
  },
  {
    title: 'Light 3rd Candle',
    description: 'Third night of Hanukkah - Light the shamash and three candles',
    category: 'Candle Lighting',
    priority: 'high' as const,
  },
  {
    title: 'Light 4th Candle',
    description: 'Fourth night of Hanukkah - Light the shamash and four candles',
    category: 'Candle Lighting',
    priority: 'high' as const,
  },
  {
    title: 'Light 5th Candle',
    description: 'Fifth night of Hanukkah - Light the shamash and five candles',
    category: 'Candle Lighting',
    priority: 'high' as const,
  },
  {
    title: 'Light 6th Candle',
    description: 'Sixth night of Hanukkah - Light the shamash and six candles',
    category: 'Candle Lighting',
    priority: 'high' as const,
  },
  {
    title: 'Light 7th Candle',
    description: 'Seventh night of Hanukkah - Light the shamash and seven candles',
    category: 'Candle Lighting',
    priority: 'high' as const,
  },
  {
    title: 'Light 8th Candle',
    description: 'Eighth night of Hanukkah - Light the shamash and eight candles',
    category: 'Candle Lighting',
    priority: 'high' as const,
  },
];

export default function CandleLightingPage() {
  const dispatch = useAppDispatch();
  const { contacts } = useAppSelector((state: any) => state.addressBook);

  // Use centralized holiday page data hook
  const { holidayId, holidayData, auth0User, homeInitialized } =
    useHolidayPageData();

  // Use standardized mutation hooks for task operations
  const {
    createTask,
    updateTask,
    deleteTask,
    createLoading,
    updateLoading,
    deleteLoading,
  } = useHolidayMutations({ holidayId, auth0User });

  // Use standardized data refresh hook
  const { refreshHomeData } = useRefreshHomeData();

  // Check if the holiday is shared to conditionally show assign to field
  const isHolidayShared = useAppSelector((state: any) =>
    selectIsHolidayShared(state, holidayId!),
  );

  // Redux data access - candle lighting are stored as tasks with category "Candle Lighting"
  const candleLighting =
    holidayData?.tasks?.filter((task: any) => task.category === 'Candle Lighting') ||
    [];
  const isLoading = !homeInitialized;
  const error = null;

  // State management
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDefaultTasks, setShowDefaultTasks] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('none');
  const [showSortModal, setShowSortModal] = useState(false);

  useEffect(() => {
    // Always fetch contacts for address book functionality
    dispatch(fetchContacts());
  }, [dispatch]);

  // Check if default candle tasks exist
  useEffect(() => {
    if (candleLighting.length === 0 && homeInitialized) {
      setShowDefaultTasks(true);
    }
  }, [candleLighting, homeInitialized]);

  // CRUD Operations
  async function handleAddTask(values: Record<string, any>) {
    if (!values.title?.trim()) return;
    if (!holidayId || !auth0User) return;

    try {
      const result = await createTask({
        title: values.title,
        description: values.description || undefined,
        priority: values.priority as 'low' | 'medium' | 'high',
        assignedTo: values.assignedTo || undefined,
        category: 'Candle Lighting',
        dueDate: values.dueDate || undefined,
      });

      // Update Redux state immediately
      dispatch(addTaskToHomeData({ holidayId: holidayId, task: result }));

      // Refresh home data to ensure UI is in sync
      await refreshHomeData(auth0User, holidayId);

      setShowForm(false);
    } catch (error) {
      console.error('Error creating candle lighting task:', error);
    }
  }

  async function addDefaultCandleTasks() {
    if (!holidayId || !auth0User) return;

    try {
      // Add default candle tasks one at a time with full completion before next
      for (let i = 0; i < defaultCandleTasks.length; i++) {
        const task = defaultCandleTasks[i];

        console.log(
          `Adding candle task ${i + 1}/${defaultCandleTasks.length}: ${task.title}`,
        );

        try {
          const result = await createTask({
            title: task.title,
            description: task.description,
            priority: task.priority,
            category: task.category,
          });

          console.log(`✅ Added task ${i + 1}: ${result.title}`);

          // Add to Redux
          dispatch(addTaskToHomeData({ holidayId: holidayId, task: result }));

          // Refresh home data after each task to ensure consistency
          await refreshHomeData(auth0User, holidayId);
        } catch (taskError) {
          console.error(`❌ Error adding task ${i + 1}:`, taskError);
        }
      }

      console.log('✅ All candle tasks added successfully');
      setShowDefaultTasks(false);
    } catch (error) {
      console.error('Failed to add default tasks:', error);
    }
  }

  async function handleToggleTask(taskId: string) {
    if (!holidayId || !auth0User) return;

    try {
      // Find the current task to get its completion status
      const currentTask = candleLighting.find((task: any) => task.id === taskId);
      if (!currentTask) {
        console.error('Task not found:', taskId);
        return;
      }

      // Toggle the completion status
      const newCompletionStatus = !currentTask.isCompleted;

      const result = await updateTask(taskId, { isCompleted: newCompletionStatus });

      // Update Redux state
      dispatch(
        updateTaskInHomeData({
          holidayId: holidayId,
          taskId: taskId,
          updates: { isCompleted: newCompletionStatus },
        }),
      );

      // Refresh home data to update progress on main holiday page
      await refreshHomeData(auth0User, holidayId);
    } catch (error) {
      console.error('Failed to toggle task:', error);
    }
  }

  const handleEditTask = (task: any) => {
    setEditingTask(task);
    setShowEditModal(true);
  };

  async function handleEditTaskSubmit(values: Record<string, any>) {
    if (!editingTask || !holidayId || !auth0User) return;

    try {
      const result = await updateTask(editingTask.id, {
        title: values.title,
        description: values.description || undefined,
        priority: values.priority as 'low' | 'medium' | 'high',
        assignedTo: values.assignedTo || undefined,
        dueDate: values.dueDate || undefined,
      });

      // Update Redux state
      dispatch(
        updateTaskInHomeData({
          holidayId: holidayId,
          taskId: editingTask.id,
          updates: result,
        }),
      );

      // Refresh home data to ensure UI is in sync
      await refreshHomeData(auth0User, holidayId);

      setEditingTask(null);
      setShowEditModal(false);
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  }

  async function handleDeleteTask(taskId: string) {
    if (!holidayId || !auth0User) return;

    try {
      await deleteTask(taskId);

      // Remove from Redux state on success
      dispatch(removeTaskFromHomeData({ holidayId: holidayId, taskId }));

      // Refresh home data to ensure UI is in sync
      await refreshHomeData(auth0User, holidayId);

      // Check if this was the last task and re-show default tasks prompt
      const remainingTasks = candleLighting.filter((c: any) => c.id !== taskId);
      console.log('Candle Lighting after delete:', remainingTasks.length);
      if (remainingTasks.length === 0) {
        console.log('No tasks remaining, showing default tasks prompt');
        setShowDefaultTasks(true);
      }
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  }

  function openForm() {
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
  }

  function closeEditModal() {
    setShowEditModal(false);
    setEditingTask(null);
  }

  // Task sorting function from Kwanzaa
  function sortTasks(tasksToSort: any[]): any[] {
    switch (sortBy) {
      case 'priority':
        const priorityOrder: { [key: string]: number } = {
          high: 3,
          medium: 2,
          low: 1,
        };
        return [...tasksToSort].sort(
          (a, b) => priorityOrder[b.priority] - priorityOrder[a.priority],
        );
      case 'dateDue':
        return [...tasksToSort].sort((a, b) => {
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        });
      case 'assignedTo':
        return [...tasksToSort].sort((a, b) =>
          (a.assignedTo || '').localeCompare(b.assignedTo || ''),
        );
      case 'category':
        return [...tasksToSort].sort((a, b) =>
          (a.category || '').localeCompare(b.category || ''),
        );
      default:
        return tasksToSort;
    }
  }

  const loading = createLoading || updateLoading || deleteLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen hanukkah-tasks-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">
            Loading candle lighting...
          </p>
        </div>
      </div>
    );
  }

  const sortedTasks = sortTasks(candleLighting);
  const incompleteCandleLighting = sortedTasks.filter(
    (task: any) => !task.isCompleted,
  );
  const completedCandleLighting = sortedTasks.filter(
    (task: any) => task.isCompleted,
  );

  // FormModal fields configuration - matching Kwanzaa exactly
  const formFields = [
    {
      id: 'title',
      type: 'text' as const,
      placeholder: 'Candle Lighting Task*',
      required: true,
    },
    {
      id: 'description',
      type: 'textarea' as const,
      placeholder: 'Description',
      rows: 2,
    },
    {
      id: 'priority',
      type: 'select' as const,
      placeholder: 'Priority',
      options: [
        { value: 'low', label: 'Low Priority' },
        { value: 'medium', label: 'Medium Priority' },
        { value: 'high', label: 'High Priority' },
      ],
    },
    ...(isHolidayShared
      ? [
          {
            id: 'assignedTo',
            type: 'text' as const,
            placeholder: 'Assigned To',
          },
        ]
      : []),
    {
      id: 'dueDate',
      type: 'date' as const,
      placeholder: 'Due Date',
    },
  ];

  return (
    <div className="min-h-screen hanukkah-tasks-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
      <HolidayPageHeader
        title="Candle Lighting Tracker"
        backHref="/hanukkah"
        onSortClick={() => setShowSortModal(true)}
        description="Keep track of your Hanukkah candle lighting!"
        holidayColor="blue-500"
        sortTitle="Sort Candle Lighting"
      />

      <main className="flex-1 w-full max-w-4xl flex flex-col gap-6 mt-4">
        {/* Default Tasks Prompt */}
        {showDefaultTasks && (
          <div className="card card-tasks rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700">
            <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
              🕯️ Set Up Hanukkah Candle Lighting
            </h3>
            <p className="text-blue-700 dark:text-blue-300 text-sm mb-3">
              Would you like to add the 8 nights of Hanukkah candle lighting tasks?
            </p>
            <div className="flex gap-2">
              <button
                onClick={addDefaultCandleTasks}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors text-sm"
              >
                Add Default Tasks
              </button>
              <button
                onClick={() => setShowDefaultTasks(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors text-sm"
              >
                Skip
              </button>
            </div>
          </div>
        )}

        <AddButton title="Candle Lighting Task" onClick={openForm} color="blue" />

        {/* Candle Lighting Status Summary */}
        {candleLighting.length > 0 && (
          <div className="card rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
              Candle Lighting Status
            </h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {candleLighting.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Total Tasks
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {completedCandleLighting.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Completed
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {incompleteCandleLighting.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Remaining
                </div>
              </div>
            </div>
          </div>
        )}

        <TaskSection
          title="Upcoming Candle Lighting"
          items={incompleteCandleLighting}
          isCompleted={false}
          emptyMessage="No candle lighting tasks yet."
          completedMessage="All candles lit!"
          renderItem={(task: any) => (
            <ToDoCard
              key={task.id}
              task={task}
              onToggleComplete={handleToggleTask}
              onDelete={handleDeleteTask}
              onEdit={handleEditTask}
              theme={{
                accentColor: '#3b82f6', // Blue for Hanukkah
              }}
              borderColor="rgb(59 130 246)" // Blue border for Hanukkah
              disableInternalModal={true}
            />
          )}
        />

        <TaskSection
          title="Completed Candle Lighting"
          items={completedCandleLighting}
          isCompleted={true}
          emptyMessage=""
          completedMessage=""
          renderItem={(task: any) => (
            <ToDoCard
              key={task.id}
              task={task}
              onToggleComplete={handleToggleTask}
              onDelete={handleDeleteTask}
              onEdit={handleEditTask}
              theme={{
                accentColor: '#3b82f6', // Blue for Hanukkah
              }}
              borderColor="rgb(59 130 246)" // Blue border for Hanukkah
              disableInternalModal={true}
            />
          )}
        />
      </main>

      {/* Form Modal */}
      <FormModal
        isOpen={showForm}
        title="Add New Candle Lighting Task"
        fields={formFields}
        initialValues={{
          title: '',
          description: '',
          priority: 'medium',
          ...(isHolidayShared ? { assignedTo: '' } : {}),
          dueDate: '',
        }}
        onSubmit={handleAddTask}
        onClose={closeForm}
        loading={false}
        submitText="Add Task"
        cardClassName="card-tasks"
      />

      {/* Edit Modal */}
      <FormModal
        isOpen={showEditModal}
        title="Edit Candle Lighting Task"
        fields={formFields}
        initialValues={{
          title: editingTask?.title || '',
          description: editingTask?.description || '',
          priority: editingTask?.priority || 'medium',
          ...(isHolidayShared ? { assignedTo: editingTask?.assignedTo || '' } : {}),
          dueDate: editingTask?.dueDate || '',
        }}
        onSubmit={handleEditTaskSubmit}
        onClose={closeEditModal}
        loading={false}
        submitText="Update Task"
        cardClassName="card-tasks"
      />

      {/* Sort Modal */}
      <SortModal
        isOpen={showSortModal}
        onClose={() => setShowSortModal(false)}
        sortBy={sortBy}
        onSortChange={(sortOption: string) => setSortBy(sortOption as SortOption)}
        sortOptions={[
          { value: 'none', label: 'None' },
          { value: 'priority', label: 'Priority' },
          { value: 'dateDue', label: 'Date Due' },
          ...(isHolidayShared
            ? [{ value: 'assignedTo', label: 'Assigned To' }]
            : []),
          { value: 'category', label: 'Category' },
        ]}
        title="Sort Tasks"
      />
    </div>
  );
}
