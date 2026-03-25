'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useHolidayPageData } from '@/hooks/useHolidayPageData';
import { useHolidayMutations } from '@/hooks/useHolidayMutations';
import { useRefreshHomeData } from '@/hooks/useRefreshHomeData';
import { useSubscription } from '@/hooks/useSubscription';
import { fetchContacts } from '@/store/slices/addressBookSlice';
import {
  selectIsHolidayShared,
  selectShareByHolidayKey,
} from '@/store/slices/sharesSlice';
import { RootState } from '@/store';
import SortModal from '@/components/modals/SortModal';
import FormModal from '@/components/modals/FormModal';
import DeleteModal from '@/components/modals/DeleteModal';
import { getFormConfigEnhanced } from '@/config/formConfigs';
import { getDeleteConfig } from '@/config/deleteModalConfigs';
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
  const { holidayId, holidayData, auth0User, homeInitialized } =
    useHolidayPageData();
  // Redux & Sharing - Enhanced Compatibility Layer
  const isHolidayShared = useAppSelector((state: any) =>
    selectIsHolidayShared(state, 'birthday'),
  );

  const shareData = useAppSelector((state: RootState) =>
    selectShareByHolidayKey(state, 'birthday'),
  );
  const baseMembers = shareData?.members || [];

  // Only include current user in shareMembers if holiday is actually shared
  const shareMembers =
    isHolidayShared && auth0User
      ? [
          // Add current user first
          {
            userId: auth0User.sub || '',
            uuid: auth0User.id || '', // Use database UUID for Enhanced Compatibility Layer
            name: auth0User.name || 'Me',
            email: auth0User.email || '',
            role: 'owner' as const,
          },
          // Add other members, filtering out current user if already present
          ...baseMembers
            .filter((member: any) => member.userId !== auth0User.sub)
            .map((member: any) => ({
              ...member,
              uuid: member.uuid || member.userId, // Prefer existing uuid, fallback to userId only if uuid missing
            })),
        ]
      : baseMembers;

  const { isUserPlusMember, hasSubscription } = useSubscription();

  const {
    createTask,
    updateTask,
    deleteTask,
    createLoading,
    updateLoading,
    deleteLoading,
  } = useHolidayMutations({ holidayId, auth0User });

  const { refreshHomeData } = useRefreshHomeData();

  // Get party planning tasks from holiday data
  const partyPlanning = useMemo(
    () =>
      holidayData?.tasks?.filter(
        (task: any) => task.category === 'Party Planning',
      ) || [],
    [holidayData?.tasks],
  );

  const isLoading = !homeInitialized;

  const isAuthorizedForSharing = hasSubscription && isUserPlusMember;

  // State management
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);

  // Name resolution helpers
  const getAssignedUserName = (assignedToUuid: string): string | null => {
    if (!assignedToUuid || !shareMembers.length) return null;
    const member = shareMembers.find((m: any) => m.uuid === assignedToUuid);
    return member ? member.name || member.email || 'Unknown User' : assignedToUuid;
  };

  const transformTaskWithAssignment = (task: any) => ({
    ...task,
    assignedToName: task.assignedTo ? getAssignedUserName(task.assignedTo) : null,
  });
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

  // Load contacts if holiday is shared for assignment functionality
  useEffect(() => {
    if (isHolidayShared && auth0User) {
      dispatch(fetchContacts(auth0User.sub));
    }
  }, [isHolidayShared, auth0User]);

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

  const sortedTasks = sortTasks(partyPlanning.map(transformTaskWithAssignment));
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

    if (!holidayId) {
      alert('Holiday data is still loading, please try again in a moment');
      return;
    }

    if (!homeInitialized) {
      alert('App is still initializing, please wait a moment');
      return;
    }

    try {
      await createTask({
        title: values.title,
        description: values.description,
        priority: values.priority,
        assigned_to: values.assigned_to || undefined,
        due_date: values.dueDate || undefined,
        category: 'Party Planning',
      });

      // Refresh home data to ensure UI is in sync
      await refreshHomeData(auth0User, holidayId);

      setShowForm(false);
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Failed to add task. Please try again.');
    }
  }

  async function addDefaultPartyPlanningTasks() {
    if (!holidayId || !auth0User) return;

    try {
      // Make all API calls using the hook
      for (const task of defaultPartyPlanningTasks) {
        await createTask({
          title: task.title,
          description: task.description,
          priority: task.priority,
          assigned_to: undefined,
          due_date: undefined,
          category: 'Party Planning',
        });
      }

      // Refresh home data ONCE after all tasks are added
      await refreshHomeData(auth0User, holidayId);
      setShowDefaultTasks(false);
    } catch (error) {
      console.error('Failed to add default tasks:', error);
    }
  }

  async function handleToggleTask(taskId: string) {
    if (!holidayId || !auth0User) return;

    try {
      // Find the current task to get its completion status
      const currentTask = partyPlanning.find((task: any) => task.id === taskId);
      if (!currentTask) {
        return;
      }

      // Toggle the completion status
      const newCompletionStatus = !currentTask.isCompleted;

      await updateTask(taskId, { isCompleted: newCompletionStatus });

      // Refresh home data to ensure UI is in sync
      await refreshHomeData(auth0User, holidayId);
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  }

  const handleEditTask = (task: any) => {
    setEditingTask(task);
    setShowEditModal(true);
  };

  async function handleEditTaskSubmit(values: Record<string, any>) {
    if (!editingTask || !holidayId || !auth0User) return;

    try {
      const updatedTask = {
        title: values.title,
        description: values.description,
        priority: values.priority,
        assigned_to: values.assigned_to || null,
        due_date: values.dueDate || null,
      };

      await updateTask(editingTask.id, updatedTask);

      // Refresh home data to ensure UI is in sync
      await refreshHomeData(auth0User, holidayId);

      setEditingTask(null);
      setShowEditModal(false);
    } catch (error) {
      console.error('Error updating task:', error);
    }
  }

  function handleDeleteTask(taskId: string) {
    const task = partyPlanning.find((t: any) => t.id === taskId);
    if (task) {
      setTaskToDelete(task);
      setShowDeleteModal(true);
    }
  }

  async function handleConfirmDelete() {
    if (!taskToDelete || !holidayId || !auth0User) return;

    try {
      await deleteTask(taskToDelete.id);

      // Refresh home data to ensure UI is in sync
      await refreshHomeData(auth0User, holidayId);

      // Check if this was the last task and re-show default tasks prompt
      const remainingTasks = partyPlanning.filter(
        (t: any) => t.id !== taskToDelete.id,
      );
      if (remainingTasks.length === 1) {
        // Will be 0 after deletion
        setShowDefaultTasks(true);
      }

      setShowDeleteModal(false);
      setTaskToDelete(null);
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  }

  function handleCancelDelete() {
    setShowDeleteModal(false);
    setTaskToDelete(null);
  }

  function openForm() {
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
  }

  function closeEditModal() {
    setEditingTask(null);
    setShowEditModal(false);
  }

  // Enhanced Compatibility Layer form config
  const formConfig = getFormConfigEnhanced('tasks', 'add', {
    holidayKey: 'birthday',
    shareMembers: shareMembers,
    auth0User: auth0User,
  });

  const editFormConfig = getFormConfigEnhanced('tasks', 'edit', {
    holidayKey: 'birthday',
    shareMembers: shareMembers,
    auth0User: auth0User,
  });

  const deleteConfig = getDeleteConfig('tasks');

  return (
    <div className="min-h-screen birthday-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
      <HolidayPageHeader
        title="Party Planning"
        backHref="/birthday"
        onSortClick={() => setShowSortModal(true)}
        sortTitle="Sort Party Planning"
        description="Plan your birthday party with style!"
        holidayColor="yellow-500"
        error={undefined}
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
                disabled={createLoading}
                className="bg-amber-500 hover:bg-amber-600 border border-amber-600 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {createLoading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-200"></div>
                )}
                {createLoading ? 'Adding Tasks...' : 'Add Default Tasks'}
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
          disabled={!homeInitialized || !holidayId || !auth0User}
        />

        {(!homeInitialized || !holidayId || !auth0User) && (
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

        {createLoading ? (
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
                gamifiedBackgroundColor="bg-gradient-to-br from-yellow-400 to-yellow-600"
                disableInternalModal={true}
              />
            )}
          />
        )}

        {!createLoading && (
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
                gamifiedBackgroundColor="bg-gradient-to-br from-yellow-400 to-yellow-600"
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
        fields={formConfig.fields}
        onSubmit={handleAddTask}
        onClose={closeForm}
        loading={createLoading}
        submitText={createLoading ? 'Processing...' : 'Add Task'}
        cardClassName="card-tasks"
        submitButtonColor="#f59e0b"
        contacts={contacts}
        shareMembers={shareMembers}
      />

      {/* Edit Modal */}
      <FormModal
        isOpen={showEditModal}
        title="Edit Party Planning Task"
        fields={editFormConfig.fields}
        initialValues={{
          title: editingTask?.title || '',
          description: editingTask?.description || '',
          priority: editingTask?.priority || 'medium',
          assigned_to: editingTask?.assignedTo || '',
          dueDate: editingTask?.dueDate
            ? new Date(editingTask.dueDate).toISOString().split('T')[0]
            : '',
        }}
        onSubmit={handleEditTaskSubmit}
        onClose={closeEditModal}
        loading={updateLoading}
        submitText={updateLoading ? 'Processing...' : 'Update Task'}
        cardClassName="card-tasks"
        submitButtonColor="#f59e0b"
        contacts={contacts}
        shareMembers={shareMembers}
      />

      {/* Delete Modal */}
      {showDeleteModal && taskToDelete && (
        <DeleteModal
          isOpen={showDeleteModal}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
          loading={deleteLoading}
          title={deleteConfig.title}
          message={deleteConfig.message}
          itemName={taskToDelete.title}
          confirmText={deleteConfig.confirmText}
          cancelText={deleteConfig.cancelText}
          cardClassName={deleteConfig.cardClassName}
          confirmButtonColor={deleteConfig.confirmButtonColor}
        />
      )}

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
