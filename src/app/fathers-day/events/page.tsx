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

export default function FathersDayEventsPage() {
  const dispatch = useAppDispatch();
  const { contacts } = useAppSelector((state: any) => state.addressBook);

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

  const isHolidayShared = useAppSelector((state: any) =>
    selectIsHolidayShared(state, 'fathers-day'),
  );

  const events = useMemo(
    () =>
      holidayData?.tasks?.filter((task: any) => task.category === 'Events') || [],
    [holidayData?.tasks],
  );
  const isLoading = !homeInitialized;
  const error = null;

  // State management
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('none');
  const [showSortModal, setShowSortModal] = useState(false);

  useEffect(() => {
    // Always fetch contacts for address book functionality
    dispatch(fetchContacts());
  }, [dispatch]);

  // CRUD Operations
  async function handleAddTask(values: Record<string, any>) {
    if (!values.title?.trim()) return;
    if (!holidayId) return;

    try {
      const payload = {
        title: values.title,
        description: values.description || undefined,
        priority: values.priority as 'low' | 'medium' | 'high',
        assignedTo: values.assignedTo || undefined,
        category: 'Events',
        dueDate: values.dueDate || undefined,
        isCompleted: false,
      };

      await createTask(payload);
      await refreshHomeData(auth0User, holidayId);
      setShowForm(false);
    } catch (error) {
      console.error('Failed to add task:', error);
    }
  }

  async function handleToggleCompletion(taskId: string) {
    if (!holidayId) return;

    try {
      const currentTask = events.find((task: any) => task.id === taskId);
      if (!currentTask) return;

      const newCompletionStatus = !currentTask.isCompleted;
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

  async function handleEditSubmit(values: Record<string, any>) {
    if (!editingTask || !holidayId) return;

    try {
      const updatedTask = {
        title: values.title,
        description: values.description || undefined,
        priority: values.priority as 'low' | 'medium' | 'high',
        assignedTo: values.assignedTo || undefined,
        category: 'Events',
        dueDate: values.dueDate || undefined,
      };

      await updateTask(editingTask.id, updatedTask);
      await refreshHomeData(auth0User, holidayId);
      setEditingTask(null);
      setShowEditModal(false);
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  }

  async function handleDelete(taskId: string, taskTitle: string) {
    if (!holidayId) return;

    try {
      await deleteTask(taskId);
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

  if (isLoading) {
    return (
      <div className="min-h-screen fathers-day-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading events...</p>
        </div>
      </div>
    );
  }

  const sortedTasks = sortTasks(events);
  const incompleteEvents = sortedTasks.filter((task: any) => !task.isCompleted);
  const completedEvents = sortedTasks.filter((task: any) => task.isCompleted);

  // FormModal fields configuration - matching Kwanzaa events exactly
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

  // Sort options configuration
  const sortOptions = [
    { value: 'none', label: 'Default Order' },
    { value: 'priority', label: 'Priority' },
    { value: 'dateDue', label: 'Due Date' },
    ...(isHolidayShared ? [{ value: 'assignedTo', label: 'Assigned To' }] : []),
    { value: 'category', label: 'Category' },
  ];

  const handleSortChange = (newSortBy: string) => {
    setSortBy(newSortBy as SortOption);
    setShowSortModal(false);
  };

  return (
    <div className="min-h-screen fathers-day-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
      <HolidayPageHeader
        title="Father's Day Events"
        backHref="/fathers-day"
        onSortClick={() => setShowSortModal(true)}
        sortTitle="Sort Events"
        description="Keep track of your Father's Day events!"
        holidayColor="blue-500"
        error={error}
      />

      <main className="flex-1 w-full max-w-4xl flex flex-col gap-6 mt-4">
        <AddButton title="Event" onClick={openForm} color="blue" />

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
                accentColor: '#3b82f6', // Blue for Father's Day
              }}
              borderColor="rgb(59 130 246)" // Blue border for Father's Day
              disableInternalModal={true}
            />
          )}
        />

        <TaskSection
          title="Completed Events"
          items={completedEvents}
          isCompleted={true}
          emptyMessage="No completed events yet."
          completedMessage="No completed events yet."
          renderItem={(task: any) => (
            <ToDoCard
              key={task.id}
              task={task}
              onToggleComplete={handleToggleCompletion}
              onDelete={(taskId: string) => handleDelete(taskId, task.title)}
              onEdit={handleEditEvent}
              theme={{
                accentColor: '#3b82f6', // Blue for Father's Day
              }}
              borderColor="rgb(59 130 246)" // Blue border for Father's Day
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
        onSortChange={handleSortChange}
        sortOptions={sortOptions}
        title="Sort Events"
      />

      {/* Form Modal */}
      <FormModal
        isOpen={showForm}
        title="Add New Event"
        fields={formFields}
        initialValues={{ priority: 'medium' }}
        onSubmit={handleAddTask}
        onClose={closeForm}
        loading={loading}
        submitText="Add Event"
        cardClassName="card-events-fathers-day"
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
        onSubmit={handleEditSubmit}
        onClose={closeEditModal}
        loading={loading}
        submitText="Update Event"
        cardClassName="card-events-fathers-day"
      />
    </div>
  );
}
