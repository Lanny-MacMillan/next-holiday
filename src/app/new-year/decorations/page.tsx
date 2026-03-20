'use client';

import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useFormModalMutation } from '@/hooks/useFormModalMutation';
import { fetchContacts } from '@/store/slices/addressBookSlice';
import {
  updateTaskInHomeData,
  setHomeData,
  addTaskToHomeData,
  removeTaskFromHomeData,
} from '@/store/slices/homeSlice';
import {
  selectHolidayPreferences,
  selectHomeInitialized,
  selectHomeData,
  selectHolidayPrefById,
} from '@/store/selectors/home';
import { selectIsHolidayShared } from '@/store/slices/sharesSlice';
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
  const { contacts } = useAppSelector((state: any) => state.addressBook);
  const { holidayId, auth0User } = useFormModalMutation();

  // Enhanced Compatibility Layer
  const shareMembers = useAppSelector((state: any) => state.shares.shareMembers);

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

  // Get Redux data
  const holidayPreferences = useAppSelector(selectHolidayPreferences);
  const homeInitialized = useAppSelector(selectHomeInitialized);
  const homeData = useAppSelector(selectHomeData);

  // Check if the holiday is shared to conditionally show assign to field
  const isHolidayShared = useAppSelector((state: any) =>
    selectIsHolidayShared(state, 'new-year'),
  );

  // Redux data access - decorations are stored as tasks with category "Decorations"
  const holidayData = useAppSelector(state =>
    selectHolidayPrefById(state, holidayId!),
  );
  const decorations =
    holidayData?.tasks?.filter((task: any) => task.category === 'Decorations') || [];
  const isLoading = !homeInitialized;

  // Refresh home data function
  const refreshHomeData = async () => {
    if (!auth0User?.sub || !holidayId) return;

    try {
      const response = await fetch('/api/home', {
        headers: {
          'Content-Type': 'application/json',
          'x-test-user': JSON.stringify(auth0User),
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
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDefaultTasks, setShowDefaultTasks] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('none');
  const [showSortModal, setShowSortModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    dispatch(fetchContacts());
  }, [dispatch]);

  // Check if default decoration tasks exist
  useEffect(() => {
    if (decorations.length === 0 && homeInitialized) {
      setShowDefaultTasks(true);
    }
  }, [decorations, homeInitialized]);

  // CRUD Operations - Add Decoration with optimistic updates + refreshHomeData + API field mapping
  async function handleAddDecoration(values: Record<string, any>) {
    if (!values.title?.trim()) return;
    if (!holidayId || !auth0User) return;

    setIsSubmitting(true);

    const newTask = {
      id: `temp-${Date.now()}`,
      title: values.title,
      description: values.description || undefined,
      priority: values.priority as 'low' | 'medium' | 'high',
      assignedTo: values.assignedTo || undefined,
      category: 'Decorations',
      dueDate: values.dueDate || undefined,
      isCompleted: false,
      holidayId: holidayId,
    };

    try {
      // Optimistically update Redux state first
      dispatch(addTaskToHomeData({ holidayId: holidayId, task: newTask }));

      // CRITICAL: Map camelCase to snake_case for API
      const apiPayload = {
        title: values.title,
        description: values.description || undefined,
        priority: values.priority as 'low' | 'medium' | 'high',
        assigned_to: values.assigned_to || undefined, // snake_case for API
        category: 'Decorations',
        due_date: values.dueDate || undefined, // snake_case for API
        isCompleted: false,
      };

      const response = await fetch(`/api/holidays/${holidayId}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-test-user': JSON.stringify(auth0User),
        },
        body: JSON.stringify(apiPayload), // Use mapped payload
      });

      if (response.ok) {
        const result = await response.json();
        dispatch(
          removeTaskFromHomeData({
            holidayId: holidayId,
            taskId: newTask.id,
          }),
        );
        dispatch(addTaskToHomeData({ holidayId: holidayId, task: result }));

        // CRITICAL: Refresh home data for proper UI updates
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
          'Failed to add decoration:',
          response.status,
          response.statusText,
        );
      }

      setShowAddModal(false);
    } catch (error) {
      // Remove optimistic update on error
      dispatch(removeTaskFromHomeData({ holidayId: holidayId, taskId: newTask.id }));
      console.error('Failed to add decoration:', error);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function addDefaultDecorationTasks() {
    if (!holidayId || !auth0User) return;

    setIsSubmitting(true);
    try {
      for (const task of defaultDecorationTasks) {
        const newTask = {
          id: `temp-${Date.now()}-${task.title}`,
          ...task,
          category: 'Decorations',
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
              'x-test-user': JSON.stringify(auth0User),
            },
            body: JSON.stringify({
              ...task,
              category: 'Decorations',
              isCompleted: false,
            }),
          });

          if (response.ok) {
            const result = await response.json();
            dispatch(
              removeTaskFromHomeData({
                holidayId: holidayId,
                taskId: newTask.id,
              }),
            );
            dispatch(addTaskToHomeData({ holidayId: holidayId, task: result }));
          } else {
            dispatch(
              removeTaskFromHomeData({
                holidayId: holidayId,
                taskId: newTask.id,
              }),
            );
            console.error(
              'Failed to add default decoration task:',
              response.status,
              response.statusText,
            );
          }
        } catch (taskError) {
          dispatch(
            removeTaskFromHomeData({
              holidayId: holidayId,
              taskId: newTask.id,
            }),
          );
          console.error('Failed to add default decoration task:', taskError);
        }
      }

      setShowDefaultTasks(false);
    } catch (error) {
      console.error('Failed to add default decoration tasks:', error);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleCompletion(taskId: string) {
    if (!holidayId || !auth0User) return;

    setIsToggling(true);
    try {
      const currentTask = decorations.find((task: any) => task.id === taskId);
      if (!currentTask) {
        console.error('Task not found:', taskId);
        return;
      }

      const newCompletionStatus = !currentTask.isCompleted;

      // Optimistically update the Redux home data
      dispatch(
        updateTaskInHomeData({
          holidayId: holidayId,
          taskId: taskId,
          updates: { isCompleted: newCompletionStatus },
        }),
      );

      const response = await fetch(`/api/holidays/${holidayId}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-test-user': JSON.stringify(auth0User),
        },
        body: JSON.stringify({
          isCompleted: newCompletionStatus,
        }),
      });

      if (!response.ok) {
        // Revert the optimistic update on error
        dispatch(
          updateTaskInHomeData({
            holidayId: holidayId,
            taskId: taskId,
            updates: { isCompleted: currentTask.isCompleted },
          }),
        );
        console.error(
          'Failed to toggle decoration:',
          response.status,
          response.statusText,
        );
      }
    } catch (error) {
      console.error('Failed to toggle decoration:', error);
    } finally {
      setIsToggling(false);
    }
  }

  const handleEditDecoration = (task: any) => {
    setEditingTask(task);
    setShowEditModal(true);
  };

  async function handleEditDecorationSubmit(values: Record<string, any>) {
    if (!editingTask || !holidayId || !auth0User) return;

    setIsEditSubmitting(true);
    try {
      const updatedTask = {
        title: values.title,
        description: values.description || undefined,
        priority: values.priority as 'low' | 'medium' | 'high',
        assignedTo: values.assigned_to || undefined,
        category: 'Decorations',
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

      // CRITICAL: Map camelCase to snake_case for API
      const apiPayload = {
        title: values.title,
        description: values.description || undefined,
        priority: values.priority as 'low' | 'medium' | 'high',
        assigned_to: values.assigned_to || undefined, // snake_case for API
        category: 'Decorations',
        due_date: values.dueDate || undefined, // snake_case for API
      };

      const response = await fetch(
        `/api/holidays/${holidayId}/tasks/${editingTask.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'x-test-user': JSON.stringify(auth0User),
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
          'Failed to update decoration:',
          response.status,
          response.statusText,
        );
      }

      setEditingTask(null);
      setShowEditModal(false);
    } catch (error) {
      console.error('Failed to update decoration:', error);
    } finally {
      setIsEditSubmitting(false);
    }
  }

  async function handleDelete(taskId: string) {
    if (!holidayId || !auth0User) return;

    const taskToDelete = decorations.find((task: any) => task.id === taskId);
    if (!taskToDelete) return;

    setIsDeleting(true);
    try {
      // Optimistically update Redux state first
      dispatch(removeTaskFromHomeData({ holidayId: holidayId, taskId }));

      const response = await fetch(`/api/holidays/${holidayId}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-test-user': JSON.stringify(auth0User),
        },
      });

      if (!response.ok) {
        // If API failed, revert the optimistic update
        dispatch(addTaskToHomeData({ holidayId: holidayId, task: taskToDelete }));
        console.error(
          'Failed to delete decoration:',
          response.status,
          response.statusText,
        );
      } else {
        // Check if this was the last task and re-show default tasks prompt
        const remainingDecorations = decorations.filter(d => d.id !== taskId);
        if (remainingDecorations.length === 0) {
          setShowDefaultTasks(true);
        }
      }
    } catch (error) {
      // If API failed, revert the optimistic update
      dispatch(addTaskToHomeData({ holidayId: holidayId, task: taskToDelete }));
      console.error('Failed to delete decoration:', error);
    } finally {
      setIsDeleting(false);
    }
  }

  function openForm() {
    setShowAddModal(true);
  }

  function closeForm() {
    setShowAddModal(false);
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

  const loading = isSubmitting || isEditSubmitting || isDeleting || isToggling;

  if (isLoading) {
    return (
      <div className="min-h-screen new-year-tasks-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading decorations...</p>
        </div>
      </div>
    );
  }

  const sortedTasks = sortTasks(decorations.map(transformTaskWithAssignment));
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
                disabled={isSubmitting}
                className="bg-amber-500 text-white px-4 py-2 rounded hover:bg-amber-600 transition-colors text-sm disabled:opacity-50"
              >
                {isSubmitting ? 'Adding...' : 'Add Default Decorations'}
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

        <AddButton title="Decoration Task" onClick={openForm} color="amber" />

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
        isOpen={showAddModal}
        title="Add New Decoration Task"
        fields={
          getFormConfigEnhanced('tasks', 'add', {
            holidayKey: 'new-year',
            shareMembers: shareMembers,
            auth0User: auth0User,
          }).fields
        }
        initialValues={{}}
        onSubmit={handleAddDecoration}
        onClose={closeForm}
        loading={isSubmitting}
        submitText={isSubmitting ? 'Processing...' : 'Add Decoration'}
        cardClassName="card-tasks"
      />

      {/* Edit Modal */}
      <FormModal
        isOpen={showEditModal}
        title="Edit Decoration Task"
        fields={
          getFormConfigEnhanced('tasks', 'edit', {
            holidayKey: 'new-year',
            shareMembers: shareMembers,
            auth0User: auth0User,
          }).fields
        }
        initialValues={{
          title: editingTask?.title || '',
          description: editingTask?.description || '',
          priority: editingTask?.priority || 'medium',
          assigned_to: editingTask?.assignedTo || '',
          dueDate: editingTask?.dueDate
            ? new Date(editingTask.dueDate).toISOString().split('T')[0]
            : '',
        }}
        onSubmit={handleEditDecorationSubmit}
        onClose={closeEditModal}
        loading={isEditSubmitting}
        submitText={isEditSubmitting ? 'Processing...' : 'Update Decoration'}
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
