'use client';

import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useAuth0 } from '@auth0/auth0-react';
import { useSubscription } from '@/hooks/useSubscription';
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

export default function ThanksgivingDecorationsPage() {
  const dispatch = useAppDispatch();
  const { contacts } = useAppSelector((state: any) => state.addressBook);
  const { user: auth0User } = useAuth0();
  const { isUserPlusMember, hasSubscription } = useSubscription();

  // No need for useFormModalMutation hook - using direct API calls like Kwanzaa

  // Get Redux data
  const holidayPreferences = useAppSelector(selectHolidayPreferences);
  const homeInitialized = useAppSelector(selectHomeInitialized);
  const homeData = useAppSelector(selectHomeData);

  // Get current Redux state for data access
  const currentState = useAppSelector((state: any) => state);

  // Holiday ID resolution
  const resolvedHolidayId = homeInitialized
    ? getHolidayIdFromRoute('/thanksgiving', holidayPreferences)
    : getHolidayIdFromRoute('/thanksgiving', holidayPreferences);

  // Check if the holiday is shared to conditionally show assign to field
  const isHolidayShared = useAppSelector((state: any) =>
    selectIsHolidayShared(state, 'thanksgiving'),
  );
  const isAuthorizedForSharing = hasSubscription && isUserPlusMember;

  // Redux data access - decorations are stored as tasks with category "Decorations" like in Kwanzaa
  const holidayData = getHolidayDataFromRedux(resolvedHolidayId, currentState);
  const decorations =
    holidayData?.tasks?.filter((task: any) => task.category === 'Decorations') || [];
  const isLoading = !homeInitialized;
  const error = null;

  // Debug logging to understand the state
  console.log('Thanksgiving Decorations Debug:', {
    resolvedHolidayId,
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

  // Refresh home data function (like Kwanzaa)
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

  // State management (like Kwanzaa)
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

  // CRUD Operations - Direct API calls like Kwanzaa
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
      console.log('Adding decoration task optimistically:', newTask);
      dispatch(addTaskToHomeData({ holidayId: resolvedHolidayId, task: newTask }));

      // CRITICAL: Map camelCase to snake_case for API
      const apiPayload = {
        title: values.title,
        description: values.description || undefined,
        priority: values.priority as 'low' | 'medium' | 'high',
        assigned_to: values.assignedTo || undefined, // snake_case for API
        category: 'Decorations',
        due_date: values.dueDate || undefined, // snake_case for API
        isCompleted: false,
      };

      console.log('🐛 [ThanksgivingDecorationsAdd] API payload:', apiPayload);

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
        body: JSON.stringify(apiPayload), // Use mapped payload
      });

      if (response.ok) {
        const result = await response.json();
        // Replace temporary task with real one from API
        dispatch(
          removeTaskFromHomeData({
            holidayId: resolvedHolidayId,
            taskId: newTask.id,
          }),
        );
        dispatch(addTaskToHomeData({ holidayId: resolvedHolidayId, task: result }));

        // CRITICAL: Refresh home data for proper UI updates
        await refreshHomeData();

        setShowForm(false);
      } else {
        console.error('API call failed:', response.status);
        // Revert optimistic update on failure
        dispatch(
          removeTaskFromHomeData({
            holidayId: resolvedHolidayId,
            taskId: newTask.id,
          }),
        );
      }
    } catch (error) {
      console.error('Error creating decoration:', error);
      // Revert optimistic update on failure
      dispatch(
        removeTaskFromHomeData({ holidayId: resolvedHolidayId, taskId: newTask.id }),
      );
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
    if (!resolvedHolidayId || !auth0User || isToggling) return;

    setIsToggling(true);
    try {
      // Find the current decoration to get its completion status
      const currentDecoration = decorations.find((d: any) => d.id === taskId);
      if (!currentDecoration) return;

      // Toggle the completion status
      const newIsCompleted = !currentDecoration.isCompleted;

      // Optimistically update Redux state
      dispatch(
        updateTaskInHomeData({
          holidayId: resolvedHolidayId,
          taskId: taskId,
          updates: { isCompleted: newIsCompleted },
        }),
      );

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
          body: JSON.stringify({ isCompleted: newIsCompleted }),
        },
      );

      if (!response.ok) {
        // Revert optimistic update on failure
        dispatch(
          updateTaskInHomeData({
            holidayId: resolvedHolidayId,
            taskId: taskId,
            updates: { isCompleted: !newIsCompleted },
          }),
        );
      } else {
        // CRITICAL: Refresh home data for proper UI updates
        await refreshHomeData();
      }
    } catch (error) {
      console.error('Error updating decoration:', error);
      // Revert optimistic update on error
      const currentDecoration = decorations.find((d: any) => d.id === taskId);
      if (currentDecoration) {
        dispatch(
          updateTaskInHomeData({
            holidayId: resolvedHolidayId,
            taskId: taskId,
            updates: { isCompleted: currentDecoration.isCompleted },
          }),
        );
      }
    } finally {
      setIsToggling(false);
    }
  }

  function handleDeleteTask(taskId: string) {
    // Find the task to get its title for confirmation
    const task = decorations.find((d: any) => d.id === taskId);
    const taskTitle = task?.title || 'this task';

    // For delete, we'll use the existing approach with confirmation
    // We can implement a simple confirm dialog in place of DeleteModal
    if (
      confirm(
        `Are you sure you want to delete "${taskTitle}"? This action cannot be undone.`,
      )
    ) {
      confirmDelete(taskId);
    }
  }

  const handleEditDecoration = (task: any) => {
    // Format the date for the input field (YYYY-MM-DD format)
    const formattedTask = {
      ...task,
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '', // Convert to YYYY-MM-DD
    };
    setEditingTask(formattedTask);
    setShowEditModal(true);
  };

  async function handleEditTaskSubmit(values: Record<string, any>) {
    if (!editingTask || !resolvedHolidayId || !auth0User || isUpdating) return;

    setIsUpdating(true);
    try {
      // CRITICAL: Map camelCase to snake_case for API
      const apiPayload = {
        title: values.title,
        description: values.description || undefined,
        priority: values.priority as 'low' | 'medium' | 'high',
        assigned_to: values.assignedTo || undefined, // snake_case for API
        category: 'Decorations',
        due_date: values.dueDate || undefined, // snake_case for API
      };

      console.log('🐛 [ThanksgivingDecorationsEdit] API payload:', apiPayload);

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
        const result = await response.json();
        // Update Redux state directly
        dispatch(
          updateTaskInHomeData({
            holidayId: resolvedHolidayId,
            taskId: editingTask.id,
            updates: result,
          }),
        );

        // CRITICAL: Refresh home data for proper UI updates
        await refreshHomeData();

        setShowEditModal(false);
        setEditingTask(null);
      } else {
        console.error('Edit API call failed:', response.status);
      }
    } catch (error) {
      console.error('Error editing decoration:', error);
    } finally {
      setIsUpdating(false);
    }
  }

  function closeEditModal() {
    setShowEditModal(false);
    setEditingTask(null);
  }

  async function confirmDelete(taskId: string) {
    if (!resolvedHolidayId || !auth0User || isDeleting) return;

    setIsDeleting(true);
    try {
      // Optimistically update Redux state
      dispatch(
        removeTaskFromHomeData({
          holidayId: resolvedHolidayId,
          taskId: taskId,
        }),
      );

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

      if (response.ok) {
        // CRITICAL: Refresh home data for proper UI updates
        await refreshHomeData();
      } else {
        console.error('Delete API call failed:', response.status);
        // TODO: Revert optimistic update on failure (would need to store original task)
      }
    } catch (error) {
      console.error('Error deleting decoration:', error);
      // TODO: Revert optimistic update on error
    } finally {
      setIsDeleting(false);
    }
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

  // Show loading only if home data is not initialized
  if (!homeInitialized) {
    return (
      <div className="min-h-screen thanksgiving-tasks-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading decorations...</p>
        </div>
      </div>
    );
  }

  const sortedTasks = sortTasks(decorations);
  const incompleteDecorations = sortedTasks.filter((task: any) => !task.isCompleted);
  const completedDecorations = sortedTasks.filter((task: any) => task.isCompleted);

  // Form configuration with conditional assign to field
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
    ...(isAuthorizedForSharing && isHolidayShared
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
    <div className="min-h-screen thanksgiving-tasks-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
      <HolidayPageHeader
        title="Decorations"
        backHref="/thanksgiving"
        onSortClick={() => setShowSortModal(true)}
        sortTitle="Sort tasks"
        description="Keep track of Thanksgiving decorations!"
        holidayColor="amber-500"
        error={undefined}
      />
      <main className="w-full max-w-4xl flex flex-col gap-6">
        <AddButton title="Decoration Task" onClick={openForm} color="amber" />
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
              onDelete={handleDeleteTask}
              onEdit={handleEditDecoration}
              theme={{
                accentColor: '#d97706', // Amber for Thanksgiving
              }}
              borderColor="rgb(217 119 6)" // Amber border for Thanksgiving
              disableInternalModal={true}
            />
          )}
        />

        <TaskSection
          title="Completed Decorations"
          items={completedDecorations}
          isCompleted={true}
          emptyMessage="No completed decorations yet."
          completedMessage="No completed decorations yet."
          renderItem={(task: any) => (
            <ToDoCard
              key={task.id}
              task={task}
              onToggleComplete={handleToggleCompletion}
              onDelete={handleDeleteTask}
              onEdit={handleEditDecoration}
              theme={{
                accentColor: '#d97706', // Amber for Thanksgiving
              }}
              borderColor="rgb(217 119 6)" // Amber border for Thanksgiving
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
        onClose={closeForm}
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
          ...(isAuthorizedForSharing && isHolidayShared
            ? { assignedTo: editingTask?.assignedTo || '' }
            : {}),
          dueDate: editingTask?.dueDate || '',
        }}
        onSubmit={handleEditTaskSubmit}
        onClose={closeEditModal}
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
