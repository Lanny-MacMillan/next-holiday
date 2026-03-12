'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useHolidayPageData } from '@/hooks/useHolidayPageData';
import { useHolidayMutations } from '@/hooks/useHolidayMutations';
import { useSubscription } from '@/hooks/useSubscription';
import { fetchContacts } from '@/store/slices/addressBookSlice';
import {
  updateTaskInHomeData,
  addTaskToHomeData,
  removeTaskFromHomeData,
  setHomeData,
} from '@/store/slices/homeSlice';
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

  const { isUserPlusMember, hasSubscription } = useSubscription();

  // Check if the holiday is shared to conditionally show assign to field
  const isHolidayShared = useAppSelector((state: any) =>
    selectIsHolidayShared(state, 'new-year'),
  );
  const isAuthorizedForSharing = hasSubscription && isUserPlusMember;

  // Redux data access - events are stored as tasks with category "Events"
  const events = useMemo(
    () =>
      holidayData?.tasks?.filter((task: any) => task.category === 'Events') || [],
    [holidayData?.tasks],
  );
  const isLoading = !homeInitialized;
  const error = null;

  // Safety check for contacts
  const safeContacts = contacts || [];

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
  const refreshHomeData = async () => {
    if (!auth0User) return;
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

  const handleAddTask = async (values: any) => {
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

      // Update Redux state immediately
      dispatch(addTaskToHomeData({ holidayId, task: result }));

      // Refresh home data to ensure UI is in sync
      await refreshHomeData();

      setShowForm(false);
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

      // Update Redux state immediately
      dispatch(
        updateTaskInHomeData({
          holidayId,
          taskId: editingTask.id,
          updates,
        }),
      );

      // Refresh home data to ensure UI is in sync
      await refreshHomeData();

      setEditingTask(null);
      setShowEditModal(false);
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
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
      await refreshHomeData();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleToggleTask = async (taskId: string) => {
    const task = events.find((t: any) => t.id === taskId);
    if (!task || !holidayId) return;

    const newCompletionStatus = !task.isCompleted;

    try {
      // Update API
      await updateTask(taskId, { isCompleted: newCompletionStatus });

      // Update Redux state immediately - no refreshHomeData
      dispatch(
        updateTaskInHomeData({
          holidayId,
          taskId,
          updates: {
            ...task,
            isCompleted: newCompletionStatus,
          },
        }),
      );
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
          onClick={() => setShowForm(true)}
          title="Event"
          color="yellow"
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
          loading={createLoading}
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
          loading={updateLoading}
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
