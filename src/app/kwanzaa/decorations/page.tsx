'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useHolidayPageData } from '@/hooks/useHolidayPageData';
import { useHolidayMutations } from '@/hooks/useHolidayMutations';
import { fetchContacts } from '@/store/slices/addressBookSlice';
import {
  updateTaskInHomeData,
  addTaskToHomeData,
  removeTaskFromHomeData,
  setHomeData,
} from '@/store/slices/homeSlice';
import {
  selectIsHolidayShared,
  selectShareByHolidayKey,
} from '@/store/slices/sharesSlice';
import { getFormConfigEnhanced } from '@/config/formConfigs';
import SortModal from '@/components/modals/SortModal';
import FormModal from '@/components/modals/FormModal';
import DeleteModal from '@/components/modals/DeleteModal';
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
  const decorations = useMemo(
    () =>
      (
        holidayData?.tasks?.filter((task: any) => task.category === 'Decorations') ||
        []
      ).map(transformTaskWithAssignment),
    [holidayData?.tasks, shareMembers],
  );
  const isLoading = !homeInitialized;

  // State management
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<any>(null);
  const [showDefaultTasks, setShowDefaultTasks] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('none');
  const [showSortModal, setShowSortModal] = useState(false);

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

  // CRUD Operations Pattern (using standardized hooks)
  async function handleAddDecoration(values: Record<string, any>) {
    if (!values.title?.trim()) return;
    if (!holidayId || !auth0User) return;

    try {
      const result = await createTask({
        title: values.title,
        description: values.description || undefined,
        priority: values.priority as 'low' | 'medium' | 'high',
        assigned_to: values.assigned_to || undefined, // snake_case for API
        category: 'Decorations',
        due_date: values.dueDate || undefined,
      });

      // Update Redux state immediately
      dispatch(addTaskToHomeData({ holidayId: holidayId, task: result }));

      setShowForm(false);
    } catch (error) {
      console.error('Error creating decoration:', error);
    }
  }

  async function addDefaultDecorationTasks() {
    if (!holidayId || !auth0User) return;

    try {
      for (const task of defaultDecorationTasks) {
        const result = await createTask({
          title: task.title,
          description: task.description,
          priority: task.priority,
          assigned_to: undefined, // Use proper snake_case field mapping
          due_date: undefined, // Use proper snake_case field mapping
          category: 'Decorations',
        });

        // Update Redux state immediately
        dispatch(addTaskToHomeData({ holidayId: holidayId, task: result }));
      }

      setShowDefaultTasks(false);
    } catch (error) {
      console.error('Error adding default decorations:', error);
    }
  }

  async function handleToggleCompletion(taskId: string) {
    if (!holidayId || !auth0User) return;

    const decoration = decorations.find((d: any) => d.id === taskId);
    if (!decoration) return;

    try {
      const result = await updateTask(taskId, {
        isCompleted: !decoration.isCompleted,
      });

      // Update Redux state
      dispatch(
        updateTaskInHomeData({
          holidayId: holidayId,
          taskId: taskId,
          updates: { isCompleted: !decoration.isCompleted },
        }),
      );

      // Refresh home data to update progress on main holiday page
    } catch (error) {
      console.error('Error toggling decoration:', error);
    }
  }

  async function handleEditDecoration(values: Record<string, any>) {
    if (!values.title?.trim() || !editingTask || !holidayId || !auth0User) return;

    try {
      const result = await updateTask(editingTask.id, {
        title: values.title,
        description: values.description || undefined,
        priority: values.priority as 'low' | 'medium' | 'high',
        assigned_to: values.assigned_to || undefined, // snake_case for API
        due_date: values.dueDate || undefined,
      });

      // Update Redux state
      dispatch(
        updateTaskInHomeData({
          holidayId: holidayId,
          taskId: editingTask.id,
          updates: result,
        }),
      );

      setEditingTask(null);
      setShowEditModal(false);
    } catch (error) {
      console.error('Error updating decoration:', error);
    }
  }

  async function handleDelete(taskId: string) {
    const task = decorations.find((t: any) => t.id === taskId);
    if (task) {
      setTaskToDelete(task);
      setShowDeleteModal(true);
    }
  }

  async function confirmDelete() {
    if (!taskToDelete || !holidayId || !auth0User) return;

    try {
      await deleteTask(taskToDelete.id);

      // Remove from Redux state on success
      dispatch(
        removeTaskFromHomeData({ holidayId: holidayId, taskId: taskToDelete.id }),
      );

      setShowDeleteModal(false);
      setTaskToDelete(null);
    } catch (error) {
      console.error('Error deleting decoration:', error);
    }
  }

  function cancelDelete() {
    setShowDeleteModal(false);
    setTaskToDelete(null);
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
  const sortedDecorations = sortTasks(decorations || []);
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
        error={undefined}
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
                disabled={createLoading}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors text-sm disabled:opacity-50"
              >
                {createLoading ? 'Adding...' : 'Add Default Tasks'}
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
          disabled={createLoading}
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
        loading={createLoading}
        submitText={createLoading ? 'Adding...' : 'Add Decoration'}
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
        loading={updateLoading}
        submitText={updateLoading ? 'Updating...' : 'Update Decoration'}
        cancelText="Cancel"
        cardClassName="card card-tasks"
        submitButtonColor="#dc2626" // Kwanzaa red
      />

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={showDeleteModal}
        title="Delete Decoration Task?"
        message={`Are you sure you want to delete "${taskToDelete?.title || 'this decoration task'}"? This action cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        loading={deleteLoading}
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
