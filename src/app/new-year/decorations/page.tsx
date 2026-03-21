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
  updateTaskInHomeData,
  addTaskToHomeData,
  removeTaskFromHomeData,
} from '@/store/slices/homeSlice';
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

const defaultDecorationTasks = [
  {
    title: 'Set up New Year countdown display',
    description: 'Prepare countdown decorations for midnight celebration',
    priority: 'high' as const,
  },
  {
    title: 'Hang New Year banners and streamers',
    description: 'Display festive New Year banners and colorful streamers',
    priority: 'medium' as const,
  },
  {
    title: 'Arrange New Year centerpieces',
    description: 'Create elegant centerpieces with champagne glasses and confetti',
    priority: 'medium' as const,
  },
  {
    title: 'Set up party decorations and balloons',
    description: 'Prepare gold, silver, and black balloons and party decorations',
    priority: 'high' as const,
  },
  {
    title: 'Prepare confetti and sparklers',
    description: 'Set up confetti cannons and safe sparklers for celebration',
    priority: 'medium' as const,
  },
  {
    title: 'Create photo booth backdrop',
    description: 'Set up New Year themed photo booth with props',
    priority: 'low' as const,
  },
];

export default function NewYearDecorationsPage() {
  const dispatch = useAppDispatch();
  const { isUserPlusMember, hasSubscription } = useSubscription();

  const { holidayId, holidayData, auth0User, homeInitialized } =
    useHolidayPageData();

  // Use standardized mutation hooks for task operations
  const {
    createTask,
    updateTask,
    deleteTask,
    createLoading,
    updateLoading,
    deleteLoading,
  } = useHolidayMutations({ holidayId, auth0User });

  // Use standardized data refresh hook
  const { refreshHomeData } = useRefreshHomeData();

  const isHolidayShared = useAppSelector((state: any) =>
    selectIsHolidayShared(state, 'new-year'),
  );
  const isAuthorizedForSharing = hasSubscription && isUserPlusMember;

  // Get share members for Enhanced Compatibility Layer
  const shareData = useAppSelector((state: RootState) =>
    selectShareByHolidayKey(state, 'new-year'),
  );
  const baseMembers = shareData?.members || [];

  // Always include current user in shareMembers for assignTo functionality
  const shareMembers = auth0User
    ? [
        // Add current user first
        {
          userId: auth0User.sub || '',
          name: auth0User.name || 'Me',
          email: auth0User.email || '',
          role: 'owner' as const,
        },
        // Add other members, filtering out current user if already present
        ...baseMembers.filter((member: any) => member.userId !== auth0User.sub),
      ]
    : baseMembers;

  // Redux data access - decorations are stored as tasks with category "Decorations"
  const decorations = useMemo(
    () =>
      holidayData?.tasks?.filter((task: any) => task.category === 'Decorations') ||
      [],
    [holidayData?.tasks],
  );
  const isLoading = !homeInitialized;
  const error = null;

  // State management
  const [sortBy, setSortBy] = useState<SortOption>('none');
  const [showSortModal, setShowSortModal] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDefaultTasks, setShowDefaultTasks] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);

  useEffect(() => {
    // Always fetch contacts for address book functionality
    dispatch(fetchContacts());
  }, [dispatch]);

  // Check if default decoration tasks exist
  useEffect(() => {
    if (decorations.length === 0 && homeInitialized) {
      setShowDefaultTasks(true);
    }
  }, [decorations, homeInitialized]);

  // CRUD Operations
  async function handleAddDecoration(values: Record<string, any>) {
    if (!values.title?.trim()) return;
    if (!holidayId || !auth0User) return;

    try {
      const newTask = {
        title: values.title,
        description: values.description || undefined,
        priority: values.priority as 'low' | 'medium' | 'high',
        ...(isAuthorizedForSharing &&
          isHolidayShared && { assigned_to: values.assignedTo || undefined }),
        category: 'Decorations',
        due_date: values.dueDate || undefined,
        isCompleted: false,
        holidayId: holidayId,
      };

      // Use the standardized hook function
      await createTask(newTask);

      // Refresh home data to ensure UI is in sync
      await refreshHomeData(auth0User, holidayId);

      setShowForm(false);
    } catch (error) {
      console.error('Error creating decoration task:', error);
    }
  }

  const addDefaultDecorationTasks = async () => {
    for (const task of defaultDecorationTasks) {
      await createTask({
        title: task.title,
        description: task.description,
        priority: task.priority,
        assigned_to: undefined, // Use proper snake_case field mapping
        due_date: undefined, // Use proper snake_case field mapping
        category: 'Decorations',
      });
    }
    setShowDefaultTasks(false);
  };

  const handleToggleCompletion = async (taskId: string) => {
    const currentTask = decorations.find((task: any) => task.id === taskId);
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

  const handleEditDecoration = (task: any) => {
    setEditingTask(task);
    setShowEditModal(true);
  };

  const handleEditDecorationSubmit = async (values: any) => {
    if (!editingTask || !holidayId) return;

    try {
      const updates = {
        title: values.title,
        description: values.description,
        priority: values.priority,
        assigned_to: values.assignedTo,
        due_date: values.dueDate,
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

  const sortedTasks = sortTasks(decorations);
  const incompleteDecorations = sortedTasks.filter((task: any) => !task.isCompleted);
  const completedDecorations = sortedTasks.filter((task: any) => task.isCompleted);

  // Form fields configuration removed - now using Enhanced Compatibility Layer

  return (
    <div className="min-h-screen new-year-tasks-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
      <HolidayPageHeader
        title="New Year's Decorations"
        backHref="/new-year"
        onSortClick={() => setShowSortModal(true)}
        sortTitle="Sort Decorations"
        description="Prepare your New Year's celebration decorations!"
        holidayColor="amber-600"
      />

      <main className="flex-1 w-full max-w-4xl flex flex-col gap-6 mt-4">
        {/* Default Tasks Prompt */}
        {showDefaultTasks && (
          <div className="card card-tasks rounded-lg p-4 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700">
            <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-200 mb-2">
              🎊 Set Up New Year's Decorations
            </h3>
            <p className="text-amber-700 dark:text-amber-300 text-sm mb-3">
              Would you like to add some common New Year's decoration tasks?
            </p>
            <div className="flex gap-2">
              <button
                onClick={addDefaultDecorationTasks}
                disabled={createLoading}
                className="bg-amber-500 text-white px-4 py-2 rounded hover:bg-amber-600 transition-colors text-sm disabled:opacity-50"
              >
                {createLoading ? 'Adding...' : 'Add Default Decorations'}
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

        <AddButton
          title="Decoration Task"
          onClick={() => setShowForm(true)}
          color="amber"
        />

        {/* Decoration Status Summary */}
        {decorations.length > 0 && (
          <div className="card rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
              Decoration Status
            </h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-amber-600">
                  {decorations.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Total Decorations
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {completedDecorations.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Completed
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {incompleteDecorations.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Remaining
                </div>
              </div>
            </div>
          </div>
        )}

        <TaskSection
          title="Pending Decorations"
          items={incompleteDecorations}
          isCompleted={false}
          emptyMessage="No decorations planned yet."
          completedMessage="All decorations completed!"
          renderItem={(task: any) => (
            <ToDoCard
              key={task.id}
              task={task}
              onToggleComplete={handleToggleCompletion}
              onDelete={handleDelete}
              onEdit={handleEditDecoration}
              theme={{
                accentColor: '#f59e0b', // Amber for New Year
              }}
              borderColor="rgb(245 158 11)" // Amber border for New Year
              disableInternalModal={true}
            />
          )}
        />

        <TaskSection
          title="Completed Decorations"
          items={completedDecorations}
          isCompleted={true}
          emptyMessage=""
          completedMessage=""
          renderItem={(task: any) => (
            <ToDoCard
              key={task.id}
              task={task}
              onToggleComplete={handleToggleCompletion}
              onDelete={handleDelete}
              onEdit={handleEditDecoration}
              className="opacity-60"
              theme={{
                accentColor: '#f59e0b', // Amber for New Year
              }}
              borderColor="rgb(245 158 11)" // Amber border for New Year
              disableInternalModal={true}
            />
          )}
        />
      </main>

      {/* Add Form Modal */}
      <FormModal
        isOpen={showForm}
        title="Add New Decoration Task"
        fields={
          getFormConfigEnhanced('tasks', 'add', {
            holidayKey: 'new-year' as any,
            shareMembers: shareMembers,
            auth0User: auth0User,
          }).fields
        }
        initialValues={{}}
        onSubmit={handleAddDecoration}
        onClose={() => setShowForm(false)}
        loading={createLoading}
        submitText={createLoading ? 'Adding...' : 'Add Decoration'}
        cardClassName="card-tasks"
      />

      {/* Edit Modal */}
      <FormModal
        isOpen={showEditModal}
        title="Edit Decoration Task"
        fields={
          getFormConfigEnhanced('tasks', 'edit', {
            holidayKey: 'new-year' as any,
            shareMembers: shareMembers,
            auth0User: auth0User,
          }).fields
        }
        initialValues={{
          title: editingTask?.title || '',
          description: editingTask?.description || '',
          priority: editingTask?.priority || 'medium',
          assignedTo: editingTask?.assignedTo || '',
          dueDate: editingTask?.dueDate
            ? new Date(editingTask.dueDate).toISOString().split('T')[0]
            : '',
        }}
        onSubmit={handleEditDecorationSubmit}
        onClose={() => {
          setShowEditModal(false);
          setEditingTask(null);
        }}
        loading={updateLoading}
        submitText={updateLoading ? 'Updating...' : 'Update Decoration'}
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
        title="Sort Decorations"
      />
    </div>
  );
}
