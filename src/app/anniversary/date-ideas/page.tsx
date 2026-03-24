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
import SortModal from '@/components/modals/SortModal';
import FormModal from '@/components/modals/FormModal';
import DeleteModal from '@/components/modals/DeleteModal';
import HolidayPageHeader from '@/components/common/HolidayPageHeader';
import AddButton from '@/components/common/AddButton';
import TaskSection from '@/components/common/TaskSection';
import ToDoCard from '@/components/cards/to-do/ToDoCard';
import { getFormConfigEnhanced } from '@/config/formConfigs';
import { getDeleteConfig } from '@/config/deleteModalConfigs';

export default function AnniversaryDateIdeasPage() {
  const dispatch = useAppDispatch();
  const { contacts } = useAppSelector((state: any) => state.addressBook);

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

  const isHolidayShared = useAppSelector((state: any) =>
    selectIsHolidayShared(state, 'anniversary'),
  );

  // Get share members for Enhanced Compatibility Layer
  const shareData = useAppSelector((state: any) =>
    selectShareByHolidayKey(state, 'anniversary'),
  );
  const shareMembers = shareData?.members || [];

  const dateIdeas = useMemo(
    () =>
      holidayData?.tasks?.filter((task: any) => task.category === 'Date Ideas') ||
      [],
    [holidayData?.tasks],
  );
  const isLoading = !homeInitialized;
  const error = null;

  // State management - separate add/edit modals and loading states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [taskToDelete, setTaskToDelete] = useState<any>(null);
  const [showSortModal, setShowSortModal] = useState(false);
  const [sortBy, setSortBy] = useState<string>('priority');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  useEffect(() => {
    // Always fetch contacts for address book functionality
    dispatch(fetchContacts());
  }, [dispatch]);

  // Enhanced Compatibility Layer form configs
  const addFormConfig = getFormConfigEnhanced('tasks', 'add', {
    holidayKey: 'anniversary',
    shareMembers: shareMembers,
    auth0User: auth0User,
  });

  const editFormConfig = getFormConfigEnhanced('tasks', 'edit', {
    holidayKey: 'anniversary',
    shareMembers: shareMembers,
    auth0User: auth0User,
  });

  const deleteConfig = getDeleteConfig('tasks');

  // Name resolution helpers for assignment display
  const getAssignedUserName = (assignedToUuid: string): string | null => {
    if (!assignedToUuid || !shareMembers.length) return null;
    const member = shareMembers.find((m: any) => m.uuid === assignedToUuid);
    return member ? member.name || member.email || 'Unknown User' : assignedToUuid;
  };

  const transformTaskWithAssignment = (task: any) => ({
    ...task,
    assignedToName: task.assignedTo ? getAssignedUserName(task.assignedTo) : null,
  });

  // Sort options for date ideas
  const sortOptions = [
    { value: 'priority', label: 'Priority' },
    { value: 'title', label: 'Title A-Z' },
    { value: 'dueDate', label: 'Due Date' },
    { value: 'assignedTo', label: 'Assigned To' },
    { value: 'category', label: 'Category' },
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
      case 'assignedTo':
        return sortedTasks.sort((a, b) => {
          if (!a.assignedTo && !b.assignedTo) return 0;
          if (!a.assignedTo) return 1;
          if (!b.assignedTo) return -1;
          return a.assignedTo.localeCompare(b.assignedTo);
        });
      case 'category':
        return sortedTasks.sort((a, b) => {
          if (!a.category && !b.category) return 0;
          if (!a.category) return 1;
          if (!b.category) return -1;
          return a.category.localeCompare(b.category);
        });
      default:
        return sortedTasks;
    }
  };

  // Apply name resolution transformation to sorted data
  const transformedDateIdeas = dateIdeas.map(transformTaskWithAssignment);
  const sortedDateTasks = sortTasks(transformedDateIdeas, sortBy);

  // CRUD Operations with proper field mapping and loading states
  async function handleAddTask(values: Record<string, any>) {
    if (!values.title?.trim()) return;
    if (!holidayId || !auth0User) return;

    setIsSubmitting(true);
    try {
      const payload = {
        title: values.title,
        description: values.description || undefined,
        priority: values.priority as 'low' | 'medium' | 'high',
        assigned_to: values.assigned_to || undefined,
        category: 'Date Ideas',
        due_date: values.dueDate || undefined,
        isCompleted: false,
      };

      await createTask(payload);
      await refreshHomeData(auth0User, holidayId);
      setShowAddModal(false);
    } catch (error) {
      console.error('Error creating date idea:', error);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleEditTaskSubmit(values: Record<string, any>) {
    if (!values.title?.trim() || !editingTask?.id) return;
    if (!holidayId || !auth0User) return;

    setIsEditSubmitting(true);
    try {
      const payload = {
        title: values.title,
        description: values.description || undefined,
        priority: values.priority as 'low' | 'medium' | 'high',
        assigned_to: values.assigned_to || null,
        category: 'Date Ideas',
        due_date: values.dueDate || null,
      };

      await updateTask(editingTask.id, payload);
      await refreshHomeData(auth0User, holidayId);
      setEditingTask(null);
      setShowEditModal(false);
    } catch (error) {
      console.error('Error updating date idea:', error);
    } finally {
      setIsEditSubmitting(false);
    }
  }

  const handleEdit = (task: any) => {
    setEditingTask(task);
    setShowEditModal(true);
  };

  async function handleDeleteTask(taskId: string) {
    const task = sortedDateTasks.find((t: any) => t.id === taskId);
    if (task) {
      setTaskToDelete(task);
      setShowDeleteModal(true);
    }
  }

  async function handleConfirmDelete() {
    if (!taskToDelete?.id || !holidayId || !auth0User) return;

    try {
      await deleteTask(taskToDelete.id);
      await refreshHomeData(auth0User, holidayId);
      setShowDeleteModal(false);
      setTaskToDelete(null);
    } catch (error) {
      console.error('Error deleting date idea:', error);
      setShowDeleteModal(false);
      setTaskToDelete(null);
    }
  }

  function handleCancelDelete() {
    setShowDeleteModal(false);
    setTaskToDelete(null);
  }

  async function handleToggleTask(taskId: string) {
    if (!holidayId || !auth0User) return;

    try {
      const currentTask = dateIdeas.find((task: any) => task.id === taskId);
      if (!currentTask) return;

      const payload = {
        isCompleted: !currentTask.isCompleted,
      };

      await updateTask(taskId, payload);
      await refreshHomeData(auth0User, holidayId);
    } catch (error) {
      console.error('Error toggling date idea:', error);
    }
  }
  const handleSortChange = (sortOption: string) => {
    setSortBy(sortOption);
  };

  const loading = createLoading || updateLoading || deleteLoading;

  // Show loading only if home data is not initialized
  if (isLoading) {
    return (
      <div className="min-h-screen anniversary-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading date ideas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen anniversary-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
      <HolidayPageHeader
        title="Date Ideas"
        backHref="/anniversary"
        onSortClick={() => setShowSortModal(true)}
        sortTitle="Sort Date Ideas"
        description="Plan your anniversary date ideas with style!"
        holidayColor="pink-500"
        error={error}
      />

      <main className="flex-1 w-full max-w-4xl flex flex-col gap-6 mt-4">
        <AddButton
          title="Date Idea"
          onClick={() => setShowAddModal(true)}
          color="pink"
        />

        <TaskSection
          title="Incomplete"
          items={sortedDateTasks.filter(task => !task.isCompleted)}
          isCompleted={false}
          emptyMessage="All date ideas completed! 🎉"
          completedMessage=""
          renderItem={task => (
            <ToDoCard
              key={task.id}
              task={task}
              onToggleComplete={handleToggleTask}
              onDelete={(taskId: string) => handleDeleteTask(taskId)}
              onEdit={handleEdit}
              disableInternalModal={true}
              theme={{
                accentColor: '#ec4899', // Pink for Anniversary
                hoverColor: 'hover:bg-pink-50 dark:hover:bg-pink-900/10',
              }}
              borderColor="rgb(var(--color-pink-500))" // Pink border for Anniversary
              gamifiedBackgroundColor="bg-gradient-to-br from-pink-400 to-pink-600"
            />
          )}
        />

        <TaskSection
          title="Completed"
          items={sortedDateTasks.filter(task => task.isCompleted)}
          isCompleted={true}
          emptyMessage="No completed date ideas yet."
          completedMessage="No completed date ideas yet."
          renderItem={task => (
            <ToDoCard
              key={task.id}
              task={task}
              onToggleComplete={handleToggleTask}
              onDelete={(taskId: string) => handleDeleteTask(taskId)}
              onEdit={handleEdit}
              disableInternalModal={true}
              className="opacity-60"
              theme={{
                accentColor: '#ec4899', // Pink for Anniversary
                hoverColor: 'hover:bg-pink-50 dark:hover:bg-pink-900/10',
              }}
              borderColor="rgb(var(--color-pink-500))" // Pink border for Anniversary
              gamifiedBackgroundColor="bg-gradient-to-br from-pink-400 to-pink-600"
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
        title="Sort Date Ideas"
      />

      {/* Add Form Modal */}
      <FormModal
        isOpen={showAddModal}
        title="Add New Date Idea"
        fields={addFormConfig.fields}
        initialValues={{ priority: 'medium' }}
        onSubmit={handleAddTask}
        onClose={() => {
          setShowAddModal(false);
          setEditingTask(null);
        }}
        loading={isSubmitting}
        submitText={isSubmitting ? 'Processing...' : 'Add Date Idea'}
        submitButtonColor="#ec4899"
        contacts={contacts}
        shareMembers={shareMembers}
      />

      {/* Edit Form Modal */}
      <FormModal
        isOpen={showEditModal}
        title="Edit Date Idea"
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
        onClose={() => {
          setShowEditModal(false);
          setEditingTask(null);
        }}
        loading={isEditSubmitting}
        submitText={isEditSubmitting ? 'Processing...' : 'Update Date Idea'}
        submitButtonColor="#ec4899"
        contacts={contacts}
        shareMembers={shareMembers}
      />

      {/* Delete Modal */}
      {showDeleteModal && taskToDelete && (
        <DeleteModal
          isOpen={showDeleteModal}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
          title={deleteConfig.title}
          message={deleteConfig.message}
          itemName={taskToDelete.title}
          confirmText={deleteConfig.confirmText}
          cancelText={deleteConfig.cancelText}
          cardClassName={deleteConfig.cardClassName}
          confirmButtonColor={deleteConfig.confirmButtonColor}
          loading={deleteLoading}
        />
      )}
    </div>
  );
}
