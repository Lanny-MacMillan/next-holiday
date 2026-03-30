'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { RootState } from '@/store';
import { useHolidayPageData } from '@/hooks/useHolidayPageData';
import { useHolidayMutations } from '@/hooks/useHolidayMutations';
import { useSubscription } from '@/hooks/useSubscription';
import { fetchContacts } from '@/store/slices/addressBookSlice';
import {
  selectIsHolidayShared,
  selectShareByHolidayKey,
} from '@/store/slices/sharesSlice';
import { getFormConfigEnhanced } from '@/config/formConfigs';
import { getDeleteConfig } from '@/config/deleteModalConfigs';
import SortModal from '@/components/modals/SortModal';
import FormModal from '@/components/modals/FormModal';
import DeleteModal from '@/components/modals/DeleteModal';
import HolidayPageHeader from '@/components/common/HolidayPageHeader';
import Footer from '@/components/common/Footer';
import AddButton from '@/components/common/AddButton';
import TaskSection from '@/components/common/TaskSection';
import ToDoCard from '@/components/cards/to-do/ToDoCard';

type SortOption = 'priority' | 'dateDue' | 'assignedTo' | 'category' | 'none';

export default function NewYearResolutionTrackerPage() {
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
          uuid: auth0User.id || '', // Database UUID for Enhanced Compatibility Layer
          name: auth0User.name || 'Me',
          email: auth0User.email || '',
          role: 'owner' as const,
        },
        // Add other members, filtering out current user if already present
        ...baseMembers
          .filter((member: any) => member.userId !== auth0User.sub)
          .map((member: any) => ({
            ...member,
            uuid: member.uuid || member.userId, // Prefer existing uuid field, fallback to userId only if uuid missing
          })),
      ]
    : baseMembers;

  const { contacts } = useAppSelector((state: any) => state.addressBook);

  // Helper function to resolve assignedTo UUID to user name
  const getAssignedUserName = (assignedToUuid: string): string | null => {
    if (!assignedToUuid || !shareMembers.length) return null;
    const member = shareMembers.find((m: any) => m.uuid === assignedToUuid);
    return member ? member.name || member.email || 'Unknown User' : assignedToUuid;
  };

  // Transform tasks to include assignedToName for display
  const transformTaskWithAssignment = (task: any) => ({
    ...task,
    // Preserve original assignedTo field for form editing (UUID)
    assignedTo: task.assignedTo,
    // Add display name for UI
    assignedToName: task.assignedTo ? getAssignedUserName(task.assignedTo) : null,
  });

  // Redux data access - resolutions are stored as tasks with category "Resolutions"
  const resolutions = useMemo(
    () =>
      (
        holidayData?.tasks?.filter((task: any) => task.category === 'Resolutions') ||
        []
      ).map(transformTaskWithAssignment),
    [holidayData?.tasks, shareMembers],
  );
  const isLoading = !homeInitialized;
  const error = null;

  // State management
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<any>(null);
  const [sortBy, setSortBy] = useState<SortOption>('none');
  const [showSortModal, setShowSortModal] = useState(false);

  useEffect(() => {
    // Always fetch contacts for address book functionality
    dispatch(fetchContacts());
  }, [dispatch]);

  // Check if default resolution tasks exist
  useEffect(() => {
    if (resolutions.length === 0 && homeInitialized) {
      // Handle default tasks if needed
    }
  }, [resolutions, homeInitialized]);

  const handleAddResolution = async (values: Record<string, any>) => {
    if (!values.title?.trim() || !holidayId) return;

    try {
      const newTask = {
        title: values.title,
        description: values.description || undefined,
        priority: values.priority as 'low' | 'medium' | 'high',
        assigned_to: values.assigned_to || undefined,
        category: 'Resolutions',
        due_date: values.dueDate || undefined,
        isCompleted: false,
        holidayId: holidayId,
      };

      // Use the standardized hook function
      await createTask(newTask);

      setShowAddModal(false);
    } catch (error) {
      console.error('Error creating resolution:', error);
    }
  };

  const handleEditResolution = (task: any) => {
    setEditingTask(task);
    setShowEditModal(true);
  };

  const handleEditSubmit = async (values: Record<string, any>) => {
    if (!editingTask || !holidayId) return;

    try {
      const updates = {
        title: values.title,
        description: values.description,
        priority: values.priority,
        assigned_to: values.assigned_to,
        category: 'Resolutions',
        due_date: values.dueDate,
      };

      await updateTask(editingTask.id, updates);

      setShowEditModal(false);
      setEditingTask(null);
    } catch (error) {
      console.error('Error updating resolution:', error);
    }
  };

  const handleDelete = (taskId: string) => {
    const taskToDelete = resolutions.find((task: any) => task.id === taskId);
    if (!taskToDelete) return;

    setTaskToDelete(taskToDelete);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!taskToDelete || !holidayId) return;

    try {
      await deleteTask(taskToDelete.id);
      setShowDeleteModal(false);
      setTaskToDelete(null);
    } catch (error) {
      console.error('Error deleting resolution:', error);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setTaskToDelete(null);
  };

  const handleToggleCompletion = async (taskId: string) => {
    // Find the current task to get its completion status
    const currentTask = resolutions.find((task: any) => task.id === taskId);
    if (!currentTask || !holidayId) {
      console.error('Task not found or no holiday ID:', taskId, holidayId);
      return;
    }

    const newCompletionStatus = !currentTask.isCompleted;

    try {
      // Use the standardized hook function
      await updateTask(taskId, { isCompleted: newCompletionStatus });
    } catch (error) {
      console.error('Error toggling resolution:', error);
    }
  };

  const openAddForm = () => {
    setEditingTask(null);
    setShowAddModal(true);
  };

  const closeForm = () => {
    setShowAddModal(false);
    setEditingTask(null);
  };

  // Sorting function
  const getSortedResolutions = () => {
    const sorted = [...resolutions].sort((a: any, b: any) => {
      switch (sortBy) {
        case 'priority':
          const priorityOrder: { [key: string]: number } = {
            high: 3,
            medium: 2,
            low: 1,
          };
          return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
        case 'dateDue':
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        case 'assignedTo':
          return (a.assignedToName || '').localeCompare(b.assignedToName || '');
        case 'category':
          return (a.category || '').localeCompare(b.category || '');
        default:
          return a.title.localeCompare(b.title);
      }
    });
    return sorted;
  };

  const sortedResolutions = getSortedResolutions();
  const incompleteResolutions = sortedResolutions.filter(
    (task: any) => !task.isCompleted,
  );
  const completedResolutions = sortedResolutions.filter(
    (task: any) => task.isCompleted,
  );

  const deleteConfig = getDeleteConfig('tasks');

  return (
    <div className="min-h-screen new-year-cards-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
      <HolidayPageHeader
        title="Resolution Tracker"
        backHref="/new-year"
        onSortClick={() => setShowSortModal(true)}
        description="Track your New Year resolutions and goals!"
        holidayColor="amber-600"
        sortTitle="Sort Resolutions"
        error={error ? 'API Error' : undefined}
      />

      <main className="flex-1 w-full max-w-4xl flex flex-col gap-6 mt-4">
        <AddButton
          title="Resolution"
          onClick={openAddForm}
          color="amber"
          disabled={isLoading || createLoading}
        />

        {/* Task Sections */}
        <TaskSection
          title="Pending Resolutions"
          items={incompleteResolutions}
          isCompleted={false}
          emptyMessage="No resolutions set yet."
          completedMessage="All resolutions achieved!"
          renderItem={(task: any) => (
            <ToDoCard
              key={task.id}
              task={task}
              onToggleComplete={handleToggleCompletion}
              onDelete={handleDelete}
              onEdit={handleEditResolution}
              theme={{
                accentColor: '#f97316', // Orange for New Year celebration
              }}
              borderColor="rgb(249 115 22)" // Orange border for New Year
              disableInternalModal={true}
            />
          )}
        />
        <TaskSection
          title="Completed Resolutions"
          items={completedResolutions}
          isCompleted={true}
          emptyMessage="No resolutions completed yet."
          completedMessage="Great job achieving your resolutions!"
          renderItem={(task: any) => (
            <ToDoCard
              key={task.id}
              task={task}
              onToggleComplete={handleToggleCompletion}
              onDelete={handleDelete}
              onEdit={handleEditResolution}
              theme={{
                accentColor: '#f97316', // Orange for New Year
              }}
              borderColor="rgb(249 115 22)" // Orange border
              disableInternalModal={true}
            />
          )}
        />
      </main>

      {/* Sort Modal */}
      <SortModal
        isOpen={showSortModal}
        onClose={() => setShowSortModal(false)}
        sortBy={sortBy}
        onSortChange={(sortOption: string) => setSortBy(sortOption as SortOption)}
        sortOptions={[
          { value: 'none', label: 'Default' },
          { value: 'priority', label: 'Priority' },
          { value: 'dateDue', label: 'Due Date' },
          { value: 'assignedTo', label: 'Assigned To' },
        ]}
        title="Sort Resolutions"
      />

      {/* Add Form Modal */}
      <FormModal
        isOpen={showAddModal}
        title="Add New Resolution"
        fields={
          getFormConfigEnhanced('tasks', 'add', {
            holidayKey: 'new-year' as any,
            shareMembers: shareMembers,
            auth0User: auth0User,
          }).fields
        }
        initialValues={{}}
        onSubmit={handleAddResolution}
        onClose={closeForm}
        loading={createLoading}
        submitText={createLoading ? 'Adding...' : 'Add Resolution'}
        cancelText="Cancel"
        cardClassName="card-events-new-year"
      />

      {/* Edit Form Modal */}
      <FormModal
        isOpen={showEditModal}
        title="Edit Resolution"
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
          assigned_to: editingTask?.assignedTo || '',
          dueDate: editingTask?.dueDate ? editingTask.dueDate.split('T')[0] : '',
        }}
        onSubmit={handleEditSubmit}
        onClose={() => {
          setShowEditModal(false);
          setEditingTask(null);
        }}
        loading={updateLoading}
        submitText={updateLoading ? 'Updating...' : 'Update Resolution'}
        cancelText="Cancel"
        cardClassName="card-events-new-year"
      />

      {/* Delete Modal */}
      <DeleteModal
        isOpen={showDeleteModal}
        onCancel={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        loading={deleteLoading}
        title={deleteConfig.title}
        message={deleteConfig.message}
        itemName={taskToDelete?.title}
        confirmText={deleteConfig.confirmText}
        cancelText={deleteConfig.cancelText}
        confirmButtonColor={deleteConfig.confirmButtonColor}
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
        title="Sort Resolutions"
      />

      <Footer />
    </div>
  );
}
