'use client';

import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useFormModalMutation } from '@/hooks/useFormModalMutation';
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
  const { holidayId, auth0User } = useFormModalMutation();

  // Get Redux data
  const holidayPreferences = useAppSelector(selectHolidayPreferences);
  const homeInitialized = useAppSelector(selectHomeInitialized);
  const homeData = useAppSelector(selectHomeData);

  // Check if the holiday is shared to conditionally show assign to field
  const isHolidayShared = useAppSelector((state: any) =>
    selectIsHolidayShared(state, 'valentines'),
  );

  // Redux data access - reservations are stored as tasks with category "Reservations"
  const holidayData = useAppSelector(state =>
    selectHolidayPrefById(state, holidayId!),
  );

  // Get share members for Enhanced Compatibility Layer
  const shareData = useAppSelector(state =>
    selectShareByHolidayKey(state, 'valentines'),
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

  const reservations =
    holidayData?.tasks?.filter((task: any) => task.category === 'Reservations') ||
    [];
  const isLoading = !homeInitialized;
  const error = null;

  // Refresh home data function (like Kwanzaa)
  const refreshHomeData = async () => {
    if (!auth0User?.sub || !holidayId) return;

    try {
      const response = await fetch('/api/home', {
        headers: {
          'Content-Type': 'application/json',
          'x-test-user': JSON.stringify({
            sub: auth0User.sub,
            email: auth0User.email,
            name: auth0User.name,
            picture: auth0User.picture,
          }),
        },
      });
      if (response.ok) {
        const result = await response.json();
        dispatch(setHomeData(result.data));
      }
    } catch (error) {
      console.error('Error refreshing home data:', error);
    }
  };

  // State management
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDefaultTasks, setShowDefaultTasks] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('none');
  const [showSortModal, setShowSortModal] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  // CRUD Operations
  async function handleAddReservation(values: Record<string, any>) {
    if (!values.title?.trim()) return;
    if (!holidayId || !auth0User) return;

    setIsAdding(true);

    const newTask = {
      id: `temp-${Date.now()}`, // Temporary ID for optimistic update
      title: values.title,
      description: values.description || undefined,
      priority: values.priority as 'low' | 'medium' | 'high',
      assignedTo: values.assigned_to || undefined,
      category: 'Reservations',
      dueDate: values.dueDate || undefined,
      isCompleted: false,
      holidayId: holidayId,
    };

    try {
      // Optimistically update Redux state first (like Kwanzaa)
      dispatch(addTaskToHomeData({ holidayId: holidayId, task: newTask }));

      // Call API - map camelCase to snake_case for API
      const apiPayload = {
        title: values.title,
        description: values.description || undefined,
        priority: values.priority as 'low' | 'medium' | 'high',
        assigned_to: values.assigned_to || undefined, // snake_case for API
        category: 'Reservations',
        due_date: values.dueDate || undefined, // snake_case for API
        isCompleted: false,
      };

      const response = await fetch(`/api/holidays/${holidayId}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-test-user': JSON.stringify({
            sub: auth0User.sub,
            email: auth0User.email,
            name: auth0User.name,
            picture: auth0User.picture,
          }),
        },
        body: JSON.stringify(apiPayload),
      });

      if (response.ok) {
        // Replace temporary task with real task from API (like Kwanzaa)
        const result = await response.json();
        dispatch(
          removeTaskFromHomeData({
            holidayId: holidayId,
            taskId: newTask.id,
          }),
        );
        dispatch(addTaskToHomeData({ holidayId: holidayId, task: result }));

        // Also refresh home data like Kwanzaa does
        await refreshHomeData();
      } else {
        // Remove optimistic update on error
        dispatch(
          removeTaskFromHomeData({
            holidayId: holidayId,
            taskId: newTask.id,
          }),
        );
        console.error(
          'Failed to add reservation:',
          response.status,
          response.statusText,
        );
      }

      setShowForm(false);
    } catch (error) {
      // Remove optimistic update on error (like Kwanzaa)
      dispatch(removeTaskFromHomeData({ holidayId: holidayId, taskId: newTask.id }));
      console.error('Failed to add reservation:', error);
    } finally {
      setIsAdding(false);
    }
  }

  async function addDefaultReservationTasks() {
    if (!holidayId || !auth0User) return;

    setIsAdding(true);
    try {
      // Add default reservation tasks one by one with refresh between each
      for (const task of defaultReservationTasks) {
        const newTask = {
          id: `temp-${Date.now()}-${task.title}`, // Temporary ID
          ...task,
          category: 'Reservations',
          isCompleted: false,
          holidayId: holidayId,
        };

        // Optimistically update Redux state first
        dispatch(addTaskToHomeData({ holidayId: holidayId, task: newTask }));

        try {
          const response = await fetch(`/api/holidays/${holidayId}/tasks`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-test-user': JSON.stringify({
                sub: auth0User.sub,
                email: auth0User.email,
                name: auth0User.name,
                picture: auth0User.picture,
              }),
            },
            body: JSON.stringify({
              ...task,
              category: 'Reservations',
              isCompleted: false,
              holidayId: holidayId,
            }),
          });

          if (response.ok) {
            // Replace temporary task with real task from API
            const result = await response.json();
            dispatch(
              removeTaskFromHomeData({
                holidayId: holidayId,
                taskId: newTask.id,
              }),
            );
            dispatch(addTaskToHomeData({ holidayId: holidayId, task: result }));

            // CRITICAL: Refresh home data after each task addition
            await refreshHomeData();
          } else {
            // Remove optimistic update on error
            dispatch(
              removeTaskFromHomeData({
                holidayId: holidayId,
                taskId: newTask.id,
              }),
            );
            console.error(
              'Failed to add default reservation:',
              response.status,
              response.statusText,
            );
          }
        } catch (taskError) {
          // Remove optimistic update on error
          dispatch(
            removeTaskFromHomeData({
              holidayId: holidayId,
              taskId: newTask.id,
            }),
          );
          console.error('Failed to add default reservation:', taskError);
        }
      }

      setShowDefaultTasks(false);
    } catch (error) {
      console.error('Failed to add default reservations:', error);
    } finally {
      setIsAdding(false);
    }
  }

  async function handleToggleCompletion(taskId: string) {
    if (!holidayId || !auth0User) return;

    setIsToggling(true);
    try {
      // Find the current task to get its completion status
      const currentTask = reservations.find((task: any) => task.id === taskId);
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

      // Call API directly instead of using custom hook
      const apiUrl = `/api/holidays/${holidayId}/tasks/${taskId}`;
      const response = await fetch(apiUrl, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-test-user': JSON.stringify({
            sub: auth0User.sub,
            email: auth0User.email,
            name: auth0User.name,
            picture: auth0User.picture,
          }),
        },
        body: JSON.stringify({
          isCompleted: newCompletionStatus,
        }),
      });

      if (!response.ok) {
        // Revert the optimistic update on error
        const currentTask = reservations.find((task: any) => task.id === taskId);
        if (currentTask) {
          dispatch(
            updateTaskInHomeData({
              holidayId: holidayId,
              taskId: taskId,
              updates: { isCompleted: currentTask.isCompleted },
            }),
          );
        }
        console.error(
          'Failed to toggle reservation:',
          response.status,
          response.statusText,
        );
      }
    } catch (error) {
      console.error('Failed to toggle reservation:', error);
    } finally {
      setIsToggling(false);
    }
  }

  const handleEditReservation = (task: any) => {
    setEditingTask(task);
    setShowEditModal(true);
  };

  async function handleEditReservationSubmit(values: Record<string, any>) {
    if (!editingTask || !holidayId || !auth0User) return;

    setIsUpdating(true);
    try {
      const updatedTask = {
        title: values.title,
        description: values.description || undefined,
        priority: values.priority as 'low' | 'medium' | 'high',
        assignedTo: values.assigned_to || undefined,
        category: 'Reservations',
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

      // Call API directly instead of using custom hook - map camelCase to snake_case
      const apiPayload = {
        title: values.title,
        description: values.description || undefined,
        priority: values.priority as 'low' | 'medium' | 'high',
        assigned_to: values.assigned_to || undefined, // snake_case for API
        category: 'Reservations',
        due_date: values.dueDate || undefined, // snake_case for API
      };

      const response = await fetch(
        `/api/holidays/${holidayId}/tasks/${editingTask.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'x-test-user': JSON.stringify({
              sub: auth0User.sub,
              email: auth0User.email,
              name: auth0User.name,
              picture: auth0User.picture,
            }),
          },
          body: JSON.stringify(apiPayload),
        },
      );

      if (!response.ok) {
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
              category: editingTask.category,
              dueDate: editingTask.dueDate,
            },
          }),
        );
        console.error(
          'Failed to update reservation:',
          response.status,
          response.statusText,
        );
      }

      setEditingTask(null);
      setShowEditModal(false);
    } catch (error) {
      console.error('Failed to update reservation:', error);
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleDeleteReservation(taskId: string) {
    if (!holidayId || !auth0User) return;

    // Find the task to delete for potential rollback
    const taskToDelete = reservations.find((task: any) => task.id === taskId);
    if (!taskToDelete) return;

    setIsDeleting(true);
    try {
      // Optimistically update Redux state first
      dispatch(removeTaskFromHomeData({ holidayId: holidayId, taskId }));

      // Call API directly instead of using custom hook
      const apiUrl = `/api/holidays/${holidayId}/tasks/${taskId}`;
      const response = await fetch(apiUrl, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-test-user': JSON.stringify({
            sub: auth0User.sub,
            email: auth0User.email,
            name: auth0User.name,
            picture: auth0User.picture,
          }),
        },
      });

      if (!response.ok) {
        // If API failed, revert the optimistic update
        dispatch(addTaskToHomeData({ holidayId: holidayId, task: taskToDelete }));
        console.error(
          'Failed to delete reservation:',
          response.status,
          response.statusText,
        );
      } else {
        // Check if this was the last task and re-show default tasks prompt
        const remainingTasks = reservations.filter(r => r.id !== taskId);
        if (remainingTasks.length === 0) {
          setShowDefaultTasks(true);
        }
      }
    } catch (error) {
      // If API failed, revert the optimistic update
      dispatch(addTaskToHomeData({ holidayId: holidayId, task: taskToDelete }));
      console.error('Failed to delete reservation:', error);
    } finally {
      setIsDeleting(false);
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

  const loading = isAdding || isUpdating || isDeleting || isToggling;

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

  const sortedTasks = sortTasks(reservations.map(transformTaskWithAssignment));
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
        loading={isAdding}
        submitText="Add Reservation"
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
        loading={isUpdating}
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
