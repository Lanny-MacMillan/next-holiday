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
} from '@/store/slices/homeSlice';
import {
  selectIsHolidayShared,
  selectShareByHolidayKey,
} from '@/store/slices/sharesSlice';
import SortModal from '@/components/modals/SortModal';
import ToDoCard from '@/components/cards/to-do/ToDoCard';
import HolidayPageHeader from '@/components/common/HolidayPageHeader';
import AddButton from '@/components/common/AddButton';
import TaskSection from '@/components/common/TaskSection';
import FormModal from '@/components/modals/FormModal';
import DeleteModal from '@/components/modals/DeleteModal';
import { getFormConfigEnhanced } from '@/config/formConfigs';
import { getDeleteConfig } from '@/config/deleteModalConfigs';

type SortOption = 'priority' | 'title' | 'dueDate' | 'assignedTo' | 'none';

export default function KwanzaaTasksPage() {
  const dispatch = useAppDispatch();

  // Hook implementations
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

  // Redux & Sharing
  const isHolidayShared = useAppSelector((state: any) =>
    selectIsHolidayShared(state, 'kwanzaa'),
  );
  const contacts = useAppSelector((state: any) => state.addressBook.contacts);

  // State management
  const [showForm, setShowForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [taskToDelete, setTaskToDelete] = useState<any>(null);
  const [sortBy, setSortBy] = useState<SortOption>('none');

  const themeColor = '#dc2626'; // Red for Kwanzaa

  // Load contacts if holiday is shared
  useEffect(() => {
    if (isHolidayShared && auth0User) {
      dispatch(fetchContacts(auth0User.id));
    }
  }, [isHolidayShared, auth0User, dispatch]);

  // Get share members for Enhanced Compatibility Layer
  const shareData = useAppSelector(state =>
    selectShareByHolidayKey(state, 'kwanzaa'),
  );
  const shareMembers = shareData?.members || [];

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

  // Task data processing with assignment name resolution
  const tasks = useMemo(
    () =>
      (
        holidayData?.tasks?.filter((task: any) => task.category === 'Tasks') || []
      ).map(transformTaskWithAssignment),
    [holidayData?.tasks, shareMembers],
  );

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

  // Show loading only if home data is not initialized
  if (!homeInitialized) {
    return (
      <div className="min-h-screen kwanzaa-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading tasks...</p>
        </div>
      </div>
    );
  }

  const sortedTasks = getSortedTasks();
  const incompleteTasks = sortedTasks.filter((task: any) => !task.isCompleted);
  const completedTasks = sortedTasks.filter((task: any) => task.isCompleted);
  const pendingTasks = sortedTasks.filter((task: any) => !task.isCompleted);

  // Task toggle function
  async function handleTaskToggle(taskId: string) {
    const task = tasks.find((t: any) => t.id === taskId);
    if (!task || !holidayId) return;

    const result = await updateTask(taskId, { isCompleted: !task.isCompleted });
    dispatch(
      updateTaskInHomeData({
        holidayId,
        taskId,
        updates: { isCompleted: !task.isCompleted },
      }),
    );
    await refreshHomeData(auth0User, holidayId);
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

    const taskData = {
      title: formData.title,
      description: formData.description,
      priority: formData.priority,
      assigned_to: formData.assigned_to || undefined,
      due_date: formData.dueDate || undefined,
      category: 'Tasks',
      isCompleted: false,
    };

    const result = await createTask(taskData);
    if (result) {
      dispatch(addTaskToHomeData({ holidayId, task: result }));
      await refreshHomeData(auth0User, holidayId);
      closeForm();
    }
  };

  const handleEditTask = async (formData: any) => {
    if (!editingTask || !holidayId) return;

    const updates = {
      title: formData.title,
      description: formData.description,
      priority: formData.priority || 'medium',
      isCompleted: formData.isCompleted || editingTask.isCompleted,
      assigned_to: formData.assigned_to || null,
      due_date: formData.dueDate || null,
    };

    const result = await updateTask(editingTask.id, updates);
    if (result) {
      dispatch(
        updateTaskInHomeData({
          holidayId,
          taskId: editingTask.id,
          updates: result,
        }),
      );
      await refreshHomeData(auth0User, holidayId);
      handleEditModalClose();
    }
  };

  const handleDeleteTask = async () => {
    if (!taskToDelete || !holidayId) return;

    const result = await deleteTask(taskToDelete.id);
    if (result) {
      dispatch(removeTaskFromHomeData({ holidayId, taskId: taskToDelete.id }));
      await refreshHomeData(auth0User, holidayId);
      handleDeleteModalClose();
    }
  };

  // Sort handler
  function handleSort(option: SortOption) {
    setSortBy(option);
    setShowSortModal(false);
  }

  // Dynamic form fields
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

  // Get form configuration
  const formConfig = getFormConfigEnhanced('tasks', editingTask ? 'edit' : 'add', {
    holidayKey: 'kwanzaa',
    shareMembers: shareMembers,
    auth0User: auth0User,
  });
  const deleteConfig = getDeleteConfig('tasks');

  return (
    <div className="min-h-screen kwanzaa-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
      <HolidayPageHeader
        title="Kwanzaa Tasks"
        backHref="/kwanzaa"
        onSortClick={() => setShowSortModal(true)}
        sortTitle="Sort tasks"
        description="Stay on top of your holiday to-dos"
        holidayColor={themeColor}
      />

      <main className="w-full max-w-4xl flex flex-col gap-6">
        <AddButton title="Task" onClick={openForm} color="red" />

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
          emptyMessage="All tasks completed! 🕯️"
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
        onSortChange={(option: string) => setSortBy(option as SortOption)}
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
        fields={
          getFormConfigEnhanced('tasks', 'add', {
            holidayKey: 'kwanzaa',
            shareMembers: shareMembers,
            auth0User: auth0User,
          }).fields
        }
        onSubmit={handleAddTask}
        onClose={closeForm}
        loading={createLoading}
        submitText={createLoading ? 'Adding...' : 'Add Task'}
        cancelText="Cancel"
        cardClassName="card card-tasks"
        submitButtonColor="#dc2626"
        contacts={contacts}
        shareMembers={shareMembers}
      />

      {/* Edit Modal */}
      <FormModal
        isOpen={showEditModal}
        title="Edit Task"
        fields={
          getFormConfigEnhanced('tasks', 'edit', {
            holidayKey: 'kwanzaa',
            shareMembers: shareMembers,
            auth0User: auth0User,
          }).fields
        }
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
        submitButtonColor="#dc2626"
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
        cardClassName={deleteConfig.cardClassName}
        confirmButtonColor={deleteConfig.confirmButtonColor}
      />
    </div>
  );
}
