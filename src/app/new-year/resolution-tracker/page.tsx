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
import { selectIsHolidayShared } from '@/store/slices/sharesSlice';
import SortModal from '@/components/modals/SortModal';
import FormModal from '@/components/modals/FormModal';
import HolidayPageHeader from '@/components/common/HolidayPageHeader';
import Footer from '@/components/common/Footer';
import AddButton from '@/components/common/AddButton';
import TaskSection from '@/components/common/TaskSection';
import ToDoCard from '@/components/cards/to-do/ToDoCard';

type SortOption = 'priority' | 'dateDue' | 'assignedTo' | 'category' | 'none';

export default function NewYearResolutionTrackerPage() {
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
    selectIsHolidayShared(state, 'new-year'),
  );

  // Redux data access - resolutions are stored as tasks with category "Resolutions"
  const resolutions = useMemo(
    () =>
      holidayData?.tasks?.filter((task: any) => task.category === 'Resolutions') ||
      [],
    [holidayData?.tasks],
  );
  const isLoading = !homeInitialized;
  const error = null;

  // State management
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
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

  // CRUD Operations
  const refreshHomeData = async () => {
    if (!auth0User) return;
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

  const handleAddResolution = async (values: Record<string, any>) => {
    if (!values.title?.trim() || !holidayId) return;

    try {
      const result = await createTask({
        title: values.title,
        description: values.description,
        priority: values.priority,
        assignedTo: values.assignedTo,
        category: 'Resolutions',
        dueDate: values.dueDate,
      });

      // Update Redux state immediately
      dispatch(addTaskToHomeData({ holidayId, task: result }));

      // Refresh home data to ensure UI is in sync
      await refreshHomeData();

      setShowForm(false);
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
        assignedTo: values.assignedTo,
        category: 'Resolutions',
        dueDate: values.dueDate,
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
      await refreshHomeData();
      setShowEditModal(false);
      setEditingTask(null);
    } catch (error) {
      console.error('Error updating resolution:', error);
    }
  };

  const handleDelete = async (taskId: string) => {
    // Find the task to get its title for confirmation
    const taskToDelete = resolutions.find((task: any) => task.id === taskId);
    if (!taskToDelete || !holidayId) return;

    if (window.confirm(`Are you sure you want to delete "${taskToDelete.title}"?`)) {
      try {
        await deleteTask(taskId);

        // Update Redux state immediately
        dispatch(
          removeTaskFromHomeData({
            holidayId,
            taskId,
          }),
        );

        // Refresh home data to ensure UI is in sync
        await refreshHomeData();
      } catch (error) {
        console.error('Error deleting resolution:', error);
      }
    }
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
      // Update API
      await updateTask(taskId, { isCompleted: newCompletionStatus });

      // Update Redux state immediately - no refreshHomeData
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
      console.error('Error toggling resolution:', error);
    }
  };

  const openAddForm = () => {
    setEditingTask(null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
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
          return (a.assignedTo || '').localeCompare(b.assignedTo || '');
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

  // Form fields configuration
  const formFields = [
    {
      id: 'title',
      type: 'text' as const,
      placeholder: 'Resolution Goal*',
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
    <div className="min-h-screen new-year-cards-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
      <HolidayPageHeader
        title="Resolution Tracker"
        backHref="/new-year"
        onSortClick={() => setShowSortModal(true)}
        description="Track your New Year resolutions and goals!"
        holidayColor="orange-600"
        sortTitle="Sort Resolutions"
        error={error ? 'API Error' : undefined}
      />

      <main className="flex-1 w-full max-w-4xl flex flex-col gap-6 mt-4">
        {' '}
        <AddButton
          title="Resolution"
          onClick={openAddForm}
          color="orange"
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
        isOpen={showForm}
        title="Add New Resolution"
        fields={formFields}
        initialValues={{}}
        onSubmit={handleAddResolution}
        onClose={closeForm}
        loading={createLoading}
        submitText="Add Resolution"
        cancelText="Cancel"
        cardClassName="card-events-new-year"
      />

      {/* Edit Form Modal */}
      <FormModal
        isOpen={showEditModal}
        title="Edit Resolution"
        fields={formFields}
        initialValues={
          editingTask
            ? {
                title: editingTask.title,
                description: editingTask.description || '',
                priority: editingTask.priority,
                assignedTo: editingTask.assignedTo || '',
                dueDate: editingTask.dueDate
                  ? editingTask.dueDate.split('T')[0]
                  : '', // CRITICAL: Format date for input
              }
            : {}
        }
        onSubmit={handleEditSubmit}
        onClose={() => {
          setShowEditModal(false);
          setEditingTask(null);
        }}
        loading={updateLoading}
        submitText="Update Resolution"
        cancelText="Cancel"
        cardClassName="card-events-new-year"
      />
      <Footer />
    </div>
  );
}
