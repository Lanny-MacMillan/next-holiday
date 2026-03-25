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
  setHomeData,
} from '@/store/slices/homeSlice';
import {
  selectIsHolidayShared,
  selectShareByHolidayKey,
} from '@/store/slices/sharesSlice';
import SortModal from '@/components/modals/SortModal';
import FormModal from '@/components/modals/FormModal';
import DeleteModal from '@/components/modals/DeleteModal';
import { getFormConfigEnhanced } from '@/config/formConfigs';
import { getDeleteConfig } from '@/config/deleteModalConfigs';
import HolidayPageHeader from '@/components/common/HolidayPageHeader';
import AddButton from '@/components/common/AddButton';
import TaskSection from '@/components/common/TaskSection';
import ToDoCard from '@/components/cards/to-do/ToDoCard';

type SortOption = 'priority' | 'dateDue' | 'assignedTo' | 'category' | 'none';

export default function MothersDayEventsPage() {
  const dispatch = useAppDispatch();
  const { contacts } = useAppSelector((state: any) => state.addressBook);

  // New hooks pattern for data access
  const { holidayId, holidayData, auth0User, homeInitialized } =
    useHolidayPageData();

  // CRUD Operations Hook for tasks
  const {
    createTask,
    updateTask,
    deleteTask,
    createLoading,
    updateLoading,
    deleteLoading,
  } = useHolidayMutations({ holidayId, auth0User });

  // Data refresh hook
  const { refreshHomeData } = useRefreshHomeData();

  // Check if the holiday is shared to conditionally show assign to field
  const isHolidayShared = useAppSelector((state: any) =>
    selectIsHolidayShared(state, 'mothers-day'),
  );
  const shareData = useAppSelector((state: any) =>
    selectShareByHolidayKey(state, 'mothers-day'),
  );
  const shareMembers = shareData?.members || [];

  // Helper functions for assignment display
  const getAssignedUserName = (assignedToUuid: string): string | null => {
    if (!assignedToUuid || !shareMembers.length) return null;
    const member = shareMembers.find((m: any) => m.uuid === assignedToUuid);
    return member ? member.name || member.email || 'Unknown User' : assignedToUuid;
  };

  const transformTaskWithAssignment = (task: any) => ({
    ...task,
    assignedToName: task.assignedTo ? getAssignedUserName(task.assignedTo) : null,
  });

  // Redux data access - events are stored as tasks with category "Events"
  const rawEvents =
    holidayData?.tasks?.filter((task: any) => task.category === 'Events') || [];
  const events = rawEvents.map(transformTaskWithAssignment);
  const isLoading = !homeInitialized;
  const error = null;

  // State management
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('none');
  const [showSortModal, setShowSortModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<any>(null);
  // Enhanced Compatibility loading states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    // Always fetch contacts for address book functionality
    dispatch(fetchContacts());
  }, [dispatch]);

  // CRUD Operations
  async function handleAddTask(values: Record<string, any>) {
    if (!values.title?.trim()) return;
    if (!holidayId || !auth0User) return;

    setIsSubmitting(true);

    const newTask = {
      id: `temp-${Date.now()}`, // Temporary ID for optimistic update
      title: values.title,
      description: values.description || undefined,
      priority: values.priority as 'low' | 'medium' | 'high',
      assignedTo: values.assigned_to || undefined,
      category: 'Events',
      dueDate: values.dueDate || undefined,
      isCompleted: false,
      holidayId: holidayId,
    };

    try {
      // Optimistically update Redux state first (like Kwanzaa)
      dispatch(addTaskToHomeData({ holidayId: holidayId, task: newTask }));

      // Call API - use the hook with proper snake_case mapping
      const result = await createTask({
        title: values.title,
        description: values.description || undefined,
        priority: values.priority as 'low' | 'medium' | 'high',
        assigned_to: values.assigned_to || undefined,
        category: 'Events',
        due_date: values.dueDate || undefined,
        isCompleted: false,
      });

      // Replace temporary task with real task from API
      dispatch(
        removeTaskFromHomeData({
          holidayId: holidayId,
          taskId: newTask.id,
        }),
      );
      dispatch(addTaskToHomeData({ holidayId: holidayId, task: result }));

      // Refresh home data
      await refreshHomeData(auth0User, holidayId);

      setShowForm(false);
    } catch (error) {
      // Remove optimistic update on error
      dispatch(removeTaskFromHomeData({ holidayId: holidayId, taskId: newTask.id }));
      console.error('Failed to add task:', error);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleCompletion(taskId: string) {
    if (!holidayId || !auth0User) return;

    setIsToggling(true);
    try {
      // Find the current task to get its completion status
      const currentTask = events.find((task: any) => task.id === taskId);
      if (!currentTask) {
        console.error('Task not found:', taskId);
        return;
      }

      // Toggle the completion status
      const newCompletionStatus = !currentTask.isCompleted;

      // Optimistically update the Redux home data
      dispatch(
        updateTaskInHomeData({
          holidayId: holidayId,
          taskId: taskId,
          updates: { isCompleted: newCompletionStatus },
        }),
      );

      // Use the hook for API call
      await updateTask(taskId, { isCompleted: newCompletionStatus });

      // Refresh home data to ensure progress tracking updates
      await refreshHomeData(auth0User, holidayId);
    } catch (error) {
      // Revert the optimistic update on error
      const currentTask = events.find((task: any) => task.id === taskId);
      if (currentTask) {
        dispatch(
          updateTaskInHomeData({
            holidayId: holidayId,
            taskId: taskId,
            updates: { isCompleted: currentTask.isCompleted },
          }),
        );
      }
      console.error('Failed to toggle task:', error);
    } finally {
      setIsToggling(false);
    }
  }

  const handleEditEvent = (task: any) => {
    setEditingTask(task);
    setShowEditModal(true);
  };

  async function handleEditSubmit(values: Record<string, any>) {
    if (!editingTask || !holidayId || !auth0User) return;

    setIsEditSubmitting(true);
    try {
      const updatedTask = {
        title: values.title,
        description: values.description || undefined,
        priority: values.priority as 'low' | 'medium' | 'high',
        assignedTo: values.assigned_to || undefined,
        dueDate: values.dueDate || undefined,
      };

      // Optimistically update the Redux home data
      dispatch(
        updateTaskInHomeData({
          holidayId: holidayId,
          taskId: editingTask.id,
          updates: updatedTask,
        }),
      );

      // Use the hook for API call with proper snake_case mapping
      await updateTask(editingTask.id, {
        title: values.title,
        description: values.description || undefined,
        priority: values.priority as 'low' | 'medium' | 'high',
        assigned_to: values.assigned_to || null,
        due_date: values.dueDate || null,
      });

      // Refresh home data to ensure progress tracking updates
      await refreshHomeData(auth0User, holidayId);

      setShowEditModal(false);
      setEditingTask(null);
    } catch (error) {
      // Revert the optimistic update on error
      dispatch(
        updateTaskInHomeData({
          holidayId: holidayId,
          taskId: editingTask.id,
          updates: {
            title: editingTask.title,
            description: editingTask.description,
            priority: editingTask.priority,
            assignedTo: editingTask.assignedTo,
            dueDate: editingTask.dueDate,
          },
        }),
      );
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
      // Optimistically remove the task from Redux
      dispatch(
        removeTaskFromHomeData({ holidayId: holidayId, taskId: taskToDelete.id }),
      );

      // Use the hook for API call
      await deleteTask(taskToDelete.id);

      // Refresh home data to ensure progress tracking updates
      await refreshHomeData(auth0User, holidayId);

      setShowDeleteModal(false);
      setTaskToDelete(null);
    } catch (error) {
      // Revert the optimistic removal on error
      if (taskToDelete) {
        dispatch(addTaskToHomeData({ holidayId: holidayId, task: taskToDelete }));
      }
      console.error('Failed to delete task:', error);
    }
  }

  function handleCancelDelete() {
    setShowDeleteModal(false);
    setTaskToDelete(null);
  }

  // Sorting functionality
  const sortOptions = [
    { value: 'none', label: 'Default Order' },
    { value: 'priority', label: 'Priority' },
    { value: 'dateDue', label: 'Due Date' },
    { value: 'assignedTo', label: 'Assigned To' },
  ];

  const sortTasks = (tasks: any[]) => {
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
        default:
          return 0;
      }
    });
  };

  // Separate incomplete and complete events
  const sortedEvents = sortTasks(events);
  const incompleteEvents = sortedEvents.filter(event => !event.isCompleted);
  const completeEvents = sortedEvents.filter(event => event.isCompleted);

  // Enhanced Compatibility Layer form configuration
  const addFormConfig = getFormConfigEnhanced('tasks', 'add', {
    holidayKey: 'mothers-day',
    shareMembers: shareMembers,
    auth0User: auth0User,
  });

  const editFormConfig = getFormConfigEnhanced('tasks', 'edit', {
    holidayKey: 'mothers-day',
    shareMembers: shareMembers,
    auth0User: auth0User,
  });

  const deleteConfig = getDeleteConfig('tasks');

  return (
    <div className="min-h-screen mothers-day-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
      <HolidayPageHeader
        title="Mother's Day Events"
        backHref="/mothers-day"
        onSortClick={() => setShowSortModal(true)}
        description="Keep track of your Mother's Day events!"
        holidayColor="pink-500"
        sortTitle="Sort Events"
      />

      <main className="flex-1 w-full max-w-4xl flex flex-col gap-6 mt-4">
        <AddButton title="Event" onClick={() => setShowForm(true)} color="pink" />

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
              onToggleComplete={handleToggleCompletion}
              onDelete={handleDeleteEvent}
              onEdit={handleEditEvent}
              theme={{
                accentColor: '#ec4899', // Pink for Mother's Day
              }}
              borderColor="rgb(236 72 153)"
              disableInternalModal={true}
            />
          )}
        />

        <TaskSection
          title="Completed Events"
          items={completeEvents}
          isCompleted={true}
          emptyMessage="No completed events yet."
          completedMessage="No completed events yet."
          renderItem={(task: any) => (
            <ToDoCard
              key={task.id}
              task={task}
              onToggleComplete={handleToggleCompletion}
              onDelete={handleDeleteEvent}
              onEdit={handleEditEvent}
              theme={{
                accentColor: '#ec4899', // Pink for Mother's Day
              }}
              borderColor="rgb(236 72 153)"
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
        onSortChange={(sortOption: string) => setSortBy(sortOption as SortOption)}
        sortOptions={sortOptions}
        title="Sort Events"
      />

      {/* Add Form Modal */}
      <FormModal
        isOpen={showForm}
        title="Add New Event"
        fields={addFormConfig.fields}
        initialValues={{ priority: 'medium' }}
        onSubmit={handleAddTask}
        onClose={() => setShowForm(false)}
        loading={isSubmitting}
        submitText={isSubmitting ? 'Processing...' : 'Add Event'}
        cardClassName="card-events-mothers-day"
        contacts={contacts}
        shareMembers={shareMembers}
      />

      {/* Edit Form Modal */}
      <FormModal
        isOpen={showEditModal}
        title="Edit Event"
        fields={editFormConfig.fields}
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
            : {}
        }
        onSubmit={handleEditSubmit}
        onClose={() => {
          setShowEditModal(false);
          setEditingTask(null);
        }}
        loading={isEditSubmitting}
        submitText={isEditSubmitting ? 'Processing...' : 'Update Event'}
        cardClassName="card-events-mothers-day"
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
          confirmButtonColor={deleteConfig.confirmButtonColor}
        />
      )}
    </div>
  );
}
