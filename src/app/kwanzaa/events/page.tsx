'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useHolidayPageData } from '@/hooks/useHolidayPageData';
import { useHolidayMutations } from '@/hooks/useHolidayMutations';
import { useRefreshHomeData } from '@/hooks/useRefreshHomeData';
import { useSubscription } from '@/hooks/useSubscription';
import { fetchContacts } from '@/store/slices/addressBookSlice';
import {
  updateTaskInHomeData,
  addTaskToHomeData,
  removeTaskFromHomeData,
  setHomeData,
} from '@/store/slices/homeSlice';
import {
  selectHolidayPreferences,
  selectHomeInitialized,
  selectHomeData,
  selectHolidayPrefById,
} from '@/store/selectors/home';
import {
  selectIsHolidayShared,
  selectShareByHolidayKey,
} from '@/store/slices/sharesSlice';
import { getFormConfigEnhanced } from '@/config/formConfigs';
import SortModal from '@/components/modals/SortModal';
import FormModal from '@/components/modals/FormModal';
import DeleteModal from '@/components/modals/DeleteModal';
import HolidayPageHeader from '@/components/common/HolidayPageHeader';
import AddButton from '@/components/common/AddButton';
import TaskSection from '@/components/common/TaskSection';
import ToDoCard from '@/components/cards/to-do/ToDoCard';

type SortOption = 'priority' | 'dateDue' | 'assignedTo' | 'category' | 'none';

export default function KwanzaaEventsPage() {
  const dispatch = useAppDispatch();
  const { contacts } = useAppSelector((state: any) => state.addressBook);

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

  const { isUserPlusMember, hasSubscription } = useSubscription();

  // Check if the holiday is shared to conditionally show assign to field
  const isHolidayShared = useAppSelector((state: any) =>
    selectIsHolidayShared(state, 'kwanzaa'),
  );
  const isAuthorizedForSharing = hasSubscription && isUserPlusMember;

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

  // Redux data access - events are stored as tasks with category "Events" like in Hanukkah
  const events = useMemo(
    () =>
      (
        holidayData?.tasks?.filter((task: any) => task.category === 'Events') || []
      ).map(transformTaskWithAssignment),
    [holidayData?.tasks, shareMembers],
  );
  const isLoading = !homeInitialized;

  // Removed refreshHomeData helper to prevent infinite loops
  // Direct dispatch calls are used instead

  // State management
  const [showAddModal, setShowAddModal] = useState(false);
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

  // CRUD Operations Pattern (using standardized hooks)
  async function handleAddTask(values: Record<string, any>) {
    if (!values.title?.trim()) return;
    if (!holidayId || !auth0User) return;

    setIsSubmitting(true);

    try {
      const result = await createTask({
        title: values.title,
        description: values.description || undefined,
        priority: values.priority as 'low' | 'medium' | 'high',
        assigned_to: values.assigned_to || undefined, // snake_case for API
        category: 'Events',
        due_date: values.dueDate || undefined,
      });

      // Update Redux state immediately
      dispatch(addTaskToHomeData({ holidayId: holidayId, task: result }));

      // Refresh home data to ensure UI is in sync
      await refreshHomeData(auth0User, holidayId);

      setShowAddModal(false);
    } catch (error) {
      console.error('Error creating event:', error);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleTask(taskId: string) {
    if (!holidayId || !auth0User) return;

    const event = events.find((e: any) => e.id === taskId);
    if (!event) return;

    try {
      const result = await updateTask(taskId, { isCompleted: !event.isCompleted });

      // Update Redux state
      dispatch(
        updateTaskInHomeData({
          holidayId: holidayId,
          taskId: taskId,
          updates: { isCompleted: !event.isCompleted },
        }),
      );

      // Refresh home data to update progress on main holiday page
      await refreshHomeData(auth0User, holidayId);
    } catch (error) {
      console.error('Error toggling event:', error);
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
      const result = await updateTask(editingTask.id, {
        title: values.title,
        description: values.description || undefined,
        priority: values.priority as 'low' | 'medium' | 'high',
        assigned_to: values.assigned_to || undefined,
        category: 'Events',
        due_date: values.dueDate || undefined,
      });

      // Update Redux state
      dispatch(
        updateTaskInHomeData({
          holidayId: holidayId,
          taskId: editingTask.id,
          updates: result,
        }),
      );

      // Refresh home data to ensure UI is in sync
      await refreshHomeData(auth0User, holidayId);

      setShowEditModal(false);
      setEditingTask(null);
    } catch (error) {
      console.error('Error updating event:', error);
    } finally {
      setIsEditSubmitting(false);
    }
  }

  async function handleDeleteTask(taskId: string) {
    const task = events.find((t: any) => t.id === taskId);
    if (task) {
      setTaskToDelete(task);
      setShowDeleteModal(true);
    }
  }

  async function confirmDeleteTask() {
    if (!taskToDelete || !holidayId || !auth0User) return;

    try {
      await deleteTask(taskToDelete.id);

      // Remove from Redux state on success
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

  function cancelDeleteTask() {
    setShowDeleteModal(false);
    setTaskToDelete(null);
  }

  function openForm() {
    setShowAddModal(true);
  }

  function closeForm() {
    setShowAddModal(false);
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
      <div className="min-h-screen kwanzaa-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading events...</p>
        </div>
      </div>
    );
  }

  const sortedTasks = sortTasks(events.map(transformTaskWithAssignment));
  const incompleteEvents = sortedTasks.filter((task: any) => !task.isCompleted);
  const completedEvents = sortedTasks.filter((task: any) => task.isCompleted);

  return (
    <div className="min-h-screen kwanzaa-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
      <HolidayPageHeader
        title="Kwanzaa Events"
        backHref="/kwanzaa"
        onSortClick={() => setShowSortModal(true)}
        description="Plan your Kwanzaa celebrations!"
        holidayColor="red-600"
        sortTitle="Sort Events"
      />

      <main className="flex-1 w-full max-w-4xl flex flex-col gap-6 mt-4">
        {/* Default Tasks Prompt */}
        <AddButton title="Event" onClick={openForm} color="red" />

        {/* Event Status Summary */}
        {events.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
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
              onToggleComplete={handleToggleTask}
              onDelete={handleDeleteTask}
              onEdit={handleEditTask}
              theme={{
                accentColor: '#dc2626', // Red for Kwanzaa
              }}
              borderColor="rgb(239 68 68)" // Red border for Kwanzaa
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
              onDelete={handleDeleteTask}
              onEdit={handleEditTask}
              className="opacity-60"
              theme={{
                accentColor: '#dc2626', // Red for Kwanzaa
              }}
              borderColor="rgb(239 68 68)" // Red border for Kwanzaa
              disableInternalModal={true}
            />
          )}
        />
      </main>

      {/* Form Modal */}
      <FormModal
        isOpen={showAddModal}
        title="Add New Event Task"
        fields={
          getFormConfigEnhanced('tasks', 'add', {
            holidayKey: 'kwanzaa',
            shareMembers: shareMembers,
            auth0User: auth0User,
          }).fields
        }
        onSubmit={handleAddTask}
        onClose={closeForm}
        loading={isSubmitting}
        submitText={isSubmitting ? 'Processing...' : 'Add Task'}
        cardClassName="card-tasks"
      />

      {/* Edit Modal */}
      <FormModal
        isOpen={showEditModal}
        title="Edit Event Task"
        fields={
          getFormConfigEnhanced('tasks', 'edit', {
            holidayKey: 'kwanzaa',
            shareMembers: shareMembers,
            auth0User: auth0User,
          }).fields
        }
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
        onSubmit={handleEditTaskSubmit}
        onClose={closeEditModal}
        loading={isEditSubmitting}
        submitText={isEditSubmitting ? 'Processing...' : 'Update Task'}
        cardClassName="card-tasks"
      />

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={showDeleteModal}
        title="Delete Event?"
        message={`Are you sure you want to delete "${taskToDelete?.title}"? This action cannot be undone.`}
        onConfirm={confirmDeleteTask}
        onCancel={cancelDeleteTask}
        loading={deleteLoading}
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
    </div>
  );
}
