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
import HolidayPageHeader from '@/components/common/HolidayPageHeader';
import ToDoCard from '@/components/cards/to-do/ToDoCard';
import AddButton from '@/components/common/AddButton';
import TaskSection from '@/components/common/TaskSection';
import FormModal from '@/components/modals/FormModal';
import DeleteModal from '@/components/modals/DeleteModal';
import SortModal from '@/components/modals/SortModal';

export default function BabyShowerGamesPage() {
  const dispatch = useAppDispatch();
  const { contacts } = useAppSelector((state: any) => state.addressBook);
  const { user: auth0User } = useAuth0();

  // Get Redux data
  const holidayPreferences = useAppSelector(selectHolidayPreferences);
  const homeInitialized = useAppSelector(selectHomeInitialized);
  const homeData = useAppSelector(selectHomeData);

  // Get current Redux state for data access
  const currentState = useAppSelector((state: any) => state);

  // Holiday ID resolution
  const resolvedHolidayId = homeInitialized
    ? getHolidayIdFromRoute('/baby-shower', holidayPreferences)
    : getHolidayIdFromRoute('/baby-shower', holidayPreferences);

  // Check if the holiday is shared to conditionally show assign to field
  const isHolidayShared = useAppSelector((state: any) =>
    selectIsHolidayShared(state, 'baby-shower'),
  );

  // Redux data access - games are stored as tasks with category "Games"
  const holidayData = getHolidayDataFromRedux(resolvedHolidayId, currentState);
  const gameTasks =
    holidayData?.tasks?.filter((task: any) => task.category === 'Games') || [];
  const isLoading = !homeInitialized;
  const error = null;

  // Refresh home data function
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
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<any>(null);
  const [showSortModal, setShowSortModal] = useState(false);
  const [sortBy, setSortBy] = useState<string>('dateCreated');
  const [showDefaultTasks, setShowDefaultTasks] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    // Always fetch contacts for address book functionality
    dispatch(fetchContacts());
  }, [dispatch]);

  useEffect(() => {
    if (gameTasks.length === 0 && homeInitialized) {
      setShowDefaultTasks(true);
    }
  }, [gameTasks, homeInitialized]);

  // Sort options for games
  const sortOptions = [
    { value: 'dateCreated', label: 'Date Created' },
    { value: 'title', label: 'Title A-Z' },
    { value: 'priority', label: 'Priority' },
    { value: 'dueDate', label: 'Due Date' },
  ];

  // Sort function
  const sortTasks = (tasks: any[], sortOption: string) => {
    const sortedTasks = [...tasks];
    switch (sortOption) {
      case 'title':
        return sortedTasks.sort((a, b) => a.title.localeCompare(b.title));
      case 'priority':
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return sortedTasks.sort(
          (a, b) =>
            (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) -
            (priorityOrder[a.priority as keyof typeof priorityOrder] || 0),
        );
      case 'dueDate':
        return sortedTasks.sort((a, b) => {
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        });
      case 'dateCreated':
      default:
        return sortedTasks.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
    }
  };

  const sortedGameTasks = sortTasks(gameTasks, sortBy);

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
      category: 'Games',
      dueDate: values.dueDate || undefined,
      isCompleted: false,
      holidayId: resolvedHolidayId,
    };

    try {
      // Optimistically update Redux state first
      dispatch(addTaskToHomeData({ holidayId: resolvedHolidayId, task: newTask }));

      // Call API - map camelCase to snake_case for API
      const apiPayload = {
        title: values.title,
        description: values.description || undefined,
        priority: values.priority as 'low' | 'medium' | 'high',
        assigned_to: values.assignedTo || undefined, // snake_case for API
        category: 'Games',
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
        // Replace temporary task with real task from API
        const result = await response.json();
        dispatch(
          removeTaskFromHomeData({
            holidayId: resolvedHolidayId,
            taskId: newTask.id,
          }),
        );
        dispatch(addTaskToHomeData({ holidayId: resolvedHolidayId, task: result }));

        // Also refresh home data
        await refreshHomeData();
      } else {
        // Remove optimistic update on error
        dispatch(
          removeTaskFromHomeData({
            holidayId: resolvedHolidayId,
            taskId: newTask.id,
          }),
        );
        console.error('Failed to add task:', response.status, response.statusText);
      }

      setShowAddForm(false);
    } catch (error) {
      // Remove optimistic update on error
      dispatch(
        removeTaskFromHomeData({ holidayId: resolvedHolidayId, taskId: newTask.id }),
      );
      console.error('Failed to add task:', error);
    } finally {
      setIsAdding(false);
    }
  }

  const handleEdit = (task: any) => {
    setEditingTask(task);
    setShowAddForm(true);
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
        category: 'Games',
        dueDate: values.dueDate || undefined,
      };

      // Optimistically update the Redux state
      dispatch(
        updateTaskInHomeData({
          holidayId: resolvedHolidayId,
          taskId: editingTask.id,
          updates: updatedTask,
        }),
      );

      // Call API - map camelCase to snake_case
      const apiPayload = {
        title: values.title,
        description: values.description || undefined,
        priority: values.priority as 'low' | 'medium' | 'high',
        assigned_to: values.assignedTo || undefined, // snake_case for API
        category: 'Games',
        due_date: values.dueDate || undefined, // snake_case for API
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
      setShowAddForm(false);
    } catch (error) {
      console.error('Failed to update task:', error);
    } finally {
      setIsUpdating(false);
    }
  }

  const handleDelete = (taskOrId: any) => {
    // Handle both task object and task ID
    const task =
      typeof taskOrId === 'string'
        ? gameTasks.find(t => t.id === taskOrId)
        : taskOrId;

    if (task) {
      setTaskToDelete(task);
      setShowDeleteModal(true);
    }
  };

  async function handleDeleteTask(taskId: string) {
    if (!resolvedHolidayId || !auth0User) return;

    // Find the task to delete for potential rollback
    const taskToDelete = gameTasks.find((task: any) => task.id === taskId);
    if (!taskToDelete) return;

    setIsDeleting(true);
    try {
      // Optimistically update Redux state first
      dispatch(removeTaskFromHomeData({ holidayId: resolvedHolidayId, taskId }));

      // Call API directly
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

  const confirmDelete = async () => {
    if (taskToDelete) {
      await handleDeleteTask(taskToDelete.id);
      setTaskToDelete(null);
    }
    setShowDeleteModal(false);
  };

  async function handleToggleTask(taskId: string) {
    if (!resolvedHolidayId || !auth0User) return;

    setIsToggling(true);
    try {
      // Find the current task to get its completion status
      const currentTask = gameTasks.find((task: any) => task.id === taskId);
      if (!currentTask) {
        console.error('Task not found:', taskId);
        return;
      }

      // Toggle the completion status
      const newCompletionStatus = !currentTask.isCompleted;

      // Optimistically update the Redux state
      dispatch(
        updateTaskInHomeData({
          holidayId: resolvedHolidayId,
          taskId: taskId,
          updates: { isCompleted: newCompletionStatus },
        }),
      );

      // Call API directly
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
        const revertTask = gameTasks.find((task: any) => task.id === taskId);
        if (revertTask) {
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

  const handleSortChange = (sortOption: string) => {
    setSortBy(sortOption);
  };

  return (
    <div className="min-h-screen baby-shower-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
      <HolidayPageHeader
        title="Baby Shower Games"
        backHref="/baby-shower"
        onSortClick={() => setShowSortModal(true)}
        sortTitle="Sort Games"
        description="Plan your baby shower games with style!"
        holidayColor="cyan-500"
        error={error ? 'An error occurred while loading games' : undefined}
      />

      <main className="flex-1 w-full max-w-4xl flex flex-col gap-6 mt-4">
        <AddButton title="Game" onClick={() => setShowAddForm(true)} color="cyan" />

        <TaskSection
          title="Incomplete"
          items={sortedGameTasks.filter(task => !task.isCompleted)}
          isCompleted={false}
          emptyMessage="All games completed! 🎉"
          completedMessage=""
          renderItem={task => (
            <ToDoCard
              key={task.id}
              task={task}
              onToggleComplete={handleToggleTask}
              onDelete={handleDelete}
              onEdit={handleEdit}
              gamifiedBackgroundColor="bg-gradient-to-br from-cyan-300 to-cyan-500"
              disableInternalModal={true}
            />
          )}
        />

        <TaskSection
          title="Completed"
          items={sortedGameTasks.filter(task => task.isCompleted)}
          isCompleted={true}
          emptyMessage="No completed games yet."
          completedMessage="No completed games yet."
          renderItem={task => (
            <ToDoCard
              key={task.id}
              task={task}
              onToggleComplete={handleToggleTask}
              onDelete={handleDelete}
              onEdit={handleEdit}
              className="opacity-60"
              gamifiedBackgroundColor="bg-gradient-to-br from-cyan-300 to-cyan-500"
            />
          )}
        />
      </main>

      {/* Sort Modal */}
      <SortModal
        isOpen={showSortModal}
        onClose={() => setShowSortModal(false)}
        sortBy={sortBy}
        onSortChange={handleSortChange}
        sortOptions={sortOptions}
        title="Sort Games"
      />

      {/* Form Modal */}
      <FormModal
        isOpen={showAddForm}
        title={editingTask ? 'Edit Game' : 'Add New Game'}
        fields={[
          {
            id: 'title',
            type: 'text' as const,
            placeholder: 'Game Title*',
            required: true,
          },
          {
            id: 'description',
            type: 'textarea' as const,
            placeholder: 'Description',
            rows: 3,
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
          { id: 'dueDate', type: 'date' as const, placeholder: 'Due Date' },
        ]}
        initialValues={
          editingTask
            ? {
                title: editingTask.title || '',
                description: editingTask.description || '',
                priority: editingTask.priority || 'medium',
                ...(isHolidayShared
                  ? { assignedTo: editingTask.assignedTo || '' }
                  : {}),
                dueDate: editingTask.dueDate
                  ? new Date(editingTask.dueDate).toISOString().split('T')[0]
                  : '',
              }
            : {
                priority: 'medium',
                category: 'Games',
                ...(isHolidayShared ? { assignedTo: '' } : {}),
              }
        }
        onSubmit={editingTask ? handleEditTaskSubmit : handleAddTask}
        onClose={() => {
          setShowAddForm(false);
          setEditingTask(null);
        }}
        loading={editingTask ? isUpdating : isAdding}
        submitText={editingTask ? 'Update Game' : 'Add Game'}
        cardClassName="card"
        submitButtonColor="#06b6d4"
      />

      {/* Delete Modal */}
      <DeleteModal
        isOpen={showDeleteModal}
        title="Delete Game"
        itemName={taskToDelete?.title}
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowDeleteModal(false);
          setTaskToDelete(null);
        }}
        loading={isDeleting}
        cardClassName="card"
        confirmButtonColor="#06b6d4"
      />
    </div>
  );
}
