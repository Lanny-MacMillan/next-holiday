'use client';

import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useAuth0 } from '@auth0/auth0-react';
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
import { useFormModalMutation } from '@/hooks/useFormModalMutation';

import { selectIsHolidayShared } from '@/store/slices/sharesSlice';
import SortModal from '@/components/modals/SortModal';
import FormModal from '@/components/modals/FormModal';
import HolidayPageHeader from '@/components/common/HolidayPageHeader';
import AddButton from '@/components/common/AddButton';
import TaskSection from '@/components/common/TaskSection';
import ToDoCard from '@/components/cards/to-do/ToDoCard';

type SortOption = 'priority' | 'dateDue' | 'assignedTo' | 'category' | 'none';

export default function NewYearEventsPage() {
  const dispatch = useAppDispatch();
  const { contacts } = useAppSelector((state: any) => state.addressBook);
  const { holidayId, auth0User } = useFormModalMutation();

  // Get Redux data
  const holidayPreferences = useAppSelector(selectHolidayPreferences);
  const homeInitialized = useAppSelector(selectHomeInitialized);
  const homeData = useAppSelector(selectHomeData);

  // Check if the holiday is shared to conditionally show assign to field
  const isHolidayShared = useAppSelector((state: any) =>
    selectIsHolidayShared(state, 'new-year'),
  );

  // Redux data access - events are stored as tasks with category "Events"
  const holidayData = useAppSelector(state =>
    selectHolidayPrefById(state, holidayId!),
  );
  const events =
    holidayData?.tasks?.filter((task: any) => task.category === 'Events') || [];
  const isLoading = !homeInitialized;
  const error = null;

  // Safety check for contacts
  const safeContacts = contacts || [];

  // Refresh home data function
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
      assignedTo: values.assignedTo || undefined,
      category: 'Events',
      dueDate: values.dueDate || undefined,
      isCompleted: false,
      holidayId: holidayId,
    };

    try {
      // Optimistically update Redux state first
      dispatch(addTaskToHomeData({ holidayId: holidayId, task: newTask }));

      // Construct API payload
      const apiPayload = {
        title: values.title,
        description: values.description || undefined,
        priority: values.priority as 'low' | 'medium' | 'high',
        assignedTo: values.assignedTo || undefined,
        category: 'Events',
        due_date: values.dueDate || undefined, // API expects due_date (snake_case)
        isCompleted: false,
        holidayId: holidayId,
      };

      // Call API
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

      if (!response.ok) {
        // Remove optimistic update on error
        dispatch(
          removeTaskFromHomeData({
            holidayId: holidayId,
            taskId: newTask.id,
          }),
        );
        console.error(
          'Failed to create task:',
          response.status,
          response.statusText,
        );
      } else {
        // Success: replace temp task with real task from API
        const result = await response.json();

        // Remove temp task and add real task
        dispatch(
          removeTaskFromHomeData({
            holidayId: holidayId,
            taskId: newTask.id,
          }),
        );
        dispatch(addTaskToHomeData({ holidayId: holidayId, task: result.data }));
      }

      setShowForm(false);
    } catch (error) {
      // Remove the optimistic update if there was an error
      dispatch(removeTaskFromHomeData({ holidayId: holidayId, taskId: newTask.id }));
      console.error('Failed to create task:', error);
    } finally {
      setIsAdding(false);
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
        assignedTo: values.assignedTo || undefined,
        category: 'Events',
        due_date: values.dueDate || undefined, // For API call
      };

      // Separate object for Redux state (needs camelCase)
      const reduxUpdate = {
        title: values.title,
        description: values.description || undefined,
        priority: values.priority as 'low' | 'medium' | 'high',
        assignedTo: values.assignedTo || undefined,
        category: 'Events',
        dueDate: values.dueDate || undefined, // Redux expects camelCase
      };

      // Optimistically update the Redux home data
      dispatch(
        updateTaskInHomeData({
          holidayId: holidayId,
          taskId: editingTask.id,
          updates: reduxUpdate, // Use camelCase version for Redux
        }),
      );

      // Call API directly instead of using custom hook
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
          body: JSON.stringify(updatedTask),
        },
      );

      if (!response.ok) {
        // DEBUG: Log API error
        const errorText = await response.text();

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
      } else {
        // DEBUG: Log successful update
        const result = await response.json();
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
        // Refresh home data to ensure progress tracking updates
        await refreshHomeData();
      }
    } catch (error) {
      // If API failed, revert the optimistic update
      dispatch(addTaskToHomeData({ holidayId: holidayId, task: taskToDelete }));
      console.error('Failed to delete task:', error);
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleToggleTask(taskId: string) {
    if (!holidayId || !auth0User) return;

    const task = events.find((t: any) => t.id === taskId);
    if (!task) return;

    setIsToggling(true);
    try {
      const updatedTask = { ...task, isCompleted: !task.isCompleted };

      // Optimistically update Redux state
      dispatch(
        updateTaskInHomeData({
          holidayId: holidayId,
          taskId,
          updates: { isCompleted: !task.isCompleted },
        }),
      );

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
        body: JSON.stringify({ isCompleted: !task.isCompleted }),
      });

      if (!response.ok) {
        // Revert optimistic update on API failure
        dispatch(
          updateTaskInHomeData({
            holidayId: holidayId,
            taskId,
            updates: { isCompleted: task.isCompleted },
          }),
        );
        console.error(
          'Failed to toggle task:',
          response.status,
          response.statusText,
        );
      } else {
        // Refresh home data to ensure progress tracking updates
        await refreshHomeData();
      }
    } catch (error) {
      // Revert optimistic update on error
      dispatch(
        updateTaskInHomeData({
          holidayId: holidayId,
          taskId,
          updates: { isCompleted: task.isCompleted },
        }),
      );
      console.error('Failed to toggle task:', error);
    } finally {
      setIsToggling(false);
    }
  }

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
          onClick={() => setShowForm(true)}
          title="Add New Event"
          color="yellow"
          disabled={isAdding}
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
      {showForm && (
        <FormModal
          isOpen={showForm}
          onClose={() => setShowForm(false)}
          onSubmit={handleAddTask}
          title="Add New Event Task"
          fields={[
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
                    id: 'assignedTo' as const,
                    type: 'text' as const,
                    placeholder: 'Assigned To',
                  },
                ]
              : []),
            {
              id: 'dueDate' as const,
              type: 'date' as const,
              placeholder: 'Due Date',
            },
          ]}
          initialValues={{
            title: '',
            description: '',
            priority: 'medium',
            ...(isHolidayShared ? { assignedTo: '' } : {}),
            dueDate: '',
          }}
          loading={isAdding}
          submitText="Add Task"
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
          fields={[
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
                    id: 'assignedTo' as const,
                    type: 'text' as const,
                    placeholder: 'Assigned To',
                  },
                ]
              : []),
            {
              id: 'dueDate' as const,
              type: 'date' as const,
              placeholder: 'Due Date',
            },
          ]}
          initialValues={{
            title: editingTask.title || '',
            description: editingTask.description || '',
            priority: editingTask.priority || 'medium',
            ...(isHolidayShared ? { assignedTo: editingTask.assignedTo || '' } : {}),
            dueDate: editingTask.dueDate
              ? new Date(editingTask.dueDate).toISOString().split('T')[0]
              : '',
          }}
          loading={isUpdating}
          submitText="Update Task"
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
