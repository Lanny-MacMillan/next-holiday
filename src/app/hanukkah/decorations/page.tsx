'use client';

import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useFormModalMutation } from '@/hooks/useFormModalMutation';
import { fetchContacts } from '@/store/slices/addressBookSlice';
import {
  updateTaskInHomeData,
  addTaskToHomeData,
  removeTaskFromHomeData,
  setHomeData,
} from '@/store/slices/homeSlice';
import {
  selectHolidayPreferences,
  selectHomeInitialized,
  selectHomeData,
  selectHolidayPrefById,
} from '@/store/selectors/home';
import { selectIsHolidayShared } from '@/store/slices/sharesSlice';
import SortModal from '@/components/modals/SortModal';
import FormModal from '@/components/modals/FormModal';
import HolidayPageHeader from '@/components/common/HolidayPageHeader';
import AddButton from '@/components/common/AddButton';
import TaskSection from '@/components/common/TaskSection';
import ToDoCard from '@/components/cards/to-do/ToDoCard';

type SortOption = 'priority' | 'dateDue' | 'assignedTo' | 'category' | 'none';

const defaultDecorationTasks = [
  {
    title: 'Set up Menorah',
    description: 'Place the menorah in a prominent location',
    category: 'Decorations',
    priority: 'high' as const,
  },
  {
    title: 'Hang Hanukkah banners',
    description: 'Display Hanukkah-themed banners and signs',
    category: 'Decorations',
    priority: 'medium' as const,
  },
  {
    title: 'String blue and white lights',
    description: 'Decorate with traditional Hanukkah colors',
    category: 'Decorations',
    priority: 'medium' as const,
  },
  {
    title: 'Display dreidels',
    description: 'Place decorative dreidels around the home',
    category: 'Decorations',
    priority: 'low' as const,
  },
  {
    title: 'Set up Hanukkah table',
    description: 'Prepare the dining table with Hanukkah decorations',
    category: 'Decorations',
    priority: 'high' as const,
  },
  {
    title: 'Hang Star of David decorations',
    description: 'Display Star of David ornaments and symbols',
    category: 'Decorations',
    priority: 'medium' as const,
  },
  {
    title: 'Arrange Hanukkah candles',
    description: 'Organize and display Hanukkah candles',
    category: 'Decorations',
    priority: 'high' as const,
  },
  {
    title: 'Set up Hanukkah centerpiece',
    description: 'Create a festive centerpiece for the table',
    category: 'Decorations',
    priority: 'low' as const,
  },
];

export default function HanukkahDecorationsPage() {
  const dispatch = useAppDispatch();
  const { contacts } = useAppSelector((state: any) => state.addressBook);
  const { holidayId, auth0User } = useFormModalMutation();

  // Get Redux data
  const holidayPreferences = useAppSelector(selectHolidayPreferences);
  const homeInitialized = useAppSelector(selectHomeInitialized);
  const homeData = useAppSelector(selectHomeData);

  // Check if the holiday is shared to conditionally show assign to field
  const isHolidayShared = useAppSelector((state: any) =>
    selectIsHolidayShared(state, 'hanukkah'),
  );

  // Redux data access - decorations are stored as tasks with category "Decorations"
  const holidayData = useAppSelector(state =>
    selectHolidayPrefById(state, holidayId!),
  );
  const decorations =
    holidayData?.tasks?.filter((task: any) => task.category === 'Decorations') || [];
  const isLoading = !homeInitialized;
  const error = null;

  // Debug logging to understand the state
  console.log('Hanukkah Decorations Debug:', {
    holidayId,
    holidayData: holidayData
      ? { ...holidayData, tasks: holidayData.tasks?.length || 0 }
      : null,
    allTasks: holidayData?.tasks?.length || 0,
    decorationTasks: decorations.length,
    decorations: decorations.map(d => ({
      id: d.id,
      title: d.title,
      category: d.category,
      isCompleted: d.isCompleted,
    })),
  });

  // Refresh home data function (like gift-list)
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
  const [isAdding, setIsAdding] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const [sortBy, setSortBy] = useState<SortOption>('none');
  const [showSortModal, setShowSortModal] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [showDefaultTasks, setShowDefaultTasks] = useState(false);

  useEffect(() => {
    // Always fetch contacts for address book functionality
    dispatch(fetchContacts());
  }, [dispatch]);

  // Check if default decoration tasks exist
  useEffect(() => {
    if (decorations.length === 0 && homeInitialized) {
      setShowDefaultTasks(true);
    }
  }, [decorations, homeInitialized]);

  // CRUD Operations
  async function handleAddDecoration(values: Record<string, any>) {
    if (!values.title?.trim()) return;
    if (!holidayId || !auth0User) return;

    setIsAdding(true);

    const newTask = {
      id: `temp-${Date.now()}`, // Temporary ID for optimistic update
      title: values.title,
      description: values.description || undefined,
      priority: values.priority as 'low' | 'medium' | 'high',
      assignedTo: values.assignedTo || undefined,
      category: 'Decorations',
      dueDate: values.dueDate || undefined,
      isCompleted: false,
      holidayId: holidayId,
    };

    try {
      // Optimistically update Redux state first
      console.log('Adding decoration task optimistically:', newTask);
      console.log('Holiday ID for addition:', holidayId);
      dispatch(addTaskToHomeData({ holidayId: holidayId, task: newTask }));
      console.log('Task added to Redux, making API call...');

      // Call API - map camelCase to snake_case for API
      const apiPayload = {
        title: values.title,
        description: values.description || undefined,
        priority: values.priority as 'low' | 'medium' | 'high',
        assigned_to: values.assignedTo || undefined, // snake_case for API
        category: 'Decorations',
        due_date: values.dueDate || undefined, // snake_case for API
        isCompleted: false,
      };

      console.log('🐛 [HanukkahDecorationsAdd] API payload:', apiPayload);

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
        console.log('API success, replacing temp task with real task:', result);
        dispatch(
          removeTaskFromHomeData({
            holidayId: holidayId,
            taskId: newTask.id,
          }),
        );
        dispatch(addTaskToHomeData({ holidayId: holidayId, task: result }));

        // Also refresh home data like gift-list does
        await refreshHomeData();
      } else {
        // Remove optimistic update on error
        console.log('API error, removing optimistic update');
        dispatch(
          removeTaskFromHomeData({
            holidayId: holidayId,
            taskId: newTask.id,
          }),
        );
        console.error('Failed to add task:', response.status, response.statusText);
      }

      setShowForm(false);
    } catch (error) {
      // Remove optimistic update on error
      dispatch(removeTaskFromHomeData({ holidayId: holidayId, taskId: newTask.id }));
      console.error('Failed to add task:', error);
    } finally {
      setIsAdding(false);
    }
  }

  async function addDefaultDecorationTasks() {
    if (!holidayId || !auth0User) return;

    setIsAdding(true);
    try {
      // Add all default decoration tasks with optimistic updates
      for (const task of defaultDecorationTasks) {
        const newTask = {
          id: `temp-${Date.now()}-${task.title}`, // Temporary ID
          ...task,
          isCompleted: false,
          holidayId: holidayId,
        };

        // Optimistically update Redux state first
        dispatch(addTaskToHomeData({ holidayId: holidayId, task: newTask }));

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
              ...task,
              isCompleted: false,
              holidayId: holidayId,
            }),
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
          } else {
            // Remove optimistic update on error
            dispatch(
              removeTaskFromHomeData({
                holidayId: holidayId,
                taskId: newTask.id,
              }),
            );
            console.error(
              'Failed to add default task:',
              response.status,
              response.statusText,
            );
          }
        } catch (taskError) {
          // Remove optimistic update on error
          dispatch(
            removeTaskFromHomeData({
              holidayId: holidayId,
              taskId: newTask.id,
            }),
          );
          console.error('Failed to add default task:', taskError);
        }
      }

      setShowDefaultTasks(false);
    } catch (error) {
      console.error('Failed to add default tasks:', error);
    } finally {
      setIsAdding(false);
    }
  }

  function openForm() {
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
  }

  async function handleToggleCompletion(taskId: string) {
    if (!holidayId || !auth0User) return;

    setIsToggling(true);
    try {
      // Find the current task to get its completion status
      const currentTask = decorations.find((task: any) => task.id === taskId);
      if (!currentTask) {
        console.error('Task not found:', taskId);
        return;
      }

      // Toggle the completion status
      const newCompletionStatus = !currentTask.isCompleted;

      // Optimistically update the Redux home data
      dispatch(
        updateTaskInHomeData({
          holidayId: holidayId,
          taskId: taskId,
          updates: { isCompleted: newCompletionStatus },
        }),
      );

      // Call API with field mapping
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
        // Revert the optimistic update on error
        dispatch(
          updateTaskInHomeData({
            holidayId: holidayId,
            taskId: taskId,
            updates: { isCompleted: !newCompletionStatus },
          }),
        );
        console.error(
          'Failed to toggle task:',
          response.status,
          response.statusText,
        );
      }
    } catch (error) {
      console.error('Failed to toggle task:', error);
      // Revert the optimistic update on error
      const currentTask = decorations.find((task: any) => task.id === taskId);
      if (currentTask) {
        dispatch(
          updateTaskInHomeData({
            holidayId: holidayId,
            taskId: taskId,
            updates: { isCompleted: currentTask.isCompleted },
          }),
        );
      }
    } finally {
      setIsToggling(false);
    }
  }

  async function handleDelete(taskId: string) {
    if (!holidayId || !auth0User) return;

    // Find the task to delete for potential rollback
    const taskToDelete = decorations.find((task: any) => task.id === taskId);
    if (!taskToDelete) return;

    setIsDeleting(true);
    try {
      // Optimistically update Redux state first
      dispatch(removeTaskFromHomeData({ holidayId: holidayId, taskId }));

      // Call API
      const response = await fetch(`/api/holidays/${holidayId}/tasks/${taskId}`, {
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
        // Check if this was the last task and re-show default tasks prompt
        const remainingTasks = decorations.filter(d => d.id !== taskId);
        if (remainingTasks.length === 0) {
          setShowDefaultTasks(true);
        }
      }
    } catch (error) {
      // If API failed, revert the optimistic update
      dispatch(addTaskToHomeData({ holidayId: holidayId, task: taskToDelete }));
      console.error('Failed to delete task:', error);
    } finally {
      setIsDeleting(false);
    }
  }

  const handleEditDecoration = (task: any) => {
    setEditingTask(task);
    setShowEditModal(true);
  };

  async function handleEditDecorationSubmit(values: Record<string, any>) {
    if (!editingTask || !holidayId || !auth0User) return;

    setIsUpdating(true);
    try {
      const updatedTask = {
        title: values.title,
        description: values.description || undefined,
        priority: values.priority as 'low' | 'medium' | 'high',
        assignedTo: values.assignedTo || undefined,
        category: 'Decorations',
        dueDate: values.dueDate || undefined,
      };

      // Optimistically update the Redux home data
      dispatch(
        updateTaskInHomeData({
          holidayId: holidayId,
          taskId: editingTask.id,
          updates: updatedTask,
        }),
      );

      // Call API with field mapping
      const apiPayload = {
        title: values.title,
        description: values.description || undefined,
        priority: values.priority as 'low' | 'medium' | 'high',
        assigned_to: values.assignedTo || undefined, // snake_case for API
        category: 'Decorations',
        due_date: values.dueDate || undefined, // snake_case for API
      };

      const response = await fetch(
        `/api/holidays/${holidayId}/tasks/${editingTask.id}`,
        {
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
          body: JSON.stringify(apiPayload),
        },
      );

      if (!response.ok) {
        // Revert the optimistic update on error
        dispatch(
          updateTaskInHomeData({
            holidayId: holidayId,
            taskId: editingTask.id,
            updates: {
              title: editingTask.title,
              description: editingTask.description,
              priority: editingTask.priority,
              assignedTo: editingTask.assignedTo,
              category: editingTask.category,
              dueDate: editingTask.dueDate,
            },
          }),
        );
        console.error(
          'Failed to update task:',
          response.status,
          response.statusText,
        );
      }

      setShowEditModal(false);
      setEditingTask(null);
    } catch (error) {
      console.error('Failed to update task:', error);
      // Revert the optimistic update on error
      dispatch(
        updateTaskInHomeData({
          holidayId: holidayId,
          taskId: editingTask.id,
          updates: {
            title: editingTask.title,
            description: editingTask.description,
            priority: editingTask.priority,
            assignedTo: editingTask.assignedTo,
            category: editingTask.category,
            dueDate: editingTask.dueDate,
          },
        }),
      );
    } finally {
      setIsUpdating(false);
    }
  }

  function closeEditModal() {
    setShowEditModal(false);
    setEditingTask(null);
  }

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

  const loading = isAdding || isUpdating || isDeleting || isToggling;

  if (isLoading) {
    return (
      <div className="min-h-screen hanukkah-tasks-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading decorations...</p>
        </div>
      </div>
    );
  }

  const sortedTasks = sortTasks(decorations);
  const incompleteDecorations = sortedTasks.filter((task: any) => !task.isCompleted);
  const completedDecorations = sortedTasks.filter((task: any) => task.isCompleted);

  return (
    <div className="min-h-screen hanukkah-tasks-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
      <HolidayPageHeader
        title="Decorations Checklist"
        backHref="/hanukkah"
        onSortClick={() => setShowSortModal(true)}
        sortTitle="Sort decorations"
        description="Stay on top of your Hanukkah decorations!"
        holidayColor="blue-500"
        error={error ? 'API Error' : undefined}
      />
      <main className="w-full max-w-4xl flex flex-col gap-6">
        {/* Default Tasks Prompt */}
        {showDefaultTasks && (
          <div className="card card-tasks rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700">
            <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
              ✨ Set Up Hanukkah Decorations
            </h3>
            <p className="text-blue-700 dark:text-blue-300 text-sm mb-3">
              Would you like to add common Hanukkah decoration tasks?
            </p>
            <div className="flex gap-2">
              <button
                onClick={addDefaultDecorationTasks}
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

        <AddButton
          title="Decoration Task"
          onClick={() => setShowForm(true)}
          color="blue"
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
          title="Pending Decorations"
          items={incompleteDecorations}
          isCompleted={false}
          emptyMessage="No decorations planned yet."
          completedMessage="All decorations completed!"
          renderItem={(task: any) => (
            <ToDoCard
              key={task.id}
              task={task}
              onToggleComplete={handleToggleCompletion}
              onDelete={handleDelete}
              onEdit={handleEditDecoration}
              theme={{
                accentColor: '#3b82f6', // Blue for Hanukkah
              }}
              borderColor="rgb(59 130 246)" // Blue border for Hanukkah
              disableInternalModal={true}
            />
          )}
        />

        <TaskSection
          title="Completed Decorations"
          items={completedDecorations}
          isCompleted={true}
          emptyMessage="No completed decorations yet."
          completedMessage="All decorations ready!"
          renderItem={(task: any) => (
            <ToDoCard
              key={task.id}
              task={task}
              onToggleComplete={handleToggleCompletion}
              onDelete={handleDelete}
              onEdit={handleEditDecoration}
              className="opacity-60"
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
        title="Add New Decoration Task"
        fields={[
          {
            id: 'title',
            type: 'text' as const,
            placeholder: 'Decoration Task*',
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
        ]}
        initialValues={{
          title: '',
          description: '',
          priority: 'medium',
          ...(isHolidayShared ? { assignedTo: '' } : {}),
          dueDate: '',
        }}
        onSubmit={handleAddDecoration}
        onClose={() => setShowForm(false)}
        loading={isAdding}
        submitText="Add Decoration"
        cardClassName="card-tasks"
      />

      {/* Edit Modal */}
      <FormModal
        isOpen={showEditModal}
        title="Edit Decoration Task"
        fields={[
          {
            id: 'title',
            type: 'text' as const,
            placeholder: 'Decoration Task*',
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
        ]}
        initialValues={{
          title: editingTask?.title || '',
          description: editingTask?.description || '',
          priority: editingTask?.priority || 'medium',
          ...(isHolidayShared ? { assignedTo: editingTask?.assignedTo || '' } : {}),
          dueDate: editingTask?.dueDate ? editingTask.dueDate.split('T')[0] : '', // Format for date input
        }}
        onSubmit={handleEditDecorationSubmit}
        onClose={closeEditModal}
        loading={isUpdating}
        submitText="Update Decoration"
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
          { value: 'assignedTo', label: 'Assigned To' },
          { value: 'category', label: 'Category' },
        ]}
        title="Sort Decorations"
      />
    </div>
  );
}
