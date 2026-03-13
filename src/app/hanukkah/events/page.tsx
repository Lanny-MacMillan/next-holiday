'use client';

import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useHolidayPageData } from '@/hooks/useHolidayPageData';
import { useHolidayMutations } from '@/hooks/useHolidayMutations';
import { useRefreshHomeData } from '@/hooks/useRefreshHomeData';
import { fetchContacts } from '@/store/slices/addressBookSlice';
import {
  updateTaskInHomeData,
  setHomeData,
  addTaskToHomeData,
  removeTaskFromHomeData,
} from '@/store/slices/homeSlice';
import { selectIsHolidayShared } from '@/store/slices/sharesSlice';

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
  const events =
    holidayData?.tasks?.filter((task: any) => task.category === 'Events') || [];
  const isLoading = !homeInitialized;

  // Sharing status (for conditional form fields)
  const isHolidayShared = useAppSelector((state: any) =>
    selectIsHolidayShared(state, 'hanukkah'),
  );

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
      const result = await createTask({
        title: values.title,
        description: values.description || undefined,
        priority: values.priority as 'low' | 'medium' | 'high',
        assignedTo: values.assignedTo || undefined,
        category: 'Events',
        dueDate: values.dueDate || undefined,
      });

      // Update Redux state immediately
      dispatch(addTaskToHomeData({ holidayId: holidayId, task: result }));

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
      const result = await updateTask(eventId, { isCompleted: !event.isCompleted });

      // Update Redux state
      dispatch(
        updateTaskInHomeData({
          holidayId: holidayId,
          taskId: eventId,
          updates: { isCompleted: !event.isCompleted },
        }),
      );

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
      const result = await updateTask(selectedEvent.id, {
        title: values.title,
        description: values.description || undefined,
        priority: values.priority as 'low' | 'medium' | 'high',
        assignedTo: values.assignedTo || undefined,
        dueDate: values.dueDate || undefined,
      });

      // Update Redux state
      dispatch(
        updateTaskInHomeData({
          holidayId: holidayId,
          taskId: selectedEvent.id,
          updates: result,
        }),
      );

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
      await deleteTask(eventToDelete.id);

      // Remove from Redux state on success
      dispatch(
        removeTaskFromHomeData({
          holidayId: holidayId,
          taskId: eventToDelete.id,
        }),
      );

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

  function cancelDelete() {
    setShowDeleteModal(false);
    setEventToDelete(null);
  }

  // Event data sorting
  const sortedEvents = [...events].sort((a, b) => {
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

  // Contact options for assigned to field
  const contactOptions = contacts.map((contact: any) => ({
    value: contact.id,
    label: contact.name,
  }));

  // Form field configuration
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
    // CONDITIONAL: Only show when isHolidayShared is true
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
        submitText="Add Task"
        submitButtonColor="#3b82f6"
        initialValues={{
          title: '',
          description: '',
          priority: 'medium',
          ...(isHolidayShared ? { assignedTo: '' } : {}),
          dueDate: '',
        }}
      />

      {/* Edit Modal */}
      <FormModal
        isOpen={showFormModal && !!selectedEvent}
        onClose={closeForm}
        title="Edit Event Task"
        fields={formFields}
        onSubmit={handleEditSubmit}
        submitText="Update Task"
        submitButtonColor="#3b82f6"
        initialValues={
          selectedEvent
            ? {
                ...selectedEvent,
                dueDate: selectedEvent.dueDate
                  ? new Date(selectedEvent.dueDate).toISOString().split('T')[0]
                  : '',
              }
            : {}
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
