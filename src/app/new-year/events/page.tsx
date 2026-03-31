'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { RootState } from '@/store';
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
import HolidayPageHeader from '@/components/common/HolidayPageHeader';
import AddButton from '@/components/common/AddButton';
import TaskSection from '@/components/common/TaskSection';
import ToDoCard from '@/components/cards/to-do/ToDoCard';
import { getDeleteConfig } from '@/config/deleteModalConfigs';

type SortOption = 'priority' | 'dateDue' | 'assignedTo' | 'category' | 'none';

export default function NewYearEventsPage() {
  const dispatch = useAppDispatch();
  const { isUserPlusMember, hasSubscription } = useSubscription();

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

  const isHolidayShared = useAppSelector((state: any) =>
    selectIsHolidayShared(state, 'new-year'),
  );
  const isAuthorizedForSharing = hasSubscription && isUserPlusMember;

  // Get share members for Enhanced Compatibility Layer
  const shareData = useAppSelector((state: RootState) =>
    selectShareByHolidayKey(state, 'new-year'),
  );
  const baseMembers = shareData?.members || [];

  // Always include current user in shareMembers for assignTo functionality
  const shareMembers = auth0User
    ? [
        // Add current user first
        {
          userId: auth0User.sub || '',
          uuid: auth0User.id || '', // Database UUID for Enhanced Compatibility Layer
          name: auth0User.name || 'Me',
          email: auth0User.email || '',
          role: 'owner' as const,
        },
        // Add other members, filtering out current user if already present
        ...baseMembers
          .filter((member: any) => member.userId !== auth0User.sub)
          .map((member: any) => ({
            ...member,
            uuid: member.uuid || member.userId, // Prefer existing uuid field, fallback to userId only if uuid missing
          })),
      ]
    : baseMembers;

  const { contacts } = useAppSelector((state: any) => state.addressBook);

  // Helper function to resolve assignedTo UUID to user name
  const getAssignedUserName = (assignedToUuid: string): string | null => {
    if (!assignedToUuid || !shareMembers.length) return null;
    const member = shareMembers.find((m: any) => m.uuid === assignedToUuid);
    return member ? member.name || member.email || 'Unknown User' : assignedToUuid;
  };

  // Transform tasks to include assignedToName for display
  const transformTaskWithAssignment = (task: any) => ({
    ...task,
    // Preserve original assignedTo field for form editing (UUID)
    assignedTo: task.assignedTo,
    // Add display name for UI
    assignedToName: task.assignedTo ? getAssignedUserName(task.assignedTo) : null,
  });

  // Redux data access - events are stored as tasks with category "Events"
  const events = useMemo(
    () =>
      (
        holidayData?.tasks?.filter((task: any) => task.category === 'Events') || []
      ).map(transformTaskWithAssignment),
    [holidayData?.tasks, shareMembers],
  );
  const isLoading = !homeInitialized;
  const error = null;

  // State management
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('none');
  const [showSortModal, setShowSortModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<any>(null);

  useEffect(() => {
    // Always fetch contacts for address book functionality
    dispatch(fetchContacts());
  }, [dispatch]);

  const handleAddTask = async (values: any) => {
    if (!values.title?.trim() || !holidayId) return;

    try {
      const newTask = {
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

      // Use the standardized hook function
      await createTask(newTask);

      setShowAddModal(false);
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const handleEditTask = (task: any) => {
    setEditingTask(task);
    setShowEditModal(true);
  };

  const handleEditTaskSubmit = async (values: Record<string, any>) => {
    if (!editingTask || !holidayId) return;

    try {
      const updates = {
        title: values.title,
        description: values.description,
        priority: values.priority,
        assigned_to: values.assigned_to === '' ? null : values.assigned_to,
        category: 'Events',
        due_date: values.dueDate || null,
      };

      await updateTask(editingTask.id, updates);

      setEditingTask(null);
      setShowEditModal(false);
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  function handleDelete(taskId: string, taskTitle: string) {
    const task = events.find((t: any) => t.id === taskId);
    if (task) {
      setTaskToDelete({ ...task, title: taskTitle });
      setShowDeleteModal(true);
    }
  }

  async function handleConfirmDelete() {
    if (!taskToDelete?.id || !holidayId || !auth0User) return;

    try {
      await deleteTask(taskToDelete.id);
      setShowDeleteModal(false);
      setTaskToDelete(null);
    } catch (error) {
      console.error('Error deleting task:', error);
      setShowDeleteModal(false);
      setTaskToDelete(null);
    }
  }

  function handleCancelDelete() {
    setShowDeleteModal(false);
    setTaskToDelete(null);
  }

  const handleToggleTask = async (taskId: string) => {
    const task = events.find((t: any) => t.id === taskId);
    if (!task || !holidayId) return;

    const newCompletionStatus = !task.isCompleted;

    try {
      // Use the standardized hook function
      await updateTask(taskId, { isCompleted: newCompletionStatus });
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  // Filter and sort events - with safety checks
  const completedEvents = events?.filter((task: any) => task.isCompleted) || [];
  const upcomingEvents = events?.filter((task: any) => !task.isCompleted) || [];

  // Sort function
  const sortTasks = (tasks: any[], sortOption: SortOption) => {
    if (sortOption === 'none') return tasks;

    return [...tasks].sort((a, b) => {
      switch (sortOption) {
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return (
            priorityOrder[b.priority as keyof typeof priorityOrder] -
            priorityOrder[a.priority as keyof typeof priorityOrder]
          );
        case 'dateDue':
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        case 'assignedTo':
          if (!a.assignedTo && !b.assignedTo) return 0;
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

  const sortedUpcomingEvents = sortTasks(upcomingEvents, sortBy);
  const sortedCompletedEvents = sortTasks(completedEvents, sortBy);

  return (
    <div className="min-h-screen new-year-cards-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
      <HolidayPageHeader
        title="New Year Events"
        description="Plan your New Year celebrations!"
        backHref="/new-year"
        holidayColor="#d97706" // New Year amber-600 to match main page
        onSortClick={() => setShowSortModal(true)}
      />

      <main className="flex-1 w-full max-w-4xl flex flex-col gap-6 mt-4">
        {/* Add New Event Button */}
        <AddButton
          onClick={() => setShowAddModal(true)}
          title="Event"
          color="amber"
          disabled={createLoading}
        />

        {/* Event Status Summary */}
        {!isLoading && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">
              Event Status
            </h2>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-yellow-600">
                  {events?.length || 0}
                </div>
                <div className="text-gray-600 dark:text-gray-400">Total Events</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {completedEvents?.length || 0}
                </div>
                <div className="text-gray-600 dark:text-gray-400">Completed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">
                  {upcomingEvents?.length || 0}
                </div>
                <div className="text-gray-600 dark:text-gray-400">Remaining</div>
              </div>
            </div>
          </div>
        )}

        <TaskSection
          title="Upcoming Events"
          items={sortedUpcomingEvents}
          isCompleted={false}
          emptyMessage="No upcoming events yet. Add your first New Year event!"
          completedMessage=""
          renderItem={(task: any) => (
            <ToDoCard
              key={task.id}
              task={task}
              onToggleComplete={handleToggleTask}
              onDelete={(taskId: string) => handleDelete(taskId, task.title)}
              onEdit={handleEditTask}
              theme={{
                accentColor: '#fbbf24', // New Year gold
                hoverColor: '#f59e0b',
              }}
              borderColor="border-l-yellow-400" // New Year accent
              disableInternalModal={true}
            />
          )}
        />

        <TaskSection
          title="Completed Events"
          items={sortedCompletedEvents}
          isCompleted={true}
          emptyMessage="No completed events yet."
          completedMessage=""
          renderItem={(task: any) => (
            <ToDoCard
              key={task.id}
              task={task}
              onToggleComplete={handleToggleTask}
              onDelete={(taskId: string) => handleDelete(taskId, task.title)}
              onEdit={handleEditTask}
              theme={{
                accentColor: '#fbbf24', // New Year gold
                hoverColor: '#f59e0b',
              }}
              borderColor="border-l-yellow-400" // New Year accent
              disableInternalModal={true}
            />
          )}
        />
      </main>

      {/* Form Modal for Adding */}
      {showAddModal && (
        <FormModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddTask}
          title="Add New Event Task"
          fields={
            getFormConfigEnhanced('tasks', 'add', {
              holidayKey: 'new-year' as any,
              shareMembers: shareMembers,
              auth0User: auth0User,
            }).fields
          }
          initialValues={{}}
          loading={createLoading}
          submitText={createLoading ? 'Adding...' : 'Add Task'}
          cardClassName="card-tasks"
          contacts={contacts}
          shareMembers={shareMembers}
        />
      )}

      {/* Edit Modal */}
      {showEditModal && editingTask && (
        <FormModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingTask(null);
          }}
          onSubmit={handleEditTaskSubmit}
          title="Edit Event Task"
          fields={
            getFormConfigEnhanced('tasks', 'edit', {
              holidayKey: 'new-year' as any,
              shareMembers: shareMembers,
              auth0User: auth0User,
            }).fields
          }
          initialValues={{
            title: editingTask.title || '',
            description: editingTask.description || '',
            priority: editingTask.priority || 'medium',
            assigned_to: editingTask.assignedTo || '',
            dueDate: editingTask.dueDate
              ? new Date(editingTask.dueDate).toISOString().split('T')[0]
              : '',
          }}
          loading={updateLoading}
          submitText={updateLoading ? 'Updating...' : 'Update Task'}
          cardClassName="card-tasks"
          contacts={contacts}
          shareMembers={shareMembers}
        />
      )}

      {/* Delete Modal */}
      {showDeleteModal && taskToDelete && (
        <DeleteModal
          isOpen={showDeleteModal}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
          title="Delete Event"
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
          onSortChange={newSort => {
            setSortBy(newSort as SortOption);
            setShowSortModal(false);
          }}
          sortOptions={[
            { value: 'none', label: 'None' },
            { value: 'priority', label: 'Priority' },
            { value: 'dateDue', label: 'Due Date' },
            { value: 'assignedTo', label: 'Assigned To' },
            { value: 'category', label: 'Category' },
          ]}
          title="Sort Events"
        />
      )}
    </div>
  );
}
