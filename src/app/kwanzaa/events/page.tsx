'use client';

import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useFormModalMutation } from '@/hooks/useFormModalMutation';
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
import HolidayPageHeader from '@/components/common/HolidayPageHeader';
import AddButton from '@/components/common/AddButton';
import TaskSection from '@/components/common/TaskSection';
import ToDoCard from '@/components/cards/to-do/ToDoCard';

type SortOption = 'priority' | 'dateDue' | 'assignedTo' | 'category' | 'none';

const defaultEventTasks = [
  {
    title: 'Kwanzaa Karamu Feast Planning',
    description: 'Plan the traditional Kwanzaa feast celebration',
    priority: 'high' as const,
  },
  {
    title: 'Kinara Lighting Ceremony Setup',
    description: 'Prepare for daily kinara candle lighting ceremonies',
    priority: 'high' as const,
  },
  {
    title: 'Zawadi Gift Exchange Planning',
    description: 'Organize handmade gift exchange activities',
    priority: 'medium' as const,
  },
  {
    title: 'African Drum and Dance Workshop',
    description: 'Plan traditional music and dance activities',
    priority: 'medium' as const,
  },
  {
    title: 'Storytelling and Poetry Reading',
    description: 'Prepare for Kuumba (Creativity) day activities',
    priority: 'medium' as const,
  },
  {
    title: 'Community Service Planning',
    description: 'Organize Ujima (Collective Work) activities',
    priority: 'high' as const,
  },
  {
    title: 'Family Heritage Workshop',
    description: 'Plan genealogy and heritage activities',
    priority: 'medium' as const,
  },
  {
    title: 'Unity Cup Ceremony Preparation',
    description: 'Set up Kikombe cha Umoja ceremony space',
    priority: 'high' as const,
  },
  {
    title: 'African Art & Craft Workshop',
    description: 'Prepare materials for traditional crafts',
    priority: 'low' as const,
  },
  {
    title: 'Vision Board Workshop',
    description: 'Plan Nia (Purpose) day goal-setting activities',
    priority: 'low' as const,
  },
];

export default function KwanzaaEventsPage() {
  const dispatch = useAppDispatch();
  const { contacts } = useAppSelector((state: any) => state.addressBook);
  const { holidayId, auth0User } = useFormModalMutation();
  const { isUserPlusMember, hasSubscription } = useSubscription();

  // Get Redux data
  const holidayPreferences = useAppSelector(selectHolidayPreferences);
  const homeInitialized = useAppSelector(selectHomeInitialized);
  const homeData = useAppSelector(selectHomeData);

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
  const holidayData = useAppSelector(state =>
    selectHolidayPrefById(state, holidayId!),
  );
  const events =
    holidayData?.tasks?.filter((task: any) => task.category === 'Events') || [];
  const isLoading = !homeInitialized;
  const error = null;

  // Refresh home data function (like gift-list)
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

  // Removed refreshHomeData helper to prevent infinite loops
  // Direct dispatch calls are used instead

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

  // Check if default event tasks exist
  useEffect(() => {
    if (events.length === 0 && homeInitialized) {
      setShowDefaultTasks(true);
    }
  }, [events, homeInitialized]);

  // CRUD Operations
  async function handleAddTask(values: Record<string, any>) {
    if (!values.title?.trim()) return;
    if (!holidayId || !auth0User) return;

    setIsAdding(true);

    const newTask = {
      id: `temp-${Date.now()}`, // Temporary ID for optimistic update
      title: values.title,
      description: values.description || undefined,
      priority: values.priority as 'low' | 'medium' | 'high',
      assignedTo: values.assigned_to || undefined,
      category: 'Events',
      dueDate: values.dueDate || undefined,
      isCompleted: false,
      holidayId: holidayId,
    };

    try {
      // Optimistically update Redux state first (like Hanukkah)
      console.log('Adding task optimistically:', newTask);
      console.log('Holiday ID for addition:', holidayId);
      dispatch(addTaskToHomeData({ holidayId: holidayId, task: newTask }));
      console.log('Task added to Redux, making API call...');

      // Call API - map camelCase to snake_case for API
      const apiPayload = {
        title: values.title,
        description: values.description || undefined,
        priority: values.priority as 'low' | 'medium' | 'high',
        assigned_to: values.assigned_to || undefined, // snake_case for API
        category: 'Events',
        due_date: values.dueDate || undefined, // snake_case for API
        isCompleted: false,
      };

      console.log('🐛 [KwanzaaAdd] API payload:', apiPayload);

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
        // Replace temporary task with real task from API (like Hanukkah)
        const result = await response.json();
        console.log('API success, replacing temp task with real task:', result);
        dispatch(
          removeTaskFromHomeData({
            holidayId: holidayId,
            taskId: newTask.id,
          }),
        );
        dispatch(addTaskToHomeData({ holidayId: holidayId, task: result }));

        // Also refresh home data like gift-list does
        await refreshHomeData();
      } else {
        // Remove optimistic update on error
        console.log('API error, removing optimistic update');
        dispatch(
          removeTaskFromHomeData({
            holidayId: holidayId,
            taskId: newTask.id,
          }),
        );
        console.error('Failed to add task:', response.status, response.statusText);
      }

      setShowForm(false);
    } catch (error) {
      // Remove optimistic update on error (like Hanukkah)
      dispatch(removeTaskFromHomeData({ holidayId: holidayId, taskId: newTask.id }));
      console.error('Failed to add task:', error);
    } finally {
      setIsAdding(false);
    }
  }

  async function addDefaultEventTasks() {
    if (!holidayId || !auth0User) return;

    setIsAdding(true);
    try {
      // Add all default event tasks with optimistic updates
      for (const task of defaultEventTasks) {
        const newTask = {
          id: `temp-${Date.now()}-${task.title}`, // Temporary ID
          ...task,
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
          } else {
            // Remove optimistic update on error
            dispatch(
              removeTaskFromHomeData({
                holidayId: holidayId,
                taskId: newTask.id,
              }),
            );
            console.error(
              'Failed to add default task:',
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
          console.error('Failed to add default task:', taskError);
        }
      }

      setShowDefaultTasks(false);
    } catch (error) {
      console.error('Failed to add default tasks:', error);
    } finally {
      setIsAdding(false);
    }
  }

  async function handleToggleTask(taskId: string) {
    if (!holidayId || !auth0User) return;

    setIsToggling(true);
    try {
      // Find the current task to get its completion status
      const currentTask = events.find((task: any) => task.id === taskId);
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
      console.log('Toggle API URL:', apiUrl); // Debug logging
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
        const currentTask = events.find((task: any) => task.id === taskId);
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
          'Failed to toggle task:',
          response.status,
          response.statusText,
        );
      }
    } catch (error) {
      console.error('Failed to toggle task:', error);
    } finally {
      setIsToggling(false);
    }
  }

  const handleEditTask = (task: any) => {
    setEditingTask(task);
    setShowEditModal(true);
  };

  async function handleEditTaskSubmit(values: Record<string, any>) {
    if (!editingTask || !holidayId || !auth0User) return;

    setIsUpdating(true);
    try {
      const updatedTask = {
        title: values.title,
        description: values.description || undefined,
        priority: values.priority as 'low' | 'medium' | 'high',
        assignedTo: values.assigned_to || undefined,
        category: 'Events',
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
        category: 'Events',
        due_date: values.dueDate || undefined, // snake_case for API
      };

      console.log('🐛 [KwanzaaEdit] API payload:', apiPayload);

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
          'Failed to update task:',
          response.status,
          response.statusText,
        );
      }

      setEditingTask(null);
      setShowEditModal(false);
    } catch (error) {
      console.error('Failed to update task:', error);
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleDeleteTask(taskId: string) {
    if (!holidayId || !auth0User) return;

    // Find the task to delete for potential rollback
    const taskToDelete = events.find((task: any) => task.id === taskId);
    if (!taskToDelete) return;

    setIsDeleting(true);
    try {
      // Optimistically update Redux state first
      dispatch(removeTaskFromHomeData({ holidayId: holidayId, taskId }));

      // Call API directly instead of using custom hook
      const apiUrl = `/api/holidays/${holidayId}/tasks/${taskId}`;
      console.log('Delete API URL:', apiUrl); // Debug logging
      console.log('Events before delete:', events.length);
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
          'Failed to delete task:',
          response.status,
          response.statusText,
        );
      } else {
        console.log('Task deleted successfully');
        // Check if this was the last task and re-show default tasks prompt
        const remainingTasks = events.filter(e => e.id !== taskId);
        console.log('Events after delete:', remainingTasks.length);
        if (remainingTasks.length === 0) {
          console.log('No tasks remaining, showing default tasks prompt');
          setShowDefaultTasks(true);
        }
      }
    } catch (error) {
      // If API failed, revert the optimistic update
      dispatch(addTaskToHomeData({ holidayId: holidayId, task: taskToDelete }));
      console.error('Failed to delete task:', error);
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

  const loading = isAdding || isUpdating || isDeleting || isToggling;

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
        {showDefaultTasks && (
          <div className="card card-tasks rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700">
            <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
              🎉 Set Up Kwanzaa Events
            </h3>
            <p className="text-blue-700 dark:text-blue-300 text-sm mb-3">
              Would you like to add some common Kwanzaa event planning tasks?
            </p>
            <div className="flex gap-2">
              <button
                onClick={addDefaultEventTasks}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors text-sm"
              >
                Add Default Events
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
        isOpen={showForm}
        title="Add New Event Task"
        fields={
          getFormConfigEnhanced('events', 'add', {
            holidayKey: 'kwanzaa',
            shareMembers: shareMembers,
            auth0User: auth0User,
          }).fields
        }
        onSubmit={handleAddTask}
        onClose={closeForm}
        loading={isAdding}
        submitText={isAdding ? 'Processing...' : 'Add Task'}
        cardClassName="card-tasks"
      />

      {/* Edit Modal */}
      <FormModal
        isOpen={showEditModal}
        title="Edit Event Task"
        fields={
          getFormConfigEnhanced('events', 'edit', {
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
        loading={isUpdating}
        submitText={isUpdating ? 'Processing...' : 'Update Task'}
        cardClassName="card-tasks"
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
