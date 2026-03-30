'use client';

import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useHolidayPageData } from '@/hooks/useHolidayPageData';
import { useHolidayMutations } from '@/hooks/useHolidayMutations';
import { useSubscription } from '@/hooks/useSubscription';
import { fetchContacts } from '@/store/slices/addressBookSlice';
import {
  selectIsHolidayShared,
  selectShareByHolidayKey,
} from '@/store/slices/sharesSlice';
import { getFormConfigEnhanced } from '@/config/formConfigs';
import SortModal from '@/components/modals/SortModal';
import FormModal from '@/components/modals/FormModal';
import DeleteModal from '@/components/modals/DeleteModal';
import { getDeleteConfig } from '@/config/deleteModalConfigs';
import HolidayPageHeader from '@/components/common/HolidayPageHeader';
import AddButton from '@/components/common/AddButton';
import TaskSection from '@/components/common/TaskSection';
import ToDoCard from '@/components/cards/to-do/ToDoCard';

type SortOption = 'priority' | 'dateDue' | 'assignedTo' | 'category' | 'none';

const defaultDecorationTasks = [
  {
    title: 'Set up Easter tree',
    description: 'Decorate with Easter eggs and spring flowers',
    priority: 'high' as const,
  },
  {
    title: 'Hang Easter banners',
    description: 'Display Easter-themed banners and signs',
    priority: 'medium' as const,
  },
  {
    title: 'Arrange Easter centerpiece',
    description: 'Create a festive centerpiece for the table',
    priority: 'medium' as const,
  },
  {
    title: 'Set up Easter egg hunt area',
    description: 'Prepare the area for Easter egg hunting',
    priority: 'high' as const,
  },
  {
    title: 'Decorate Easter egg display',
    description: 'Create beautiful Easter egg arrangements',
    priority: 'medium' as const,
  },
  {
    title: 'Set up Easter photo booth',
    description: 'Prepare Easter-themed photo opportunity',
    priority: 'low' as const,
  },
];

export default function EasterDecorationsPage() {
  const dispatch = useAppDispatch();
  const { contacts } = useAppSelector((state: any) => state.addressBook);

  // Get share members for Enhanced Compatibility Layer
  const shareData = useAppSelector(state =>
    selectShareByHolidayKey(state, 'easter'),
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

  const { isUserPlusMember, hasSubscription } = useSubscription();

  // Check if the holiday is shared to conditionally show assign to field
  const isHolidayShared = useAppSelector((state: any) =>
    selectIsHolidayShared(state, 'easter'),
  );
  const isAuthorizedForSharing = hasSubscription && isUserPlusMember;

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

  // Redux data access with name resolution - decorations are stored as tasks with category "Decorations"
  const decorations =
    holidayData?.tasks
      ?.filter((task: any) => task.category === 'Decorations')
      .map(transformTaskWithAssignment) || [];
  const isLoading = !homeInitialized;
  const error = null;

  // Removed refreshHomeData helper to prevent infinite loops
  // Direct dispatch calls are used instead

  // State management
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<any>(null);
  const [sortBy, setSortBy] = useState<SortOption>('none');
  const [showSortModal, setShowSortModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  // Delete config
  const deleteConfig = getDeleteConfig('tasks');

  useEffect(() => {
    // Always fetch contacts for address book functionality
    dispatch(fetchContacts());
  }, [dispatch]);

  // CRUD Operations
  async function handleAddTask(values: Record<string, any>) {
    if (!values.title?.trim()) return;
    if (!holidayId || !auth0User) return;

    try {
      const result = await createTask({
        title: values.title,
        description: values.description,
        priority: values.priority,
        assigned_to: values.assigned_to || undefined,
        category: 'Decorations',
        due_date: values.dueDate || undefined,
      });

      setShowForm(false);
    } catch (error) {
      console.error('Failed to add task:', error);
    }
  }

  async function handleToggleCompletion(taskId: string) {
    if (!holidayId || !auth0User) return;

    const task = decorations.find((t: any) => t.id === taskId);
    if (!task) return;

    try {
      await updateTask(taskId, {
        isCompleted: !task.isCompleted,
      });
    } catch (error) {
      console.error('Failed to toggle task completion:', error);
    }
  }

  async function handleEditDecoration(task: any) {
    if (!task) return;

    // Format dates for input fields (YYYY-MM-DD format)
    const formattedTask = {
      ...task,
      dueDate: task.dueDate
        ? new Date(task.dueDate).toISOString().split('T')[0]
        : '',
    };

    setEditingTask(formattedTask);
    setShowEditModal(true);
  }

  async function handleEditTaskSubmit(values: Record<string, any>) {
    if (!values.title?.trim() || !editingTask) return;
    if (!holidayId || !auth0User) return;

    try {
      await updateTask(editingTask.id, {
        title: values.title,
        description: values.description,
        priority: values.priority,
        assigned_to: values.assigned_to || null,
        category: 'Decorations',
        due_date: values.dueDate || null,
        isCompleted: editingTask.isCompleted,
      });

      setShowEditModal(false);
      setEditingTask(null);
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  }

  const handleDeleteModalOpen = (task: any) => {
    setTaskToDelete(task);
    setShowDeleteModal(true);
  };

  const handleDeleteModalClose = () => {
    setTaskToDelete(null);
    setShowDeleteModal(false);
  };

  async function handleDeleteTask() {
    if (!taskToDelete || !holidayId || !auth0User) return;

    try {
      await deleteTask(taskToDelete.id);

      handleDeleteModalClose();
    } catch (error) {
      console.error('Error deleting task:', error);
      handleDeleteModalClose();
    }
  }

  // Filter tasks by completion status
  const incompleteDecorations = decorations.filter(
    (decoration: any) => !decoration.isCompleted,
  );
  const completedDecorations = decorations.filter(
    (decoration: any) => decoration.isCompleted,
  );

  // Sort functions (same as Kwanzaa pattern)
  const sortTasks = (tasks: any[], sortBy: SortOption) => {
    if (sortBy === 'none') return tasks;

    return [...tasks].sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          const priorityOrder: { [key: string]: number } = {
            high: 3,
            medium: 2,
            low: 1,
          };
          return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
        case 'dateDue':
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        case 'assignedTo':
          if (!a.assignedTo) return 1;
          if (!b.assignedTo) return -1;
          return a.assignedTo.localeCompare(b.assignedTo);
        case 'category':
          return a.category.localeCompare(b.category);
        default:
          return 0;
      }
    });
  };

  const sortedIncompleteDecorations = sortTasks(incompleteDecorations, sortBy);
  const sortedCompletedDecorations = sortTasks(completedDecorations, sortBy);

  // Enhanced Compatibility Layer for form configuration
  const addFormConfig = getFormConfigEnhanced('tasks', 'add', {
    holidayKey: 'easter',
    shareMembers: shareMembers,
    auth0User: auth0User,
  });

  const editFormConfig = getFormConfigEnhanced('tasks', 'edit', {
    holidayKey: 'easter',
    shareMembers: shareMembers,
    auth0User: auth0User,
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen easter-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
        <div className="flex-1 w-full max-w-4xl flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading decorations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen easter-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
      <HolidayPageHeader
        title="Easter Decorations"
        backHref="/easter"
        onSortClick={() => setShowSortModal(true)}
        description="Plan your Easter decorations with festive flair!"
        holidayColor="purple-500"
        sortTitle="Sort Decorations"
      />

      <main className="flex-1 w-full max-w-4xl flex flex-col gap-6 mt-4">
        <AddButton
          title="Decoration"
          onClick={() => setShowForm(true)}
          color="purple"
        />

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
          items={sortedIncompleteDecorations}
          isCompleted={false}
          emptyMessage="No decorations planned yet."
          completedMessage="All decorations completed!"
          renderItem={(task: any) => (
            <ToDoCard
              key={task.id}
              task={task}
              onToggleComplete={handleToggleCompletion}
              onDelete={() => handleDeleteModalOpen(task)}
              onEdit={handleEditDecoration}
              theme={{
                accentColor: '#a855f7', // Purple for Easter
              }}
              borderColor="rgb(168 85 247)" // Purple border for Easter
              disableInternalModal={true}
            />
          )}
        />

        <TaskSection
          title="Completed Decorations"
          items={sortedCompletedDecorations}
          isCompleted={true}
          emptyMessage="No completed decorations yet."
          completedMessage=""
          renderItem={(task: any) => (
            <ToDoCard
              key={task.id}
              task={task}
              onToggleComplete={handleToggleCompletion}
              onDelete={() => handleDeleteModalOpen(task)}
              onEdit={handleEditDecoration}
              theme={{
                accentColor: '#a855f7', // Purple for Easter
              }}
              borderColor="rgb(168 85 247)" // Purple border for Easter
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
        initialValues={{
          title: '',
          description: '',
          priority: 'medium',
          assigned_to: '',
          dueDate: '',
        }}
        onSubmit={handleAddTask}
        onClose={() => setShowForm(false)}
        loading={createLoading}
        submitText="Add Task"
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
        onClose={() => {
          setShowEditModal(false);
          setEditingTask(null);
        }}
        loading={updateLoading}
        submitText="Update Task"
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
          onCancel={handleDeleteModalClose}
          onConfirm={handleDeleteTask}
          loading={deleteLoading}
          title={getDeleteConfig('tasks').title}
          message={getDeleteConfig('tasks').message}
          itemName={taskToDelete.title}
          confirmText={getDeleteConfig('tasks').confirmText}
          cancelText={getDeleteConfig('tasks').cancelText}
          cardClassName={getDeleteConfig('tasks').cardClassName}
          confirmButtonColor={getDeleteConfig('tasks').confirmButtonColor}
        />
      )}
    </div>
  );
}
