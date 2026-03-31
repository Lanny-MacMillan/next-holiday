'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useHolidayPageData } from '@/hooks/useHolidayPageData';
import { useHolidayMutations } from '@/hooks/useHolidayMutations';
import { fetchContacts } from '@/store/slices/addressBookSlice';
import {
  selectIsHolidayShared,
  selectShareByHolidayKey,
} from '@/store/slices/sharesSlice';
import { getFormConfigEnhanced } from '@/config/formConfigs';
import SortModal from '@/components/modals/SortModal';
import DeleteModal from '@/components/modals/DeleteModal';
import FormModal from '@/components/modals/FormModal';
import HolidayPageHeader from '@/components/common/HolidayPageHeader';
import AddButton from '@/components/common/AddButton';
import TaskSection from '@/components/common/TaskSection';
import ToDoCard from '@/components/cards/to-do/ToDoCard';

type SortOption = 'priority' | 'dateDue' | 'assignedTo' | 'category' | 'none';

export default function HalloweenDecorationsPage() {
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

  // Check if the holiday is shared to conditionally show assign to field
  const isHolidayShared = useAppSelector((state: any) =>
    selectIsHolidayShared(state, holidayId!),
  );

  const shareMembers =
    useAppSelector((state: any) => selectShareByHolidayKey(state, 'halloween'))
      ?.members || [];

  // Name resolution for assignment display
  const getAssignedUserName = (assignedToUuid: string): string | null => {
    if (!assignedToUuid || !shareMembers.length) return null;
    const member = shareMembers.find((m: any) => m.uuid === assignedToUuid);
    return member ? member.name || member.email || 'Unknown User' : assignedToUuid;
  };

  const transformTaskWithAssignment = (task: any) => ({
    ...task,
    assignedToName: task.assignedTo ? getAssignedUserName(task.assignedTo) : null,
  });

  // Data filtering using holidayData from the hook with assignment name resolution
  const decorations = useMemo(
    () =>
      (
        holidayData?.tasks?.filter((task: any) => task.category === 'Decorations') ||
        []
      ).map(transformTaskWithAssignment),
    [holidayData?.tasks, shareMembers],
  );
  const isLoading = !homeInitialized;
  const error = null;

  // State management
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('none');
  const [showSortModal, setShowSortModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    show: boolean;
    taskId: string | null;
  }>({
    show: false,
    taskId: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  useEffect(() => {
    // Always fetch contacts for address book functionality
    dispatch(fetchContacts());
  }, [dispatch]);

  // CRUD Operations - Add Decoration with optimistic updates + refreshHomeData
  const handleAddDecoration = async (values: any) => {
    if (!values.title?.trim() || !holidayId) return;

    setIsSubmitting(true);
    try {
      const result = await createTask({
        title: values.title,
        description: values.description,
        priority: values.priority,
        assigned_to: values.assigned_to || undefined, // Use snake_case for API
        due_date: values.dueDate || undefined, // Use snake_case for API
        category: 'Decorations',
      });

      setShowForm(false);
    } catch (error) {
      console.error('Error creating task:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  function openForm() {
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
  }

  const handleToggleCompletion = async (taskId: string) => {
    const currentTask = decorations.find((task: any) => task.id === taskId);
    if (!currentTask || !holidayId) return;

    const newCompletionStatus = !currentTask.isCompleted;

    try {
      // Update API
      await updateTask(taskId, {
        isCompleted: newCompletionStatus,
      });
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  function handleDelete(taskId: string) {
    setDeleteConfirm({ show: true, taskId });
  }

  const handleEditDecoration = (task: any) => {
    setEditingTask(task);
    setShowEditModal(true);
  };

  const handleEditDecorationSubmit = async (values: any) => {
    if (!editingTask || !holidayId) return;

    setIsEditSubmitting(true);
    try {
      const updates = {
        title: values.title,
        description: values.description,
        priority: values.priority,
        assigned_to: values.assigned_to || null, // Use snake_case for API
        due_date: values.dueDate || null, // Use snake_case for API
      };

      await updateTask(editingTask.id, updates);

      setEditingTask(null);
      setShowEditModal(false);
    } catch (error) {
      console.error('Error updating task:', error);
    } finally {
      setIsEditSubmitting(false);
    }
  };

  function closeEditModal() {
    setShowEditModal(false);
    setEditingTask(null);
  }

  async function confirmDelete() {
    if (deleteConfirm.taskId && holidayId) {
      try {
        await deleteTask(deleteConfirm.taskId);
      } catch (error) {
        console.error('Error deleting task:', error);
      } finally {
        setDeleteConfirm({ show: false, taskId: null });
      }
    }
  }

  function cancelDelete() {
    setDeleteConfirm({ show: false, taskId: null });
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

  // Show loading only if home data is not initialized
  if (!homeInitialized) {
    return (
      <div className="min-h-screen halloween-tasks-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading decorations...</p>
        </div>
      </div>
    );
  }

  const sortedTasks = sortTasks(decorations);
  const incompleteDecorations = sortedTasks.filter((task: any) => !task.isCompleted);
  const completedDecorations = sortedTasks.filter((task: any) => task.isCompleted);

  const renderTaskItem = (task: any) => (
    <ToDoCard
      key={task.id}
      task={task}
      onToggleComplete={handleToggleCompletion}
      onDelete={handleDelete}
      onEdit={handleEditDecoration}
      theme={{
        accentColor: '#f97316', // Orange for Halloween
      }}
      borderColor="rgb(249 115 22)" // Orange border for Halloween
      disableInternalModal={true}
    />
  );

  return (
    <div className="min-h-screen halloween-tasks-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
      <HolidayPageHeader
        title="Decorations"
        backHref="/halloween"
        onSortClick={() => setShowSortModal(true)}
        sortTitle="Sort tasks"
        description="Keep track of Halloween decorations!"
        holidayColor="orange-500"
        error={undefined}
      />
      <main className="w-full max-w-4xl flex flex-col gap-6">
        <AddButton title="Decoration Task" onClick={openForm} color="orange" />
        <div className="flex items-center justify-center">
          {sortBy !== 'none' && (
            <div className="text-center text-sm text-gray-600 dark:text-gray-400">
              {sortBy === 'priority' && 'Sorted by Priority'}
              {sortBy === 'dateDue' && 'Sorted by Date Due'}
              {sortBy === 'assignedTo' && 'Sorted by Assigned To'}
              {sortBy === 'category' && 'Sorted by Category'}
            </div>
          )}
        </div>

        <TaskSection
          title="Pending Decorations"
          items={incompleteDecorations}
          isCompleted={false}
          emptyMessage="No decorations planned yet."
          completedMessage="All decorations completed!"
          renderItem={renderTaskItem}
          // cardClassName="card-tasks"
        />

        <TaskSection
          title="Completed Decorations"
          items={completedDecorations}
          isCompleted={true}
          emptyMessage="No completed decorations yet."
          completedMessage=""
          renderItem={renderTaskItem}
          // cardClassName="card-tasks"
        />
      </main>

      {/* Form Modal */}
      <FormModal
        isOpen={showForm}
        {...getFormConfigEnhanced('tasks', 'add', {
          holidayKey: 'halloween',
          shareMembers: shareMembers,
          auth0User: auth0User,
        })}
        onSubmit={handleAddDecoration}
        onClose={closeForm}
        loading={isSubmitting}
        submitText={isSubmitting ? 'Processing...' : 'Add Decoration'}
        cardClassName="card-tasks"
        contacts={contacts}
        shareMembers={shareMembers}
      />

      {/* Edit Modal */}
      <FormModal
        isOpen={showEditModal}
        {...getFormConfigEnhanced('tasks', 'edit', {
          holidayKey: 'halloween',
          shareMembers: shareMembers,
          auth0User: auth0User,
        })}
        initialValues={{
          title: editingTask?.title || '',
          description: editingTask?.description || '',
          priority: editingTask?.priority || 'medium',
          assigned_to: editingTask?.assignedTo || '', // Form expects UUID directly
          dueDate: editingTask?.dueDate
            ? new Date(editingTask.dueDate).toISOString().split('T')[0]
            : '',
        }}
        onSubmit={handleEditDecorationSubmit}
        onClose={closeEditModal}
        loading={isEditSubmitting}
        submitText={isEditSubmitting ? 'Processing...' : 'Update Decoration'}
        cardClassName="card-tasks"
        contacts={contacts}
        shareMembers={shareMembers}
      />

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={deleteConfirm.show}
        onCancel={cancelDelete}
        onConfirm={confirmDelete}
        loading={deleteLoading}
        // cardClassName="card-tasks"
        title="Confirm Delete"
        message="Are you sure you want to delete this decoration task? This action cannot be undone."
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
        title="Sort Tasks"
      />
    </div>
  );
}
