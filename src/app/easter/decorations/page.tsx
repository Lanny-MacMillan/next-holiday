'use client';

import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useAuth0 } from '@auth0/auth0-react';
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
} from '@/store/selectors/home';
import { getHolidayIdFromRoute } from '@/utils/holidayUtils';
import { getHolidayDataFromRedux } from '@/utils/holidayData';
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
    title: 'Set up Easter tree',
    description: 'Decorate with Easter eggs and spring flowers',
    priority: 'high' as const,
  },
  {
    title: 'Hang Easter banners',
    description: 'Display Easter-themed banners and signs',
    priority: 'medium' as const,
  },
  {
    title: 'Arrange Easter centerpiece',
    description: 'Create a festive centerpiece for the table',
    priority: 'medium' as const,
  },
  {
    title: 'Set up Easter egg hunt area',
    description: 'Prepare the area for Easter egg hunting',
    priority: 'high' as const,
  },
  {
    title: 'Decorate Easter egg display',
    description: 'Create beautiful Easter egg arrangements',
    priority: 'medium' as const,
  },
  {
    title: 'Set up Easter photo booth',
    description: 'Prepare Easter-themed photo opportunity',
    priority: 'low' as const,
  },
];

export default function EasterDecorationsPage() {
  const dispatch = useAppDispatch();
  const { contacts } = useAppSelector((state: any) => state.addressBook);
  const { user: auth0User } = useAuth0();

  // No need for useFormModalMutation hook - using direct API calls like Kwanzaa

  // Get Redux data
  const holidayPreferences = useAppSelector(selectHolidayPreferences);
  const homeInitialized = useAppSelector(selectHomeInitialized);
  const homeData = useAppSelector(selectHomeData);

  // Get current Redux state for data access
  const currentState = useAppSelector((state: any) => state);

  // Holiday ID resolution
  const resolvedHolidayId = homeInitialized
    ? getHolidayIdFromRoute('/easter', holidayPreferences)
    : getHolidayIdFromRoute('/easter', holidayPreferences);

  // Check if the holiday is shared to conditionally show assign to field
  const isHolidayShared = useAppSelector((state: any) =>
    selectIsHolidayShared(state, 'easter'),
  );

  // Redux data access - decorations are stored as tasks with category "Decorations" like Kwanzaa
  const holidayData = getHolidayDataFromRedux(resolvedHolidayId, currentState);
  const decorations =
    holidayData?.tasks?.filter((task: any) => task.category === 'Decorations') || [];
  const isLoading = !homeInitialized;
  const error = null;

  // Refresh home data function (like gift-list)
  const refreshHomeData = async () => {
    if (!auth0User?.sub || !resolvedHolidayId) return;

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

  // Removed refreshHomeData helper to prevent infinite loops
  // Direct dispatch calls are used instead

  // State management
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('none');
  const [showSortModal, setShowSortModal] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    // Always fetch contacts for address book functionality
    dispatch(fetchContacts());
  }, [dispatch]);

  // CRUD Operations
  async function handleAddTask(values: Record<string, any>) {
    if (!values.title?.trim()) return;
    if (!resolvedHolidayId || !auth0User) return;

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
      holidayId: resolvedHolidayId,
    };

    try {
      // Optimistically update Redux state first (like Kwanzaa)
      dispatch(addTaskToHomeData({ holidayId: resolvedHolidayId, task: newTask }));
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

      const response = await fetch(`/api/holidays/${resolvedHolidayId}/tasks`, {
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
        // Replace temporary task with real task from API (like Kwanzaa)
        const result = await response.json();
        console.log('API success, replacing temp task with real task:', result);
        dispatch(
          removeTaskFromHomeData({
            holidayId: resolvedHolidayId,
            taskId: newTask.id,
          }),
        );
        dispatch(addTaskToHomeData({ holidayId: resolvedHolidayId, task: result }));

        // Also refresh home data like gift-list does
        await refreshHomeData();
      } else {
        // Remove optimistic update on error
        console.log('API error, removing optimistic update');
        dispatch(
          removeTaskFromHomeData({
            holidayId: resolvedHolidayId,
            taskId: newTask.id,
          }),
        );
        console.error('Failed to add task:', response.status, response.statusText);
      }

      setShowForm(false);
    } catch (error) {
      // Remove optimistic update on error (like Kwanzaa)
      dispatch(
        removeTaskFromHomeData({ holidayId: resolvedHolidayId, taskId: newTask.id }),
      );
      console.error('Failed to add task:', error);
    } finally {
      setIsAdding(false);
    }
  }

  async function handleToggleCompletion(taskId: string) {
    if (!resolvedHolidayId || !auth0User) return;

    const task = decorations.find(t => t.id === taskId);
    if (!task) return;

    setIsToggling(true);
    try {
      const updatedTask = { ...task, isCompleted: !task.isCompleted };

      // Optimistically update Redux state first
      dispatch(
        updateTaskInHomeData({
          holidayId: resolvedHolidayId,
          taskId: taskId,
          updates: { isCompleted: !task.isCompleted },
        }),
      );

      // Call API
      const response = await fetch(
        `/api/holidays/${resolvedHolidayId}/tasks/${taskId}`,
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
          body: JSON.stringify({
            isCompleted: !task.isCompleted,
          }),
        },
      );

      if (!response.ok) {
        // Revert optimistic update on error
        dispatch(
          updateTaskInHomeData({
            holidayId: resolvedHolidayId,
            taskId: taskId,
            updates: { isCompleted: task.isCompleted },
          }),
        );
        console.error(
          'Failed to toggle task completion:',
          response.status,
          response.statusText,
        );
      } else {
        // Refresh home data for proper UI updates
        await refreshHomeData();
      }
    } catch (error) {
      // Revert optimistic update on error
      dispatch(
        updateTaskInHomeData({
          holidayId: resolvedHolidayId,
          taskId: taskId,
          updates: { isCompleted: task.isCompleted },
        }),
      );
      console.error('Failed to toggle task completion:', error);
    } finally {
      setIsToggling(false);
    }
  }

  async function handleEditDecoration(task: any) {
    if (!task) return;

    // Format dates for input fields (YYYY-MM-DD format)
    const formattedTask = {
      ...task,
      dueDate: task.dueDate
        ? new Date(task.dueDate).toISOString().split('T')[0]
        : '',
    };

    setEditingTask(formattedTask);
    setShowEditModal(true);
  }

  async function handleEditTaskSubmit(values: Record<string, any>) {
    if (!values.title?.trim() || !editingTask) return;
    if (!resolvedHolidayId || !auth0User) return;

    setIsUpdating(true);
    try {
      const updatedTask = {
        ...editingTask,
        title: values.title,
        description: values.description || undefined,
        priority: values.priority as 'low' | 'medium' | 'high',
        assignedTo: values.assignedTo || undefined,
        dueDate: values.dueDate || undefined,
      };

      // Optimistically update Redux state first
      dispatch(
        updateTaskInHomeData({
          holidayId: resolvedHolidayId,
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
        isCompleted: editingTask.isCompleted,
      };

      const response = await fetch(
        `/api/holidays/${resolvedHolidayId}/tasks/${editingTask.id}`,
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

      if (response.ok) {
        // Refresh home data for proper UI updates
        await refreshHomeData();
      } else {
        // Revert optimistic update on error
        dispatch(
          updateTaskInHomeData({
            holidayId: resolvedHolidayId,
            taskId: editingTask.id,
            updates: editingTask,
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
      // Revert optimistic update on error
      if (editingTask) {
        dispatch(
          updateTaskInHomeData({
            holidayId: resolvedHolidayId,
            taskId: editingTask.id,
            updates: editingTask,
          }),
        );
      }
      console.error('Failed to update task:', error);
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleDelete(taskId: string, taskTitle: string) {
    if (!resolvedHolidayId || !auth0User) return;

    setIsDeleting(true);
    try {
      const taskToDelete = decorations.find(t => t.id === taskId);
      if (!taskToDelete) return;

      // Optimistically remove from Redux state first
      dispatch(removeTaskFromHomeData({ holidayId: resolvedHolidayId, taskId }));

      // Call API
      const response = await fetch(
        `/api/holidays/${resolvedHolidayId}/tasks/${taskId}`,
        {
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
        },
      );

      if (!response.ok) {
        // Revert optimistic update on error
        dispatch(
          addTaskToHomeData({ holidayId: resolvedHolidayId, task: taskToDelete }),
        );
        console.error(
          'Failed to delete task:',
          response.status,
          response.statusText,
        );
      } else {
        // Refresh home data for proper UI updates
        await refreshHomeData();
      }
    } catch (error) {
      console.error('Failed to delete task:', error);
    } finally {
      setIsDeleting(false);
    }
  }

  // Filter tasks by completion status
  const incompleteDecorations = decorations.filter(
    decoration => !decoration.isCompleted,
  );
  const completedDecorations = decorations.filter(
    decoration => decoration.isCompleted,
  );

  // Sort functions (same as Kwanzaa pattern)
  const sortTasks = (tasks: any[], sortBy: SortOption) => {
    if (sortBy === 'none') return tasks;

    return [...tasks].sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          const priorityOrder: { [key: string]: number } = {
            high: 3,
            medium: 2,
            low: 1,
          };
          return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
        case 'dateDue':
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        case 'assignedTo':
          if (!a.assignedTo) return 1;
          if (!b.assignedTo) return -1;
          return a.assignedTo.localeCompare(b.assignedTo);
        case 'category':
          return a.category.localeCompare(b.category);
        default:
          return 0;
      }
    });
  };

  const sortedIncompleteDecorations = sortTasks(incompleteDecorations, sortBy);
  const sortedCompletedDecorations = sortTasks(completedDecorations, sortBy);

  // Form field configuration with conditional assign to field
  const formFields = [
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
  ];

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen easter-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
        <div className="flex-1 w-full max-w-4xl flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading decorations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen easter-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
      <HolidayPageHeader
        title="Easter Decorations"
        backHref="/easter"
        onSortClick={() => setShowSortModal(true)}
        description="Plan your Easter decorations with festive flair!"
        holidayColor="purple-500"
        sortTitle="Sort Decorations"
      />

      <main className="flex-1 w-full max-w-4xl flex flex-col gap-6 mt-4">
        <AddButton
          title="Decoration"
          onClick={() => setShowForm(true)}
          color="purple"
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
          items={sortedIncompleteDecorations}
          isCompleted={false}
          emptyMessage="No decorations planned yet."
          completedMessage="All decorations completed!"
          renderItem={(task: any) => (
            <ToDoCard
              key={task.id}
              task={task}
              onToggleComplete={handleToggleCompletion}
              onDelete={(taskId: string) => handleDelete(taskId, task.title)}
              onEdit={handleEditDecoration}
              theme={{
                accentColor: '#a855f7', // Purple for Easter
              }}
              borderColor="rgb(168 85 247)" // Purple border for Easter
              disableInternalModal={true}
            />
          )}
        />

        <TaskSection
          title="Completed Decorations"
          items={sortedCompletedDecorations}
          isCompleted={true}
          emptyMessage="No completed decorations yet."
          completedMessage=""
          renderItem={(task: any) => (
            <ToDoCard
              key={task.id}
              task={task}
              onToggleComplete={handleToggleCompletion}
              onDelete={(taskId: string) => handleDelete(taskId, task.title)}
              onEdit={handleEditDecoration}
              theme={{
                accentColor: '#a855f7', // Purple for Easter
              }}
              borderColor="rgb(168 85 247)" // Purple border for Easter
              disableInternalModal={true}
            />
          )}
        />
      </main>

      {/* Form Modal */}
      <FormModal
        isOpen={showForm}
        title="Add New Decoration Task"
        fields={formFields}
        initialValues={{
          title: '',
          description: '',
          priority: 'medium',
          assignedTo: '',
          dueDate: '',
        }}
        onSubmit={handleAddTask}
        onClose={() => setShowForm(false)}
        loading={isAdding}
        submitText="Add Task"
        cardClassName="card-tasks"
      />

      {/* Edit Modal */}
      <FormModal
        isOpen={showEditModal}
        title="Edit Decoration Task"
        fields={formFields}
        initialValues={{
          title: editingTask?.title || '',
          description: editingTask?.description || '',
          priority: editingTask?.priority || 'medium',
          assignedTo: editingTask?.assignedTo || '',
          dueDate: editingTask?.dueDate || '',
        }}
        onSubmit={handleEditTaskSubmit}
        onClose={() => {
          setShowEditModal(false);
          setEditingTask(null);
        }}
        loading={isUpdating}
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
          { value: 'assignedTo', label: 'Assigned To' },
          { value: 'category', label: 'Category' },
        ]}
        title="Sort Tasks"
      />
    </div>
  );
}
