'use client';

import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useAuth0 } from '@auth0/auth0-react';
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
import { selectIsHolidayShared } from '@/store/slices/sharesSlice';
import SortModal from '@/components/modals/SortModal';
import DeleteModal from '@/components/modals/DeleteModal';
import FormModal from '@/components/modals/FormModal';
import HolidayPageHeader from '@/components/common/HolidayPageHeader';
import AddButton from '@/components/common/AddButton';
import TaskSection from '@/components/common/TaskSection';
import ToDoCard from '@/components/cards/to-do/ToDoCard';

type SortOption = 'priority' | 'dateDue' | 'assignedTo' | 'category' | 'none';

// Default decoration tasks removed per user request
/*
const defaultDecorationTasks = [
	{
		title: "Set up Halloween decorations",
		description: "Hang spooky decorations around the home",
		priority: "high" as const,
	},
	{
		title: "Carve pumpkins",
		description: "Create jack-o-lanterns for display",
		priority: "medium" as const,
	},
	{
		title: "Set up trick-or-treat area",
		description: "Prepare the front yard for trick-or-treaters",
		priority: "high" as const,
	},
	{
		title: "Arrange Halloween centerpiece",
		description: "Create a spooky centerpiece",
		priority: "low" as const,
	},
	{
		title: "String up spooky lights",
		description: "Add orange and purple lighting effects",
		priority: "medium" as const,
	},
	{
		title: "Create haunted house entrance",
		description: "Transform entrance for trick-or-treaters",
		priority: "high" as const,
	},
];
*/

export default function HalloweenDecorationsPage() {
  const dispatch = useAppDispatch();
  const { contacts } = useAppSelector((state: any) => state.addressBook);
  const {
    holidayId,
    mutation,
    isLoading: mutationLoading,
    error: mutationError,
    auth0User,
  } = useFormModalMutation();

  // No need for useFormModalMutation hook - using direct API calls like Kwanzaa

  // Get Redux data
  const holidayPreferences = useAppSelector(selectHolidayPreferences);
  const homeInitialized = useAppSelector(selectHomeInitialized);
  const homeData = useAppSelector(selectHomeData);

  // Check if the holiday is shared to conditionally show assign to field
  const isHolidayShared = useAppSelector((state: any) =>
    selectIsHolidayShared(state, holidayId!),
  );

  // Redux data access - decorations are stored as tasks with category "Decorations" like in Kwanzaa
  const holidayData = useAppSelector((state: any) =>
    selectHolidayPrefById(state, holidayId!),
  );
  const decorations =
    holidayData?.tasks?.filter((task: any) => task.category === 'Decorations') || [];
  const isLoading = !homeInitialized;
  const error = null;

  // Refresh home data function (like gift-list)
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
  const [sortBy, setSortBy] = useState<SortOption>('none');
  const [showSortModal, setShowSortModal] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    show: boolean;
    taskId: string | null;
  }>({
    show: false,
    taskId: null,
  });

  useEffect(() => {
    // Always fetch contacts for address book functionality
    dispatch(fetchContacts());
  }, [dispatch]);

  // CRUD Operations
  async function handleAddTask(values: Record<string, any>) {
    if (!values.title?.trim()) return;
    if (!holidayId || !auth0User) return;

    setIsAdding(true);

    const newTask = {
      id: `temp-${Date.now()}`, // Temporary ID for optimistic update
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
      // Optimistically update Redux state first (like Kwanzaa)
      console.log('Adding decoration optimistically:', newTask);
      console.log('Holiday ID for addition:', holidayId);
      dispatch(addTaskToHomeData({ holidayId: holidayId, task: newTask }));
      console.log('Decoration added to Redux, making API call...');

      // Call API - map camelCase to snake_case for API
      const apiPayload = {
        title: values.title,
        description: values.description || undefined,
        priority: values.priority as 'low' | 'medium' | 'high',
        assignedTo: values.assignedTo || undefined, // API expects camelCase
        category: 'Decorations',
        due_date: values.dueDate || undefined, // snake_case for API
        isCompleted: false,
      };

      console.log('🐛 [HalloweenDecorationsAdd] API payload:', apiPayload);

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
        body: JSON.stringify(apiPayload),
      });

      if (response.ok) {
        // Replace temporary task with real task from API (like Kwanzaa)
        const result = await response.json();
        console.log(
          'API success, replacing temp decoration with real decoration:',
          result,
        );
        dispatch(
          removeTaskFromHomeData({
            holidayId: holidayId,
            taskId: newTask.id,
          }),
        );
        dispatch(addTaskToHomeData({ holidayId: holidayId, task: result }));

        // Also refresh home data like gift-list does
        await refreshHomeData();
      } else {
        // Remove optimistic update on error
        console.log('API error, removing optimistic update');
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
      // Remove optimistic update on error (like Kwanzaa)
      dispatch(removeTaskFromHomeData({ holidayId: holidayId, taskId: newTask.id }));
      console.error('Failed to add decoration:', error);
    } finally {
      setIsAdding(false);
    }
  }

  function openForm() {
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
  }

  async function handleToggleCompletion(taskId: string) {
    if (!holidayId || !auth0User) return;

    setIsToggling(true);
    try {
      const decoration = decorations.find((d: any) => d.id === taskId);
      if (decoration) {
        const newIsCompleted = !decoration.isCompleted;

        // Optimistically update Redux state first
        dispatch(
          updateTaskInHomeData({
            holidayId: holidayId,
            taskId,
            updates: { isCompleted: newIsCompleted },
          }),
        );

        // Call API with snake_case mapping
        const response = await fetch(`/api/holidays/${holidayId}/tasks/${taskId}`, {
          method: 'PATCH', // Use PATCH instead of PUT
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
            isCompleted: newIsCompleted, // Use isCompleted, not is_completed
          }),
        });

        if (!response.ok) {
          // Revert optimistic update on error
          dispatch(
            updateTaskInHomeData({
              holidayId: holidayId,
              taskId,
              updates: { isCompleted: decoration.isCompleted },
            }),
          );
          console.error(
            'Failed to update decoration:',
            response.status,
            response.statusText,
          );
        }
      }
    } catch (error) {
      // Revert optimistic update on error
      const decoration = decorations.find((d: any) => d.id === taskId);
      if (decoration) {
        dispatch(
          updateTaskInHomeData({
            holidayId: holidayId,
            taskId,
            updates: { isCompleted: decoration.isCompleted },
          }),
        );
      }
      console.error('Error updating decoration:', error);
    } finally {
      setIsToggling(false);
    }
  }

  function handleDelete(taskId: string) {
    setDeleteConfirm({ show: true, taskId });
  }

  const handleEditDecoration = (task: any) => {
    // Format date for input field if it exists
    const formattedTask = {
      ...task,
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '', // Format YYYY-MM-DD for input
    };
    setEditingTask(formattedTask);
    setShowEditModal(true);
  };

  async function handleEditDecorationSubmit(values: Record<string, any>) {
    if (!editingTask || !holidayId || !auth0User) return;

    setIsUpdating(true);
    try {
      // Optimistically update Redux state first
      const updatedTask = {
        ...editingTask,
        title: values.title,
        description: values.description || undefined,
        priority: values.priority as 'low' | 'medium' | 'high',
        assignedTo: values.assignedTo || undefined,
        dueDate: values.dueDate || undefined,
      };

      dispatch(
        updateTaskInHomeData({
          holidayId: holidayId,
          taskId: editingTask.id,
          updates: updatedTask,
        }),
      );

      // Call API with snake_case mapping
      const apiPayload = {
        title: values.title,
        description: values.description || undefined,
        priority: values.priority as 'low' | 'medium' | 'high',
        assignedTo: values.assignedTo || undefined, // API expects camelCase
        category: 'Decorations',
        due_date: values.dueDate || undefined, // snake_case for API
      };

      const response = await fetch(
        `/api/holidays/${holidayId}/tasks/${editingTask.id}`,
        {
          method: 'PATCH', // Use PATCH instead of PUT
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
        // Update Redux with real data from API
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
        console.error(
          'Failed to update decoration:',
          response.status,
          response.statusText,
        );
      }

      setShowEditModal(false);
      setEditingTask(null);
    } catch (error) {
      // Revert optimistic update on error
      dispatch(
        updateTaskInHomeData({
          holidayId: holidayId,
          taskId: editingTask.id,
          updates: editingTask,
        }),
      );
      console.error('Error editing decoration:', error);
    } finally {
      setIsUpdating(false);
    }
  }

  function closeEditModal() {
    setShowEditModal(false);
    setEditingTask(null);
  }

  async function confirmDelete() {
    if (deleteConfirm.taskId && holidayId && auth0User) {
      setIsDeleting(true);
      try {
        // Optimistically remove from Redux state first
        dispatch(
          removeTaskFromHomeData({
            holidayId: holidayId,
            taskId: deleteConfirm.taskId,
          }),
        );

        // Call API
        const response = await fetch(
          `/api/holidays/${holidayId}/tasks/${deleteConfirm.taskId}`,
          {
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
          },
        );

        if (!response.ok) {
          // On error, we'd need to add the task back, but we don't have it anymore
          // This is a limitation of optimistic updates with delete
          console.error(
            'Failed to delete decoration:',
            response.status,
            response.statusText,
          );
          // Refresh home data to get correct state
          await refreshHomeData();
        }

        setDeleteConfirm({ show: false, taskId: null });
      } catch (error) {
        console.error('Error deleting decoration:', error);
        // Refresh home data to get correct state
        await refreshHomeData();
        setDeleteConfirm({ show: false, taskId: null });
      } finally {
        setIsDeleting(false);
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
        title="Add New Decoration Task"
        fields={[
          {
            id: 'title',
            type: 'text' as const,
            placeholder: 'Decoration Task*',
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
            placeholder: 'Due Date',
          },
        ]}
        initialValues={{
          title: '',
          description: '',
          priority: 'medium',
          assignedTo: '',
          dueDate: '',
        }}
        onSubmit={handleAddTask}
        onClose={closeForm}
        loading={isAdding}
        submitText="Add Decoration"
        cardClassName="card-tasks"
      />

      {/* Edit Modal */}
      <FormModal
        isOpen={showEditModal}
        title="Edit Decoration Task"
        fields={[
          {
            id: 'title',
            type: 'text' as const,
            placeholder: 'Decoration Task*',
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
            placeholder: 'Due Date',
          },
        ]}
        initialValues={{
          title: editingTask?.title || '',
          description: editingTask?.description || '',
          priority: editingTask?.priority || 'medium',
          assignedTo: editingTask?.assignedTo || '',
          dueDate: editingTask?.dueDate || '',
        }}
        onSubmit={handleEditDecorationSubmit}
        onClose={closeEditModal}
        loading={isUpdating}
        submitText="Update Decoration"
        cardClassName="card-tasks"
      />

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={deleteConfirm.show}
        onCancel={cancelDelete}
        onConfirm={confirmDelete}
        loading={isDeleting}
        cardClassName="card-tasks"
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
