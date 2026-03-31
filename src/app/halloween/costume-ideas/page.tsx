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
import FormModal from '@/components/modals/FormModal';
import HolidayPageHeader from '@/components/common/HolidayPageHeader';
import AddButton from '@/components/common/AddButton';
import TaskSection from '@/components/common/TaskSection';
import ToDoCard from '@/components/cards/to-do/ToDoCard';
import DeleteModal from '@/components/modals/DeleteModal';

type SortOption = 'priority' | 'dateDue' | 'assignedTo' | 'category' | 'none';

export default function HalloweenCostumeIdeasPage() {
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

  const costumeIdeas = useMemo(
    () =>
      (
        holidayData?.tasks?.filter(
          (task: any) => task.category === 'Costume Ideas',
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

  // CRUD Operations - Add Costume Idea with optimistic updates + refreshHomeData
  const handleAddCostumeIdea = async (values: any) => {
    if (!values.title?.trim() || !holidayId) return;

    setIsSubmitting(true);
    try {
      const result = await createTask({
        title: values.title,
        description: values.description,
        priority: values.priority,
        assigned_to: values.assigned_to || undefined, // Use snake_case for API
        due_date: values.dueDate || undefined, // Use snake_case for API
        category: 'Costume Ideas',
      });

      setShowForm(false);
    } catch (error) {
      console.error('Error creating task:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleCompletion = async (taskId: string) => {
    const currentTask = costumeIdeas.find((task: any) => task.id === taskId);
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

  const handleEditCostumeIdea = (task: any) => {
    setEditingTask(task);
    setShowEditModal(true);
  };

  const handleEditCostumeIdeaSubmit = async (values: any) => {
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

  const sortedTasks = sortTasks(costumeIdeas);
  const incompleteCostumeIdeas = sortedTasks.filter(
    (task: any) => !task.isCompleted,
  );
  const completedCostumeIdeas = sortedTasks.filter((task: any) => task.isCompleted);

  const renderTaskItem = (task: any) => (
    <ToDoCard
      key={task.id}
      task={task}
      onToggleComplete={handleToggleCompletion}
      onDelete={handleDeleteClick}
      onEdit={handleEditCostumeIdea}
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
        title="Costume Ideas"
        backHref="/halloween"
        onSortClick={() => setShowSortModal(true)}
        sortTitle="Sort tasks"
        description="Brainstorm and organize Halloween costume ideas!"
        holidayColor="orange-500"
        error={undefined}
      />
      <main className="w-full max-w-4xl flex flex-col gap-6">
        <AddButton title="Costume Idea" onClick={openForm} color="orange" />
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
          title="Pending Costume Ideas"
          items={incompleteCostumeIdeas}
          isCompleted={false}
          emptyMessage="No costume ideas yet."
          completedMessage="All costume ideas completed!"
          renderItem={renderTaskItem}
        />

        <TaskSection
          title="Completed Costume Ideas"
          items={completedCostumeIdeas}
          isCompleted={true}
          emptyMessage="No completed costume ideas yet."
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
        onSubmit={handleAddCostumeIdea}
        onClose={closeForm}
        loading={isSubmitting}
        submitText={isSubmitting ? 'Processing...' : 'Add Costume Idea'}
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
        onSubmit={handleEditCostumeIdeaSubmit}
        onClose={closeEditModal}
        loading={isEditSubmitting}
        submitText={isEditSubmitting ? 'Processing...' : 'Update Costume'}
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
        title="Delete Task?"
        message="Are you sure you want to delete this costume idea? This action cannot be undone."
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
