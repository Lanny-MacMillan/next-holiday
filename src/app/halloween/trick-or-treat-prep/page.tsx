'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useHolidayPageData } from '@/hooks/useHolidayPageData';
import { useHolidayMutations } from '@/hooks/useHolidayMutations';
import { useSubscription } from '@/hooks/useSubscription';
import { fetchContacts } from '@/store/slices/addressBookSlice';
import {
  selectIsHolidayShared,
  selectShareByHolidayKey,
} from '@/store/slices/sharesSlice';
import { getFormConfigEnhanced } from '@/config/formConfigs';
import SortModal from '@/components/modals/SortModal';
import FormModal from '@/components/modals/FormModal';
import DeleteModal from '@/components/modals/DeleteModal';
import { getDeleteConfig } from '@/config/deleteModalConfigs';
import HolidayPageHeader from '@/components/common/HolidayPageHeader';
import AddButton from '@/components/common/AddButton';
import TaskSection from '@/components/common/TaskSection';
import ToDoCard from '@/components/cards/to-do/ToDoCard';

type SortOption = 'priority' | 'dateDue' | 'assignedTo' | 'category' | 'none';

const defaultTrickOrTreatTasks = [
  {
    title: 'Buy Halloween Candy',
    description: 'Stock up on candy for trick-or-treaters',
    category: 'Trick-or-Treat Prep',
    priority: 'high' as const,
  },
  {
    title: 'Prepare Trick-or-Treat Route',
    description: 'Plan route for trick-or-treating',
    category: 'Trick-or-Treat Prep',
    priority: 'medium' as const,
  },
  {
    title: 'Buy Glow Sticks',
    description: 'For safety during trick-or-treating',
    category: 'Trick-or-Treat Prep',
    priority: 'medium' as const,
  },
  {
    title: 'Check Flashlights',
    description: 'Ensure flashlights work for evening trick-or-treating',
    category: 'Trick-or-Treat Prep',
    priority: 'low' as const,
  },
];

export default function HalloweenTrickOrTreatPrepPage() {
  const dispatch = useAppDispatch();
  const { contacts } = useAppSelector((state: any) => state.addressBook);
  const { isUserPlusMember, hasSubscription } = useSubscription();

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
  const isAuthorizedForSharing = hasSubscription && isUserPlusMember;

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
  const trickOrTreatPrep = useMemo(
    () =>
      (
        holidayData?.tasks?.filter(
          (task: any) => task.category === 'Trick or Treat Prep',
        ) || []
      ).map(transformTaskWithAssignment),
    [holidayData?.tasks, shareMembers],
  );
  const isLoading = !homeInitialized;
  const error = null;

  // State management
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDefaultTasks, setShowDefaultTasks] = useState(false);
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

  // Check if default trick-or-treat prep tasks exist
  useEffect(() => {
    if (trickOrTreatPrep.length === 0 && homeInitialized) {
      setShowDefaultTasks(true);
    }
  }, [trickOrTreatPrep, homeInitialized]);

  useEffect(() => {
    // Always fetch contacts for address book functionality
    dispatch(fetchContacts());
  }, [dispatch]);

  // CRUD Operations - Add Trick-or-Treat Prep with optimistic updates + refreshHomeData
  const handleAddTrickOrTreatPrep = async (values: any) => {
    if (!values.title?.trim() || !holidayId) return;

    setIsSubmitting(true);
    try {
      const result = await createTask({
        title: values.title,
        description: values.description,
        priority: values.priority,
        assigned_to: values.assigned_to || undefined, // Use snake_case for API
        due_date: values.dueDate || undefined, // Use snake_case for API
        category: 'Trick or Treat Prep',
      });

      setShowForm(false);
    } catch (error) {
      console.error('Error creating task:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addDefaultTrickOrTreatTasks = async () => {
    for (const task of defaultTrickOrTreatTasks) {
      await createTask({
        title: task.title,
        description: task.description,
        priority: task.priority,
        category: 'Trick or Treat Prep',
      });
    }
    setShowDefaultTasks(false);
  };

  const handleToggleCompletion = async (taskId: string) => {
    const currentTask = trickOrTreatPrep.find((task: any) => task.id === taskId);
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

  const handleEditTrickOrTreatPrep = (task: any) => {
    setEditingTask(task);
    setShowEditModal(true);
  };

  const handleEditTrickOrTreatPrepSubmit = async (values: any) => {
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

  const handleDelete = async (taskId: string) => {
    if (!holidayId) return;

    try {
      await deleteTask(taskId);
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  function handleDeleteClick(taskId: string) {
    setDeleteConfirm({ show: true, taskId });
  }

  async function confirmDelete() {
    if (deleteConfirm.taskId) {
      await handleDelete(deleteConfirm.taskId);
      setDeleteConfirm({ show: false, taskId: null });
    }
  }

  function cancelDelete() {
    setDeleteConfirm({ show: false, taskId: null });
  }

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

  if (isLoading) {
    return (
      <div className="min-h-screen halloween-tasks-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
        <div className="w-full max-w-4xl flex flex-col gap-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          </div>
        </div>
      </div>
    );
  }

  const sortedTasks = sortTasks(trickOrTreatPrep);
  const incompleteTrickOrTreatPrep = sortedTasks.filter(
    (task: any) => !task.isCompleted,
  );
  const completedTrickOrTreatPrep = sortedTasks.filter(
    (task: any) => task.isCompleted,
  );

  const renderTaskItem = (task: any) => (
    <ToDoCard
      key={task.id}
      task={task}
      onToggleComplete={handleToggleCompletion}
      onDelete={handleDeleteClick}
      onEdit={handleEditTrickOrTreatPrep}
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
        title="Trick-or-Treat Prep"
        backHref="/halloween"
        onSortClick={() => setShowSortModal(true)}
        sortTitle="Sort tasks"
        description="Get ready for Halloween trick-or-treating!"
        holidayColor="orange-500"
        error={undefined}
      />
      <main className="w-full max-w-4xl flex flex-col gap-6">
        <AddButton title="Trick-or-Treat Task" onClick={openForm} color="orange" />

        {/* Default Tasks Suggestion */}
        {showDefaultTasks && (
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-orange-800 dark:text-orange-200 mb-2">
              Get started with common trick-or-treat prep tasks!
            </h3>
            <p className="text-orange-700 dark:text-orange-300 mb-3">
              Would you like to add some suggested trick-or-treat preparation tasks?
            </p>
            <div className="flex gap-2">
              <button
                onClick={addDefaultTrickOrTreatTasks}
                className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
              >
                Add Suggested Tasks
              </button>
              <button
                onClick={() => setShowDefaultTasks(false)}
                className="bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
              >
                No Thanks
              </button>
            </div>
          </div>
        )}

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
          title="Pending Trick-or-Treat Prep"
          items={incompleteTrickOrTreatPrep}
          isCompleted={false}
          emptyMessage="No trick-or-treat prep tasks yet."
          completedMessage="All trick-or-treat prep completed!"
          renderItem={renderTaskItem}
        />

        <TaskSection
          title="Completed Trick-or-Treat Prep"
          items={completedTrickOrTreatPrep}
          isCompleted={true}
          emptyMessage="No completed trick-or-treat prep yet."
          completedMessage=""
          renderItem={renderTaskItem}
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
        onSubmit={handleAddTrickOrTreatPrep}
        onClose={closeForm}
        loading={isSubmitting}
        submitText={isSubmitting ? 'Processing...' : 'Add Task'}
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
          assigned_to: (() => {
            // The form expects UUID as the value since buildAssignToField uses member.uuid
            console.log('=== EDIT MODAL DEBUG ===');
            console.log('editingTask?.assignedTo:', editingTask?.assignedTo);
            console.log('shareMembers:', shareMembers);

            // For Enhanced Compatibility Layer, the assigned_to field expects UUID values
            // directly, not userId. The options are built with member.uuid as values.
            return editingTask?.assignedTo || '';
          })(),
          dueDate: editingTask?.dueDate
            ? new Date(editingTask.dueDate).toISOString().split('T')[0]
            : '',
        }}
        onSubmit={handleEditTrickOrTreatPrepSubmit}
        onClose={closeEditModal}
        loading={isEditSubmitting}
        submitText={isEditSubmitting ? 'Processing...' : 'Update Task'}
        cardClassName="card-tasks"
        contacts={contacts}
        shareMembers={shareMembers}
      />

      {/* Delete Modal */}
      <DeleteModal
        isOpen={deleteConfirm.show}
        onCancel={cancelDelete}
        onConfirm={confirmDelete}
        loading={deleteLoading}
        title="Delete Task?"
        message="Are you sure you want to delete this task? This action cannot be undone."
        cardClassName="bg-white rounded-lg shadow-lg"
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonColor="#ef4444"
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
