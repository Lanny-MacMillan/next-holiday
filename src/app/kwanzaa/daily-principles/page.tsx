'use client';

import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useHolidayPageData } from '@/hooks/useHolidayPageData';
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
  const error = null;

  // Refresh home data function
  const refreshHomeData = async () => {
    if (!auth0User?.sub || !holidayId) return;

    try {
      const response = await fetch('/api/home', {
        headers: {
          'Content-Type': 'application/json',
          'x-test-user': JSON.stringify({
            sub: auth0User.sub,
            email: auth0User.email,
            name: auth0User.name,
            picture: auth0User.picture,
          }),
        },
      });
      if (response.ok) {
        const result = await response.json();
        dispatch(setHomeData(result.data));
      }
    } catch (error) {
      console.error('Error refreshing home data:', error);
    }
  };

  // State management
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [showDefaultPrinciples, setShowDefaultPrinciples] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('none');
  const [showSortModal, setShowSortModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Check if default principles exist
  useEffect(() => {
    if (displayTasks.length === 0 && homeInitialized) {
      setShowDefaultPrinciples(true);
    }
  }, [displayTasks, homeInitialized]);

  const handleToggleTask = async (taskId: string) => {
    if (!holidayId || !auth0User) return;

    setIsToggling(true);
    try {
      const currentTask = displayTasks.find((task: any) => task.id === taskId);
      if (!currentTask) {
        console.error('Task not found:', taskId);
        return;
      }

      const newCompletionStatus = !currentTask.isCompleted;

      // Optimistically update Redux state
      dispatch(
        updateTaskInHomeData({
          holidayId: holidayId,
          taskId: taskId,
          updates: { isCompleted: newCompletionStatus },
        }),
      );

      const response = await fetch(`/api/holidays/${holidayId}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-test-user': JSON.stringify({
            sub: auth0User.sub,
            email: auth0User.email,
            name: auth0User.name,
            picture: auth0User.picture,
          }),
        },
        body: JSON.stringify({
          isCompleted: newCompletionStatus,
        }),
      });

      if (!response.ok) {
        // Revert optimistic update on error
        const currentTask = displayTasks.find((task: any) => task.id === taskId);
        if (currentTask) {
          dispatch(
            updateTaskInHomeData({
              holidayId: holidayId,
              taskId: taskId,
              updates: { isCompleted: currentTask.isCompleted },
            }),
          );
        }
        console.error(
          'Failed to toggle task:',
          response.status,
          response.statusText,
        );
      }
    } catch (error) {
      console.error('Failed to toggle task:', error);
    } finally {
      setIsToggling(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!holidayId || !auth0User) return;

    // Find the task to delete for potential rollback
    const taskToDelete = displayTasks.find((task: any) => task.id === taskId);
    if (!taskToDelete) return;

    setIsDeleting(true);
    try {
      // Optimistically update Redux state first
      dispatch(removeTaskFromHomeData({ holidayId: holidayId, taskId }));

      // Call API directly instead of using custom hook
      const apiUrl = `/api/holidays/${holidayId}/tasks/${taskId}`;
      console.log('Delete API URL:', apiUrl); // Debug logging
      console.log('Daily Principles before delete:', displayTasks.length);
      const response = await fetch(apiUrl, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-test-user': JSON.stringify({
            sub: auth0User.sub,
            email: auth0User.email,
            name: auth0User.name,
            picture: auth0User.picture,
          }),
        },
      });

      if (!response.ok) {
        // If API failed, revert the optimistic update
        dispatch(addTaskToHomeData({ holidayId: holidayId, task: taskToDelete }));
        console.error(
          'Failed to delete task:',
          response.status,
          response.statusText,
        );
      } else {
        console.log('Task deleted successfully');
        // Check if this was the last task and re-show default principles prompt
        const remainingTasks = displayTasks.filter((c: any) => c.id !== taskId);
        console.log('Daily Principles after delete:', remainingTasks.length);
        if (remainingTasks.length === 0) {
          console.log('No tasks remaining, showing default principles prompt');
          setShowDefaultPrinciples(true);
        }
      }
    } catch (error) {
      // If API failed, revert the optimistic update
      dispatch(addTaskToHomeData({ holidayId: holidayId, task: taskToDelete }));
      console.error('Failed to delete task:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  async function handleAddTask(values: Record<string, any>) {
    if (!values.title?.trim()) return;
    if (!holidayId || !auth0User) return;

    setIsAdding(true);

    const newTask = {
      id: `temp-${Date.now()}`, // Temporary ID for optimistic update
      title: values.title,
      description: values.description || undefined,
      priority: values.priority as 'low' | 'medium' | 'high',
      assignedTo: values.assignedTo || undefined,
      category: 'Daily Principles',
      dueDate: values.dueDate || undefined,
      isCompleted: false,
      holidayId: holidayId,
    };

    try {
      // Optimistically update Redux state first
      dispatch(addTaskToHomeData({ holidayId: holidayId, task: newTask }));

      // API call with snake_case mapping
      const apiPayload = {
        title: values.title,
        description: values.description || undefined,
        priority: values.priority as 'low' | 'medium' | 'high',
        assigned_to: values.assignedTo || undefined, // snake_case for API
        category: 'Daily Principles',
        due_date: values.dueDate || undefined, // snake_case for API
        isCompleted: false,
      };

      const response = await fetch(`/api/holidays/${holidayId}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-test-user': JSON.stringify({
            sub: auth0User.sub,
            email: auth0User.email,
            name: auth0User.name,
            picture: auth0User.picture,
          }),
        },
        body: JSON.stringify(apiPayload),
      });

      if (response.ok) {
        // Replace temporary task with real task from API
        const result = await response.json();
        dispatch(
          removeTaskFromHomeData({
            holidayId: holidayId,
            taskId: newTask.id,
          }),
        );
        dispatch(addTaskToHomeData({ holidayId: holidayId, task: result }));

        // CRITICAL: Refresh home data for proper UI updates
        await refreshHomeData();
      } else {
        // Remove optimistic update on error
        dispatch(
          removeTaskFromHomeData({
            holidayId: holidayId,
            taskId: newTask.id,
          }),
        );
        console.error('Failed to add task:', response.status, response.statusText);
      }
      setShowFormModal(false);
    } catch (error) {
      dispatch(removeTaskFromHomeData({ holidayId: holidayId, taskId: newTask.id }));
      console.error('Failed to add task:', error);
    } finally {
      setIsAdding(false);
    }
  }

  async function addDefaultPrinciples() {
    if (!holidayId || !auth0User) return;

    setIsAdding(true);
    try {
      // Add default principles one at a time with refreshHomeData after each
      for (let i = 0; i < defaultKwanzaaPrinciples.length; i++) {
        const principle = defaultKwanzaaPrinciples[i];

        console.log(
          `Adding principle ${i + 1}/${defaultKwanzaaPrinciples.length}: ${principle.name}`,
        );

        try {
          const response = await fetch(`/api/holidays/${holidayId}/tasks`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-test-user': JSON.stringify({
                sub: auth0User.sub,
                email: auth0User.email,
                name: auth0User.name,
                picture: auth0User.picture,
              }),
            },
            body: JSON.stringify({
              title: principle.name,
              description: principle.description,
              priority: principle.priority,
              category: 'Daily Principles',
              isCompleted: false,
            }),
          });

          if (response.ok) {
            const result = await response.json();
            console.log(`✅ Added principle ${i + 1}: ${result.title}`);

            // Add to Redux
            dispatch(addTaskToHomeData({ holidayId: holidayId, task: result }));

            // Refresh home data after each principle to ensure consistency
            await refreshHomeData();
          } else {
            console.error(
              `❌ Failed to add principle ${i + 1}:`,
              response.status,
              response.statusText,
            );
          }
        } catch (taskError) {
          console.error(`❌ Error adding principle ${i + 1}:`, taskError);
        }
      }

      console.log('✅ All default principles added successfully');
      setShowDefaultPrinciples(false);
    } catch (error) {
      console.error('Failed to add default principles:', error);
    } finally {
      setIsAdding(false);
    }
  }

  async function handleEditTask(values: Record<string, any>) {
    if (!selectedTask || !holidayId || !auth0User) return;

    setIsUpdating(true);
    try {
      // Optimistically update Redux state
      dispatch(
        updateTaskInHomeData({
          holidayId: holidayId,
          taskId: selectedTask.id,
          updates: {
            title: values.title,
            description: values.description || undefined,
            priority: values.priority,
            assignedTo: values.assignedTo || undefined, // camelCase for Redux
            dueDate: values.dueDate || undefined, // camelCase for Redux
          },
        }),
      );

      // API call with snake_case mapping
      const apiPayload = {
        title: values.title,
        description: values.description || undefined,
        priority: values.priority as 'low' | 'medium' | 'high',
        assigned_to: values.assignedTo || undefined, // snake_case for API
        due_date: values.dueDate || undefined, // snake_case for API
      };

      const response = await fetch(
        `/api/holidays/${holidayId}/tasks/${selectedTask.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'x-test-user': JSON.stringify(auth0User),
          },
          body: JSON.stringify(apiPayload),
        },
      );

      if (!response.ok) {
        // Revert optimistic update on error
        dispatch(
          updateTaskInHomeData({
            holidayId: holidayId,
            taskId: selectedTask.id,
            updates: {
              title: selectedTask.title,
              description: selectedTask.description,
              priority: selectedTask.priority,
              assignedTo: selectedTask.assignedTo,
              category: selectedTask.category,
              dueDate: selectedTask.dueDate,
            },
          }),
        );
        console.error(
          'Failed to update task:',
          response.status,
          response.statusText,
        );
      }

      setSelectedTask(null);
      setShowFormModal(false);
    } catch (error) {
      console.error('Failed to update task:', error);
    } finally {
      setIsUpdating(false);
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

  const loading = isAdding || isUpdating || isDeleting || isToggling;

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
        loading={loading}
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
