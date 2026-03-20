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

const defaultDecorationTasks = [
  {
    title: 'Kinara Candle Holder Setup',
    description: 'Set up the seven-branched kinara candle holder as centerpiece',
    priority: 'high' as const,
  },
  {
    title: 'Mkeka Mat Placement',
    description: 'Place the mkeka (straw mat) as foundation for all decorations',
    priority: 'high' as const,
  },
  {
    title: 'Unity Cup Display',
    description: 'Set up Kikombe cha Umoja (unity cup) for ceremonies',
    priority: 'high' as const,
  },
  {
    title: 'African Decorative Elements',
    description: 'Add traditional African art, fabrics, and cultural displays',
    priority: 'medium' as const,
  },
  {
    title: 'Red, Black, Green Color Scheme',
    description: 'Incorporate Kwanzaa colors throughout decoration scheme',
    priority: 'medium' as const,
  },
  {
    title: 'Harvest Display Setup',
    description: 'Create display of fruits and vegetables (mazao)',
    priority: 'medium' as const,
  },
  {
    title: 'Corn Decoration Arrangement',
    description: 'Place ears of corn (vibunzi) representing children',
    priority: 'low' as const,
  },
  {
    title: 'Heritage Wall Creation',
    description: 'Create family heritage and ancestral photo display',
    priority: 'medium' as const,
  },
  {
    title: 'Seven Principles Banners',
    description: 'Create and hang banners for each Kwanzaa principle',
    priority: 'low' as const,
  },
  {
    title: 'Candle Lighting Area Setup',
    description: 'Prepare safe space for daily candle lighting ceremonies',
    priority: 'high' as const,
  },
];

export default function KwanzaaDecorationsPage() {
  const dispatch = useAppDispatch();
  const { contacts } = useAppSelector((state: any) => state.addressBook);
  const { holidayId, auth0User } = useFormModalMutation();

  // Get Redux data
  const holidayPreferences = useAppSelector(selectHolidayPreferences);
  const homeInitialized = useAppSelector(selectHomeInitialized);
  const homeData = useAppSelector(selectHomeData);

  // Check if the holiday is shared to conditionally show assign to field
  const isHolidayShared = useAppSelector((state: any) =>
    selectIsHolidayShared(state, 'kwanzaa'),
  );

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

  // Redux data access - decorations are stored as tasks with category "Decorations"
  const holidayData = useAppSelector(state =>
    selectHolidayPrefById(state, holidayId!),
  );
  const decorations =
    holidayData?.tasks?.filter((task: any) => task.category === 'Decorations') || [];
  const isLoading = !homeInitialized;
  const error = null;

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

    setIsAdding(true);

    const newTask = {
      id: `temp-${Date.now()}`,
      title: values.title,
      description: values.description || undefined,
      priority: values.priority as 'low' | 'medium' | 'high',
      assignedTo: values.assigned_to || undefined,
      category: 'Decorations',
      dueDate: values.dueDate || undefined,
      isCompleted: false,
      holidayId: holidayId,
    };

    try {
      // Optimistically update Redux state first
      console.log('Adding decoration optimistically:', newTask);
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

      console.log('🐛 [KwanzaaDecorationsAdd] API payload:', apiPayload);

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

      setShowForm(false);
    } catch (error) {
      // Remove optimistic update on error
      dispatch(removeTaskFromHomeData({ holidayId: holidayId, taskId: newTask.id }));
      console.error('Failed to add decoration:', error);
    } finally {
      setIsAdding(false);
    }
  }

  async function addDefaultDecorationTasks() {
    if (!holidayId || !auth0User) return;

    setIsAdding(true);
    try {
      for (const task of defaultDecorationTasks) {
        const newTask = {
          id: `temp-${Date.now()}-${task.title}`,
          ...task,
          isCompleted: false,
          holidayId: holidayId,
          category: 'Decorations',
        };

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
              'Failed to add default decoration:',
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
          console.error('Failed to add default decoration:', taskError);
        }
      }
      setShowDefaultTasks(false);
    } catch (error) {
      console.error('Error adding default decorations:', error);
    } finally {
      setIsAdding(false);
    }
  }

  async function handleToggleCompletion(taskId: string) {
    if (!holidayId || !auth0User) return;

    setIsToggling(true);

    const currentTask = decorations.find((task: any) => task.id === taskId);
    if (!currentTask) return;

    const updatedTask = {
      ...currentTask,
      isCompleted: !currentTask.isCompleted,
      completedDate: !currentTask.isCompleted ? new Date().toISOString() : null,
    };

    try {
      // Optimistically update Redux
      dispatch(
        updateTaskInHomeData({
          holidayId: holidayId,
          taskId,
          updates: updatedTask,
        }),
      );

      const response = await fetch(`/api/holidays/${holidayId}/tasks/${taskId}`, {
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
          isCompleted: !currentTask.isCompleted,
        }),
      });

      if (!response.ok) {
        // Revert optimistic update on error
        dispatch(
          updateTaskInHomeData({
            holidayId: holidayId,
            taskId,
            updates: currentTask,
          }),
        );
        console.error('Failed to toggle decoration completion');
      }
    } catch (error) {
      // Revert optimistic update on error
      dispatch(
        updateTaskInHomeData({
          holidayId: holidayId,
          taskId,
          updates: currentTask,
        }),
      );
      console.error('Error toggling decoration:', error);
    } finally {
      setIsToggling(false);
    }
  }

  async function handleEditDecoration(values: Record<string, any>) {
    if (!values.title?.trim() || !editingTask || !holidayId || !auth0User) return;

    setIsUpdating(true);

    const updatedTask = {
      ...editingTask,
      title: values.title,
      description: values.description || undefined,
      priority: values.priority as 'low' | 'medium' | 'high',
      assignedTo: values.assigned_to || undefined,
      dueDate: values.dueDate || undefined,
    };

    try {
      // Optimistically update Redux
      dispatch(
        updateTaskInHomeData({
          holidayId: holidayId,
          taskId: editingTask.id,
          updates: updatedTask,
        }),
      );

      // Map to API format
      const apiPayload = {
        title: values.title,
        description: values.description || undefined,
        priority: values.priority as 'low' | 'medium' | 'high',
        assigned_to: values.assigned_to || undefined, // snake_case for API
        due_date: values.dueDate || undefined, // snake_case for API
        category: 'Decorations',
        isCompleted: editingTask.isCompleted,
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

      if (response.ok) {
        const result = await response.json();
        dispatch(
          updateTaskInHomeData({
            holidayId: holidayId,
            taskId: editingTask.id,
            updates: result,
          }),
        );
      } else {
        // Revert optimistic update on error
        dispatch(
          updateTaskInHomeData({
            holidayId: holidayId,
            taskId: editingTask.id,
            updates: editingTask,
          }),
        );
        console.error('Failed to update decoration');
      }

      setEditingTask(null);
      setShowEditModal(false);
    } catch (error) {
      // Revert optimistic update on error
      dispatch(
        updateTaskInHomeData({
          holidayId: holidayId,
          taskId: editingTask.id,
          updates: editingTask,
        }),
      );
      console.error('Error updating decoration:', error);
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleDelete(taskId: string) {
    if (!holidayId || !auth0User) return;

    setIsDeleting(true);

    const taskToDelete = decorations.find((task: any) => task.id === taskId);
    if (!taskToDelete) return;

    try {
      // Optimistically remove from Redux
      dispatch(removeTaskFromHomeData({ holidayId: holidayId, taskId }));

      const response = await fetch(`/api/holidays/${holidayId}/tasks/${taskId}`, {
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
        // Restore task on error
        dispatch(addTaskToHomeData({ holidayId: holidayId, task: taskToDelete }));
        console.error('Failed to delete decoration');
      }
    } catch (error) {
      // Restore task on error
      dispatch(addTaskToHomeData({ holidayId: holidayId, task: taskToDelete }));
      console.error('Error deleting decoration:', error);
    } finally {
      setIsDeleting(false);
    }
  }

  // Sorting function
  function sortTasks(tasksToSort: any[]): any[] {
    switch (sortBy) {
      case 'priority':
        const priorityOrder: { [key: string]: number } = {
          high: 3,
          medium: 2,
          low: 1,
        };
        return [...tasksToSort].sort(
          (a, b) =>
            (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0),
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

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen kwanzaa-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading decorations...</p>
        </div>
      </div>
    );
  }

  // Sort and separate decorations
  const sortedDecorations = sortTasks(
    (decorations || []).map(transformTaskWithAssignment),
  );
  const incompleteDecorations = sortedDecorations.filter(
    (decoration: any) => !decoration.isCompleted,
  );
  const completedDecorations = sortedDecorations.filter(
    (decoration: any) => decoration.isCompleted,
  );

  return (
    <div className="min-h-screen kwanzaa-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
      <HolidayPageHeader
        title="Decorations Checklist"
        backHref="/kwanzaa"
        onSortClick={() => setShowSortModal(true)}
        sortTitle="Sort Decorations"
        error={error ? 'API Error' : undefined}
        holidayColor="red-600"
      />
      <main className="w-full max-w-4xl flex flex-col gap-6">
        {/* Default Tasks Prompt */}
        {showDefaultTasks && (
          <div className="card card-tasks rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700">
            <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
              ✨ Set Up Kwanzaa Decorations
            </h3>
            <p className="text-blue-700 dark:text-blue-300 text-sm mb-3">
              Would you like to add common Kwanzaa decoration tasks?
            </p>
            <div className="flex gap-2">
              <button
                onClick={addDefaultDecorationTasks}
                disabled={isAdding}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors text-sm disabled:opacity-50"
              >
                {isAdding ? 'Adding...' : 'Add Default Tasks'}
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
          color="red"
          disabled={isAdding}
        />

        {sortBy !== 'none' && (
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            {sortBy === 'priority' && 'Sorted by Priority'}
            {sortBy === 'dateDue' && 'Sorted by Date Due'}
            {sortBy === 'assignedTo' && 'Sorted by Assigned To'}
            {sortBy === 'category' && 'Sorted by Category'}
          </div>
        )}

        {/* Pending Decorations */}
        <TaskSection
          title="Pending Decorations"
          items={incompleteDecorations}
          isCompleted={false}
          emptyMessage="No decorations planned yet."
          completedMessage="All decorations completed!"
          renderItem={(decoration: any) => (
            <ToDoCard
              key={decoration.id}
              task={decoration}
              onToggleComplete={handleToggleCompletion}
              onDelete={handleDelete}
              onEdit={(task: any) => {
                setEditingTask(task);
                setShowEditModal(true);
              }}
              theme={{
                accentColor: '#dc2626', // Red for Kwanzaa
              }}
              borderColor="rgb(220 38 38)" // Red border for Kwanzaa
              disableInternalModal={true}
            />
          )}
        />

        {/* Completed Decorations */}
        <TaskSection
          title="Completed Decorations"
          items={completedDecorations}
          isCompleted={true}
          emptyMessage="No decorations completed yet."
          completedMessage=""
          renderItem={(decoration: any) => (
            <ToDoCard
              key={decoration.id}
              task={decoration}
              onToggleComplete={handleToggleCompletion}
              onDelete={handleDelete}
              onEdit={(task: any) => {
                setEditingTask(task);
                setShowEditModal(true);
              }}
              theme={{
                accentColor: '#dc2626', // Red for Kwanzaa
              }}
              borderColor="rgb(220 38 38)" // Red border for Kwanzaa
              disableInternalModal={true}
            />
          )}
        />
      </main>

      {/* Form Modal for Adding */}
      <FormModal
        isOpen={showForm}
        title="Add Decoration Task"
        fields={
          getFormConfigEnhanced('tasks', 'add', {
            customTitle: 'Add Decoration Task',
            holidayKey: 'kwanzaa',
            shareMembers: shareMembers,
            auth0User: auth0User,
          }).fields
        }
        initialValues={{}}
        onSubmit={handleAddDecoration}
        onClose={() => setShowForm(false)}
        loading={isAdding}
        submitText={isAdding ? 'Processing...' : 'Add Decoration'}
        cancelText="Cancel"
        cardClassName="card card-tasks"
        submitButtonColor="#dc2626" // Kwanzaa red
      />

      {/* Form Modal for Editing */}
      <FormModal
        isOpen={showEditModal}
        title="Edit Decoration Task"
        fields={
          getFormConfigEnhanced('tasks', 'edit', {
            customTitle: 'Edit Decoration Task',
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
                // CRITICAL: Format date for input field
                dueDate: editingTask.dueDate
                  ? editingTask.dueDate.includes('T')
                    ? editingTask.dueDate.split('T')[0]
                    : editingTask.dueDate
                  : '',
              }
            : {}
        }
        onSubmit={handleEditDecoration}
        onClose={() => {
          setShowEditModal(false);
          setEditingTask(null);
        }}
        loading={isUpdating}
        submitText={isUpdating ? 'Processing...' : 'Update Decoration'}
        cancelText="Cancel"
        cardClassName="card card-tasks"
        submitButtonColor="#dc2626" // Kwanzaa red
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
          { value: 'dateDue', label: 'Date Due' },
          { value: 'assignedTo', label: 'Assigned To' },
          { value: 'category', label: 'Category' },
        ]}
        title="Sort Decorations"
      />
    </div>
  );
}
