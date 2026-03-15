'use client';

import { useState, useEffect } from 'react';
import {
  selectHolidayPreferences,
  selectHomeInitialized,
  selectHomeData,
} from '@/store/selectors/home';
import { getHolidayDataFromRedux } from '@/utils/holidayData';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { RootState } from '@/store';
import { updateTaskInHomeData, setHomeData } from '@/store/slices/homeSlice';
import {
  selectIsHolidayShared,
  selectShareByHolidayKey,
} from '@/store/slices/sharesSlice';
import { useAuth0 } from '@auth0/auth0-react';
import { useSubscription } from '@/hooks/useSubscription';
import SortModal from '@/components/modals/SortModal';
import ToDoCard from '@/components/cards/to-do/ToDoCard';
import EditTaskModal from '@/components/modals/EditTaskModal';
import HolidayPageHeader from '@/components/common/HolidayPageHeader';
import AddButton from '@/components/common/AddButton';
import TaskSection from '@/components/common/TaskSection';
import FormModal from '@/components/modals/FormModal';
import { getFormConfigEnhanced } from '@/config/formConfigs';
import { getHolidayIdFromRoute } from '@/utils/holidayUtils';

type SortOption = 'priority' | 'dateDue' | 'assignedTo' | 'category' | 'none';

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  isCompleted: boolean;
  completedDate?: string;
  dueDate?: string;
  category?: string;
  assignedTo?: string;
  shareId?: string;
  createdAt: string;
  updatedAt: string;
}

export default function TasksPage() {
  const dispatch = useAppDispatch();
  const { user: auth0User } = useAuth0();
  const { isUserPlusMember, hasSubscription } = useSubscription();
  const holidayPreferences = useAppSelector(selectHolidayPreferences);
  const homeInitialized = useAppSelector(selectHomeInitialized);
  const homeData = useAppSelector(selectHomeData);

  // Get current Redux state for skip logic
  const currentState = useAppSelector((state: RootState) => state);

  // Get holiday ID for Christmas - try to resolve from home data, fallback to route-based resolution
  const resolvedHolidayId = homeInitialized
    ? getHolidayIdFromRoute('/christmas', holidayPreferences)
    : getHolidayIdFromRoute('/christmas', holidayPreferences); // Allow fallback for cold entry

  // Check if the holiday is shared to conditionally show assign to field
  const isHolidayShared = useAppSelector((state: RootState) =>
    selectIsHolidayShared(state, 'christmas'),
  );
  const isAuthorizedForSharing = hasSubscription && isUserPlusMember;

  // Get share members for Enhanced Compatibility Layer
  const shareData = useAppSelector((state: RootState) =>
    selectShareByHolidayKey(state, 'christmas'),
  );
  const baseMembers = shareData?.members || [];

  // Always include current user in shareMembers for assignTo functionality
  const shareMembers = auth0User
    ? [
        // Add current user first
        {
          userId: auth0User.sub || '',
          name: auth0User.name || 'Me',
          email: auth0User.email || '',
          role: 'owner' as const,
        },
        // Add other members, filtering out current user if already present
        ...baseMembers.filter((member: any) => member.userId !== auth0User.sub),
      ]
    : baseMembers;

  // Get holiday data from Redux - single source of truth
  const holidayData = getHolidayDataFromRedux(resolvedHolidayId, currentState);

  // Use Redux data directly - no individual API calls needed
  const tasks = holidayData?.tasks || [];
  const isLoading = !homeInitialized;
  const error = null; // Error handling through home data loading

  // State management
  const [sortBy, setSortBy] = useState<SortOption>('none');
  const [showForm, setShowForm] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Local loading states for mutations
  const [isAdding, setIsAdding] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  // Function to refresh home data after mutations
  async function refreshHomeData() {
    if (!auth0User) return;

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
  }

  async function handleAddTask(formValues: Record<string, any>) {
    if (!formValues.title?.trim() || !resolvedHolidayId || !auth0User) return;

    try {
      const newTask = {
        title: formValues.title,
        description: formValues.description || undefined,
        priority: formValues.priority as 'low' | 'medium' | 'high',
        ...(isAuthorizedForSharing &&
          isHolidayShared && { assignedTo: formValues.assignedTo || undefined }),
        category: formValues.category || 'Tasks',
        dueDate: formValues.dueDate || undefined,
        isCompleted: false,
        holidayId: resolvedHolidayId,
      };

      // Call API directly instead of using RTK mutation
      await fetch(`/api/holidays/${resolvedHolidayId}/tasks`, {
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
        body: JSON.stringify(newTask),
      });

      // Refresh home data to ensure UI is in sync
      await refreshHomeData();

      setShowForm(false);
    } catch (error) {
      console.error('Failed to add task:', error);
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

  async function handleToggleTask(taskId: string) {
    if (!auth0User || !resolvedHolidayId) return;

    setIsToggling(true);
    try {
      // Find the current task to get its completion status
      const currentTask = tasks.find((task: Task) => task.id === taskId);
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

      // Call API directly instead of using RTK mutation
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
            isCompleted: newCompletionStatus,
          }),
        },
      );

      if (!response.ok) {
        console.error(
          'Failed to toggle task:',
          response.status,
          response.statusText,
        );
      }
    } catch (error) {
      console.error('Failed to toggle task:', error);
      // Revert the optimistic update on error
      const currentTask = tasks.find((task: Task) => task.id === taskId);
      if (currentTask && resolvedHolidayId) {
        dispatch(
          updateTaskInHomeData({
            holidayId: resolvedHolidayId,
            taskId: taskId,
            updates: { isCompleted: currentTask.isCompleted },
          }),
        );
      }
    } finally {
      setIsToggling(false);
    }
  }

  async function handleDeleteTask(taskId: string) {
    if (!auth0User || !resolvedHolidayId) return;

    setIsDeleting(true);
    try {
      // Call API directly instead of using RTK mutation
      await fetch(`/api/holidays/${resolvedHolidayId}/tasks/${taskId}`, {
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

      // Refresh home data to ensure UI is in sync
      await refreshHomeData();
    } catch (error) {
      console.error('Failed to delete task:', error);
    } finally {
      setIsDeleting(false);
    }
  }

  function handleEditTask(task: Task) {
    setEditingTask(task);
  }

  async function handleSaveEdit(
    updatedTask: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>,
  ) {
    if (editingTask && auth0User && resolvedHolidayId) {
      setIsUpdating(true);
      try {
        // Optimistically update the Redux home data
        dispatch(
          updateTaskInHomeData({
            holidayId: resolvedHolidayId,
            taskId: editingTask.id,
            updates: updatedTask,
          }),
        );

        // Call API directly instead of using RTK mutation
        await fetch(`/api/holidays/${resolvedHolidayId}/tasks/${editingTask.id}`, {
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
          body: JSON.stringify(updatedTask),
        });

        // Refresh home data to ensure UI is in sync
        await refreshHomeData();

        setEditingTask(null);
      } catch (error) {
        console.error('Failed to update task:', error);
        // Revert the optimistic update on error
        dispatch(
          updateTaskInHomeData({
            holidayId: resolvedHolidayId,
            taskId: editingTask.id,
            updates: {
              title: editingTask.title,
              description: editingTask.description,
              priority: editingTask.priority,
              category: editingTask.category,
              assignedTo: editingTask.assignedTo,
              dueDate: editingTask.dueDate,
            },
          }),
        );
      } finally {
        setIsUpdating(false);
      }
    }
  }

  function handleCloseEdit() {
    setEditingTask(null);
  }

  function sortTasks(tasksToSort: Task[]): Task[] {
    switch (sortBy) {
      case 'priority':
        const priorityOrder = { high: 3, medium: 2, low: 1 };
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

  if (isLoading && !holidayData?.tasks) {
    return (
      <div className="min-h-screen christmas-tasks-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading tasks...</p>
        </div>
      </div>
    );
  }

  const sortedTasks = sortTasks(tasks);
  const incompleteTasks = sortedTasks.filter((task: Task) => !task.isCompleted);
  const completedTasks = sortedTasks.filter((task: Task) => task.isCompleted);

  const loading = isAdding || isUpdating || isDeleting || isToggling;

  return (
    <div className="min-h-screen christmas-tasks-gradient  flex flex-col items-center p-4 sm:p-8 font-sans">
      <HolidayPageHeader
        title="To-Do List"
        backHref="/christmas"
        onSortClick={() => setShowSortModal(true)}
        sortTitle="Sort tasks"
        description="Add tasks to your holiday to-do list"
        holidayColor="red-500"
        error={error ? 'Failed to load tasks' : undefined}
      />
      <main className="w-full max-w-4xl flex flex-col gap-6">
        <AddButton title="Task" onClick={openForm} color="green" />
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
          emptyMessage="All tasks completed! 🎉"
          completedMessage="All tasks completed! 🎉"
          renderItem={(task: Task) => (
            <ToDoCard
              key={task.id}
              task={task}
              onToggleComplete={handleToggleTask}
              onDelete={handleDeleteTask}
              onEdit={handleEditTask}
              theme={{
                accentColor: '#22c55e', // Green for Christmas
              }}
              borderColor="rgb(var(--color-green-500))" // Green border for Christmas
              disableInternalModal={true}
            />
          )}
          // cardClassName="card-tasks"
        />

        <TaskSection
          title="Completed"
          items={completedTasks}
          isCompleted={true}
          emptyMessage="No completed tasks yet."
          completedMessage="No completed tasks yet."
          renderItem={(task: Task) => (
            <ToDoCard
              key={task.id}
              task={task}
              onToggleComplete={handleToggleTask}
              onDelete={handleDeleteTask}
              onEdit={handleEditTask}
              className="opacity-60"
              theme={{
                accentColor: '#22c55e', // Green for Christmas
              }}
              borderColor="rgb(var(--color-green-500))" // Green border for Christmas
              disableInternalModal={true}
            />
          )}
          // cardClassName="card-tasks"
        />
      </main>

      {/* Form Modal */}
      <FormModal
        isOpen={showForm}
        title="Add New Task"
        fields={
          getFormConfigEnhanced('tasks', 'add', {
            holidayKey: 'christmas',
            shareMembers: shareMembers,
            auth0User: auth0User,
          }).fields
        }
        onSubmit={handleAddTask}
        onClose={closeForm}
        loading={loading}
        submitText={loading ? 'Adding...' : 'Add Task'}
        cancelText="Cancel"
        cardClassName="card"
        submitButtonColor="#22c55e"
        shareMembers={shareMembers}
      />

      {/* Edit Task Modal */}
      <EditTaskModal
        isOpen={editingTask !== null}
        task={editingTask}
        onClose={handleCloseEdit}
        onSave={handleSaveEdit}
        loading={loading}
        isHolidayShared={isHolidayShared}
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
          ...(isAuthorizedForSharing && isHolidayShared
            ? [{ value: 'assignedTo', label: 'Assigned To' }]
            : []),
          { value: 'category', label: 'Category' },
        ]}
        title="Sort Tasks"
      />
    </div>
  );
}
