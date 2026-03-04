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
} from '@/store/selectors/home';
import { getHolidayIdFromRoute } from '@/utils/holidayUtils';
import { getHolidayDataFromRedux } from '@/utils/holidayData';
import { selectIsHolidayShared } from '@/store/slices/sharesSlice';
import SortModal from '@/components/modals/SortModal';
import FormModal from '@/components/modals/FormModal';
import HolidayPageHeader from '@/components/common/HolidayPageHeader';
import AddButton from '@/components/common/AddButton';
import TaskSection from '@/components/common/TaskSection';
import ToDoCard from '@/components/cards/to-do/ToDoCard';

type SortOption = 'priority' | 'dateDue' | 'assignedTo' | 'category' | 'none';

const defaultPartyPlanningTasks = [
  {
    title: 'Birthday Venue Selection',
    description: 'Choose and book the perfect birthday party venue',
    priority: 'high' as const,
  },
  {
    title: 'Guest List & Invitations',
    description: 'Compile guest list and send out party invitations',
    priority: 'high' as const,
  },
  {
    title: 'Birthday Cake & Desserts',
    description: 'Order birthday cake and arrange dessert table',
    priority: 'high' as const,
  },
  {
    title: 'Party Decorations Setup',
    description: 'Plan and set up birthday party decorations',
    priority: 'medium' as const,
  },
  {
    title: 'Music & Entertainment',
    description: 'Arrange music playlist and party entertainment',
    priority: 'medium' as const,
  },
  {
    title: 'Food & Catering',
    description: 'Plan party menu and arrange catering',
    priority: 'medium' as const,
  },
  {
    title: 'Party Favors & Gifts',
    description: 'Prepare party favors and gift bags for guests',
    priority: 'low' as const,
  },
  {
    title: 'Photography Setup',
    description: 'Arrange for party photography and photo booth',
    priority: 'low' as const,
  },
];

export default function BirthdayPartyPlanningPage() {
  const dispatch = useAppDispatch();
  const { contacts } = useAppSelector((state: any) => state.addressBook);
  const { user: auth0User } = useAuth0();
  const { isUserPlusMember, hasSubscription } = useSubscription();

  // No need for custom mutations hook - using direct API calls like Kwanzaa

  // Get Redux data
  const holidayPreferences = useAppSelector(selectHolidayPreferences);
  const homeInitialized = useAppSelector(selectHomeInitialized);
  const homeData = useAppSelector(selectHomeData);

  // Get current Redux state for data access
  const currentState = useAppSelector((state: any) => state);

  // Holiday ID resolution
  const resolvedHolidayId = homeInitialized
    ? getHolidayIdFromRoute('/birthday', holidayPreferences)
    : getHolidayIdFromRoute('/birthday', holidayPreferences);

  // Check if the holiday is shared to conditionally show assign to field
  const isHolidayShared = useAppSelector((state: any) =>
    selectIsHolidayShared(state, 'birthday'),
  );
  const isAuthorizedForSharing = hasSubscription && isUserPlusMember;

  // Redux data access - party planning tasks are stored as tasks with category "Party Planning"
  const holidayData = getHolidayDataFromRedux(resolvedHolidayId, currentState);
  const partyPlanning =
    holidayData?.tasks?.filter((task: any) => task.category === 'Party Planning') ||
    [];
  const isLoading = !homeInitialized;
  const error = null;

  // Refresh home data function (like Kwanzaa)
  const refreshHomeData = async () => {
    if (!auth0User?.sub || !resolvedHolidayId) return;

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

  // Check if default party planning tasks exist
  useEffect(() => {
    if (partyPlanning.length === 0 && homeInitialized) {
      setShowDefaultTasks(true);
    }
  }, [partyPlanning, homeInitialized]);

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
        return [...tasksToSort];
    }
  }

  const sortedTasks = sortTasks(partyPlanning);
  const incompletePartyPlanningTasks = sortedTasks.filter(
    (task: any) => !task.isCompleted,
  );
  const completedPartyPlanningTasks = sortedTasks.filter(
    (task: any) => task.isCompleted,
  );

  // CRUD Operations
  async function handleAddTask(values: Record<string, any>) {
    if (!values.title?.trim()) {
      alert('Please enter a task title');
      return;
    }

    if (!auth0User) {
      alert('You need to be logged in to add tasks');
      return;
    }

    if (!resolvedHolidayId) {
      alert('Holiday data is still loading, please try again in a moment');
      return;
    }

    if (!homeInitialized) {
      alert('App is still initializing, please wait a moment');
      return;
    }

    setIsAdding(true);

    const newTask = {
      id: `temp-${Date.now()}`, // Temporary ID for optimistic update
      title: values.title,
      description: values.description || undefined,
      priority: values.priority as 'low' | 'medium' | 'high',
      assignedTo: values.assignedTo || undefined,
      category: 'Party Planning',
      dueDate: values.dueDate || undefined,
      isCompleted: false,
      holidayId: resolvedHolidayId,
    };

    try {
      // Optimistically update Redux state first (like Kwanzaa)
      dispatch(addTaskToHomeData({ holidayId: resolvedHolidayId, task: newTask }));

      // Call API - map camelCase to snake_case for API
      const apiPayload = {
        title: values.title,
        description: values.description || undefined,
        priority: values.priority as 'low' | 'medium' | 'high',
        assigned_to: values.assignedTo || undefined, // snake_case for API
        category: 'Party Planning',
        due_date: values.dueDate || undefined, // snake_case for API
        isCompleted: false,
      };

      const response = await fetch(`/api/holidays/${resolvedHolidayId}/tasks`, {
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
            holidayId: resolvedHolidayId,
            taskId: newTask.id,
          }),
        );
        dispatch(addTaskToHomeData({ holidayId: resolvedHolidayId, task: result }));

        // Also refresh home data like Kwanzaa does
        await refreshHomeData();
      } else {
        // Remove optimistic update on error
        dispatch(
          removeTaskFromHomeData({
            holidayId: resolvedHolidayId,
            taskId: newTask.id,
          }),
        );
        console.error('Failed to add task:', response.status, response.statusText);
      }

      setShowForm(false);
    } catch (error) {
      // Remove optimistic update on error (like Kwanzaa)
      dispatch(
        removeTaskFromHomeData({ holidayId: resolvedHolidayId, taskId: newTask.id }),
      );
      console.error('Failed to add task:', error);
    } finally {
      setIsAdding(false);
    }
  }

  async function addDefaultPartyPlanningTasks() {
    if (!resolvedHolidayId || !auth0User) return;

    setIsAdding(true);
    try {
      // Make all API calls WITHOUT optimistic updates during bulk addition
      for (const task of defaultPartyPlanningTasks) {
        try {
          const response = await fetch(`/api/holidays/${resolvedHolidayId}/tasks`, {
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
              category: 'Party Planning',
              isCompleted: false,
            }),
          });

          if (!response.ok) {
            console.error(
              'Failed to add default task:',
              response.status,
              response.statusText,
            );
          }
        } catch (taskError) {
          console.error('Failed to add default task:', taskError);
        }
      }

      // Refresh home data ONCE after all tasks are added
      await refreshHomeData();
      setShowDefaultTasks(false);
    } catch (error) {
      console.error('Failed to add default tasks:', error);
    } finally {
      setIsAdding(false);
    }
  }

  async function handleToggleTask(taskId: string) {
    if (!resolvedHolidayId || !auth0User) return;

    setIsToggling(true);
    try {
      // Find the current task to get its completion status
      const currentTask = partyPlanning.find((task: any) => task.id === taskId);
      if (!currentTask) {
        return;
      }

      // Toggle the completion status
      const newCompletionStatus = !currentTask.isCompleted;

      // Optimistically update the Redux home data
      dispatch(
        updateTaskInHomeData({
          holidayId: resolvedHolidayId,
          taskId: taskId,
          updates: { isCompleted: newCompletionStatus },
        }),
      );

      // Call API directly instead of using custom hook
      const apiUrl = `/api/holidays/${resolvedHolidayId}/tasks/${taskId}`;
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
        const currentTask = partyPlanning.find((task: any) => task.id === taskId);
        if (currentTask) {
          dispatch(
            updateTaskInHomeData({
              holidayId: resolvedHolidayId,
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
    if (!editingTask || !resolvedHolidayId || !auth0User) return;

    setIsUpdating(true);
    try {
      const updatedTask = {
        title: values.title,
        description: values.description || undefined,
        priority: values.priority as 'low' | 'medium' | 'high',
        assignedTo: values.assignedTo || undefined,
        category: 'Party Planning',
        dueDate: values.dueDate || undefined,
      };

      // Optimistically update the Redux home data
      dispatch(
        updateTaskInHomeData({
          holidayId: resolvedHolidayId,
          taskId: editingTask.id,
          updates: updatedTask,
        }),
      );

      // Call API directly instead of using custom hook - map camelCase to snake_case
      const apiPayload = {
        title: values.title,
        description: values.description || undefined,
        priority: values.priority as 'low' | 'medium' | 'high',
        assigned_to: values.assignedTo || undefined, // snake_case for API
        category: 'Party Planning',
        due_date: values.dueDate || undefined, // snake_case for API
      };

      const response = await fetch(
        `/api/holidays/${resolvedHolidayId}/tasks/${editingTask.id}`,
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
            holidayId: resolvedHolidayId,
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
    if (!resolvedHolidayId || !auth0User) return;

    // Find the task to delete for potential rollback
    const taskToDelete = partyPlanning.find((task: any) => task.id === taskId);
    if (!taskToDelete) return;

    setIsDeleting(true);
    try {
      // Optimistically update Redux state first
      dispatch(removeTaskFromHomeData({ holidayId: resolvedHolidayId, taskId }));

      // Call API directly instead of using custom hook
      const apiUrl = `/api/holidays/${resolvedHolidayId}/tasks/${taskId}`;
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
        dispatch(
          addTaskToHomeData({ holidayId: resolvedHolidayId, task: taskToDelete }),
        );
        console.error(
          'Failed to delete task:',
          response.status,
          response.statusText,
        );
      } else {
        // Check if this was the last task and re-show default tasks prompt
        const remainingTasks = partyPlanning.filter(t => t.id !== taskId);
        if (remainingTasks.length === 0) {
          setShowDefaultTasks(true);
        }
      }
    } catch (error) {
      // If API failed, revert the optimistic update
      dispatch(
        addTaskToHomeData({ holidayId: resolvedHolidayId, task: taskToDelete }),
      );
      console.error('Failed to delete task:', error);
    } finally {
      setIsDeleting(false);
    }
  }

  function openForm() {
    // Add guard to prevent opening form when conditions are not met
    if (!homeInitialized || !resolvedHolidayId || !auth0User) {
      return;
    }
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
  }

  function closeEditModal() {
    setShowEditModal(false);
    setEditingTask(null);
  }

  // FormModal fields configuration - matching Kwanzaa exactly
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
    ...(isAuthorizedForSharing && isHolidayShared
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

  return (
    <div className="min-h-screen birthday-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
      <HolidayPageHeader
        title="Party Planning"
        backHref="/birthday"
        onSortClick={() => setShowSortModal(true)}
        sortTitle="Sort Party Planning"
        description="Plan your birthday party with style!"
        holidayColor="yellow-500"
        error={error ? 'An error occurred' : undefined}
      />

      <main className="flex-1 w-full max-w-4xl flex flex-col gap-6 mt-4">
        {/* Show default tasks prompt if no tasks exist */}
        {showDefaultTasks && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">
              Get Started with Party Planning
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Would you like to add some default party planning tasks to get started?
            </p>
            <div className="flex gap-3">
              <button
                onClick={addDefaultPartyPlanningTasks}
                disabled={isAdding}
                className="bg-amber-500 hover:bg-amber-600 border border-amber-600 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isAdding && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-200"></div>
                )}
                {isAdding ? 'Adding Tasks...' : 'Add Default Tasks'}
              </button>
              <button
                onClick={() => setShowDefaultTasks(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium"
              >
                Skip
              </button>
            </div>
          </div>
        )}

        <AddButton
          title="Task"
          onClick={openForm}
          color="amber"
          disabled={!homeInitialized || !resolvedHolidayId || !auth0User}
        />

        {(!homeInitialized || !resolvedHolidayId || !auth0User) && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
            <p className="text-yellow-800">
              {!auth0User
                ? 'Please log in to manage party planning tasks'
                : 'Loading party planning data...'}
            </p>
          </div>
        )}

        {/* Party Planning Status Summary */}
        {partyPlanning.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Party Planning Status</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {partyPlanning.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Total Tasks
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {completedPartyPlanningTasks.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Completed
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {incompletePartyPlanningTasks.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Remaining
                </div>
              </div>
            </div>
          </div>
        )}

        {isAdding ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-300">
                Adding default tasks...
              </p>
            </div>
          </div>
        ) : (
          <TaskSection
            title="Incomplete"
            items={incompletePartyPlanningTasks}
            isCompleted={false}
            emptyMessage="All party planning tasks completed! 🎉"
            completedMessage=""
            renderItem={task => (
              <ToDoCard
                key={task.id}
                task={task}
                onToggleComplete={handleToggleTask}
                onDelete={handleDeleteTask}
                onEdit={handleEditTask}
                theme={{
                  accentColor: '#f59e0b', // Amber for Birthday
                }}
                borderColor="rgb(var(--color-amber-500))" // Amber border for Birthday
                gamifiedBackgroundColor="bg-gradient-to-br from-yellow-300 to-yellow-500"
                disableInternalModal={true}
              />
            )}
          />
        )}

        {!isAdding && (
          <TaskSection
            title="Completed"
            items={completedPartyPlanningTasks}
            isCompleted={true}
            emptyMessage="No completed party planning tasks yet."
            completedMessage="No completed party planning tasks yet."
            renderItem={task => (
              <ToDoCard
                key={task.id}
                task={task}
                onToggleComplete={handleToggleTask}
                onDelete={handleDeleteTask}
                onEdit={handleEditTask}
                className="opacity-60"
                theme={{
                  accentColor: '#f59e0b', // Amber for Birthday
                }}
                borderColor="rgb(var(--color-amber-500))" // Amber border for Birthday
                gamifiedBackgroundColor="bg-gradient-to-br from-yellow-300 to-yellow-500"
                disableInternalModal={true}
              />
            )}
          />
        )}
      </main>

      {/* Form Modal */}
      <FormModal
        isOpen={showForm}
        title="Add New Party Planning Task"
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
          ...(isAuthorizedForSharing && isHolidayShared
            ? [
                {
                  id: 'assignedTo',
                  type: 'text' as const,
                  placeholder: 'Assigned To',
                },
              ]
            : []),
          { id: 'dueDate', type: 'date' as const, placeholder: 'Due Date' },
        ]}
        initialValues={{
          title: '',
          description: '',
          priority: 'medium',
          ...(isAuthorizedForSharing && isHolidayShared ? { assignedTo: '' } : {}),
          dueDate: '',
        }}
        onSubmit={handleAddTask}
        onClose={closeForm}
        loading={isAdding}
        submitText="Add Task"
        cardClassName="card-tasks"
        submitButtonColor="#f59e0b"
      />

      {/* Edit Modal */}
      <FormModal
        isOpen={showEditModal}
        title="Edit Party Planning Task"
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
          ...(isAuthorizedForSharing && isHolidayShared
            ? [
                {
                  id: 'assignedTo',
                  type: 'text' as const,
                  placeholder: 'Assigned To',
                },
              ]
            : []),
          { id: 'dueDate', type: 'date' as const, placeholder: 'Due Date' },
        ]}
        initialValues={
          editingTask
            ? {
                title: editingTask.title || '',
                description: editingTask.description || '',
                priority: editingTask.priority || 'medium',
                ...(isAuthorizedForSharing && isHolidayShared
                  ? { assignedTo: editingTask.assignedTo || '' }
                  : {}),
                dueDate: editingTask.dueDate
                  ? new Date(editingTask.dueDate).toISOString().split('T')[0]
                  : '',
              }
            : {}
        }
        onSubmit={handleEditTaskSubmit}
        onClose={closeEditModal}
        loading={isUpdating}
        submitText="Update Task"
        cardClassName="card-tasks"
        submitButtonColor="#f59e0b"
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
        title="Sort Party Planning"
      />
    </div>
  );
}
