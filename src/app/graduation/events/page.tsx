'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useHolidayPageData } from '@/hooks/useHolidayPageData';
import { useHolidayMutations } from '@/hooks/useHolidayMutations';
import { useRefreshHomeData } from '@/hooks/useRefreshHomeData';
import { fetchContacts } from '@/store/slices/addressBookSlice';
import { selectIsHolidayShared } from '@/store/slices/sharesSlice';
import SortModal from '@/components/modals/SortModal';
import FormModal from '@/components/modals/FormModal';
import HolidayPageHeader from '@/components/common/HolidayPageHeader';
import AddButton from '@/components/common/AddButton';
import TaskSection from '@/components/common/TaskSection';
import ToDoCard from '@/components/cards/to-do/ToDoCard';

type SortOption = 'priority' | 'dateDue' | 'assignedTo' | 'category' | 'none';

const defaultEventTasks = [
  {
    title: 'Plan graduation ceremony attendance',
    description: 'Confirm ceremony details and seating arrangements',
    priority: 'high' as const,
  },
  {
    title: 'Organize graduation party',
    description: 'Plan celebration event with family and friends',
    priority: 'high' as const,
  },
  {
    title: 'Arrange graduation photos',
    description: 'Schedule professional photo session',
    priority: 'medium' as const,
  },
  {
    title: 'Reserve graduation dinner venue',
    description: 'Book restaurant or venue for celebration dinner',
    priority: 'medium' as const,
  },
  {
    title: 'Coordinate cap and gown pickup',
    description: 'Schedule time to collect graduation attire',
    priority: 'medium' as const,
  },
  {
    title: 'Send graduation announcements',
    description: 'Mail or email graduation announcements to family and friends',
    priority: 'low' as const,
  },
];

export default function GraduationEventsPage() {
  const dispatch = useAppDispatch();
  const { contacts } = useAppSelector((state: any) => state.addressBook);

  // Use new standardized hooks
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

  // Check if the holiday is shared to conditionally show assign to field
  const isHolidayShared = useAppSelector((state: any) =>
    selectIsHolidayShared(state, holidayId!),
  );

  // Filter events from holiday data using Events category
  const events = useMemo(
    () =>
      holidayData?.tasks?.filter((task: any) => task.category === 'Events') || [],
    [holidayData?.tasks],
  );

  const isLoading = !homeInitialized;

  // State management
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDefaultTasks, setShowDefaultTasks] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('none');
  const [showSortModal, setShowSortModal] = useState(false);

  // Check if default event tasks exist
  useEffect(() => {
    if (events.length === 0 && homeInitialized) {
      setShowDefaultTasks(true);
    }
  }, [events, homeInitialized]);

  useEffect(() => {
    // Always fetch contacts for address book functionality
    dispatch(fetchContacts());
  }, [dispatch]);

  // Task sorting function
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

  // CRUD Operations using new hooks
  const handleAddEvent = async (values: any) => {
    if (!values.title?.trim() || !holidayId) return;

    try {
      const result = await createTask({
        title: values.title,
        description: values.description,
        priority: values.priority,
        assignedTo: values.assignedTo,
        category: 'Events',
        dueDate: values.dueDate,
      });

      // Refresh home data to ensure UI is in sync
      await refreshHomeData(auth0User, holidayId);

      setShowForm(false);
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const addDefaultEventTasks = async () => {
    for (const task of defaultEventTasks) {
      await createTask({
        title: task.title,
        description: task.description,
        priority: task.priority,
        category: 'Events',
      });
    }
    setShowDefaultTasks(false);
  };

  const handleToggleCompletion = async (taskId: string) => {
    const currentTask = events.find((task: any) => task.id === taskId);
    if (!currentTask || !holidayId) return;

    const newCompletionStatus = !currentTask.isCompleted;

    try {
      await updateTask(taskId, {
        isCompleted: newCompletionStatus,
      });

      // Refresh home data to ensure UI is in sync
      await refreshHomeData(auth0User, holidayId);
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  const handleEditEvent = (task: any) => {
    setEditingTask(task);
    setShowEditModal(true);
  };

  const handleEditEventSubmit = async (values: any) => {
    if (!editingTask || !holidayId) return;

    try {
      const updates = {
        title: values.title,
        description: values.description,
        priority: values.priority,
        assignedTo: values.assignedTo,
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

  const handleDelete = async (taskId: string) => {
    if (!holidayId) return;

    try {
      await deleteTask(taskId);

      // Refresh home data to ensure UI is in sync
      await refreshHomeData(auth0User, holidayId);
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  // Helper functions
  const openForm = () => setShowForm(true);
  const closeForm = () => setShowForm(false);
  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingTask(null);
  };

  // Loading state from hooks
  const loading = createLoading || updateLoading || deleteLoading;

  const sortedTasks = sortTasks(events);
  const incompleteEvents = sortedTasks.filter((task: any) => !task.isCompleted);
  const completedEvents = sortedTasks.filter((task: any) => task.isCompleted);

  // Form fields configuration
  const formFields = [
    {
      id: 'title',
      type: 'text' as const,
      label: 'Event Title',
      placeholder: 'Enter event title',
      required: true,
    },
    {
      id: 'description',
      type: 'textarea' as const,
      label: 'Description',
      placeholder: 'Event description...',
      rows: 3,
    },
    {
      id: 'priority',
      type: 'select' as const,
      label: 'Priority',
      options: [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' },
      ],
      defaultValue: 'medium',
    },
    ...(isHolidayShared
      ? [
          {
            id: 'assignedTo',
            type: 'text' as const,
            label: 'Assigned To',
            placeholder: 'Assigned To',
          },
        ]
      : []),
    {
      id: 'dueDate',
      type: 'date' as const,
      label: 'Due Date',
      placeholder: 'Due Date',
    },
  ];

  return (
    <div className="min-h-screen graduation-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
      <HolidayPageHeader
        title="Graduation Events"
        backHref="/graduation"
        onSortClick={() => setShowSortModal(true)}
        description="Plan your Graduation celebrations!"
        holidayColor="purple-500"
        error={undefined}
        sortTitle="Sort Events"
      />

      <main className="w-full max-w-4xl flex flex-col gap-6">
        <AddButton title="Event" onClick={openForm} color="purple" />

        {/* Default tasks suggestion */}
        {showDefaultTasks && (
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-purple-800 dark:text-purple-200 mb-2">
              🎓 Get Started with Common Graduation Events
            </h3>
            <p className="text-purple-600 dark:text-purple-300 mb-3">
              Would you like to add some common graduation events to get started?
            </p>
            <div className="flex gap-2">
              <button
                onClick={addDefaultEventTasks}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Add Common Events
              </button>
              <button
                onClick={() => setShowDefaultTasks(false)}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500"
              >
                Skip
              </button>
            </div>
          </div>
        )}

        {/* Task List */}
        <div className="space-y-6">
          <TaskSection
            title="Upcoming Events"
            items={incompleteEvents}
            isCompleted={false}
            emptyMessage="No upcoming events."
            completedMessage="All events completed!"
            renderItem={(task: any) => (
              <ToDoCard
                key={task.id}
                task={task}
                onToggleComplete={handleToggleCompletion}
                onEdit={handleEditEvent}
                onDelete={handleDelete}
              />
            )}
          />

          <TaskSection
            title="Completed Events"
            items={completedEvents}
            isCompleted={true}
            emptyMessage="No completed events yet."
            completedMessage="No completed events to display."
            renderItem={(task: any) => (
              <ToDoCard
                key={task.id}
                task={task}
                onToggleComplete={handleToggleCompletion}
                onEdit={handleEditEvent}
                onDelete={handleDelete}
              />
            )}
          />
        </div>
      </main>

      {/* Form Modal */}
      <FormModal
        isOpen={showForm}
        title="Add New Event"
        fields={formFields}
        onSubmit={handleAddEvent}
        onClose={closeForm}
        loading={loading}
        submitText="Add Event"
        cardClassName="card-events-graduation"
      />

      {/* Edit Modal */}
      <FormModal
        isOpen={showEditModal}
        title="Edit Event"
        fields={formFields}
        initialValues={
          editingTask
            ? {
                title: editingTask.title || '',
                description: editingTask.description || '',
                priority: editingTask.priority || 'medium',
                ...(isHolidayShared
                  ? { assignedTo: editingTask.assignedTo || '' }
                  : {}),
                dueDate: editingTask.dueDate
                  ? new Date(editingTask.dueDate).toISOString().split('T')[0]
                  : '',
              }
            : {}
        }
        onSubmit={handleEditEventSubmit}
        onClose={closeEditModal}
        loading={loading}
        submitText="Update Event"
        cardClassName="card-events-graduation"
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
