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

export default function FourthOfJulyDecorationsPage() {
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
    ? getHolidayIdFromRoute('/fourth-of-july', holidayPreferences)
    : getHolidayIdFromRoute('/fourth-of-july', holidayPreferences);

  // Check if the holiday is shared to conditionally show assign to field
  const isHolidayShared = useAppSelector((state: any) =>
    selectIsHolidayShared(state, 'fourth-of-july'),
  );
  const isAuthorizedForSharing = hasSubscription && isUserPlusMember;

  // Redux data access - decorations are stored as tasks with category "Decorations" like in Kwanzaa
  const holidayData = getHolidayDataFromRedux(resolvedHolidayId, currentState);
  const decorations =
    holidayData?.tasks?.filter((task: any) => task.category === 'Decorations') || [];
  const isLoading = !homeInitialized;
  const error = null;

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
      console.log('Adding decoration optimistically:', newTask);
      console.log('Holiday ID for addition:', resolvedHolidayId);
      dispatch(addTaskToHomeData({ holidayId: resolvedHolidayId, task: newTask }));
      console.log('Task added to Redux, making API call...');

      // Call API - map camelCase to snake_case for API
      const apiPayload: any = {
        title: values.title,
        category: 'Decorations',
        isCompleted: false,
        holidayId: resolvedHolidayId, // Include holidayId in payload
      };

      // Only add optional fields if they have values
      if (values.description) apiPayload.description = values.description;
      if (values.priority) apiPayload.priority = values.priority;
      if (values.assignedTo) apiPayload.assigned_to = values.assignedTo;
      if (values.dueDate) apiPayload.due_date = values.dueDate;

      console.log('🐛 [FourthOfJulyDecorationsAdd] API payload:', apiPayload);

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

        // CRITICAL: Refresh home data for proper UI updates
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

  async function handleToggleTask(taskId: string) {
    if (!resolvedHolidayId || !auth0User) return;

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
          holidayId: resolvedHolidayId,
          taskId: taskId,
          updates: { isCompleted: newCompletionStatus },
        }),
      );

      // Call API directly instead of using custom hook
      const apiUrl = `/api/holidays/${resolvedHolidayId}/tasks/${taskId}`;
      const response = await fetch(apiUrl, {
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
        const currentTask = decorations.find((task: any) => task.id === taskId);
        if (currentTask) {
          dispatch(
            updateTaskInHomeData({
              holidayId: resolvedHolidayId,
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
  }

  const handleEditTask = (task: any) => {
    setEditingTask(task);
    setShowEditModal(true);
  };

  async function handleEditTaskSubmit(values: Record<string, any>) {
    if (!editingTask || !resolvedHolidayId || !auth0User) return;

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
          holidayId: resolvedHolidayId,
          taskId: editingTask.id,
          updates: updatedTask,
        }),
      );

      // Call API directly instead of using custom hook - map camelCase to snake_case
      const apiPayload = {
        title: values.title,
        description: values.description || undefined,
        priority: values.priority as 'low' | 'medium' | 'high',
        assigned_to: values.assignedTo || undefined, // snake_case for API
        category: 'Decorations',
        due_date: values.dueDate || undefined, // snake_case for API
      };

      console.log('🐛 [FourthOfJulyDecorationsEdit] API payload:', apiPayload);

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

      if (!response.ok) {
        // Revert the optimistic update on error
        dispatch(
          updateTaskInHomeData({
            holidayId: resolvedHolidayId,
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

      setEditingTask(null);
      setShowEditModal(false);
    } catch (error) {
      console.error('Failed to update task:', error);
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleDeleteTask(taskId: string) {
    if (!resolvedHolidayId || !auth0User) return;

    // Find the task to delete for potential rollback
    const taskToDelete = decorations.find((task: any) => task.id === taskId);
    if (!taskToDelete) return;

    setIsDeleting(true);
    try {
      // Optimistically update Redux state first
      dispatch(removeTaskFromHomeData({ holidayId: resolvedHolidayId, taskId }));

      // Call API directly instead of using custom hook
      const apiUrl = `/api/holidays/${resolvedHolidayId}/tasks/${taskId}`;
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
        dispatch(
          addTaskToHomeData({ holidayId: resolvedHolidayId, task: taskToDelete }),
        );
        console.error(
          'Failed to delete task:',
          response.status,
          response.statusText,
        );
      } else {
        console.log('Task deleted successfully');
      }
    } catch (error) {
      // If API failed, revert the optimistic update
      dispatch(
        addTaskToHomeData({ holidayId: resolvedHolidayId, task: taskToDelete }),
      );
      console.error('Failed to delete task:', error);
    } finally {
      setIsDeleting(false);
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

  const loading = isAdding || isUpdating || isDeleting || isToggling;

  if (isLoading) {
    return (
      <div className="min-h-screen fourth-of-july-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading decorations...</p>
        </div>
      </div>
    );
  }

  const sortedTasks = sortTasks(decorations);
  const incompleteDecorations = sortedTasks.filter((task: any) => !task.isCompleted);
  const completedDecorations = sortedTasks.filter((task: any) => task.isCompleted);

  // FormModal fields configuration - matching Kwanzaa exactly
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
    <div className="min-h-screen fourth-of-july-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
      <HolidayPageHeader
        title="Fourth of July Decorations"
        backHref="/fourth-of-july"
        onSortClick={() => setShowSortModal(true)}
        description="Plan your patriotic decorations!"
        holidayColor="blue-600"
        sortTitle="Sort Decorations"
      />

      <main className="flex-1 w-full max-w-4xl flex flex-col gap-6 mt-4">
        <AddButton title="Decoration" onClick={openForm} color="blue" />

        {/* Decoration Status Summary */}
        {decorations.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Decoration Status</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {decorations.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Total Decorations
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {completedDecorations.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Completed
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {incompleteDecorations.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Remaining
                </div>
              </div>
            </div>
          </div>
        )}

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
              onToggleComplete={handleToggleTask}
              onDelete={(taskId: string) => handleDeleteTask(taskId)}
              onEdit={handleEditTask}
              theme={{
                accentColor: '#3b82f6', // Blue for Fourth of July
              }}
              borderColor="rgb(59 130 246)" // Blue border for Fourth of July
              disableInternalModal={true}
            />
          )}
        />

        <TaskSection
          title="Completed Decorations"
          items={completedDecorations}
          isCompleted={true}
          emptyMessage=""
          completedMessage=""
          renderItem={(task: any) => (
            <ToDoCard
              key={task.id}
              task={task}
              onToggleComplete={handleToggleTask}
              onDelete={(taskId: string) => handleDeleteTask(taskId)}
              onEdit={handleEditTask}
              className="opacity-60"
              theme={{
                accentColor: '#3b82f6', // Blue for Fourth of July
              }}
              borderColor="rgb(59 130 246)" // Blue border for Fourth of July
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
          ...(isAuthorizedForSharing && isHolidayShared
            ? [
                {
                  id: 'assignedTo',
                  type: 'text' as const,
                  placeholder: 'Assigned To',
                },
              ]
            : []),
          { id: 'dueDate', type: 'date' as const, placeholder: 'Due Date' },
        ]}
        initialValues={{
          title: '',
          description: '',
          priority: 'medium',
          ...(isAuthorizedForSharing && isHolidayShared ? { assignedTo: '' } : {}),
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
          ...(isAuthorizedForSharing && isHolidayShared
            ? [
                {
                  id: 'assignedTo',
                  type: 'text' as const,
                  placeholder: 'Assigned To',
                },
              ]
            : []),
          { id: 'dueDate', type: 'date' as const, placeholder: 'Due Date' },
        ]}
        initialValues={
          editingTask
            ? {
                title: editingTask.title || '',
                description: editingTask.description || '',
                priority: editingTask.priority || 'medium',
                ...(isAuthorizedForSharing && isHolidayShared
                  ? { assignedTo: editingTask.assignedTo || '' }
                  : {}),
                dueDate: editingTask.dueDate
                  ? new Date(editingTask.dueDate).toISOString().split('T')[0]
                  : '',
              }
            : {}
        }
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
          { value: 'dateDue', label: 'Due Date' },
          { value: 'assignedTo', label: 'Assigned To' },
          { value: 'category', label: 'Category' },
        ]}
        title="Sort Decorations"
      />
    </div>
  );
}
