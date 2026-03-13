'use client';

import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useHolidayPageData } from '@/hooks/useHolidayPageData';
import { useHolidayMutations } from '@/hooks/useHolidayMutations';
import { useRefreshHomeData } from '@/hooks/useRefreshHomeData';
import {
  updateTaskInHomeData,
  setHomeData,
  addTaskToHomeData,
  removeTaskFromHomeData,
} from '@/store/slices/homeSlice';
import { selectIsHolidayShared } from '@/store/slices/sharesSlice';
import SortModal from '@/components/modals/SortModal';
import FormModal from '@/components/modals/FormModal';
import HolidayPageHeader from '@/components/common/HolidayPageHeader';
import AddButton from '@/components/common/AddButton';
import TaskSection from '@/components/common/TaskSection';
import ToDoCard from '@/components/cards/to-do/ToDoCard';
import { toDateOnlyString } from '@/lib/dates';

type SortOption = 'priority' | 'dateDue' | 'assignedTo' | 'category' | 'none';

// Default Kwanzaa principles for preloading
const defaultKwanzaaPrinciples = [
  {
    dayNumber: 1,
    name: 'Umoja (Unity)',
    description: 'First day of Kwanzaa - focus on unity',
    priority: 'high' as const,
  },
  {
    dayNumber: 2,
    name: 'Kujichagulia (Self-Determination)',
    description: 'Second day of Kwanzaa - focus on self-determination',
    priority: 'high' as const,
  },
  {
    dayNumber: 3,
    name: 'Ujima (Collective Work and Responsibility)',
    description: 'Third day of Kwanzaa - focus on collective work',
    priority: 'high' as const,
  },
  {
    dayNumber: 4,
    name: 'Ujamaa (Cooperative Economics)',
    description: 'Fourth day of Kwanzaa - focus on cooperative economics',
    priority: 'high' as const,
  },
  {
    dayNumber: 5,
    name: 'Nia (Purpose)',
    description: 'Fifth day of Kwanzaa - focus on purpose',
    priority: 'high' as const,
  },
  {
    dayNumber: 6,
    name: 'Kuumba (Creativity)',
    description: 'Sixth day of Kwanzaa - focus on creativity',
    priority: 'high' as const,
  },
  {
    dayNumber: 7,
    name: 'Imani (Faith)',
    description: 'Seventh day of Kwanzaa - focus on faith',
    priority: 'high' as const,
  },
];

export default function DailyPrinciplesPage() {
  const dispatch = useAppDispatch();

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
    selectIsHolidayShared(state, 'kwanzaa'),
  );

  // Redux data access - daily principles are stored as tasks with category "Daily Principles"
  const displayTasks =
    holidayData?.tasks?.filter(
      (task: any) => task.category === 'Daily Principles',
    ) || [];
  const isLoading = !homeInitialized;

  // State management
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [showDefaultPrinciples, setShowDefaultPrinciples] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('none');
  const [showSortModal, setShowSortModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);

  // Check if default principles exist
  useEffect(() => {
    if (displayTasks.length === 0 && homeInitialized) {
      setShowDefaultPrinciples(true);
    }
  }, [displayTasks, homeInitialized]);

  const handleToggleTask = async (taskId: string) => {
    if (!holidayId || !auth0User) return;

    const principle = displayTasks.find((t: any) => t.id === taskId);
    if (!principle) return;

    try {
      const result = await updateTask(taskId, {
        isCompleted: !principle.isCompleted,
      });

      // Update Redux state
      dispatch(
        updateTaskInHomeData({
          holidayId: holidayId,
          taskId: taskId,
          updates: { isCompleted: !principle.isCompleted },
        }),
      );

      // Refresh home data to update progress on main holiday page
      await refreshHomeData(auth0User, holidayId);
    } catch (error) {
      console.error('Error toggling principle:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!holidayId || !auth0User) return;

    try {
      await deleteTask(taskId);

      // Remove from Redux state on success
      dispatch(removeTaskFromHomeData({ holidayId: holidayId, taskId }));

      // Refresh home data to ensure UI is in sync
      await refreshHomeData(auth0User, holidayId);

      // Check if this was the last task and re-show default principles prompt
      const remainingTasks = displayTasks.filter((c: any) => c.id !== taskId);
      if (remainingTasks.length === 0) {
        setShowDefaultPrinciples(true);
      }
    } catch (error) {
      console.error('Error deleting principle:', error);
    }
  };

  async function handleAddTask(values: Record<string, any>) {
    if (!values.title?.trim()) return;
    if (!holidayId || !auth0User) return;

    try {
      const result = await createTask({
        title: values.title,
        description: values.description || undefined,
        priority: values.priority as 'low' | 'medium' | 'high',
        assignedTo: values.assignedTo || undefined,
        category: 'Daily Principles',
        dueDate: values.dueDate || undefined,
      });

      // Update Redux state immediately
      dispatch(addTaskToHomeData({ holidayId: holidayId, task: result }));

      // Refresh home data to ensure UI is in sync
      await refreshHomeData(auth0User, holidayId);

      setShowFormModal(false);
    } catch (error) {
      console.error('Error creating principle:', error);
    }
  }

  async function addDefaultPrinciples() {
    if (!holidayId || !auth0User) return;

    try {
      // Add default principles one at a time
      for (let i = 0; i < defaultKwanzaaPrinciples.length; i++) {
        const principle = defaultKwanzaaPrinciples[i];

        console.log(
          `Adding principle ${i + 1}/${defaultKwanzaaPrinciples.length}: ${principle.name}`,
        );

        const result = await createTask({
          title: principle.name,
          description: principle.description,
          priority: principle.priority,
          category: 'Daily Principles',
        });

        // Update Redux state immediately
        dispatch(addTaskToHomeData({ holidayId: holidayId, task: result }));
      }

      // Refresh home data to ensure UI is in sync
      await refreshHomeData(auth0User, holidayId);

      console.log('✅ All default principles added successfully');
      setShowDefaultPrinciples(false);
    } catch (error) {
      console.error('Failed to add default principles:', error);
    }
  }

  async function handleEditTask(values: Record<string, any>) {
    if (!selectedTask || !holidayId || !auth0User) return;

    try {
      const result = await updateTask(selectedTask.id, {
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
          taskId: selectedTask.id,
          updates: result,
        }),
      );

      // Refresh home data to ensure UI is in sync
      await refreshHomeData(auth0User, holidayId);

      setSelectedTask(null);
      setShowFormModal(false);
    } catch (error) {
      console.error('Error updating principle:', error);
    }
  }

  const openEditModal = (task: any) => {
    setSelectedTask(task);
    setShowFormModal(true);
  };

  const closeForm = () => {
    setShowFormModal(false);
    setSelectedTask(null);
  };

  function sortTasks(tasksToSort: any[]): any[] {
    switch (sortBy) {
      case 'priority':
        const priorityOrder: { [key: string]: number } = {
          high: 3,
          medium: 2,
          low: 1,
        };
        return [...tasksToSort].sort(
          (a, b) =>
            (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0),
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

  // Show loading only if home data is not initialized
  if (isLoading) {
    return (
      <div className="min-h-screen kwanzaa-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">
            Loading daily principles...
          </p>
        </div>
      </div>
    );
  }

  const sortedTasks = sortTasks(displayTasks || []);
  const incompleteTasks = sortedTasks.filter((task: any) => !task.isCompleted);
  const completedTasks = sortedTasks.filter((task: any) => task.isCompleted);

  // Form fields with conditional shared holiday support
  const formFields = [
    {
      id: 'title',
      type: 'text' as const,
      placeholder: 'Daily Principle*',
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
    <div className="min-h-screen kwanzaa-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
      <HolidayPageHeader
        title="Daily Principle Tracker"
        backHref="/kwanzaa"
        onSortClick={() => setShowSortModal(true)}
        sortTitle="Sort Principles"
        holidayColor="red-600"
      />
      <main className="w-full max-w-4xl flex flex-col gap-6">
        {/* Default Principles Prompt */}
        {showDefaultPrinciples && (
          <div className="card card-tasks rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700">
            <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
              🕯️ Set Up Kwanzaa Principles
            </h3>
            <p className="text-blue-700 dark:text-blue-300 text-sm mb-3">
              Would you like to add the seven traditional Kwanzaa principles to track
              daily?
            </p>
            <div className="flex gap-2">
              <button
                onClick={addDefaultPrinciples}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors text-sm"
              >
                Add Default Principles
              </button>
              <button
                onClick={() => setShowDefaultPrinciples(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors text-sm"
              >
                Skip
              </button>
            </div>
          </div>
        )}

        <AddButton
          title="Principle"
          onClick={() => setShowFormModal(true)}
          color="red"
        />
        <div className="flex items-center justify-center">
          {sortBy !== 'none' && (
            <div className="text-center text-sm text-gray-600 dark:text-gray-400">
              {sortBy === 'priority' && 'Sorted by Priority'}
              {sortBy === 'dateDue' && 'Sorted by Date Due'}
              {sortBy === 'assignedTo' && 'Sorted by Assigned To'}
              {sortBy === 'category' && 'Sorted by Category'}
            </div>
          )}
        </div>

        <TaskSection
          title="Incomplete"
          items={incompleteTasks}
          isCompleted={false}
          emptyMessage="All principles completed! 🕯️✨"
          completedMessage=""
          renderItem={(task: any) => (
            <ToDoCard
              key={task.id}
              task={task}
              onToggleComplete={handleToggleTask}
              onDelete={handleDeleteTask}
              onEdit={openEditModal}
              theme={{
                accentColor: '#dc2626', // Red for Kwanzaa
              }}
              borderColor="rgb(220 38 38)" // Red border for Kwanzaa
              disableInternalModal={true}
            />
          )}
        />

        <TaskSection
          title="Completed"
          items={completedTasks}
          isCompleted={true}
          emptyMessage="No completed tasks yet."
          completedMessage=""
          renderItem={(task: any) => (
            <ToDoCard
              key={task.id}
              task={task}
              onToggleComplete={handleToggleTask}
              onDelete={handleDeleteTask}
              onEdit={openEditModal}
              theme={{
                accentColor: '#dc2626', // Red for Kwanzaa
              }}
              borderColor="rgb(220 38 38)" // Red border for Kwanzaa
              disableInternalModal={true}
            />
          )}
        />
      </main>

      {/* Form Modal */}
      <FormModal
        isOpen={showFormModal}
        title={selectedTask ? 'Edit Principle' : 'Add Principle'}
        fields={formFields}
        initialValues={
          selectedTask
            ? {
                title: selectedTask.title || '',
                description: selectedTask.description || '',
                priority: selectedTask.priority || 'medium',
                assignedTo: selectedTask.assignedTo || '',
                dueDate: selectedTask.dueDate
                  ? toDateOnlyString(new Date(selectedTask.dueDate))
                  : '',
              }
            : {}
        }
        onSubmit={selectedTask ? handleEditTask : handleAddTask}
        onClose={closeForm}
        loading={updateLoading}
        submitText={selectedTask ? 'Update Principle' : 'Add Principle'}
        cancelText="Cancel"
        cardClassName="card card-tasks"
        submitButtonColor="#dc2626"
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
