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
  setHomeData,
  addTaskToHomeData,
  removeTaskFromHomeData,
  updateTaskInHomeData,
} from '@/store/slices/homeSlice';
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

  const { refreshHomeData } = useRefreshHomeData();

  const isHolidayShared = useAppSelector((state: any) =>
    selectIsHolidayShared(state, 'valentines'),
  );
  const isAuthorizedForSharing = hasSubscription && isUserPlusMember;

  // Get share members for Enhanced Compatibility Layer
  const shareData = useAppSelector((state: RootState) =>
    selectShareByHolidayKey(state, 'valentines'),
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
            uuid: member.uuid || member.userId, // Ensure uuid field exists - prefer existing uuid over userId
          })),
      ]
    : baseMembers;

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

  const reservations = useMemo(
    () =>
      (
        holidayData?.tasks?.filter(
          (task: any) => task.category === 'Reservations',
        ) || []
      ).map(transformTaskWithAssignment),
    [holidayData?.tasks, shareMembers],
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<any>(null);

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

  // CRUD Operations - Add Reservation with Enhanced Compatibility Layer
  const handleAddReservation = async (values: any) => {
    if (!values.title?.trim() || !holidayId || !auth0User) return;

    try {
      const newTask = {
        title: values.title,
        description: values.description || undefined,
        priority: values.priority as 'low' | 'medium' | 'high',
        ...(isAuthorizedForSharing &&
          isHolidayShared && { assigned_to: values.assigned_to || undefined }),
        category: 'Reservations',
        due_date: values.dueDate || undefined,
      };

      const result = await createTask(newTask);

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
    if (!editingTask || !holidayId || !auth0User) return;

    try {
      const updates = {
        title: values.title,
        description: values.description || undefined,
        priority: values.priority as 'low' | 'medium' | 'high',
        ...(isAuthorizedForSharing &&
          isHolidayShared && { assigned_to: values.assigned_to || undefined }),
        category: 'Reservations',
        due_date: values.dueDate || undefined,
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

  const handleDeleteReservation = (taskId: string) => {
    const task = reservations.find((t: any) => t.id === taskId);
    if (task) {
      setTaskToDelete(task);
      setShowDeleteModal(true);
    }
  };

  const confirmDelete = async () => {
    if (!taskToDelete || !holidayId) return;

    try {
      await deleteTask(taskToDelete.id);

      // Update Redux state immediately
      dispatch(
        removeTaskFromHomeData({
          holidayId,
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
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setTaskToDelete(null);
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

  // Form fields configuration using Enhanced Compatibility Layer
  const formFields = getFormConfigEnhanced('tasks', 'add', {
    holidayKey: 'valentines',
    shareMembers: shareMembers,
    auth0User: auth0User,
  }).fields;

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
        shareMembers={shareMembers}
        initialValues={{
          title: '',
          description: '',
          priority: 'medium',
          ...(shareMembers.length > 0 ? { assigned_to: '' } : {}),
          dueDate: '',
        }}
        onSubmit={handleAddReservation}
        onClose={closeForm}
        loading={createLoading}
        submitText={createLoading ? 'Adding...' : 'Add Reservation'}
        cardClassName="card-events-valentines"
      />

      {/* Edit Modal */}
      <FormModal
        isOpen={showEditModal}
        title="Edit Reservation"
        fields={formFields}
        shareMembers={shareMembers}
        initialValues={
          editingTask
            ? {
                title: editingTask.title || '',
                description: editingTask.description || '',
                priority: editingTask.priority || 'medium',
                ...(shareMembers.length > 0
                  ? { assigned_to: editingTask.assignedTo || '' }
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
        submitText={updateLoading ? 'Updating...' : 'Update Reservation'}
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

      {/* Delete Modal */}
      <DeleteModal
        isOpen={showDeleteModal}
        onCancel={cancelDelete}
        onConfirm={confirmDelete}
        title="Delete Reservation"
        message={`Are you sure you want to delete "${taskToDelete?.title}"? This action cannot be undone.`}
        loading={deleteLoading}
      />
    </div>
  );
}
