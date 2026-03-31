'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { RootState } from '@/store';
import {
  selectIsHolidayShared,
  selectShareByHolidayKey,
} from '@/store/slices/sharesSlice';
import { useHolidayPageData } from '@/hooks/useHolidayPageData';
import { useHolidayMutations } from '@/hooks/useHolidayMutations';

import { useSubscription } from '@/hooks/useSubscription';
import { fetchContacts } from '@/store/slices/addressBookSlice';
import SortModal from '@/components/modals/SortModal';
import ToDoCard from '@/components/cards/to-do/ToDoCard';
import EditTaskModal from '@/components/modals/EditTaskModal';
import HolidayPageHeader from '@/components/common/HolidayPageHeader';
import AddButton from '@/components/common/AddButton';
import TaskSection from '@/components/common/TaskSection';
import FormModal from '@/components/modals/FormModal';
import DeleteModal from '@/components/modals/DeleteModal';
import { getFormConfigEnhanced } from '@/config/formConfigs';
import { getDeleteConfig } from '@/config/deleteModalConfigs';

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
  const { isUserPlusMember, hasSubscription } = useSubscription();

  // Use standardized hooks
  const { holidayId, holidayData, auth0User, homeInitialized } =
    useHolidayPageData();

  const {
    createTask,
    updateTask,
    toggleTask,
    deleteTask,
    createLoading,
    updateLoading,
    deleteLoading,
  } = useHolidayMutations({ holidayId, auth0User });

  // Use standardized data refresh hook

  // Check if the holiday is shared to conditionally show assign to field
  const isHolidayShared = useAppSelector((state: any) =>
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
          uuid: auth0User.id || '', // Database UUID for Enhanced Compatibility Layer
          name: auth0User.name || 'Me',
          email: auth0User.email || '',
          role: 'owner' as const,
        },
        // Add other members, filtering out current user if already present
        ...baseMembers
          .filter((member: any) => member.userId !== auth0User.sub)
          .map((member: any) => ({
            ...member,
            uuid: member.uuid || member.userId, // Preserve existing uuid, fallback to userId only if needed
          })),
      ]
    : baseMembers;

  // Get contacts for Enhanced Compatibility Layer
  const { contacts } = useAppSelector((state: any) => state.addressBook);

  // Helper function to resolve assignedTo UUID to user name
  const getAssignedUserName = (assignedToUuid: string): string | null => {
    if (!assignedToUuid || !shareMembers.length) return null;
    const member = shareMembers.find((m: any) => m.uuid === assignedToUuid);
    return member ? member.name || member.email || 'Unknown User' : assignedToUuid;
  };

  // Transform tasks to include assignedToName for display
  const transformTaskWithAssignment = (task: any) => ({
    ...task,
    assignedToName: task.assignedTo ? getAssignedUserName(task.assignedTo) : null,
  });

  // Use memoized tasks filtering from holiday data with assignment names
  const tasks = useMemo(
    () => (holidayData?.tasks || []).map(transformTaskWithAssignment),
    [holidayData?.tasks, shareMembers],
  );

  const isLoading = !homeInitialized;
  const error = null; // Error handling through home data loading

  // State management
  const [sortBy, setSortBy] = useState<SortOption>('none');
  const [showForm, setShowForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<any>(null);

  useEffect(() => {
    // Always fetch contacts for address book functionality
    dispatch(fetchContacts());
  }, [dispatch]);

  async function handleAddTask(formValues: Record<string, any>) {
    if (!formValues.title?.trim() || !holidayId || !auth0User) return;

    try {
      const newTask = {
        title: formValues.title,
        description: formValues.description || undefined,
        priority: formValues.priority as 'low' | 'medium' | 'high',
        ...(isAuthorizedForSharing &&
          isHolidayShared && { assigned_to: formValues.assigned_to || undefined }),
        category: formValues.category || 'Tasks',
        due_date: formValues.dueDate || undefined,
        isCompleted: false,
        holidayId: holidayId,
      };

      // Use the standardized hook function
      await createTask(newTask);

      setShowForm(false);
    } catch (error) {
      console.error('Failed to add task:', error);
    }
  }

  function openForm() {
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
  }

  async function handleToggleTask(taskId: string) {
    if (!auth0User || !holidayId) return;

    try {
      // Find the current task to get its completion status
      const currentTask = tasks.find((task: Task) => task.id === taskId);
      if (!currentTask) {
        console.error('Task not found:', taskId);
        return;
      }

      // Toggle the completion status
      const newCompletionStatus = !currentTask.isCompleted;

      // ✅ Use the dedicated toggleTask function for completion changes
      await toggleTask(taskId, newCompletionStatus);
    } catch (error) {
      console.error('Failed to toggle task:', error);
    }
  }

  function handleDelete(taskId: string, taskTitle: string) {
    const task = tasks.find((t: any) => t.id === taskId);
    if (task) {
      setTaskToDelete({ ...task, title: taskTitle });
      setShowDeleteModal(true);
    }
  }

  async function handleConfirmDelete() {
    if (!taskToDelete?.id || !holidayId || !auth0User) return;

    try {
      await deleteTask(taskToDelete.id);
      setShowDeleteModal(false);
      setTaskToDelete(null);
    } catch (error) {
      console.error('Error deleting task:', error);
      setShowDeleteModal(false);
      setTaskToDelete(null);
    }
  }

  function handleCancelDelete() {
    setShowDeleteModal(false);
    setTaskToDelete(null);
  }

  function handleEditTask(task: Task) {
    setEditingTask(task);
    setShowEditModal(true);
  }

  async function handleSaveEdit(formValues: Record<string, any>) {
    if (editingTask && auth0User && holidayId) {
      try {
        const updatedTask = {
          title: formValues.title,
          description: formValues.description || undefined,
          priority: formValues.priority as 'low' | 'medium' | 'high',
          assigned_to: formValues.assigned_to || null,
          category: formValues.category || 'Tasks',
          due_date: formValues.dueDate || null,
          isCompleted: formValues.isCompleted || false,
        };

        // Use the standardized hook function
        await updateTask(editingTask.id, updatedTask);

        setEditingTask(null);
        setShowEditModal(false);
      } catch (error) {
        console.error('Failed to update task:', error);
      }
    }
  }

  function handleCloseEdit() {
    setEditingTask(null);
    setShowEditModal(false);
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

  const loading = createLoading || updateLoading || deleteLoading;

  return (
    <div className="min-h-screen christmas-tasks-gradient  flex flex-col items-center p-4 sm:p-8 font-sans">
      <HolidayPageHeader
        title="Tasks"
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
              onDelete={(taskId: string) => handleDelete(taskId, task.title)}
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
              onDelete={(taskId: string) => handleDelete(taskId, task.title)}
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
        contacts={contacts}
        shareMembers={shareMembers}
      />

      {/* Edit Task Modal */}
      <FormModal
        isOpen={showEditModal}
        title="Edit Task"
        fields={
          getFormConfigEnhanced('tasks', 'edit', {
            holidayKey: 'christmas',
            shareMembers: shareMembers,
            auth0User: auth0User,
          }).fields
        }
        onSubmit={handleSaveEdit}
        onClose={handleCloseEdit}
        loading={loading}
        submitText={loading ? 'Updating...' : 'Update Task'}
        cancelText="Cancel"
        cardClassName="card"
        submitButtonColor="#22c55e"
        contacts={contacts}
        shareMembers={shareMembers}
        initialValues={
          editingTask
            ? {
                title: editingTask.title,
                description: editingTask.description || '',
                priority: editingTask.priority,
                assigned_to: editingTask.assignedTo || '',
                category: editingTask.category || 'Tasks',
                dueDate: editingTask.dueDate
                  ? new Date(editingTask.dueDate).toISOString().split('T')[0]
                  : '',
                isCompleted: editingTask.isCompleted,
              }
            : undefined
        }
      />

      {/* Delete Modal */}
      {showDeleteModal && taskToDelete && (
        <DeleteModal
          isOpen={showDeleteModal}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
          title="Delete Task"
          message={`Are you sure you want to delete "${taskToDelete?.title}"? This action cannot be undone.`}
          loading={deleteLoading}
        />
      )}

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
