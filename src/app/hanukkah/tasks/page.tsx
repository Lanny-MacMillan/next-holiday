'use client';

import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useHolidayPageData } from '@/hooks/useHolidayPageData';
import { useHolidayMutations } from '@/hooks/useHolidayMutations';
import { fetchContacts } from '@/store/slices/addressBookSlice';
import {
  updateTaskInHomeData,
  addTaskToHomeData,
  removeTaskFromHomeData,
} from '@/store/slices/homeSlice';
import {
  selectIsHolidayShared,
  selectShareByHolidayKey,
} from '@/store/slices/sharesSlice';
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

export default function HanukkahTasksPage() {
  const dispatch = useAppDispatch();
  const { contacts } = useAppSelector((state: any) => state.addressBook);

  // Use centralized holiday page data hook
  const { holidayId, holidayData, auth0User, homeInitialized } =
    useHolidayPageData();

  // Use standardized mutation hooks for task operations
  const {
    createTask,
    updateTask,
    deleteTask,
    createLoading,
    updateLoading,
    deleteLoading,
  } = useHolidayMutations({ holidayId, auth0User });

  // Redux data access - tasks with category "Tasks"
  const tasks =
    holidayData?.tasks?.filter((task: any) => task.category === 'Tasks') || [];
  const isLoading = !homeInitialized;

  // Sharing status (for conditional form fields)
  const isHolidayShared = useAppSelector((state: any) =>
    selectIsHolidayShared(state, 'hanukkah'),
  );

  const [sortBy, setSortBy] = useState<SortOption>('none');
  const [showForm, setShowForm] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [taskToDelete, setTaskToDelete] = useState<any>(null);

  useEffect(() => {
    // Always fetch contacts for address book functionality
    dispatch(fetchContacts());
  }, [dispatch]);

  async function handleAddTask(formValues: Record<string, any>) {
    if (!formValues.title?.trim()) return;
    if (!holidayId || !auth0User) return;

    try {
      const result = await createTask({
        title: formValues.title,
        description: formValues.description || undefined,
        priority: formValues.priority || 'medium',
        assigned_to: formValues.assigned_to || undefined,
        category: 'Tasks',
        due_date: formValues.dueDate || undefined,
      });

      // Update Redux state immediately
      dispatch(addTaskToHomeData({ holidayId: holidayId, task: result }));

      setShowForm(false);
    } catch (error) {
      console.error('Error creating task:', error);
    }
  }

  function openForm() {
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
  }

  async function handleEditTask(formValues: Record<string, any>) {
    if (!editingTask?.id || !holidayId || !auth0User) return;

    try {
      const updatedTask = await updateTask(editingTask.id, {
        title: formValues.title,
        description: formValues.description,
        priority: formValues.priority || 'medium',
        isCompleted: formValues.isCompleted || editingTask.isCompleted,
        assigned_to: formValues.assigned_to || null,
        due_date: formValues.dueDate || null,
      });

      // Update Redux state immediately
      dispatch(
        updateTaskInHomeData({
          holidayId: holidayId,
          taskId: editingTask.id,
          updates: updatedTask,
        }),
      );

      setShowEditModal(false);
      setEditingTask(null);
    } catch (error) {
      console.error('Error updating task:', error);
    }
  }

  function handleEditModalOpen(task: any) {
    setEditingTask(task);
    setShowEditModal(true);
  }

  function handleEditModalClose() {
    setShowEditModal(false);
    setEditingTask(null);
  }

  function handleDelete(taskId: string, taskTitle: string) {
    const task = tasks.find((t: any) => t.id === taskId);
    if (task) {
      setTaskToDelete(task);
      setShowDeleteModal(true);
    }
  }

  async function confirmDelete() {
    if (!taskToDelete || !holidayId || !auth0User) return;

    try {
      await deleteTask(taskToDelete.id);
      setShowDeleteModal(false);
      setTaskToDelete(null);
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  }

  function handleDeleteCancel() {
    setShowDeleteModal(false);
    setTaskToDelete(null);
  }

  async function handleTaskToggle(taskId: string) {
    if (!holidayId || !auth0User) return;

    const task = tasks.find((t: any) => t.id === taskId);
    if (!task) return;

    try {
      const result = await updateTask(taskId, { isCompleted: !task.isCompleted });

      // Update Redux state immediately
      dispatch(
        updateTaskInHomeData({
          holidayId: holidayId,
          taskId: taskId,
          updates: { isCompleted: !task.isCompleted },
        }),
      );
    } catch (error) {
      console.error('Error toggling task completion:', error);
    }
  }

  function handleSort(option: SortOption) {
    setSortBy(option);
    setShowSortModal(false);
  }

  function getSortedTasks() {
    if (sortBy === 'none') return tasks.map(transformTaskWithAssignment);

    return [...tasks].map(transformTaskWithAssignment).sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return (
            (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) -
            (priorityOrder[a.priority as keyof typeof priorityOrder] || 0)
          );
        case 'dateDue':
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        case 'assignedTo':
          return (a.assignedToName || '').localeCompare(b.assignedToName || '');
        case 'category':
          return (a.category || '').localeCompare(b.category || '');
        default:
          return 0;
      }
    });
  }

  // Get share members for Enhanced Compatibility Layer
  const shareData = useAppSelector(state =>
    selectShareByHolidayKey(state, 'hanukkah'),
  );
  const shareMembers = shareData?.members || [];

  // Enhanced Compatibility Layer form configuration
  const addFormConfig = getFormConfigEnhanced('tasks', 'add', {
    holidayKey: 'hanukkah',
    shareMembers: shareMembers,
    auth0User: auth0User,
  });

  const editFormConfig = getFormConfigEnhanced('tasks', 'edit', {
    holidayKey: 'hanukkah',
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

  // Holiday-specific theme colors (Hanukkah blue)
  const themeColor = '#3b82f6';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const sortedTasks = getSortedTasks();
  const completedTasks = sortedTasks.filter((task: any) => task.isCompleted);
  const pendingTasks = sortedTasks.filter((task: any) => !task.isCompleted);

  return (
    <div className="min-h-screen hanukkah-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
      <HolidayPageHeader
        title="Hanukkah Tasks"
        backHref="/hanukkah"
        onSortClick={() => setShowSortModal(true)}
        sortTitle="Sort tasks"
        description="Stay on top of your holiday to-dos"
        holidayColor={themeColor}
      />

      <main className="w-full max-w-4xl flex flex-col gap-6">
        <AddButton title="Task" onClick={openForm} color="blue" />

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
        {/* Pending Tasks */}
        <TaskSection
          title="Incomplete"
          items={pendingTasks}
          isCompleted={false}
          emptyMessage="All tasks completed! 🕎"
          completedMessage=""
          renderItem={(task: any) => (
            <ToDoCard
              key={task.id}
              task={task}
              onToggleComplete={(taskId: string) => {
                const isCompleted = !task.completed;
                handleTaskToggle(taskId);
              }}
              onEdit={() => handleEditModalOpen(task)}
              onDelete={(taskId: string) => handleDelete(taskId, task.title)}
              disableInternalModal={true}
              theme={{
                accentColor: themeColor,
              }}
              borderColor={themeColor}
            />
          )}
        />

        {/* Completed Tasks */}
        <TaskSection
          title="Completed"
          items={completedTasks}
          isCompleted={true}
          emptyMessage="No completed tasks yet."
          completedMessage=""
          renderItem={(task: any) => (
            <ToDoCard
              key={task.id}
              task={task}
              onToggleComplete={handleTaskToggle}
              onEdit={() => handleEditModalOpen(task)}
              onDelete={(taskId: string) => handleDelete(taskId, task.title)}
              disableInternalModal={true}
              className="opacity-60"
              theme={{
                accentColor: themeColor,
              }}
              borderColor={themeColor}
            />
          )}
        />
      </main>

      {/* Form Modal for Adding Tasks */}
      {showForm && (
        <FormModal
          isOpen={showForm}
          title="Add New Task"
          fields={addFormConfig.fields}
          onSubmit={handleAddTask}
          onClose={closeForm}
          loading={createLoading}
          submitText={createLoading ? 'Adding...' : 'Add Task'}
          cancelText="Cancel"
          cardClassName="card card-tasks"
          submitButtonColor={themeColor}
          contacts={contacts}
          shareMembers={shareMembers}
        />
      )}

      {/* Edit Modal */}
      {showEditModal && editingTask && (
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
          loading={updateLoading}
          submitText={updateLoading ? 'Updating...' : 'Update Task'}
          cancelText="Cancel"
          cardClassName="card card-tasks"
          submitButtonColor={themeColor}
          contacts={contacts}
          shareMembers={shareMembers}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && taskToDelete && (
        <DeleteModal
          isOpen={showDeleteModal}
          onCancel={handleDeleteCancel}
          onConfirm={confirmDelete}
          title="Delete Task"
          message={`Are you sure you want to delete "${taskToDelete?.title}"? This action cannot be undone.`}
          loading={deleteLoading}
        />
      )}

      {/* Sort Modal */}
      {showSortModal && (
        <SortModal
          isOpen={showSortModal}
          onClose={() => setShowSortModal(false)}
          sortBy={sortBy}
          onSortChange={(option: string) => handleSort(option as SortOption)}
          sortOptions={[
            { value: 'none', label: 'No sorting' },
            { value: 'priority', label: 'Priority' },
            { value: 'dateDue', label: 'Date Due' },
            { value: 'assignedTo', label: 'Assigned To' },
            { value: 'category', label: 'Category' },
          ]}
          title="Sort Tasks"
        />
      )}
    </div>
  );
}
