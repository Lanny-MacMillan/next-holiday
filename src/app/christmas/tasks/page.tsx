'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useHolidayPageData } from '@/hooks/useHolidayPageData';
import { useHolidayMutations } from '@/hooks/useHolidayMutations';
import { useRefreshHomeData } from '@/hooks/useRefreshHomeData';
import { selectIsHolidayShared } from '@/store/slices/sharesSlice';
import { useSubscription } from '@/hooks/useSubscription';
import SortModal from '@/components/modals/SortModal';
import ToDoCard from '@/components/cards/to-do/ToDoCard';
import EditTaskModal from '@/components/modals/EditTaskModal';
import HolidayPageHeader from '@/components/common/HolidayPageHeader';
import AddButton from '@/components/common/AddButton';
import TaskSection from '@/components/common/TaskSection';
import FormModal from '@/components/modals/FormModal';
import { getFormConfig } from '@/config/formConfigs';

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
    deleteTask,
    createLoading,
    updateLoading,
    deleteLoading,
  } = useHolidayMutations({ holidayId, auth0User });

  // Use standardized data refresh hook
  const { refreshHomeData } = useRefreshHomeData();

  // Check if the holiday is shared to conditionally show assign to field
  const isHolidayShared = useAppSelector((state: any) =>
    selectIsHolidayShared(state, 'christmas'),
  );
  const isAuthorizedForSharing = hasSubscription && isUserPlusMember;

  // Use memoized tasks filtering from holiday data
  const tasks = useMemo(() => holidayData?.tasks || [], [holidayData?.tasks]);

  const isLoading = !homeInitialized;
  const error = null; // Error handling through home data loading

  // State management
  const [sortBy, setSortBy] = useState<SortOption>('none');
  const [showForm, setShowForm] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  async function handleAddTask(formValues: Record<string, any>) {
    if (!formValues.title?.trim() || !holidayId || !auth0User) return;

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
        holidayId: holidayId,
      };

      // Use the standardized hook function
      await createTask(newTask);

      // Refresh home data to ensure UI is in sync
      await refreshHomeData(auth0User, holidayId);

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

      // Use the standardized hook function
      await updateTask(taskId, {
        isCompleted: newCompletionStatus,
      });

      // Refresh home data to ensure UI is in sync
      await refreshHomeData(auth0User, holidayId);
    } catch (error) {
      console.error('Failed to toggle task:', error);
    }
  }

  async function handleDeleteTask(taskId: string) {
    if (!auth0User || !holidayId) return;

    try {
      // Use the standardized hook function
      await deleteTask(taskId);

      // Refresh home data to ensure UI is in sync
      await refreshHomeData(auth0User, holidayId);
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  }

  function handleEditTask(task: Task) {
    setEditingTask(task);
  }

  async function handleSaveEdit(
    updatedTask: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>,
  ) {
    if (editingTask && auth0User && holidayId) {
      try {
        // Use the standardized hook function
        await updateTask(editingTask.id, updatedTask);

        // Refresh home data to ensure UI is in sync
        await refreshHomeData(auth0User, holidayId);

        setEditingTask(null);
      } catch (error) {
        console.error('Failed to update task:', error);
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
        fields={getFormConfig('tasks', 'add').fields.filter(
          field =>
            field.id !== 'assignedTo' || (isAuthorizedForSharing && isHolidayShared),
        )}
        onSubmit={handleAddTask}
        onClose={closeForm}
        loading={loading}
        submitText={loading ? 'Adding...' : 'Add Task'}
        cancelText="Cancel"
        cardClassName="card"
        submitButtonColor="#22c55e"
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
