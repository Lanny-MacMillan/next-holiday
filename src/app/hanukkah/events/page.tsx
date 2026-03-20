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

import HolidayPageHeader from '@/components/common/HolidayPageHeader';
import TaskSection from '@/components/common/TaskSection';
import ToDoCard from '@/components/cards/to-do/ToDoCard';
import FormModal from '@/components/modals/FormModal';
import DeleteModal from '@/components/modals/DeleteModal';
import SortModal from '@/components/modals/SortModal';
import AddButton from '@/components/common/AddButton';

export default function HanukkahEventsPage() {
  const dispatch = useAppDispatch();
  const { contacts } = useAppSelector((state: any) => state.addressBook);
  const { isUserPlusMember, hasSubscription } = useSubscription();

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

  // Redux data access - events are stored as tasks with category "Events" like in Kwanzaa
  const events = useMemo(
    () =>
      holidayData?.tasks?.filter((task: any) => task.category === 'Events') || [],
    [holidayData?.tasks],
  );
  const isLoading = !homeInitialized;

  // Sharing status (for conditional form fields)
  const isHolidayShared = useAppSelector((state: any) =>
    selectIsHolidayShared(state, 'hanukkah'),
  );
  const isAuthorizedForSharing = hasSubscription && isUserPlusMember;

  // Get share members for Enhanced Compatibility Layer
  const shareData = useAppSelector((state: RootState) =>
    selectShareByHolidayKey(state, 'hanukkah'),
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

  // State management
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<any>(null);
  const [showSortModal, setShowSortModal] = useState(false);
  const [sortBy, setSortBy] = useState<string>('datetime');

  useEffect(() => {
    // Always fetch contacts for address book functionality
    dispatch(fetchContacts());
  }, [dispatch]);

  // Check if default event tasks exist
  useEffect(() => {
    if (events.length === 0 && homeInitialized) {
      // Could add default tasks here if needed
    }
  }, [events, homeInitialized]);

  // CRUD Operations Pattern (using standardized hooks)
  async function handleAddEvent(values: Record<string, any>) {
    if (!values.title?.trim()) return;
    if (!holidayId || !auth0User) return;

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

      setShowFormModal(false);
    } catch (error) {
      console.error('Error creating event:', error);
    }
  }

  async function handleToggleCompletion(eventId: string) {
    if (!holidayId || !auth0User) return;

    const event = events.find((e: any) => e.id === eventId);
    if (!event) return;

    try {
      // Use the standardized hook function
      await updateTask(eventId, { isCompleted: !event.isCompleted });

      // Refresh home data to update progress on main holiday page
      await refreshHomeData(auth0User, holidayId);
    } catch (error) {
      console.error('Error toggling event:', error);
    }
  }

  function handleEditEvent(event: any) {
    setSelectedEvent(event);
    setShowFormModal(true);
  }

  async function handleEditSubmit(values: Record<string, any>) {
    if (!selectedEvent || !holidayId || !auth0User) return;

    try {
      const updatedTask = {
        title: values.title,
        description: values.description || undefined,
        priority: values.priority as 'low' | 'medium' | 'high',
        ...(isAuthorizedForSharing &&
          isHolidayShared && { assigned_to: values.assignedTo || undefined }),
        dueDate: values.dueDate || undefined,
      };

      // Use the standardized hook function
      await updateTask(selectedEvent.id, updatedTask);

      // Refresh home data to ensure UI is in sync
      await refreshHomeData(auth0User, holidayId);

      setShowFormModal(false);
      setSelectedEvent(null);
    } catch (error) {
      console.error('Error updating event:', error);
    }
  }

  function handleDelete(taskId: string, taskTitle: string) {
    const task = events.find((e: any) => e.id === taskId);
    if (task) {
      setEventToDelete(task);
      setShowDeleteModal(true);
    }
  }

  async function confirmDelete() {
    if (!eventToDelete || !holidayId || !auth0User) return;

    try {
      // Use the standardized hook function
      await deleteTask(eventToDelete.id);

      // Refresh home data to ensure UI is in sync
      await refreshHomeData(auth0User, holidayId);

      setShowDeleteModal(false);
      setEventToDelete(null);
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  }

  function openForm() {
    setShowFormModal(true);
    setSelectedEvent(null);
  }

  function closeForm() {
    setShowFormModal(false);
    setSelectedEvent(null);
  }

  // Helper function to resolve assignedTo name for display
  const getAssignedUserName = (assignedToUuid: string): string | null => {
    if (!assignedToUuid || !shareMembers.length) return null;

    const member = shareMembers.find((m: any) => m.userId === assignedToUuid);
    return member ? member.name || member.email || 'Unknown User' : assignedToUuid;
  };

  // Transform tasks to include assignedToName for display
  const transformTaskWithAssignment = (task: any) => ({
    ...task,
    assignedToName: task.assignedTo ? getAssignedUserName(task.assignedTo) : null,
  });

  function cancelDelete() {
    setShowDeleteModal(false);
    setEventToDelete(null);
  }

  // Event data sorting with name transformation
  const sortedEvents = [...events.map(transformTaskWithAssignment)].sort((a, b) => {
    switch (sortBy) {
      case 'title':
        return a.title.localeCompare(b.title);
      case 'completed':
        return a.isCompleted === b.isCompleted ? 0 : a.isCompleted ? 1 : -1;
      case 'datetime':
        return (
          new Date(a.datetime || 0).getTime() - new Date(b.datetime || 0).getTime()
        );
      default:
        return 0;
    }
  });

  const incompleteEvents = sortedEvents.filter((event: any) => !event.isCompleted);
  const completedEvents = sortedEvents.filter((event: any) => event.isCompleted);

  // Form fields configuration using Enhanced Compatibility Layer
  const formFields = getFormConfigEnhanced('tasks', 'add', {
    holidayKey: 'hanukkah',
    shareMembers: shareMembers,
    auth0User: auth0User,
  }).fields;

  const loading = createLoading || updateLoading || deleteLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen hanukkah-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen hanukkah-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
      <HolidayPageHeader
        title="Hanukkah Events"
        backHref="/hanukkah"
        description="Plan your Hanukkah celebrations!"
      />

      <div className="w-full max-w-4xl mt-8">
        {/* Event Status */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl p-6 mb-6 shadow-lg border border-blue-200/30">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {events.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Total Events
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {completedEvents.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Completed
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {incompleteEvents.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Upcoming
              </div>
            </div>
          </div>
        </div>

        {/* Add Button - positioned above tasks like other implementations */}
        <div className="w-full">
          <div className="w-full">
            <AddButton title="Event" onClick={openForm} color="blue" />
          </div>
        </div>

        {/* Upcoming Events */}
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
              onDelete={(taskId: string) => handleDelete(taskId, task.title)}
              onEdit={handleEditEvent}
              theme={{
                accentColor: '#3b82f6', // Blue for Hanukkah
              }}
              borderColor="rgb(59 130 246)" // Blue border for Hanukkah
              disableInternalModal={true}
            />
          )}
        />

        {/* Completed Events */}
        {completedEvents.length > 0 && (
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
                onToggleComplete={handleToggleCompletion}
                onDelete={(taskId: string) => handleDelete(taskId, task.title)}
                onEdit={handleEditEvent}
                className="opacity-60"
                theme={{
                  accentColor: '#3b82f6', // Blue for Hanukkah
                }}
                borderColor="rgb(59 130 246)" // Blue border for Hanukkah
                disableInternalModal={true}
              />
            )}
          />
        )}
      </div>

      {/* Add Modal */}
      <FormModal
        isOpen={showFormModal && !selectedEvent}
        onClose={closeForm}
        title="Add New Event Task"
        fields={formFields}
        onSubmit={handleAddEvent}
        loading={loading}
        submitText={loading ? 'Adding...' : 'Add Task'}
        submitButtonColor="#3b82f6"
        shareMembers={shareMembers}
        initialValues={{
          title: '',
          description: '',
          priority: 'medium',
          assignedTo: '',
          dueDate: '',
        }}
      />

      {/* Edit Modal */}
      <FormModal
        isOpen={showFormModal && !!selectedEvent}
        onClose={closeForm}
        title="Edit Event Task"
        fields={
          getFormConfigEnhanced('tasks', 'edit', {
            holidayKey: 'hanukkah',
            shareMembers: shareMembers,
            auth0User: auth0User,
          }).fields
        }
        onSubmit={handleEditSubmit}
        loading={loading}
        submitText={loading ? 'Updating...' : 'Update Task'}
        submitButtonColor="#3b82f6"
        shareMembers={shareMembers}
        initialValues={
          selectedEvent
            ? {
                title: selectedEvent.title || '',
                description: selectedEvent.description || '',
                priority: selectedEvent.priority || 'medium',
                assignedTo: selectedEvent.assignedTo || '',
                dueDate: selectedEvent.dueDate
                  ? new Date(selectedEvent.dueDate).toISOString().split('T')[0]
                  : '',
              }
            : undefined
        }
      />

      {/* Delete Modal */}
      <DeleteModal
        isOpen={showDeleteModal}
        onCancel={cancelDelete}
        onConfirm={confirmDelete}
        title="Delete Event"
        message={`Are you sure you want to delete "${eventToDelete?.title}"?`}
        loading={deleteLoading}
      />

      {/* Sort Modal */}
      <SortModal
        isOpen={showSortModal}
        onClose={() => setShowSortModal(false)}
        sortOptions={[
          { value: 'datetime', label: 'Date & Time' },
          { value: 'title', label: 'Title A-Z' },
          { value: 'completed', label: 'Completion Status' },
        ]}
        sortBy={sortBy}
        onSortChange={(sortOption: string) => setSortBy(sortOption)}
        title="Sort Events"
      />
    </div>
  );
}
