'use client';

import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useHolidayPageData } from '@/hooks/useHolidayPageData';
import { useHolidayMutations } from '@/hooks/useHolidayMutations';
import { useRefreshHomeData } from '@/hooks/useRefreshHomeData';
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

export default function EasterEventsPage() {
  const dispatch = useAppDispatch();
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
  const { isUserPlusMember, hasSubscription } = useSubscription();

  // Check if the holiday is shared to conditionally show assign to field
  const isHolidayShared = useAppSelector((state: any) =>
    selectIsHolidayShared(state, 'easter'),
  );

  // Get share members for Enhanced Compatibility Layer
  const shareData = useAppSelector(state =>
    selectShareByHolidayKey(state, 'easter'),
  );
  const shareMembers = shareData?.members || [];
  const { contacts } = useAppSelector((state: any) => state.addressBook);
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

  // Redux data access with name resolution - events are stored as tasks with category "Events"
  const events =
    holidayData?.tasks
      ?.filter((task: any) => task.category === 'Events')
      .map(transformTaskWithAssignment) || [];
  const isLoading = !homeInitialized;
  const error = null;

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

  useEffect(() => {
    // Always fetch contacts for address book functionality
    dispatch(fetchContacts());
  }, [dispatch]);

  // CRUD Operations
  async function handleAddTask(values: Record<string, any>) {
    if (!values.title?.trim()) return;
    if (!holidayId || !auth0User) return;

    console.log('Form values received:', values);

    setIsSubmitting(true);
    try {
      const payload = {
        title: values.title,
        description: values.description || undefined,
        priority: values.priority as 'low' | 'medium' | 'high',
        ...(isAuthorizedForSharing &&
          isHolidayShared && { assigned_to: values.assigned_to || undefined }),
        category: 'Events',
        due_date: values.dueDate || undefined,
        isCompleted: false,
        holidayId: holidayId,
      };

      console.log('API payload being sent:', payload);

      const result = await createTask(payload);

      console.log('API response received:', result);

      // Refresh home data to ensure UI is in sync
      await refreshHomeData(auth0User, holidayId);

      setShowForm(false);
    } catch (error) {
      console.error('Failed to add task:', error);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleTask(taskId: string) {
    if (!holidayId || !auth0User) return;

    try {
      // Find the current task to get its completion status
      const currentTask = events.find((task: any) => task.id === taskId);
      if (!currentTask) {
        console.error('Task not found:', taskId);
        return;
      }

      // Toggle the completion status
      const newCompletionStatus = !currentTask.isCompleted;

      await updateTask(taskId, {
        isCompleted: newCompletionStatus,
      });

      // Refresh home data for proper UI updates
      await refreshHomeData(auth0User, holidayId);
    } catch (error) {
      console.error('Failed to toggle task:', error);
    }
  }

  const handleEditTask = (task: any) => {
    setEditingTask(task);
    setShowEditModal(true);
  };

  async function handleEditTaskSubmit(values: Record<string, any>) {
    if (!editingTask || !holidayId || !auth0User) return;

    setIsEditSubmitting(true);
    try {
      await updateTask(editingTask.id, {
        title: values.title,
        description: values.description,
        priority: values.priority,
        assigned_to: values.assigned_to || null,
        category: 'Events',
        due_date: values.dueDate || null,
        isCompleted: editingTask.isCompleted,
      });

      // Refresh home data for proper UI updates
      await refreshHomeData(auth0User, holidayId);

      setEditingTask(null);
      setShowEditModal(false);
    } catch (error) {
      console.error('Failed to update task:', error);
    } finally {
      setIsEditSubmitting(false);
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

      // Refresh home data for proper UI updates
      await refreshHomeData(auth0User, holidayId);

      handleDeleteModalClose();
    } catch (error) {
      console.error('Failed to delete task:', error);
      handleDeleteModalClose();
    }
  }

  // Updated for backward compatibility
  async function _originalHandleDeleteTask(taskId: string) {
    if (!holidayId || !auth0User) return;

    try {
      await deleteTask(taskId);

      // Refresh home data for proper UI updates
      await refreshHomeData(auth0User, holidayId);
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  }

  function openForm() {
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
  }

  function closeEditModal() {
    setShowEditModal(false);
    setEditingTask(null);
  }

  // Task sorting function from Hanukkah
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

  if (isLoading) {
    return (
      <div className="min-h-screen easter-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading events...</p>
        </div>
      </div>
    );
  }

  const sortedTasks = sortTasks(events);
  const incompleteEvents = sortedTasks.filter((task: any) => !task.isCompleted);
  const completedEvents = sortedTasks.filter((task: any) => task.isCompleted);

  // Enhanced Compatibility Layer for form configuration
  const formConfig = getFormConfigEnhanced('tasks', 'add', {
    holidayKey: 'easter',
    shareMembers: shareMembers,
    auth0User: auth0User,
  });

  const editFormConfig = getFormConfigEnhanced('tasks', 'edit', {
    holidayKey: 'easter',
    shareMembers: shareMembers,
    auth0User: auth0User,
  });

  return (
    <div className="min-h-screen easter-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
      <HolidayPageHeader
        title="Easter Events"
        backHref="/easter"
        onSortClick={() => setShowSortModal(true)}
        description="Plan your Easter celebrations!"
        holidayColor="purple-500"
        sortTitle="Sort Events"
      />

      <main className="flex-1 w-full max-w-4xl flex flex-col gap-6 mt-4">
        <AddButton title="Event" onClick={openForm} color="purple" />

        {/* Event Status Summary */}
        {events.length > 0 && (
          <div className="card rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
              Event Status
            </h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {events.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Total Events
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {completedEvents.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Completed
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {incompleteEvents.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Remaining
                </div>
              </div>
            </div>
          </div>
        )}

        <TaskSection
          title="Upcoming Events"
          items={incompleteEvents}
          isCompleted={false}
          emptyMessage="No events planned yet."
          completedMessage="All events completed!"
          renderItem={(task: any) => (
            <ToDoCard
              key={task.id}
              task={task}
              onToggleComplete={handleToggleTask}
              onDelete={() => handleDeleteModalOpen(task)}
              onEdit={handleEditTask}
              theme={{
                accentColor: '#a855f7', // Purple for Easter
              }}
              borderColor="rgb(168 85 247)" // Purple border for Easter
              disableInternalModal={true}
            />
          )}
        />

        <TaskSection
          title="Completed Events"
          items={completedEvents}
          isCompleted={true}
          emptyMessage=""
          completedMessage=""
          renderItem={(task: any) => (
            <ToDoCard
              key={task.id}
              task={task}
              onToggleComplete={handleToggleTask}
              onDelete={() => handleDeleteModalOpen(task)}
              onEdit={handleEditTask}
              className="opacity-60"
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
        title="Add New Event Task"
        fields={formConfig.fields}
        onSubmit={handleAddTask}
        onClose={closeForm}
        loading={isSubmitting}
        submitText={isSubmitting ? 'Processing...' : 'Add Event'}
        cardClassName="card-tasks"
        contacts={contacts}
        shareMembers={shareMembers}
      />

      {/* Edit Modal */}
      <FormModal
        isOpen={showEditModal}
        title="Edit Event Task"
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
        loading={isEditSubmitting}
        submitText={isEditSubmitting ? 'Processing...' : 'Update Event'}
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
          { value: 'dateDue', label: 'Due Date' },
          { value: 'assignedTo', label: 'Assigned To' },
          { value: 'category', label: 'Category' },
        ]}
        title="Sort Events"
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
