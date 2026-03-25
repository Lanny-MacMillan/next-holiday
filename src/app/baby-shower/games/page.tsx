'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useHolidayPageData } from '@/hooks/useHolidayPageData';
import { useHolidayMutations } from '@/hooks/useHolidayMutations';
import { useRefreshHomeData } from '@/hooks/useRefreshHomeData';
import { fetchContacts } from '@/store/slices/addressBookSlice';
import {
  selectIsHolidayShared,
  selectShareByHolidayKey,
} from '@/store/slices/sharesSlice';
import HolidayPageHeader from '@/components/common/HolidayPageHeader';
import ToDoCard from '@/components/cards/to-do/ToDoCard';
import AddButton from '@/components/common/AddButton';
import TaskSection from '@/components/common/TaskSection';
import FormModal from '@/components/modals/FormModal';
import DeleteModal from '@/components/modals/DeleteModal';
import SortModal from '@/components/modals/SortModal';
import { getFormConfigEnhanced } from '@/config/formConfigs';

export default function BabyShowerGamesPage() {
  const dispatch = useAppDispatch();
  const contacts = useAppSelector((state: any) => state.addressBook.contacts);

  // Get share members for Enhanced Compatibility Layer
  const shareData = useAppSelector((state: any) =>
    selectShareByHolidayKey(state, 'baby-shower'),
  );
  const shareMembers = shareData?.members || [];

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

  const { refreshHomeData } = useRefreshHomeData();

  // Check if the holiday is shared to conditionally show assign to field
  const isHolidayShared = useAppSelector((state: any) =>
    selectIsHolidayShared(state, 'baby-shower'),
  );

  // Filter games from holiday data - games are stored as tasks with category "Games"
  const gameTasks = useMemo(
    () => holidayData?.tasks?.filter((task: any) => task.category === 'Games') || [],
    [holidayData?.tasks],
  );
  const isLoading = !homeInitialized;
  const error = null;

  // State management
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<any>(null);
  const [showSortModal, setShowSortModal] = useState(false);
  const [sortBy, setSortBy] = useState<string>('dateCreated');
  const [showDefaultTasks, setShowDefaultTasks] = useState(false);

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

  // Name resolution helper functions
  const getAssignedUserName = (assignedToUuid: string): string | null => {
    if (!assignedToUuid || !shareMembers.length) return null;
    const member = shareMembers.find((m: any) => m.uuid === assignedToUuid);
    return member ? member.name || member.email || 'Unknown User' : assignedToUuid;
  };

  const transformTaskWithAssignment = (task: any) => ({
    ...task,
    assignedToName: task.assignedTo ? getAssignedUserName(task.assignedTo) : null,
  });

  const sortedGameTasks = sortTasks(gameTasks, sortBy).map(
    transformTaskWithAssignment,
  );

  // Enhanced Compatibility Layer form configurations
  const formConfig = getFormConfigEnhanced('tasks', 'add', {
    holidayKey: 'baby-shower',
    shareMembers: shareMembers,
    auth0User: auth0User,
  });

  const editFormConfig = getFormConfigEnhanced('tasks', 'edit', {
    holidayKey: 'baby-shower',
    shareMembers: shareMembers,
    auth0User: auth0User,
  });

  // CRUD Operations
  async function handleAddTask(values: Record<string, any>) {
    if (!values.title?.trim()) return;
    if (!holidayId || !auth0User) return;

    const newTask = {
      title: values.title,
      description: values.description || undefined,
      priority: values.priority as 'low' | 'medium' | 'high',
      assigned_to: values.assigned_to || undefined,
      due_date: values.dueDate || undefined,
      category: 'Games',
    };

    await createTask(newTask);
    await refreshHomeData(auth0User, holidayId);
    setShowAddForm(false);
  }

  const handleEdit = (task: any) => {
    setEditingTask(task);
    setShowAddForm(true);
  };

  async function handleEditTaskSubmit(values: Record<string, any>) {
    if (!editingTask || !holidayId || !auth0User) return;

    const updatedTask = {
      title: values.title,
      description: values.description || undefined,
      priority: values.priority as 'low' | 'medium' | 'high',
      assigned_to: values.assigned_to || null,
      due_date: values.dueDate || null,
      category: 'Games',
    };

    await updateTask(editingTask.id, updatedTask);
    await refreshHomeData(auth0User, holidayId);
    setEditingTask(null);
    setShowAddForm(false);
  }

  const handleDelete = (taskOrId: any) => {
    // Handle both task object and task ID
    const task =
      typeof taskOrId === 'string'
        ? gameTasks.find((t: any) => t.id === taskOrId)
        : taskOrId;

    if (task) {
      setTaskToDelete(task);
      setShowDeleteModal(true);
    }
  };

  const confirmDelete = async () => {
    if (taskToDelete && holidayId && auth0User) {
      try {
        await deleteTask(taskToDelete.id);
        await refreshHomeData(auth0User, holidayId);
      } catch (error) {
        console.error('Failed to delete task:', error);
      }
      setTaskToDelete(null);
    }
    setShowDeleteModal(false);
  };

  async function handleToggleTask(taskId: string) {
    if (!holidayId || !auth0User) return;

    // Find the current task to get its completion status
    const currentTask = gameTasks.find((task: any) => task.id === taskId);
    if (!currentTask) {
      console.error('Task not found:', taskId);
      return;
    }

    // Toggle the completion status
    const updates = { isCompleted: !currentTask.isCompleted };

    try {
      await updateTask(taskId, updates);
      await refreshHomeData(auth0User, holidayId);
    } catch (error) {
      console.error('Failed to toggle task:', error);
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
              disableInternalModal={true}
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
        fields={editingTask ? editFormConfig.fields : formConfig.fields}
        initialValues={
          editingTask
            ? {
                title: editingTask.title || '',
                description: editingTask.description || '',
                priority: editingTask.priority || 'medium',
                assigned_to: editingTask.assignedTo || '',
                dueDate: editingTask.dueDate
                  ? new Date(editingTask.dueDate).toISOString().split('T')[0]
                  : '',
              }
            : {
                priority: 'medium',
              }
        }
        onSubmit={editingTask ? handleEditTaskSubmit : handleAddTask}
        onClose={() => {
          setShowAddForm(false);
          setEditingTask(null);
        }}
        loading={editingTask ? updateLoading : createLoading}
        submitText={
          editingTask
            ? updateLoading
              ? 'Processing...'
              : 'Update Game'
            : createLoading
              ? 'Processing...'
              : 'Add Game'
        }
        cardClassName="card"
        submitButtonColor="#06b6d4"
        contacts={contacts}
        shareMembers={shareMembers}
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
        loading={deleteLoading}
        cardClassName="card"
        confirmButtonColor="#06b6d4"
      />
    </div>
  );
}
