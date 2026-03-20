'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useHolidayPageData } from '@/hooks/useHolidayPageData';
import { useHolidayMutations } from '@/hooks/useHolidayMutations';
import { useRefreshHomeData } from '@/hooks/useRefreshHomeData';
import { fetchContacts } from '@/store/slices/addressBookSlice';
import { selectIsHolidayShared } from '@/store/slices/sharesSlice';
import SortModal from '@/components/modals/SortModal';
import FormModal from '@/components/modals/FormModal';
import HolidayPageHeader from '@/components/common/HolidayPageHeader';
import AddButton from '@/components/common/AddButton';
import TaskSection from '@/components/common/TaskSection';
import ToDoCard from '@/components/cards/to-do/ToDoCard';

export default function AnniversaryDateIdeasPage() {
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

  const { refreshHomeData } = useRefreshHomeData();

  const isHolidayShared = useAppSelector((state: any) =>
    selectIsHolidayShared(state, 'anniversary'),
  );

  const dateIdeas = useMemo(
    () =>
      holidayData?.tasks?.filter((task: any) => task.category === 'Date Ideas') ||
      [],
    [holidayData?.tasks],
  );
  const isLoading = !homeInitialized;
  const error = null;

  // State management
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [showSortModal, setShowSortModal] = useState(false);
  const [sortBy, setSortBy] = useState<string>('priority');

  useEffect(() => {
    // Always fetch contacts for address book functionality
    dispatch(fetchContacts());
  }, [dispatch]);

  // Sort options for date ideas
  const sortOptions = [
    { value: 'priority', label: 'Priority' },
    { value: 'title', label: 'Title A-Z' },
    { value: 'dueDate', label: 'Due Date' },
    { value: 'assignedTo', label: 'Assigned To' },
    { value: 'category', label: 'Category' },
  ];

  // Sort function
  const sortTasks = (tasks: any[], sortOption: string) => {
    const sortedTasks = [...tasks];
    switch (sortOption) {
      case 'title':
        return sortedTasks.sort((a, b) => a.title.localeCompare(b.title));
      case 'priority':
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return sortedTasks.sort(
          (a, b) =>
            (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) -
            (priorityOrder[a.priority as keyof typeof priorityOrder] || 0),
        );
      case 'dueDate':
        return sortedTasks.sort((a, b) => {
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        });
      case 'assignedTo':
        return sortedTasks.sort((a, b) => {
          if (!a.assignedTo && !b.assignedTo) return 0;
          if (!a.assignedTo) return 1;
          if (!b.assignedTo) return -1;
          return a.assignedTo.localeCompare(b.assignedTo);
        });
      case 'category':
        return sortedTasks.sort((a, b) => {
          if (!a.category && !b.category) return 0;
          if (!a.category) return 1;
          if (!b.category) return -1;
          return a.category.localeCompare(b.category);
        });
      default:
        return sortedTasks;
    }
  };

  const sortedDateTasks = sortTasks(dateIdeas, sortBy);

  useEffect(() => {
    // Always fetch contacts for address book functionality
    dispatch(fetchContacts());
  }, [dispatch]);

  // CRUD Operations
  async function handleAddTask(values: Record<string, any>) {
    if (!values.title?.trim()) return;
    if (!holidayId || !auth0User) return;

    try {
      const payload = {
        title: values.title,
        description: values.description || undefined,
        priority: values.priority as 'low' | 'medium' | 'high',
        assigned_to: values.assignedTo || undefined,
        category: 'Date Ideas',
        due_date: values.dueDate || undefined,
        isCompleted: false,
      };

      await createTask(payload);
      await refreshHomeData(auth0User, holidayId);
      setShowAddForm(false);
    } catch (error) {
      console.error('Error creating date idea:', error);
    }
  }

  async function handleEditTaskSubmit(values: Record<string, any>) {
    if (!values.title?.trim() || !editingTask?.id) return;
    if (!holidayId || !auth0User) return;

    try {
      const payload = {
        title: values.title,
        description: values.description || undefined,
        priority: values.priority as 'low' | 'medium' | 'high',
        assigned_to: values.assignedTo || undefined,
        category: 'Date Ideas',
        due_date: values.dueDate || undefined,
      };

      await updateTask(editingTask.id, payload);
      await refreshHomeData(auth0User, holidayId);
      setEditingTask(null);
      setShowAddForm(false);
    } catch (error) {
      console.error('Error updating date idea:', error);
    }
  }

  const handleEdit = (task: any) => {
    setEditingTask(task);
    setShowAddForm(true);
  };

  async function handleDeleteTask(taskId: string) {
    if (!holidayId || !auth0User) return;

    try {
      await deleteTask(taskId);
      await refreshHomeData(auth0User, holidayId);
    } catch (error) {
      console.error('Error deleting date idea:', error);
    }
  }

  async function handleToggleTask(taskId: string) {
    if (!holidayId || !auth0User) return;

    try {
      const currentTask = dateIdeas.find((task: any) => task.id === taskId);
      if (!currentTask) return;

      const payload = {
        isCompleted: !currentTask.isCompleted,
      };

      await updateTask(taskId, payload);
      await refreshHomeData(auth0User, holidayId);
    } catch (error) {
      console.error('Error toggling date idea:', error);
    }
  }
  const handleSortChange = (sortOption: string) => {
    setSortBy(sortOption);
  };

  const loading = createLoading || updateLoading || deleteLoading;

  // Show loading only if home data is not initialized
  if (isLoading) {
    return (
      <div className="min-h-screen anniversary-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading date ideas...</p>
        </div>
      </div>
    );
  }

  // Form configuration - matching Kwanzaa events pattern
  const formFields = [
    {
      id: 'title',
      type: 'text' as const,
      placeholder: 'Date Idea Title*',
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
  ];

  return (
    <div className="min-h-screen anniversary-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
      <HolidayPageHeader
        title="Date Ideas"
        backHref="/anniversary"
        onSortClick={() => setShowSortModal(true)}
        sortTitle="Sort Date Ideas"
        description="Plan your anniversary date ideas with style!"
        holidayColor="pink-500"
        error={error}
      />

      <main className="flex-1 w-full max-w-4xl flex flex-col gap-6 mt-4">
        <AddButton
          title="Date Idea"
          onClick={() => setShowAddForm(true)}
          color="pink"
        />

        <TaskSection
          title="Incomplete"
          items={sortedDateTasks.filter(task => !task.isCompleted)}
          isCompleted={false}
          emptyMessage="All date ideas completed! 🎉"
          completedMessage=""
          renderItem={task => (
            <ToDoCard
              key={task.id}
              task={task}
              onToggleComplete={handleToggleTask}
              onDelete={handleDeleteTask}
              onEdit={handleEdit}
              theme={{
                accentColor: '#ec4899', // Pink for Anniversary
                hoverColor: 'hover:bg-pink-50 dark:hover:bg-pink-900/10',
              }}
              borderColor="rgb(var(--color-pink-500))" // Pink border for Anniversary
              gamifiedBackgroundColor="bg-gradient-to-br from-pink-300 to-pink-500"
              disableInternalModal={true}
            />
          )}
        />

        <TaskSection
          title="Completed"
          items={sortedDateTasks.filter(task => task.isCompleted)}
          isCompleted={true}
          emptyMessage="No completed date ideas yet."
          completedMessage="No completed date ideas yet."
          renderItem={task => (
            <ToDoCard
              key={task.id}
              task={task}
              onToggleComplete={handleToggleTask}
              onDelete={handleDeleteTask}
              onEdit={handleEdit}
              className="opacity-60"
              theme={{
                accentColor: '#ec4899', // Pink for Anniversary
                hoverColor: 'hover:bg-pink-50 dark:hover:bg-pink-900/10',
              }}
              borderColor="rgb(var(--color-pink-500))" // Pink border for Anniversary
              gamifiedBackgroundColor="bg-gradient-to-br from-pink-300 to-pink-500"
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
        onSortChange={handleSortChange}
        sortOptions={sortOptions}
        title="Sort Date Ideas"
      />

      {/* Form Modal */}
      <FormModal
        isOpen={showAddForm}
        title={editingTask ? 'Edit Date Idea' : 'Add New Date Idea'}
        fields={formFields}
        initialValues={
          editingTask
            ? {
                title: editingTask.title || '',
                description: editingTask.description || '',
                priority: editingTask.priority || 'medium',
                ...(isHolidayShared
                  ? { assignedTo: editingTask.assignedTo || '' }
                  : {}),
                dueDate: editingTask.dueDate
                  ? new Date(editingTask.dueDate).toISOString().split('T')[0]
                  : '',
              }
            : { priority: 'medium' }
        }
        onSubmit={editingTask ? handleEditTaskSubmit : handleAddTask}
        onClose={() => {
          setShowAddForm(false);
          setEditingTask(null);
        }}
        loading={loading}
        submitText={editingTask ? 'Update Date Idea' : 'Add Date Idea'}
        submitButtonColor="#ec4899"
      />
    </div>
  );
}
