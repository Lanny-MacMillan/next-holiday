'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { RootState } from '@/store';
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
import HolidayPageHeader from '@/components/common/HolidayPageHeader';
import AddButton from '@/components/common/AddButton';
import TaskSection from '@/components/common/TaskSection';
import ToDoCard from '@/components/cards/to-do/ToDoCard';

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

  // Use standardized data refresh hook
  const { refreshHomeData } = useRefreshHomeData();

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
          name: auth0User.name || 'Me',
          email: auth0User.email || '',
          role: 'owner' as const,
        },
        // Add other members, filtering out current user if already present
        ...baseMembers.filter((member: any) => member.userId !== auth0User.sub),
      ]
    : baseMembers;

  const { contacts } = useAppSelector((state: any) => state.addressBook);

  // Redux data access - events are stored as tasks with category "Events"
  const events = useMemo(
    () =>
      holidayData?.tasks?.filter((task: any) => task.category === 'Events') || [],
    [holidayData?.tasks],
  );
  const isLoading = !homeInitialized;
  const error = null;

  // State management
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('none');
  const [showSortModal, setShowSortModal] = useState(false);

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
          isHolidayShared && { assigned_to: values.assignedTo || undefined }),
        category: 'Events',
        dueDate: values.dueDate || undefined,
        isCompleted: false,
        holidayId: holidayId,
      };

      // Use the standardized hook function
      await createTask(newTask);

      // Refresh home data to ensure UI is in sync
      await refreshHomeData(auth0User, holidayId);

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
        assignedTo: values.assignedTo,
        category: 'Events',
        dueDate: values.dueDate,
      };

      await updateTask(editingTask.id, updates);

      // Refresh home data to ensure UI is in sync
      await refreshHomeData(auth0User, holidayId);

      setEditingTask(null);
      setShowEditModal(false);
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!holidayId) return;

    try {
      // Use the standardized hook function
      await deleteTask(taskId);

      // Refresh home data to update progress on main holiday page
      await refreshHomeData(auth0User, holidayId);
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleToggleTask = async (taskId: string) => {
    const task = events.find((t: any) => t.id === taskId);
    if (!task || !holidayId) return;

    const newCompletionStatus = !task.isCompleted;

    try {
      // Use the standardized hook function
      await updateTask(taskId, { isCompleted: newCompletionStatus });

      // Refresh home data to update progress on main holiday page
      await refreshHomeData(auth0User, holidayId);
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
              onDelete={handleDeleteTask}
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
              onDelete={handleDeleteTask}
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
            assignedTo: editingTask.assignedTo || '',
            dueDate: editingTask.dueDate
              ? new Date(editingTask.dueDate).toISOString().split('T')[0]
              : '',
          }}
          loading={updateLoading}
          submitText={updateLoading ? 'Updating...' : 'Update Task'}
          cardClassName="card-tasks"
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
