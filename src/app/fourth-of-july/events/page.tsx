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

export default function FourthOfJulyEventsPage() {
  const dispatch = useAppDispatch();
  const { contacts } = useAppSelector((state: any) => state.addressBook);
  const { holidayId, holidayData, auth0User, homeInitialized } =
    useHolidayPageData();
  const { refreshHomeData } = useRefreshHomeData();

  // Check if the holiday is shared to conditionally show assign to field
  const isHolidayShared = useAppSelector((state: any) =>
    selectIsHolidayShared(state, 'fourth-of-july'),
  );
  const shareData = useAppSelector((state: any) =>
    selectShareByHolidayKey(state, 'fourth-of-july'),
  );
  const shareMembers = shareData?.members || [];

  // State management
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('none');
  const [showSortModal, setShowSortModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<any>(null);

  // Use hooks for CRUD operations
  const {
    createTask,
    updateTask,
    deleteTask,
    createLoading,
    updateLoading,
    deleteLoading,
  } = useHolidayMutations({ holidayId, auth0User });

  const isLoading = !homeInitialized;
  const error = null;

  // Helper functions for name resolution
  const getAssignedUserName = (assignedToUuid: string): string | null => {
    if (!assignedToUuid || !shareMembers.length) return null;
    const member = shareMembers.find((m: any) => m.uuid === assignedToUuid);
    return member ? member.name || member.email || 'Unknown User' : assignedToUuid;
  };

  const transformTaskWithAssignment = (task: any) => ({
    ...task,
    assignedToName: task.assignedTo ? getAssignedUserName(task.assignedTo) : null,
  });

  // Use memoized events filtering from holiday data with assignment names
  const events = useMemo(() => {
    const filteredEvents =
      holidayData?.tasks?.filter((task: any) => task.category === 'Events') || [];
    return filteredEvents.map(transformTaskWithAssignment);
  }, [holidayData?.tasks, shareMembers]);

  useEffect(() => {
    // Always fetch contacts for address book functionality
    dispatch(fetchContacts());
  }, [dispatch]);

  // Show message if holiday doesn't exist
  if (!holidayId) {
    return (
      <div className="min-h-screen fourth-of-july-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
        <HolidayPageHeader
          title="Fourth of July Events"
          backHref="/fourth-of-july"
          description="Keep track of your Fourth of July events!"
          holidayColor="bg-gradient-to-br from-red-400 to-red-600"
        />
        <main className="flex-1 w-full max-w-4xl flex flex-col gap-6 mt-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              Fourth of July Holiday Not Set Up
            </h3>
            <p className="text-red-700 mb-4">
              To use Fourth of July features, you need to add Fourth of July to your
              holiday preferences first.
            </p>
            <p className="text-red-600 text-sm">
              Please go to your home page and add Fourth of July to your holiday
              list.
            </p>
          </div>
        </main>
      </div>
    );
  }

  // CRUD Operations
  async function handleAddEvent(values: Record<string, any>) {
    if (!values.title?.trim()) return;
    setIsSubmitting(true);
    try {
      const taskData = {
        title: values.title,
        description: values.description || undefined,
        priority: values.priority as 'low' | 'medium' | 'high',
        assigned_to: values.assigned_to || null,
        due_date: values.dueDate || null,
        category: 'Events',
        isCompleted: false,
      };

      await createTask(taskData);
      await refreshHomeData(auth0User, holidayId);
      setShowForm(false);
    } catch (error) {
      console.error('Failed to add event:', error);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleEvent(taskId: string) {
    const currentTask = events.find((task: any) => task.id === taskId);
    if (!currentTask) {
      console.error('Task not found:', taskId);
      return;
    }

    const newCompletionStatus = !currentTask.isCompleted;

    try {
      await updateTask(taskId, { isCompleted: newCompletionStatus });
      await refreshHomeData(auth0User, holidayId);
    } catch (error) {
      console.error('Failed to toggle task:', error);
    }
  }

  const handleEditEvent = (task: any) => {
    setEditingTask(task);
    setShowEditModal(true);
  };

  async function handleEditEventSubmit(values: Record<string, any>) {
    if (!editingTask) return;
    setIsEditSubmitting(true);
    try {
      const updatedTask = {
        title: values.title,
        description: values.description || undefined,
        priority: values.priority as 'low' | 'medium' | 'high',
        assigned_to: values.assigned_to || null,
        due_date: values.dueDate || null,
        category: 'Events',
      };

      await updateTask(editingTask.id, updatedTask);
      await refreshHomeData(auth0User, holidayId);
      setEditingTask(null);
      setShowEditModal(false);
    } catch (error) {
      console.error('Failed to update task:', error);
    } finally {
      setIsEditSubmitting(false);
    }
  }

  function handleDeleteEvent(taskId: string) {
    const task = events.find((t: any) => t.id === taskId);
    if (task) {
      setTaskToDelete(task);
      setShowDeleteModal(true);
    }
  }

  async function handleConfirmDelete() {
    if (!taskToDelete || !holidayId || !auth0User) return;

    try {
      await deleteTask(taskToDelete.id);
      await refreshHomeData(auth0User, holidayId);
      setShowDeleteModal(false);
      setTaskToDelete(null);
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  }

  function handleCancelDelete() {
    setShowDeleteModal(false);
    setTaskToDelete(null);
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

  // Task sorting function from Kwanzaa
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

  const loading = createLoading || updateLoading || deleteLoading;

  // Enhanced Compatibility Layer form configuration
  const addFormConfig = getFormConfigEnhanced('tasks', 'add', {
    holidayKey: 'fourth-of-july',
    shareMembers: shareMembers,
    auth0User: auth0User,
  });

  const editFormConfig = getFormConfigEnhanced('tasks', 'edit', {
    holidayKey: 'fourth-of-july',
    shareMembers: shareMembers,
    auth0User: auth0User,
  });

  const deleteConfig = getDeleteConfig('tasks');

  if (isLoading) {
    return (
      <div className="min-h-screen fourth-of-july-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading events...</p>
        </div>
      </div>
    );
  }

  const sortedTasks = sortTasks(events).map(transformTaskWithAssignment);
  const incompleteEvents = sortedTasks.filter((task: any) => !task.isCompleted);
  const completedEvents = sortedTasks.filter((task: any) => task.isCompleted);

  return (
    <div className="min-h-screen fourth-of-july-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
      <HolidayPageHeader
        title="Fourth of July Events"
        backHref="/fourth-of-july"
        onSortClick={() => setShowSortModal(true)}
        description="Plan your Fourth of July celebrations!"
        holidayColor="red-600"
        sortTitle="Sort Events"
      />

      <main className="flex-1 w-full max-w-4xl flex flex-col gap-6 mt-4">
        <AddButton title="Event" onClick={openForm} color="red" />

        {/* Event Status Summary */}
        {events.length > 0 && (
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4">Event Status</h3>
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
              onToggleComplete={handleToggleEvent}
              onDelete={handleDeleteEvent}
              onEdit={handleEditEvent}
              theme={{
                accentColor: '#dc2626', // Red for Fourth of July
              }}
              borderColor="rgb(220 38 38)" // Red border for Fourth of July
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
              onToggleComplete={handleToggleEvent}
              onDelete={handleDeleteEvent}
              onEdit={handleEditEvent}
              className="opacity-60"
              theme={{
                accentColor: '#dc2626', // Red for Fourth of July
              }}
              borderColor="rgb(220 38 38)" // Red border for Fourth of July
              disableInternalModal={true}
            />
          )}
        />
      </main>

      {/* Form Modal */}
      <FormModal
        isOpen={showForm}
        title="Add New Event Task"
        fields={addFormConfig.fields}
        onSubmit={handleAddEvent}
        onClose={() => setShowForm(false)}
        loading={isSubmitting}
        submitText={isSubmitting ? 'Processing...' : 'Add Event'}
        cardClassName={addFormConfig.cardClassName}
        submitButtonColor="#dc2626"
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
        onSubmit={handleEditEventSubmit}
        onClose={() => setShowEditModal(false)}
        loading={isEditSubmitting}
        submitText={isEditSubmitting ? 'Processing...' : 'Update Event'}
        cardClassName={editFormConfig.cardClassName}
        submitButtonColor="#dc2626"
        contacts={contacts}
        shareMembers={shareMembers}
      />

      {/* Delete Modal */}
      {showDeleteModal && taskToDelete && (
        <DeleteModal
          isOpen={showDeleteModal}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
          loading={deleteLoading}
          title={deleteConfig.title}
          message={deleteConfig.message}
          itemName={taskToDelete.title}
          confirmText={deleteConfig.confirmText}
          cancelText={deleteConfig.cancelText}
          cardClassName={deleteConfig.cardClassName}
          confirmButtonColor={deleteConfig.confirmButtonColor}
        />
      )}

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
    </div>
  );
}
