'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useHolidayPageData } from '@/hooks/useHolidayPageData';
import { useHolidayMutations } from '@/hooks/useHolidayMutations';
import { useRefreshHomeData } from '@/hooks/useRefreshHomeData';
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
import DeleteModal from '@/components/modals/DeleteModal';
import { getFormConfigEnhanced } from '@/config/formConfigs';
import { getDeleteConfig } from '@/config/deleteModalConfigs';

type SortOption = 'priority' | 'dateDue' | 'assignedTo' | 'category' | 'none';

const defaultMealPlanningTasks = [
  {
    title: 'Plan Traditional Turkey Menu',
    description: 'Decide on turkey preparation method and seasonings',
    priority: 'high' as const,
  },
  {
    title: 'Prepare Side Dish List',
    description: 'Plan stuffing, mashed potatoes, cranberry sauce, and vegetables',
    priority: 'high' as const,
  },
  {
    title: 'Dessert Planning',
    description: 'Organize pumpkin pie, apple pie, and other Thanksgiving desserts',
    priority: 'medium' as const,
  },
  {
    title: 'Calculate Serving Portions',
    description: 'Determine quantities based on guest count',
    priority: 'high' as const,
  },
  {
    title: 'Create Cooking Timeline',
    description: 'Schedule when to start each dish for coordinated meal',
    priority: 'high' as const,
  },
  {
    title: 'Prepare Make-Ahead Items',
    description: 'Plan dishes that can be prepared in advance',
    priority: 'medium' as const,
  },
  {
    title: 'Vegetarian/Dietary Options',
    description: 'Plan alternative dishes for dietary restrictions',
    priority: 'medium' as const,
  },
  {
    title: 'Appetizers and Beverages',
    description: 'Select pre-dinner snacks and drink options',
    priority: 'low' as const,
  },
  {
    title: 'Leftover Planning',
    description: 'Plan creative ways to use Thanksgiving leftovers',
    priority: 'low' as const,
  },
  {
    title: 'Final Menu Review',
    description: 'Double-check menu completeness and balance',
    priority: 'medium' as const,
  },
];

export default function ThanksgivingMealPlanningPage() {
  const dispatch = useAppDispatch();
  const { contacts } = useAppSelector((state: any) => state.addressBook);

  // Use centralized holiday page data hook
  const { holidayId, holidayData, auth0User, homeInitialized } =
    useHolidayPageData();
  const { isUserPlusMember, hasSubscription } = useSubscription();

  // Use standardized mutation hooks
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

  // Check if the holiday is shared to conditionally show assign to field
  const isHolidayShared = useAppSelector((state: any) =>
    selectIsHolidayShared(state, 'thanksgiving'),
  );

  // Get share members for Enhanced Compatibility Layer
  const shareMembers =
    useAppSelector((state: any) => state.shares.shareMembers) || [];

  // Name resolution helper functions
  const getAssignedUserName = (assignedToUuid: string): string | null => {
    if (!assignedToUuid || !shareMembers.length) return null;
    const member = shareMembers.find((m: any) => m.uuid === assignedToUuid);
    return member ? member.name || member.email || 'Unknown User' : assignedToUuid;
  };

  const transformTaskWithAssignment = (task: any) => ({
    ...task,
    assignedToName: task.assignedTo ? getAssignedUserName(task.assignedTo) : null,
  });

  // Enhanced Compatibility Layer - Task form configuration
  const addFormConfig = getFormConfigEnhanced('tasks', 'add', {
    holidayKey: 'thanksgiving',
    shareMembers: shareMembers,
    auth0User: auth0User,
  });

  const editFormConfig = getFormConfigEnhanced('tasks', 'edit', {
    holidayKey: 'thanksgiving',
    shareMembers: shareMembers,
    auth0User: auth0User,
  });

  // Redux data access - meal planning tasks are stored as tasks with category "Meal Planning"
  const mealPlanningTasks = useMemo(
    () =>
      (
        holidayData?.tasks?.filter(
          (task: any) => task.category === 'Meal Planning',
        ) || []
      ).map(transformTaskWithAssignment),
    [holidayData?.tasks, shareMembers],
  );
  const isLoading = !homeInitialized;
  const error = null;

  // Delete modal handlers
  const handleDeleteModalOpen = (task: any) => {
    setTaskToDelete(task);
    setShowDeleteModal(true);
  };

  const handleDeleteModalClose = () => {
    setTaskToDelete(null);
    setShowDeleteModal(false);
  };

  const handleConfirmDelete = async () => {
    if (!taskToDelete?.id || !holidayId) return;

    try {
      await deleteTask(taskToDelete.id);
      dispatch(
        removeTaskFromHomeData({
          holidayId: holidayId,
          taskId: taskToDelete.id,
        }),
      );
      await refreshHomeData(auth0User, holidayId);
      setShowDeleteModal(false);
      setTaskToDelete(null);
    } catch (error) {
      console.error('Error deleting task:', error);
      setShowDeleteModal(false);
      setTaskToDelete(null);
    }
  };

  // State management
  const [sortBy, setSortBy] = useState<SortOption>('none');
  const [showForm, setShowForm] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDefaultTasks, setShowDefaultTasks] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<any>(null);

  useEffect(() => {
    // Always fetch contacts for address book functionality
    dispatch(fetchContacts());
  }, [dispatch]);

  // Check if default meal planning tasks should be shown
  useEffect(() => {
    if (mealPlanningTasks.length === 0 && homeInitialized) {
      setShowDefaultTasks(true);
    }
  }, [mealPlanningTasks, homeInitialized]);

  const addDefaultMealPlanningTasks = async () => {
    if (!holidayId) return;

    try {
      // Create all default tasks
      for (const task of defaultMealPlanningTasks) {
        await createTask({
          title: task.title,
          description: task.description,
          priority: task.priority,
          assigned_to: undefined,
          due_date: undefined,
          category: 'Meal Planning',
        });
      }

      // Refresh home data after all tasks are added
      await refreshHomeData(auth0User, holidayId);
      setShowDefaultTasks(false);
    } catch (error) {
      console.error('Failed to add default tasks:', error);
    }
  };

  const handleAddTask = async (values: Record<string, any>) => {
    if (!values.title?.trim() || !holidayId) return;

    try {
      const result = await createTask({
        title: values.title,
        description: values.description,
        priority: values.priority,
        assigned_to: values.assigned_to || undefined,
        due_date: values.dueDate || undefined,
        category: 'Meal Planning',
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

  const handleToggleTask = async (taskId: string) => {
    const currentTask = mealPlanningTasks.find((task: any) => task.id === taskId);
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
        assigned_to: values.assigned_to || null,
        due_date: values.dueDate || null,
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

  const handleDelete = (taskId: string, taskTitle: string) => {
    const task = mealPlanningTasks.find((t: any) => t.id === taskId);
    if (task) {
      setTaskToDelete({ ...task, title: taskTitle });
      setShowDeleteModal(true);
    }
  };

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

  function sortTasks(tasksToSort: any[]): any[] {
    switch (sortBy) {
      case 'priority':
        return [...tasksToSort].sort((a, b) => {
          const priorityOrder: { [key: string]: number } = {
            high: 3,
            medium: 2,
            low: 1,
          };
          return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
        });
      case 'dateDue':
        return [...tasksToSort].sort((a, b) => {
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        });
      case 'assignedTo':
        return [...tasksToSort].sort((a, b) => {
          if (!a.assignedTo && !b.assignedTo) return 0;
          if (!a.assignedTo) return 1;
          if (!b.assignedTo) return -1;
          return a.assignedTo.localeCompare(b.assignedTo);
        });
      case 'category':
        return [...tasksToSort].sort((a, b) => {
          if (!a.category && !b.category) return 0;
          if (!a.category) return 1;
          if (!b.category) return -1;
          return a.category.localeCompare(b.category);
        });
      default:
        return tasksToSort;
    }
  }

  // Show loading only if home data is not initialized
  if (!homeInitialized) {
    return (
      <div className="min-h-screen thanksgiving-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">
            Loading meal planning...
          </p>
        </div>
      </div>
    );
  }

  const sortedTasks = sortTasks(mealPlanningTasks);
  const incompleteTasks = sortedTasks.filter((task: any) => !task.isCompleted);
  const completedTasks = sortedTasks.filter((task: any) => task.isCompleted);

  return (
    <div className="min-h-screen thanksgiving-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
      <HolidayPageHeader
        title="🍽️ Meal Planning"
        backHref="/thanksgiving"
        onSortClick={() => setShowSortModal(true)}
        description="Plan your Thanksgiving menu and dishes!"
        holidayColor="amber-600"
        sortTitle="Sort Tasks"
      />

      <main className="flex-1 w-full max-w-4xl flex flex-col gap-6 mt-4">
        {/* Default Tasks Prompt */}
        {showDefaultTasks && (
          <div className="card card-tasks rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700">
            <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
              🍽️ Set Up Meal Planning
            </h3>
            <p className="text-blue-700 dark:text-blue-300 text-sm mb-3">
              Would you like to add some common Thanksgiving meal planning tasks?
            </p>
            <div className="flex gap-2">
              <button
                onClick={addDefaultMealPlanningTasks}
                disabled={createLoading}
                className="bg-amber-500 hover:bg-amber-600 border border-amber-600 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {createLoading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                {createLoading ? 'Adding Tasks...' : 'Add Default Tasks'}
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

        <AddButton title="Task" onClick={openForm} color="amber" />

        {/* Task Status Summary */}
        {mealPlanningTasks.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Meal Planning Status</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {mealPlanningTasks.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Total Tasks
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {completedTasks.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Completed
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {incompleteTasks.length}
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
            title="Upcoming Tasks"
            items={incompleteTasks}
            isCompleted={false}
            emptyMessage="No meal planning tasks yet."
            completedMessage="All tasks completed!"
            renderItem={(task: any) => (
              <ToDoCard
                key={task.id}
                task={task}
                onToggleComplete={handleToggleTask}
                onDelete={(taskId: string) => handleDelete(taskId, task.title)}
                onEdit={handleEditTask}
                theme={{
                  accentColor: '#d97706', // Amber for Thanksgiving
                }}
                borderColor="rgb(217 119 6)" // Amber border for Thanksgiving
                disableInternalModal={true}
              />
            )}
          />
        )}

        {!createLoading && (
          <TaskSection
            title="Completed Tasks"
            items={completedTasks}
            isCompleted={true}
            emptyMessage=""
            completedMessage=""
            renderItem={(task: any) => (
              <ToDoCard
                key={task.id}
                task={task}
                onToggleComplete={handleToggleTask}
                onDelete={(taskId: string) => handleDelete(taskId, task.title)}
                onEdit={handleEditTask}
                className="opacity-60"
                theme={{
                  accentColor: '#d97706', // Amber for Thanksgiving
                }}
                borderColor="rgb(217 119 6)" // Amber border for Thanksgiving
                disableInternalModal={true}
              />
            )}
          />
        )}
      </main>

      {/* Form Modal */}
      <FormModal
        isOpen={showForm}
        title="Add New Meal Planning Task"
        fields={addFormConfig.fields}
        onSubmit={handleAddTask}
        onClose={closeForm}
        loading={createLoading}
        submitText={createLoading ? 'Processing...' : 'Add Task'}
        cardClassName="card-tasks"
        contacts={contacts}
        shareMembers={shareMembers}
      />

      {/* Edit Modal */}
      <FormModal
        isOpen={showEditModal}
        title="Edit Meal Planning Task"
        fields={editFormConfig.fields}
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
        loading={updateLoading}
        submitText={updateLoading ? 'Processing...' : 'Update Task'}
        cardClassName="card-tasks"
        contacts={contacts}
        shareMembers={shareMembers}
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
        title="Sort Tasks"
      />

      {/* Delete Modal */}
      {showDeleteModal && taskToDelete && (
        <DeleteModal
          isOpen={showDeleteModal}
          onConfirm={handleConfirmDelete}
          onCancel={handleDeleteModalClose}
          title={getDeleteConfig('tasks').title}
          message={getDeleteConfig('tasks').message}
          itemName={taskToDelete.title}
          confirmText={getDeleteConfig('tasks').confirmText}
          cancelText={getDeleteConfig('tasks').cancelText}
          loading={deleteLoading}
        />
      )}
    </div>
  );
}
