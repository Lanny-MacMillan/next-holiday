'use client';

import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useHolidayPageData } from '@/hooks/useHolidayPageData';
import { useHolidayMutations } from '@/hooks/useHolidayMutations';
import { useRefreshHomeData } from '@/hooks/useRefreshHomeData';
import { fetchContacts } from '@/store/slices/addressBookSlice';
import {
  updateTaskInHomeData,
  addTaskToHomeData,
  removeTaskFromHomeData,
} from '@/store/slices/homeSlice';
import { selectIsHolidayShared } from '@/store/slices/sharesSlice';
import SortModal from '@/components/modals/SortModal';
import ToDoCard from '@/components/cards/to-do/ToDoCard';
import EditTaskModal from '@/components/modals/EditTaskModal';
import HolidayPageHeader from '@/components/common/HolidayPageHeader';
import AddButton from '@/components/common/AddButton';
import TaskSection from '@/components/common/TaskSection';
import FormModal from '@/components/modals/FormModal';
import DeleteModal from '@/components/modals/DeleteModal';
import { getFormConfig } from '@/config/formConfigs';
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

  // Use standardized data refresh hook
  const { refreshHomeData } = useRefreshHomeData();

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
        priority: formValues.priority as 'low' | 'medium' | 'high',
        assignedTo: formValues.assignedTo || undefined,
        category: 'Tasks',
        dueDate: formValues.dueDate || undefined,
      });

      // Update Redux state immediately
      dispatch(addTaskToHomeData({ holidayId: holidayId, task: result }));

      // Refresh home data to ensure UI is in sync
      await refreshHomeData(auth0User, holidayId);

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

  async function handleEditTask(task: any) {
    if (!holidayId || !auth0User) return;

    try {
      const updatedTask = await updateTask(task.id, {
        title: task.title,
        description: task.description,
        priority: task.priority,
        isCompleted: task.isCompleted,
        assignedTo: task.assignedTo,
        dueDate: task.dueDate,
      });

      // Update Redux state immediately
      dispatch(
        updateTaskInHomeData({
          holidayId: holidayId,
          taskId: task.id,
          updates: updatedTask,
        }),
      );

      // Refresh home data to ensure UI is in sync
      await refreshHomeData(auth0User, holidayId);

      setShowEditModal(false);
      setEditingTask(null);
    } catch (error) {
      console.error('Error updating task:', error);
    }
  }

  async function handleDeleteTask() {
    if (!taskToDelete || !holidayId || !auth0User) return;

    try {
      await deleteTask(taskToDelete.id);

      // Update Redux state immediately
      dispatch(
        removeTaskFromHomeData({
          holidayId: holidayId,
          taskId: taskToDelete.id,
        }),
      );

      // Refresh home data to ensure UI is in sync
      await refreshHomeData(auth0User, holidayId);

      setShowDeleteModal(false);
      setTaskToDelete(null);
    } catch (error) {
      console.error('Error deleting task:', error);
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

  function handleDeleteModalOpen(task: any) {
    setTaskToDelete(task);
    setShowDeleteModal(true);
  }

  function handleDeleteModalClose() {
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

      // Refresh home data to ensure UI is in sync
      await refreshHomeData(auth0User, holidayId);
    } catch (error) {
      console.error('Error toggling task completion:', error);
    }
  }

  function handleSort(option: SortOption) {
    setSortBy(option);
    setShowSortModal(false);
  }

  function getSortedTasks() {
    if (sortBy === 'none') return tasks;

    return [...tasks].sort((a, b) => {
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
          return (a.assignedTo || '').localeCompare(b.assignedTo || '');
        case 'category':
          return (a.category || '').localeCompare(b.category || '');
        default:
          return 0;
      }
    });
  }

  // Create conditional form fields based on sharing status
  const formFields = [
    {
      id: 'title',
      type: 'text' as const,
      placeholder: 'Task Title*',
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
    // Conditionally include assignedTo field only for shared holidays
    ...(isHolidayShared
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

  // Form configuration for tasks
  const formConfig = getFormConfig('tasks', editingTask ? 'edit' : 'add');
  const deleteConfig = getDeleteConfig('tasks');

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
              onDelete={(taskId: string) => handleDeleteModalOpen(task)}
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
              onDelete={(taskId: string) => handleDeleteModalOpen(task)}
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
          fields={formFields}
          onSubmit={handleAddTask}
          onClose={closeForm}
          loading={createLoading}
          submitText={createLoading ? 'Adding...' : 'Add Task'}
          cancelText="Cancel"
          cardClassName="card card-tasks"
          submitButtonColor={themeColor}
          showAddressBook={isHolidayShared}
          contacts={contacts}
        />
      )}

      {/* Edit Modal */}
      {showEditModal && editingTask && (
        <FormModal
          isOpen={showEditModal}
          title="Edit Task"
          fields={formFields}
          initialValues={{
            title: editingTask?.title || '',
            description: editingTask?.description || '',
            priority: editingTask?.priority || 'medium',
            ...(isHolidayShared
              ? { assignedTo: editingTask?.assignedTo || '' }
              : {}),
            dueDate: editingTask?.dueDate || '',
          }}
          onSubmit={handleEditTask}
          onClose={handleEditModalClose}
          loading={updateLoading}
          submitText={updateLoading ? 'Updating...' : 'Update Task'}
          cancelText="Cancel"
          cardClassName="card card-tasks"
          submitButtonColor={themeColor}
          showAddressBook={isHolidayShared}
          contacts={contacts}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && taskToDelete && (
        <DeleteModal
          isOpen={showDeleteModal}
          title={deleteConfig.title}
          message={deleteConfig.message}
          confirmText={deleteConfig.confirmText}
          cancelText={deleteConfig.cancelText}
          onConfirm={handleDeleteTask}
          onCancel={handleDeleteModalClose}
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
