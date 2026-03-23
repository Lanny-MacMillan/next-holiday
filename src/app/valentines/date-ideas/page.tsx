'use client';

import { useState, useEffect, useMemo } from 'react';
import { useHolidayPageData } from '@/hooks/useHolidayPageData';
import { useHolidayMutations } from '@/hooks/useHolidayMutations';
import { useRefreshHomeData } from '@/hooks/useRefreshHomeData';
import { useSubscription } from '@/hooks/useSubscription';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { RootState } from '@/store';
import { fetchContacts } from '@/store/slices/addressBookSlice';
import {
  selectIsHolidayShared,
  selectShareByHolidayKey,
} from '@/store/slices/sharesSlice';
import { getFormConfigEnhanced } from '@/config/formConfigs';
import {
  updateTaskInHomeData,
  setHomeData,
  addTaskToHomeData,
  removeTaskFromHomeData,
} from '@/store/slices/homeSlice';
import SortModal from '@/components/modals/SortModal';
import FormModal from '@/components/modals/FormModal';
import DeleteModal from '@/components/modals/DeleteModal';
import HolidayPageHeader from '@/components/common/HolidayPageHeader';
import Footer from '@/components/common/Footer';
import AddButton from '@/components/common/AddButton';
import DateTrackerCard from '@/components/cards/DateTrackerCard';
import DateIdeaCard from '@/components/cards/DateIdeaCard';
import TaskSection from '@/components/common/TaskSection';

export default function ValentinesDateIdeasPage() {
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

  const { refreshHomeData } = useRefreshHomeData();

  const isHolidayShared = useAppSelector((state: any) =>
    selectIsHolidayShared(state, 'valentines'),
  );
  const isAuthorizedForSharing = hasSubscription && isUserPlusMember;

  // Get share members for Enhanced Compatibility Layer
  const shareData = useAppSelector((state: RootState) =>
    selectShareByHolidayKey(state, 'valentines'),
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
            uuid: member.uuid || member.userId, // Ensure uuid field exists - prefer existing uuid over userId
          })),
      ]
    : baseMembers;

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

  // Redux Data Access (Date Ideas are stored as tasks with category "Date Ideas")
  const dateIdeas = useMemo(
    () =>
      (
        holidayData?.tasks?.filter((task: any) => task.category === 'Date Ideas') ||
        []
      ).map(transformTaskWithAssignment),
    [holidayData?.tasks, shareMembers],
  );
  const isLoading = !homeInitialized;
  const error = null;

  const [editingTask, setEditingTask] = useState<any>(null);
  const [showSortModal, setShowSortModal] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [sortBy, setSortBy] = useState('title');

  useEffect(() => {
    // Always fetch contacts for address book functionality
    dispatch(fetchContacts());
  }, [dispatch]);

  // CRUD Operations using useHolidayMutations hook
  const handleAddDateIdea = async (values: Record<string, any>) => {
    if (!values.title?.trim() || !holidayId || !auth0User) return;

    try {
      const newTask = {
        title: values.title,
        description: values.description || undefined,
        priority: values.priority as 'low' | 'medium' | 'high',
        ...(isAuthorizedForSharing &&
          isHolidayShared && { assigned_to: values.assigned_to || undefined }),
        category: 'Date Ideas',
        due_date: values.dueDate,
      };

      const result = await createTask(newTask);

      // Update Redux state immediately
      dispatch(addTaskToHomeData({ holidayId, task: result }));

      // Refresh home data to ensure UI is in sync
      await refreshHomeData(auth0User, holidayId);

      setShowForm(false);
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const handleEditDateIdea = (task: any) => {
    setEditingTask({
      ...task,
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '', // CRITICAL: Format date for input (same as New Year)
    });
    setShowForm(true);
  };

  const handleUpdateDateIdea = async (values: Record<string, any>) => {
    if (!holidayId || !auth0User || !editingTask) return;

    try {
      const updates = {
        title: values.title,
        description: values.description || undefined,
        priority: values.priority as 'low' | 'medium' | 'high',
        ...(isAuthorizedForSharing &&
          isHolidayShared && { assigned_to: values.assigned_to || undefined }),
        category: 'Date Ideas',
        due_date: values.dueDate ? values.dueDate.split('T')[0] : undefined, // Format date for API
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

      setShowForm(false);
      setEditingTask(null);
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleToggleCompletion = async (taskId: string) => {
    const currentTask = dateIdeas.find((task: any) => task.id === taskId);
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

  const handleDelete = (taskId: string, taskTitle: string) => {
    const task = dateIdeas.find((t: any) => t.id === taskId);

    setTaskToDelete({
      id: taskId,
      title: taskTitle || task?.title || 'this item', // Fallback to task title or generic text
    });
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!holidayId || !taskToDelete) return;

    try {
      await deleteTask(taskToDelete.id);

      // Update Redux state immediately
      dispatch(
        removeTaskFromHomeData({
          holidayId,
          taskId: taskToDelete.id,
        }),
      );

      // Refresh home data to ensure UI is in sync
      await refreshHomeData(auth0User, holidayId);

      setShowDeleteModal(false);
      setTaskToDelete(null);
    } catch (error) {
      console.error('Error deleting date idea:', error);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setTaskToDelete(null);
  };

  const openAddForm = () => {
    setEditingTask(null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingTask(null);
  };

  // Data sorting and completion filtering
  const sortedDateIdeas = [...dateIdeas].sort((a: any, b: any) => {
    switch (sortBy) {
      case 'title':
        return a.title.localeCompare(b.title);
      case 'priority':
        const priorityOrder: { [key: string]: number } = {
          high: 3,
          medium: 2,
          low: 1,
        };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      case 'dueDate':
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      case 'completed':
        return a.isCompleted === b.isCompleted ? 0 : a.isCompleted ? 1 : -1;
      default:
        return 0;
    }
  });

  const completeDateIdeas = sortedDateIdeas.filter((task: any) => task.isCompleted);
  const incompleteDateIdeas = sortedDateIdeas.filter(
    (task: any) => !task.isCompleted,
  );

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const loading = createLoading || updateLoading || deleteLoading;

  // Form fields configuration using Enhanced Compatibility Layer
  const formFields = getFormConfigEnhanced('tasks', 'add', {
    holidayKey: 'valentines',
    shareMembers: shareMembers,
    auth0User: auth0User,
  }).fields;

  return (
    <div className="min-h-screen valentines-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
      <HolidayPageHeader
        title="Date Ideas"
        backHref="/valentines"
        onSortClick={() => setShowSortModal(true)}
        description="Keep track of your date ideas!"
        holidayColor="pink-500"
        sortTitle="Sort Date Ideas"
        error={undefined}
      />

      <main className="flex-1 w-full max-w-4xl flex flex-col gap-6 mt-4">
        {/* Summary Stats */}
        <DateTrackerCard
          totalIdeas={dateIdeas.length}
          completedIdeas={completeDateIdeas.length}
          highPriorityIdeas={
            dateIdeas.filter((task: any) => task.priority === 'high').length
          }
          dueSoonIdeas={
            dateIdeas.filter((task: any) => {
              if (!task.dueDate) return false;
              const dueDate = new Date(task.dueDate);
              const now = new Date();
              const diffDays = Math.ceil(
                (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
              );
              return diffDays <= 7 && diffDays >= 0;
            }).length
          }
          holidayColor="bg-gradient-to-br from-pink-300 to-pink-500"
        />

        <AddButton
          title="Date Idea"
          onClick={openAddForm}
          color="pink"
          disabled={loading}
        />

        {/* Task Sections using TaskSection component */}
        {!homeInitialized ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto"></div>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Loading date ideas...
            </p>
          </div>
        ) : (
          <>
            <TaskSection
              title="Pending Date Ideas"
              items={incompleteDateIdeas}
              isCompleted={false}
              emptyMessage="No date ideas set yet."
              completedMessage="All date ideas planned!"
              renderItem={(task: any) => (
                <DateIdeaCard
                  key={task.id}
                  task={task}
                  onToggleCompletion={() => handleToggleCompletion(task.id)}
                  onEdit={handleEditDateIdea}
                  onDelete={() => handleDelete(task.id, task.title)}
                  getPriorityColor={getPriorityColor}
                />
              )}
            />

            {completeDateIdeas.length > 0 && (
              <TaskSection
                title="Completed Date Ideas"
                items={completeDateIdeas}
                isCompleted={true}
                emptyMessage="No completed date ideas yet."
                completedMessage=""
                renderItem={(task: any) => (
                  <DateIdeaCard
                    key={task.id}
                    task={task}
                    onToggleCompletion={() => handleToggleCompletion(task.id)}
                    onEdit={handleEditDateIdea}
                    onDelete={() => handleDelete(task.id, task.title)}
                    getPriorityColor={getPriorityColor}
                  />
                )}
              />
            )}
          </>
        )}
      </main>

      {/* Sort Modal */}
      <SortModal
        isOpen={showSortModal}
        onClose={() => setShowSortModal(false)}
        sortBy={sortBy}
        onSortChange={setSortBy}
        sortOptions={[
          { value: 'title', label: 'Title' },
          { value: 'priority', label: 'Priority' },
          { value: 'dueDate', label: 'Due Date' },
          { value: 'completed', label: 'Completion Status' },
        ]}
        title="Sort Date Ideas"
      />

      {/* Form Modal */}
      <FormModal
        isOpen={showForm}
        title={editingTask ? 'Edit Date Idea' : 'Add New Date Idea'}
        fields={formFields}
        shareMembers={shareMembers}
        initialValues={
          editingTask
            ? {
                title: editingTask.title,
                description: editingTask.description || '',
                priority: editingTask.priority,
                assigned_to: editingTask.assignedTo || '',
                dueDate: editingTask.dueDate || '',
              }
            : {}
        }
        onSubmit={editingTask ? handleUpdateDateIdea : handleAddDateIdea}
        onClose={closeForm}
        loading={loading}
        submitText={
          editingTask
            ? updateLoading
              ? 'Updating...'
              : 'Update Date Idea'
            : createLoading
              ? 'Adding...'
              : 'Add Date Idea'
        }
        cancelText="Cancel"
        cardClassName="card-events-valentines"
      />

      {/* Delete Modal */}
      <DeleteModal
        isOpen={showDeleteModal}
        onCancel={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Date Idea"
        message={`Are you sure you want to delete "${taskToDelete?.title}"? This action cannot be undone.`}
        loading={deleteLoading}
      />
      <Footer />
    </div>
  );
}
