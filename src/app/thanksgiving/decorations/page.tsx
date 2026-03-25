'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useHolidayPageData } from '@/hooks/useHolidayPageData';
import { useHolidayMutations } from '@/hooks/useHolidayMutations';
import { useRefreshHomeData } from '@/hooks/useRefreshHomeData';
import { fetchContacts } from '@/store/slices/addressBookSlice';
import {
  updateTaskInHomeData,
  addTaskToHomeData,
  removeTaskFromHomeData,
  setHomeData,
} from '@/store/slices/homeSlice';
import {
  selectIsHolidayShared,
  selectShareByHolidayKey,
} from '@/store/slices/sharesSlice';
import { RootState } from '@/store';
import SortModal from '@/components/modals/SortModal';
import FormModal from '@/components/modals/FormModal';
import HolidayPageHeader from '@/components/common/HolidayPageHeader';
import AddButton from '@/components/common/AddButton';
import TaskSection from '@/components/common/TaskSection';
import ToDoCard from '@/components/cards/to-do/ToDoCard';
import DeleteModal from '@/components/modals/DeleteModal';
import { getFormConfigEnhanced } from '@/config/formConfigs';
import { getDeleteConfig } from '@/config/deleteModalConfigs';

type SortOption = 'priority' | 'dateDue' | 'assignedTo' | 'category' | 'none';

export default function ThanksgivingDecorationsPage() {
  const dispatch = useAppDispatch();
  const { contacts } = useAppSelector((state: any) => state.addressBook);

  // Use centralized holiday page data hook
  const { holidayId, holidayData, auth0User, homeInitialized } =
    useHolidayPageData();

  // Use standardized mutation hooks
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

  // Redux & Sharing - Enhanced Compatibility Layer
  const isHolidayShared = useAppSelector((state: any) =>
    selectIsHolidayShared(state, 'thanksgiving'),
  );

  const shareData = useAppSelector((state: RootState) =>
    selectShareByHolidayKey(state, 'thanksgiving'),
  );
  const baseMembers = shareData?.members || [];

  // Only include current user in shareMembers if holiday is actually shared
  const shareMembers =
    isHolidayShared && auth0User
      ? [
          // Add current user first
          {
            userId: auth0User.sub || '',
            uuid: auth0User.id || '', // Use database UUID for Enhanced Compatibility Layer
            name: auth0User.name || 'Me',
            email: auth0User.email || '',
            role: 'owner' as const,
          },
          // Add other members, filtering out current user if already present
          ...baseMembers
            .filter((member: any) => member.userId !== auth0User.sub)
            .map((member: any) => ({
              ...member,
              uuid: member.uuid || member.userId, // Prefer existing uuid, fallback to userId only if uuid missing
            })),
        ]
      : baseMembers;

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

  // Enhanced Compatibility Layer - Task form configuration
  const addFormConfig = getFormConfigEnhanced('tasks', 'add', {
    holidayKey: 'thanksgiving',
    shareMembers: shareMembers,
    auth0User: auth0User,
  });

  const editFormConfig = getFormConfigEnhanced('tasks', 'edit', {
    holidayKey: 'thanksgiving',
    shareMembers: shareMembers,
    auth0User: auth0User,
  });

  // Redux data access - decorations are stored as tasks with category "Decorations"
  const decorations = useMemo(
    () =>
      (
        holidayData?.tasks?.filter((task: any) => task.category === 'Decorations') ||
        []
      ).map(transformTaskWithAssignment),
    [holidayData?.tasks, shareMembers],
  );
  const isLoading = !homeInitialized;
  const error = null;

  // Delete modal handlers
  const handleDeleteModalOpen = (task: any) => {
    setTaskToDelete(task);
    setShowDeleteModal(true);
  };

  const handleDeleteModalClose = () => {
    setTaskToDelete(null);
    setShowDeleteModal(false);
  };

  const handleConfirmDelete = async () => {
    if (!taskToDelete?.id || !holidayId) return;

    try {
      await deleteTask(taskToDelete.id);
      dispatch(
        removeTaskFromHomeData({
          holidayId: holidayId,
          taskId: taskToDelete.id,
        }),
      );
      await refreshHomeData(auth0User, holidayId);
      setShowDeleteModal(false);
      setTaskToDelete(null);
    } catch (error) {
      console.error('Error deleting task:', error);
      setShowDeleteModal(false);
      setTaskToDelete(null);
    }
  };

  // State management
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('none');
  const [showSortModal, setShowSortModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<any>(null);

  useEffect(() => {
    // Always fetch contacts for address book functionality
    dispatch(fetchContacts());
  }, [dispatch]);

  // Load contacts if holiday is shared for assignment functionality
  useEffect(() => {
    if (isHolidayShared && auth0User) {
      dispatch(fetchContacts(auth0User.sub));
    }
  }, [isHolidayShared, auth0User, dispatch]);

  // CRUD Operations - Using standardized hooks
  const handleAddTask = async (values: Record<string, any>) => {
    if (!values.title?.trim() || !holidayId) return;

    try {
      const result = await createTask({
        title: values.title,
        description: values.description,
        priority: values.priority,
        assigned_to: values.assigned_to || undefined,
        due_date: values.dueDate || undefined,
        category: 'Decorations',
      });

      // Update Redux state immediately
      dispatch(addTaskToHomeData({ holidayId, task: result }));

      // Refresh home data to ensure UI is in sync
      await refreshHomeData(auth0User, holidayId);

      setShowForm(false);
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  function openForm() {
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
  }

  const handleToggleCompletion = async (taskId: string) => {
    const currentTask = decorations.find((task: any) => task.id === taskId);
    if (!currentTask || !holidayId) return;

    const newCompletionStatus = !currentTask.isCompleted;

    try {
      // Update API
      await updateTask(taskId, {
        isCompleted: newCompletionStatus,
      });

      // Update Redux state immediately
      dispatch(
        updateTaskInHomeData({
          holidayId,
          taskId,
          updates: {
            ...currentTask,
            isCompleted: newCompletionStatus,
          },
        }),
      );
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  function handleDelete(taskId: string, taskTitle: string) {
    const task = decorations.find((t: any) => t.id === taskId);
    if (task) {
      setTaskToDelete({ ...task, title: taskTitle });
      setShowDeleteModal(true);
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

  const handleEditTaskSubmit = async (values: Record<string, any>) => {
    if (!editingTask || !holidayId) return;

    try {
      const updates = {
        title: values.title,
        description: values.description,
        priority: values.priority,
        assigned_to: values.assigned_to || null,
        due_date: values.dueDate || null,
      };

      await updateTask(editingTask.id, updates);

      // Update Redux state immediately
      dispatch(
        updateTaskInHomeData({
          holidayId,
          taskId: editingTask.id,
          updates,
        }),
      );

      // Refresh home data to ensure UI is in sync
      await refreshHomeData(auth0User, holidayId);

      setEditingTask(null);
      setShowEditModal(false);
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

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

  const loading = createLoading || updateLoading || deleteLoading;

  const sortedTasks = sortTasks(decorations);
  const incompleteDecorations = sortedTasks.filter((task: any) => !task.isCompleted);
  const completedDecorations = sortedTasks.filter((task: any) => task.isCompleted);

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
              onDelete={(taskId: string) => handleDelete(taskId, task.title)}
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
              onDelete={(taskId: string) => handleDelete(taskId, task.title)}
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
        fields={addFormConfig.fields}
        onSubmit={handleAddTask}
        onClose={closeForm}
        loading={createLoading}
        submitText={createLoading ? 'Processing...' : 'Add Task'}
        cardClassName="card-tasks"
        contacts={contacts}
        shareMembers={shareMembers}
      />

      {/* Edit Modal */}
      <FormModal
        isOpen={showEditModal}
        title="Edit Decoration Task"
        fields={editFormConfig.fields}
        initialValues={{
          title: editingTask?.title || '',
          description: editingTask?.description || '',
          priority: editingTask?.priority || 'medium',
          assigned_to: editingTask?.assignedTo || '',
          dueDate: editingTask?.dueDate
            ? new Date(editingTask.dueDate).toISOString().split('T')[0]
            : '',
        }}
        onSubmit={handleEditTaskSubmit}
        onClose={closeEditModal}
        loading={updateLoading}
        submitText={updateLoading ? 'Processing...' : 'Update Task'}
        cardClassName="card-tasks"
        contacts={contacts}
        shareMembers={shareMembers}
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

      {/* Delete Modal */}
      {showDeleteModal && taskToDelete && (
        <DeleteModal
          isOpen={showDeleteModal}
          onConfirm={handleConfirmDelete}
          onCancel={handleDeleteModalClose}
          loading={deleteLoading}
          title={getDeleteConfig('tasks').title}
          message={getDeleteConfig('tasks').message}
          itemName={taskToDelete.title}
          confirmText={getDeleteConfig('tasks').confirmText}
          cancelText={getDeleteConfig('tasks').cancelText}
        />
      )}
    </div>
  );
}
