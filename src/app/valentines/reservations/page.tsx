'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useHolidayPageData } from '@/hooks/useHolidayPageData';
import { useHolidayMutations } from '@/hooks/useHolidayMutations';
import { useRefreshHomeData } from '@/hooks/useRefreshHomeData';
import { fetchContacts } from '@/store/slices/addressBookSlice';
import {
  setHomeData,
  addTaskToHomeData,
  removeTaskFromHomeData,
  updateTaskInHomeData,
} from '@/store/slices/homeSlice';
import { selectIsHolidayShared } from '@/store/slices/sharesSlice';
import SortModal from '@/components/modals/SortModal';
import FormModal from '@/components/modals/FormModal';
import HolidayPageHeader from '@/components/common/HolidayPageHeader';
import AddButton from '@/components/common/AddButton';
import TaskSection from '@/components/common/TaskSection';
import ToDoCard from '@/components/cards/to-do/ToDoCard';

type SortOption = 'priority' | 'dateDue' | 'assignedTo' | 'category' | 'none';

const defaultReservationTasks = [
  {
    title: "Valentine's Restaurant Reservation",
    description: "Book a romantic dinner for Valentine's Day",
    priority: 'high' as const,
  },
  {
    title: "Spa Couple's Massage Appointment",
    description: "Reserve relaxing couple's spa treatment",
    priority: 'high' as const,
  },
  {
    title: 'Theater or Concert Tickets',
    description: "Reserve entertainment for Valentine's evening",
    priority: 'medium' as const,
  },
  {
    title: 'Hotel or B&B Weekend Getaway',
    description: 'Book romantic weekend escape',
    priority: 'medium' as const,
  },
  {
    title: 'Flower Delivery Service',
    description: "Schedule Valentine's flower arrangement delivery",
    priority: 'medium' as const,
  },
  {
    title: 'Wine Tasting Experience',
    description: 'Reserve romantic wine tasting session',
    priority: 'high' as const,
  },
  {
    title: 'Photography Session',
    description: "Book couple's photo shoot appointment",
    priority: 'medium' as const,
  },
  {
    title: 'Cooking Class for Two',
    description: 'Reserve romantic cooking class experience',
    priority: 'high' as const,
  },
  {
    title: 'Chocolate Making Workshop',
    description: "Book Valentine's chocolate-making session",
    priority: 'low' as const,
  },
  {
    title: 'Private Dinner Chef Service',
    description: 'Reserve in-home chef for romantic dinner',
    priority: 'low' as const,
  },
];

export default function ValentinesReservationsPage() {
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
    selectIsHolidayShared(state, 'valentines'),
  );

  const reservations = useMemo(
    () =>
      holidayData?.tasks?.filter((task: any) => task.category === 'Reservations') ||
      [],
    [holidayData?.tasks],
  );
  const isLoading = !homeInitialized;
  const error = null;

  // State management
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDefaultTasks, setShowDefaultTasks] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('none');
  const [showSortModal, setShowSortModal] = useState(false);

  useEffect(() => {
    // Always fetch contacts for address book functionality
    dispatch(fetchContacts());
  }, [dispatch]);

  // Check if default reservation tasks exist
  useEffect(() => {
    if (reservations.length === 0 && homeInitialized) {
      setShowDefaultTasks(true);
    }
  }, [reservations, homeInitialized]);

  // CRUD Operations - Add Reservation with optimistic updates + refreshHomeData + API field mapping
  const handleAddReservation = async (values: any) => {
    if (!values.title?.trim() || !holidayId) return;

    try {
      const result = await createTask({
        title: values.title,
        description: values.description,
        priority: values.priority,
        assignedTo: values.assignedTo,
        category: 'Reservations',
        dueDate: values.dueDate,
      });

      // Update Redux state immediately
      dispatch(addTaskToHomeData({ holidayId, task: result }));

      // Refresh home data to ensure UI is in sync
      await refreshHomeData(auth0User, holidayId);

      setShowForm(false);
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const addDefaultReservationTasks = async () => {
    for (const task of defaultReservationTasks) {
      await createTask({
        title: task.title,
        description: task.description,
        priority: task.priority,
        category: 'Reservations',
      });
    }
    setShowDefaultTasks(false);
  };

  const handleToggleCompletion = async (taskId: string) => {
    const currentTask = reservations.find((task: any) => task.id === taskId);
    if (!currentTask || !holidayId) return;

    const newCompletionStatus = !currentTask.isCompleted;

    try {
      // Update API
      await updateTask(taskId, {
        isCompleted: newCompletionStatus,
      });

      // Update Redux state immediately
      dispatch(
        updateTaskInHomeData({
          holidayId,
          taskId,
          updates: {
            ...currentTask,
            isCompleted: newCompletionStatus,
          },
        }),
      );
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  const handleEditReservation = (task: any) => {
    setEditingTask(task);
    setShowEditModal(true);
  };

  const handleEditReservationSubmit = async (values: any) => {
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

      // Update Redux state immediately
      dispatch(
        updateTaskInHomeData({
          holidayId,
          taskId: editingTask.id,
          updates,
        }),
      );

      // Refresh home data to ensure UI is in sync
      await refreshHomeData(auth0User, holidayId);

      setEditingTask(null);
      setShowEditModal(false);
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleDeleteReservation = async (taskId: string) => {
    if (!holidayId) return;

    try {
      await deleteTask(taskId);

      // Update Redux state immediately
      dispatch(
        removeTaskFromHomeData({
          holidayId,
          taskId,
        }),
      );

      // Refresh home data to ensure UI is in sync
      await refreshHomeData(auth0User, holidayId);
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

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
      <div className="min-h-screen valentines-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading reservations...</p>
        </div>
      </div>
    );
  }

  const sortedTasks = sortTasks(reservations);
  const incompleteReservations = sortedTasks.filter(
    (task: any) => !task.isCompleted,
  );
  const completedReservations = sortedTasks.filter((task: any) => task.isCompleted);

  // FormModal fields configuration - matching Kwanzaa pattern exactly
  const formFields = [
    {
      id: 'title',
      type: 'text' as const,
      placeholder: 'Reservation Goal*',
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
      placeholder: 'Target Date',
    },
  ];

  return (
    <div className="min-h-screen valentines-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
      <HolidayPageHeader
        title="Valentine's Reservations"
        backHref="/valentines"
        onSortClick={() => setShowSortModal(true)}
        description="Plan your romantic reservations!"
        holidayColor="pink-500"
        sortTitle="Sort Reservations"
      />

      <main className="flex-1 w-full max-w-4xl flex flex-col gap-6 mt-4">
        {/* Default Tasks Prompt */}
        {showDefaultTasks && (
          <div className="card card-tasks rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700">
            <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
              💖 Set Up Valentine's Reservations
            </h3>
            <p className="text-blue-700 dark:text-blue-300 text-sm mb-3">
              Would you like to add some common Valentine's reservation planning
              tasks?
            </p>
            <div className="flex gap-2">
              <button
                onClick={addDefaultReservationTasks}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors text-sm"
                disabled={loading}
              >
                Add Default Reservations
              </button>
              <button
                onClick={() => setShowDefaultTasks(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors text-sm"
              >
                Skip
              </button>
            </div>
          </div>
        )}

        <AddButton title="Reservation" onClick={openForm} color="pink" />

        {/* Reservation Status Summary */}
        {reservations.length > 0 && (
          <div className="card rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
              Reservation Status
            </h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {reservations.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Total Reservations
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {completedReservations.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Confirmed
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {incompleteReservations.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Pending
                </div>
              </div>
            </div>
          </div>
        )}

        <TaskSection
          title="Pending Reservations"
          items={incompleteReservations}
          isCompleted={false}
          emptyMessage="No reservations set yet."
          completedMessage="All reservations confirmed!"
          renderItem={(task: any) => (
            <ToDoCard
              key={task.id}
              task={task}
              onToggleComplete={handleToggleCompletion}
              onDelete={handleDeleteReservation}
              onEdit={handleEditReservation}
              theme={{
                accentColor: '#ec4899', // Pink for Valentine's
              }}
              borderColor="rgb(236 72 153)" // Pink border for Valentine's
              disableInternalModal={true}
            />
          )}
        />

        <TaskSection
          title="Confirmed Reservations"
          items={completedReservations}
          isCompleted={true}
          emptyMessage=""
          completedMessage=""
          renderItem={(task: any) => (
            <ToDoCard
              key={task.id}
              task={task}
              onToggleComplete={handleToggleCompletion}
              onDelete={handleDeleteReservation}
              onEdit={handleEditReservation}
              className="opacity-60"
              theme={{
                accentColor: '#ec4899', // Pink for Valentine's
              }}
              borderColor="rgb(236 72 153)" // Pink border for Valentine's
              disableInternalModal={true}
            />
          )}
        />
      </main>

      {/* Form Modal */}
      <FormModal
        isOpen={showForm}
        title="Add New Reservation"
        fields={formFields}
        initialValues={{
          title: '',
          description: '',
          priority: 'medium',
          ...(isHolidayShared ? { assignedTo: '' } : {}),
          dueDate: '',
        }}
        onSubmit={handleAddReservation}
        onClose={closeForm}
        loading={createLoading}
        submitText="Add Reservation"
        cardClassName="card-events-valentines"
      />

      {/* Edit Modal */}
      <FormModal
        isOpen={showEditModal}
        title="Edit Reservation"
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
        onSubmit={handleEditReservationSubmit}
        onClose={closeEditModal}
        loading={updateLoading}
        submitText="Update Reservation"
        cardClassName="card-events-valentines"
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
        title="Sort Reservations"
      />
    </div>
  );
}
