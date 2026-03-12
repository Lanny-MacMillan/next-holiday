'use client';

import { useState, useEffect } from 'react';
import { useFormModalMutation } from '@/hooks/useFormModalMutation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchContacts } from '@/store/slices/addressBookSlice';
import {
  selectHolidayPreferences,
  selectHomeInitialized,
  selectHomeData,
  selectHolidayPrefById,
} from '@/store/selectors/home';
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
  const { holidayId, auth0User } = useFormModalMutation();
  const { contacts, isHolidayShared } = useAppSelector(
    (state: any) => state.addressBook,
  );

  // Get home data and holiday data from Redux
  const homeData = useAppSelector(selectHomeData);
  const homeInitialized = useAppSelector(selectHomeInitialized);
  const holidayPreferences = useAppSelector(selectHolidayPreferences);

  // Redux data access using selectHolidayPrefById
  const holidayData = useAppSelector(state =>
    selectHolidayPrefById(state, holidayId!),
  );

  // Redux Data Access (Date Ideas are stored as tasks with category "Date Ideas")
  const dateIdeas =
    holidayData?.tasks?.filter((task: any) => task.category === 'Date Ideas') || [];
  const isLoading = !homeInitialized;

  // RefreshHomeData Function (CRITICAL for UI updates)
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
      } else {
        console.error(
          '🐛 [RefreshHomeData] Response not ok:',
          response.status,
          response.statusText,
        );
      }
    } catch (error) {
      console.error('Error refreshing home data:', error);
    }
  };

  const [editingTask, setEditingTask] = useState<any>(null);
  const [showSortModal, setShowSortModal] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [sortBy, setSortBy] = useState('title');
  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    // Always fetch contacts for address book functionality
    dispatch(fetchContacts());
  }, [dispatch]);

  // CRUD Operations with Direct API Calls and Field Mapping
  const handleAddDateIdea = async (values: Record<string, any>) => {
    if (!holidayId || !auth0User) return;

    setIsAdding(true);

    const newTask = {
      id: `temp-${Date.now()}`,
      title: values.title,
      description: values.description || undefined,
      priority: values.priority as 'low' | 'medium' | 'high',
      assignedTo: values.assignedTo || undefined,
      category: 'Date Ideas',
      dueDate: values.dueDate || undefined,
      isCompleted: false,
      holidayId: holidayId,
    };

    // Optimistically update Redux state first
    dispatch(addTaskToHomeData({ holidayId: holidayId, task: newTask }));

    try {
      // CRITICAL: Map camelCase to snake_case for API
      const apiPayload = {
        title: values.title,
        description: values.description || undefined,
        priority: values.priority as 'low' | 'medium' | 'high',
        assigned_to: values.assignedTo || undefined, // snake_case for API
        category: 'Date Ideas',
        due_date: values.dueDate || undefined, // snake_case for API
        isCompleted: false,
      };

      const response = await fetch(`/api/holidays/${holidayId}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-test-user': JSON.stringify(auth0User),
        },
        body: JSON.stringify(apiPayload),
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
        setShowForm(false);
      } else {
        // Revert optimistic update
        dispatch(
          removeTaskFromHomeData({
            holidayId: holidayId,
            taskId: newTask.id,
          }),
        );
        console.error('Error adding date idea:', response.statusText);
      }
    } catch (error) {
      // Revert optimistic update
      dispatch(removeTaskFromHomeData({ holidayId: holidayId, taskId: newTask.id }));
      console.error('Error adding date idea:', error);
    } finally {
      setIsAdding(false);
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

    setIsAdding(true);

    try {
      // CRITICAL: Map camelCase to snake_case for API
      const apiPayload = {
        title: values.title,
        description: values.description || undefined,
        priority: values.priority as 'low' | 'medium' | 'high',
        assigned_to: values.assignedTo || undefined, // snake_case for API
        category: 'Date Ideas',
        due_date: values.dueDate ? values.dueDate.split('T')[0] : undefined, // CRITICAL: Format date same as edit (prevent timezone issues)
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

      if (response.ok) {
        const result = await response.json();

        // Use the exact pattern from working New Year resolution tracker
        dispatch(
          updateTaskInHomeData({
            holidayId: holidayId,
            taskId: editingTask.id,
            updates: result, // Use result directly, not result.data
          }),
        );

        // Add back refresh to ensure UI consistency
        await refreshHomeData();

        setShowForm(false);
        setEditingTask(null);
      } else {
        console.error('Error updating date idea:', response.statusText);
        const errorText = await response.text();
        console.error('Error details:', errorText);
      }
    } catch (error) {
      console.error('Error updating date idea:', error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggleCompletion = async (taskId: string) => {
    if (!holidayId || !auth0User) return;

    try {
      const task = dateIdeas.find((t: any) => t.id === taskId);
      if (task) {
        const response = await fetch(`/api/holidays/${holidayId}/tasks/${taskId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'x-test-user': JSON.stringify(auth0User),
          },
          body: JSON.stringify({ isCompleted: !task.isCompleted }),
        });

        if (response.ok) {
          const result = await response.json();

          dispatch(
            updateTaskInHomeData({
              holidayId: holidayId,
              taskId,
              updates: result,
            }),
          );

          // Refresh home data to ensure UI consistency
          await refreshHomeData();
        } else {
          console.error('Error toggling completion:', response.statusText);
        }
      }
    } catch (error) {
      console.error('Error updating date idea:', error);
    }
  };

  const handleDelete = (taskId: string, taskTitle: string) => {
    const task = dateIdeas.find(t => t.id === taskId);

    setTaskToDelete({
      id: taskId,
      title: taskTitle || task?.title || 'this item', // Fallback to task title or generic text
    });
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!holidayId || !auth0User || !taskToDelete) return;

    setIsDeleting(true);

    try {
      const response = await fetch(
        `/api/holidays/${holidayId}/tasks/${taskToDelete.id}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'x-test-user': JSON.stringify(auth0User),
          },
        },
      );

      if (response.ok) {
        dispatch(
          removeTaskFromHomeData({
            holidayId: holidayId,
            taskId: taskToDelete.id,
          }),
        );

        // Refresh home data to ensure progress tracking updates
        await refreshHomeData();

        setShowDeleteModal(false);
        setTaskToDelete(null);
      } else {
        console.error('Error deleting date idea:', response.statusText);
      }
    } catch (error) {
      console.error('Error deleting date idea:', error);
    } finally {
      setIsDeleting(false);
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

  const completeDateIdeas = dateIdeas.filter((task: any) => task.isCompleted);
  const incompleteDateIdeas = dateIdeas.filter((task: any) => !task.isCompleted);

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

  // Form Configuration with Date Formatting Fix
  const formFields = [
    {
      id: 'title',
      type: 'text' as const,
      placeholder: 'Date Idea*',
      required: true,
    },
    {
      id: 'description',
      type: 'textarea' as const,
      placeholder: 'Description',
      rows: 2,
    },
    {
      id: 'priority',
      type: 'select' as const,
      placeholder: 'Priority',
      options: [
        { value: 'low', label: 'Low Priority' },
        { value: 'medium', label: 'Medium Priority' },
        { value: 'high', label: 'High Priority' },
      ],
    },
    ...(isHolidayShared
      ? [
          {
            id: 'assignedTo',
            type: 'text' as const,
            placeholder: 'Assigned To',
          },
        ]
      : []),
    {
      id: 'dueDate',
      type: 'date' as const,
      placeholder: 'Target Date',
    },
  ];

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
          disabled={isAdding}
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
        initialValues={
          editingTask
            ? {
                title: editingTask.title,
                description: editingTask.description || '',
                priority: editingTask.priority,
                assignedTo: editingTask.assignedTo || '',
                dueDate: editingTask.dueDate || '',
              }
            : {}
        }
        onSubmit={editingTask ? handleUpdateDateIdea : handleAddDateIdea}
        onClose={closeForm}
        loading={isAdding}
        submitText={editingTask ? 'Update Date Idea' : 'Add Date Idea'}
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
        loading={isDeleting}
      />
      <Footer />
    </div>
  );
}
