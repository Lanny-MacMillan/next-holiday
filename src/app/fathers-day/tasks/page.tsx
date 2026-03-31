'use client';

import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useHolidayPageData } from '@/hooks/useHolidayPageData';
import { useHolidayMutations } from '@/hooks/useHolidayMutations';
import { fetchContacts } from '@/store/slices/addressBookSlice';
import {
  selectIsHolidayShared,
  selectShareByHolidayKey,
} from '@/store/slices/sharesSlice';
import { RootState } from '@/store';
import { getFormConfigEnhanced } from '@/config/formConfigs';
import SortModal from '@/components/modals/SortModal';
import ToDoCard from '@/components/cards/to-do/ToDoCard';
import HolidayPageHeader from '@/components/common/HolidayPageHeader';
import AddButton from '@/components/common/AddButton';
import TaskSection from '@/components/common/TaskSection';
import FormModal from '@/components/modals/FormModal';
import DeleteModal from '@/components/modals/DeleteModal';
import { getDeleteConfig } from '@/config/deleteModalConfigs';

type SortOption = 'priority' | 'title' | 'dueDate' | 'assignedTo' | 'none';

export default function FathersDayTasksPage() {
  // Hook implementations
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

  // Redux & Sharing
  const dispatch = useAppDispatch();
  const isHolidayShared = useAppSelector((state: any) =>
    selectIsHolidayShared(state, 'fathers-day'),
  );
  const contacts = useAppSelector((state: any) => state.addressBook.contacts);

  // Get share members for Enhanced Compatibility Layer
  const shareData = useAppSelector((state: RootState) =>
    selectShareByHolidayKey(state, 'fathers-day'),
  );
  const baseMembers = shareData?.members || [];
  // Let Enhanced Compatibility Layer handle shareMembers enhancement automatically
  const shareMembers = baseMembers;

  // State management
  const [showForm, setShowForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [taskToDelete, setTaskToDelete] = useState<any>(null);
  const [sortBy, setSortBy] = useState<SortOption>('none');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  const themeColor = '#3b82f6'; // Blue for Father's Day

  // Load contacts if holiday is shared
  useEffect(() => {
    if (isHolidayShared && auth0User) {
      dispatch(fetchContacts(auth0User.sub));
    }
  }, [isHolidayShared, auth0User, dispatch]);

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

  // Task data processing
  const tasks =
    holidayData?.tasks?.filter((task: any) => task.category === 'Tasks') || [];

  // Sort function following working pattern
  function getSortedTasks() {
    if (sortBy === 'none') return tasks;

    return [...tasks].sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return (
            (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) -
            (priorityOrder[a.priority as keyof typeof priorityOrder] || 0)
          );
        case 'dueDate':
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        case 'assignedTo':
          return (a.assignedTo || '').localeCompare(b.assignedTo || '');
        default:
          return 0;
      }
    });
  }

  const sortedTasks = getSortedTasks().map(transformTaskWithAssignment);
  const completedTasks = sortedTasks.filter((task: any) => task.isCompleted);
  const pendingTasks = sortedTasks.filter((task: any) => !task.isCompleted);

  // Task toggle function
  async function handleTaskToggle(taskId: string) {
    const task = tasks.find((t: any) => t.id === taskId);
    if (!task || !holidayId) return;

    await toggleTask(taskId, !task.isCompleted);
  }

  // Modal handlers
  const openForm = () => setShowForm(true);
  const closeForm = () => setShowForm(false);

  const handleEditModalOpen = (task: any) => {
    setEditingTask(task);
    setShowEditModal(true);
  };

  const handleEditModalClose = () => {
    setEditingTask(null);
    setShowEditModal(false);
  };

  const handleDeleteModalOpen = (task: any) => {
    setTaskToDelete(task);
    setShowDeleteModal(true);
  };

  const handleDeleteModalClose = () => {
    setTaskToDelete(null);
    setShowDeleteModal(false);
  };

  // CRUD operations
  const handleAddTask = async (formData: any) => {
    if (!holidayId) return;
    setIsSubmitting(true);
    try {
      const taskData = {
        ...formData,
        assigned_to: formData.assigned_to || undefined,
        due_date: formData.dueDate || undefined,
        category: 'Tasks',
        isCompleted: false,
      };

      await createTask(taskData);
      closeForm();
    } catch (error) {
      console.error('Error creating task:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditTask = async (formData: any) => {
    if (!editingTask || !holidayId) return;
    setIsEditSubmitting(true);
    try {
      const updateData = {
        ...formData,
        assigned_to: formData.assigned_to || null,
        due_date: formData.dueDate || null,
      };

      await updateTask(editingTask.id, updateData);
      handleEditModalClose();
    } catch (error) {
      console.error('Error updating task:', error);
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!taskToDelete || !holidayId) return;

    await deleteTask(taskToDelete.id);
    handleDeleteModalClose();
  };

  // Sort handler
  function handleSort(option: SortOption) {
    setSortBy(option);
    setShowSortModal(false);
  }

  // Enhanced Compatibility Layer for form configuration
  const addFormConfig = getFormConfigEnhanced('tasks', 'add', {
    holidayKey: 'fathers-day',
    shareMembers: shareMembers,
    auth0User: auth0User,
  });

  const editFormConfig = getFormConfigEnhanced('tasks', 'edit', {
    holidayKey: 'fathers-day',
    shareMembers: shareMembers,
    auth0User: auth0User,
  });

  const deleteConfig = getDeleteConfig('tasks');

  return (
    <div className="min-h-screen fathers-day-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
      <HolidayPageHeader
        title="Father's Day Tasks"
        backHref="/fathers-day"
        onSortClick={() => setShowSortModal(true)}
        sortTitle="Sort tasks"
        description="Stay on top of your holiday to-dos"
        holidayColor={themeColor}
      />

      <main className="w-full max-w-4xl flex flex-col gap-6">
        <AddButton title="Task" onClick={openForm} color="blue" />

        {/* Sort indicator */}
        <div className="flex items-center justify-center">
          {sortBy !== 'none' && (
            <div className="text-center text-sm text-gray-600 dark:text-gray-400">
              Sorted by {sortBy === 'dueDate' ? 'due date' : sortBy}
            </div>
          )}
        </div>

        {/* Incomplete Tasks Section */}
        <TaskSection
          title="Incomplete"
          items={pendingTasks}
          isCompleted={false}
          emptyMessage="All tasks completed! 👨‍👧‍👦"
          completedMessage=""
          renderItem={(task: any) => (
            <ToDoCard
              key={task.id}
              task={task}
              onToggleComplete={handleTaskToggle}
              onEdit={() => handleEditModalOpen(task)}
              onDelete={(taskId: string) => handleDeleteModalOpen(task)}
              disableInternalModal={true}
              theme={{ accentColor: themeColor }}
              borderColor={themeColor}
            />
          )}
        />

        {/* Completed Tasks Section */}
        {completedTasks.length > 0 && (
          <TaskSection
            title="Completed"
            items={completedTasks}
            isCompleted={true}
            emptyMessage=""
            completedMessage={`Great job! You've completed ${completedTasks.length} task${completedTasks.length !== 1 ? 's' : ''}.`}
            renderItem={(task: any) => (
              <ToDoCard
                key={task.id}
                task={task}
                onToggleComplete={handleTaskToggle}
                onEdit={() => handleEditModalOpen(task)}
                onDelete={(taskId: string) => handleDeleteModalOpen(task)}
                disableInternalModal={true}
                theme={{ accentColor: themeColor }}
                borderColor={themeColor}
              />
            )}
          />
        )}
      </main>

      {/* Sort Modal */}
      <SortModal
        isOpen={showSortModal}
        onClose={() => setShowSortModal(false)}
        sortBy={sortBy}
        onSortChange={(option: string) => handleSort(option as SortOption)}
        sortOptions={[
          { value: 'none', label: 'None' },
          { value: 'title', label: 'Title' },
          { value: 'priority', label: 'Priority' },
          { value: 'dueDate', label: 'Due Date' },
          ...(isHolidayShared
            ? [{ value: 'assignedTo', label: 'Assigned To' }]
            : []),
        ]}
        title="Sort Tasks"
      />

      {/* Add Modal */}
      <FormModal
        isOpen={showForm}
        title="Add New Task"
        fields={addFormConfig.fields}
        onSubmit={handleAddTask}
        onClose={closeForm}
        loading={isSubmitting}
        submitText={isSubmitting ? 'Processing...' : 'Add Task'}
        cancelText="Cancel"
        cardClassName="card card-tasks"
        submitButtonColor={themeColor}
        contacts={contacts}
        shareMembers={shareMembers}
      />

      {/* Edit Modal */}
      <FormModal
        isOpen={showEditModal}
        title="Edit Task"
        fields={editFormConfig.fields}
        initialValues={{
          title: editingTask?.title || '',
          description: editingTask?.description || '',
          priority: editingTask?.priority || 'medium',
          assigned_to: editingTask?.assignedTo || '',
          dueDate: editingTask?.dueDate || '',
        }}
        onSubmit={handleEditTask}
        onClose={handleEditModalClose}
        loading={isEditSubmitting}
        submitText={isEditSubmitting ? 'Processing...' : 'Update Task'}
        cancelText="Cancel"
        cardClassName="card card-tasks"
        submitButtonColor={themeColor}
        contacts={contacts}
        shareMembers={shareMembers}
      />

      {/* Delete Modal */}
      <DeleteModal
        isOpen={showDeleteModal}
        onCancel={handleDeleteModalClose}
        onConfirm={handleDeleteTask}
        loading={deleteLoading}
        title={deleteConfig.title}
        message={deleteConfig.message}
        itemName={taskToDelete?.title}
        confirmText={deleteConfig.confirmText}
        cancelText={deleteConfig.cancelText}
        confirmButtonColor={deleteConfig.confirmButtonColor}
      />
    </div>
  );
}
