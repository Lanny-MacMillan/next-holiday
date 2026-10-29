'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectIsHolidayShared } from '@/store/slices/sharesSlice';
import { useHolidayMutations } from '@/hooks/useHolidayMutations';
import { useSharedHoliday } from '@/hooks/useSharedHoliday';
import { fetchContacts } from '@/store/slices/addressBookSlice';
import { getFormConfigEnhanced } from '@/config/formConfigs';
import type { TaskPageConfig } from '@/config/taskPageConfigs';
import SortModal from '@/components/modals/SortModal';
import ToDoCard from '@/components/cards/to-do/ToDoCard';
import HolidayPageHeader from '@/components/common/HolidayPageHeader';
import AddButton from '@/components/common/AddButton';
import TaskSection from '@/components/common/TaskSection';
import FormModal from '@/components/modals/FormModal';
import DeleteModal from '@/components/modals/DeleteModal';
import Toast from '@/components/common/Toast';

type SortOption =
  | 'priority'
  | 'dateDue'
  | 'assignedTo'
  | 'category'
  | 'title'
  | 'none';
type Priority = 'low' | 'medium' | 'high';

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: Priority;
  isCompleted: boolean;
  dueDate?: string;
  category?: string;
  assignedTo?: string;
  assignedToName?: string | null;
}

const PRIORITY_ORDER: Record<Priority, number> = { high: 3, medium: 2, low: 1 };

const SORT_LABELS: Record<Exclude<SortOption, 'none'>, string> = {
  priority: 'Priority',
  dateDue: 'Date Due',
  assignedTo: 'Assigned To',
  category: 'Category',
  title: 'Title',
};

function sortTasks(tasks: Task[], sortBy: SortOption) {
  switch (sortBy) {
    case 'priority':
      return [...tasks].sort(
        (a, b) => PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority],
      );
    case 'dateDue':
      return [...tasks].sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
    case 'assignedTo':
      return [...tasks].sort((a, b) =>
        (a.assignedToName || '').localeCompare(b.assignedToName || ''),
      );
    case 'category':
      return [...tasks].sort((a, b) =>
        (a.category || '').localeCompare(b.category || ''),
      );
    case 'title':
      return [...tasks].sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    default:
      return tasks;
  }
}

// One tasks page for every holiday; the config supplies names, category and colours.
export default function TasksPage({ config }: { config: TaskPageConfig }) {
  const { holidayKey, taskCategory } = config;
  const isEvents = config.variant === 'events';
  const noun = isEvents ? 'Event' : 'Task';
  const nounLower = noun.toLowerCase();
  const dispatch = useAppDispatch();
  const { contacts } = useAppSelector((state: any) => state.addressBook);
  const isHolidayShared = useAppSelector((state: any) =>
    selectIsHolidayShared(state, holidayKey),
  );

  const { holidayId, holidayData, auth0User, homeInitialized, shareMembers } =
    useSharedHoliday(holidayKey);

  const {
    createTask,
    updateTask,
    toggleTask,
    deleteTask,
    createLoading,
    updateLoading,
    deleteLoading,
  } = useHolidayMutations({ holidayId, auth0User });

  // Tasks carry the assignee's id; show their name
  const tasks: Task[] = useMemo(
    () =>
      (holidayData?.tasks || [])
        .filter((task: any) => !taskCategory || task.category === taskCategory)
        .map((task: any) => {
          const member = task.assignedTo
            ? shareMembers.find((m: any) => m.uuid === task.assignedTo)
            : null;
          return {
            ...task,
            assignedToName: task.assignedTo
              ? member
                ? member.name || member.email || 'Unknown User'
                : task.assignedTo
              : null,
          };
        }),
    [holidayData?.tasks, shareMembers, taskCategory],
  );

  const [sortBy, setSortBy] = useState<SortOption>('none');
  const [showForm, setShowForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  useEffect(() => {
    dispatch(fetchContacts());
  }, [dispatch]);

  async function handleAddTask(values: Record<string, any>) {
    if (!values.title?.trim() || !holidayId || !auth0User) return;

    try {
      await createTask({
        title: values.title,
        description: values.description || undefined,
        priority: values.priority as Priority,
        ...(isHolidayShared && { assigned_to: values.assigned_to || undefined }),
        category: taskCategory ?? (values.category || 'Tasks'),
        due_date: values.dueDate || undefined,
        isCompleted: false,
        holidayId,
      });
      setToast({ message: `${noun} added successfully!`, type: 'success' });
      setShowForm(false);
    } catch (error) {
      console.error('Failed to add task:', error);
      setToast({
        message: `Error adding ${nounLower}. Please try again.`,
        type: 'error',
      });
    }
  }

  async function handleSaveEdit(values: Record<string, any>) {
    if (!editingTask || !auth0User || !holidayId) return;

    try {
      await updateTask(editingTask.id, {
        title: values.title,
        description: values.description || undefined,
        priority: values.priority as Priority,
        assigned_to: values.assigned_to || null,
        category: taskCategory ?? (values.category || 'Tasks'),
        due_date: values.dueDate || null,
        isCompleted: values.isCompleted || false,
      });
      setToast({ message: `${noun} updated successfully!`, type: 'success' });
      setEditingTask(null);
      setShowEditModal(false);
    } catch (error) {
      console.error('Failed to update task:', error);
      setToast({
        message: `Error updating ${nounLower}. Please try again.`,
        type: 'error',
      });
    }
  }

  async function handleToggleTask(taskId: string) {
    if (!auth0User || !holidayId) return;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    try {
      await toggleTask(taskId, !task.isCompleted);
    } catch (error) {
      console.error('Failed to toggle task:', error);
    }
  }

  async function handleConfirmDelete() {
    if (!taskToDelete || !holidayId || !auth0User) return;

    try {
      await deleteTask(taskToDelete.id);
    } catch (error) {
      console.error('Error deleting task:', error);
    }
    setTaskToDelete(null);
  }

  if (!homeInitialized && !holidayData?.tasks) {
    return (
      <div
        className={`min-h-screen ${config.gradientClass} flex items-center justify-center`}
      >
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
            style={{ borderBottomColor: config.accent ?? '#3b82f6' }}
          ></div>
          <p className="text-gray-600 dark:text-gray-300">Loading {nounLower}s...</p>
        </div>
      </div>
    );
  }

  const sortedTasks = sortTasks(tasks, sortBy);
  const incompleteTasks = sortedTasks.filter(task => !task.isCompleted);
  const completedTasks = sortedTasks.filter(task => task.isCompleted);
  const loading = createLoading || updateLoading || deleteLoading;

  const formFields = (mode: 'add' | 'edit') =>
    getFormConfigEnhanced('tasks', mode, {
      holidayKey,
      shareMembers,
      auth0User,
    }).fields;

  const sortOptions = [
    { value: 'none', label: 'None' },
    { value: 'priority', label: SORT_LABELS.priority },
    { value: 'dateDue', label: SORT_LABELS.dateDue },
    ...(isHolidayShared
      ? [{ value: 'assignedTo', label: SORT_LABELS.assignedTo }]
      : []),
    ...(taskCategory ? [] : [{ value: 'category', label: SORT_LABELS.category }]),
    { value: 'title', label: SORT_LABELS.title },
  ];

  const renderTask = (task: Task, completed: boolean) => (
    <ToDoCard
      key={task.id}
      task={task as any}
      onToggleComplete={handleToggleTask}
      onDelete={() => setTaskToDelete(task)}
      onEdit={(selected: any) => {
        setEditingTask(selected);
        setShowEditModal(true);
      }}
      className={completed ? 'opacity-60' : undefined}
      theme={config.accent ? { accentColor: config.accent } : undefined}
      borderColor={config.border}
      disableInternalModal={true}
    />
  );

  return (
    <div
      className={`min-h-screen ${config.gradientClass} flex flex-col items-center p-4 sm:p-8 font-sans`}
    >
      <HolidayPageHeader
        title={config.title}
        backHref={`/${holidayKey}`}
        onSortClick={() => setShowSortModal(true)}
        sortTitle={`Sort ${nounLower}s`}
        description={config.description}
        holidayColor={config.headerColor}
        error={undefined}
      />
      <main className="w-full max-w-4xl flex flex-col gap-6">
        <AddButton
          title={noun}
          onClick={() => setShowForm(true)}
          color={config.addButton}
        />

        {sortBy !== 'none' && (
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            Sorted by {SORT_LABELS[sortBy]}
          </div>
        )}

        {isEvents && tasks.length > 0 && (
          <div className="card rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
              Event Status
            </h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              {[
                ['text-blue-600', tasks.length, 'Total Events'],
                ['text-green-600', completedTasks.length, 'Completed'],
                ['text-orange-600', incompleteTasks.length, 'Remaining'],
              ].map(([color, count, label]) => (
                <div key={label}>
                  <div className={`text-2xl font-bold ${color}`}>{count}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <TaskSection
          title={isEvents ? 'Upcoming Events' : 'Incomplete'}
          items={incompleteTasks}
          isCompleted={false}
          emptyMessage={
            isEvents
              ? 'No events planned yet.'
              : `All tasks completed! ${config.doneEmoji}`
          }
          completedMessage=""
          renderItem={(task: Task) => renderTask(task, false)}
        />

        <TaskSection
          title={isEvents ? 'Completed Events' : 'Completed'}
          items={completedTasks}
          isCompleted={true}
          emptyMessage=""
          completedMessage={`No completed ${nounLower}s yet.`}
          renderItem={(task: Task) => renderTask(task, true)}
        />
      </main>

      <FormModal
        isOpen={showForm}
        title={`Add New ${noun}`}
        fields={formFields('add')}
        onSubmit={handleAddTask}
        onClose={() => setShowForm(false)}
        loading={loading}
        submitText={loading ? 'Adding...' : `Add ${noun}`}
        cancelText="Cancel"
        cardClassName={config.modalClassName ?? 'card'}
        submitButtonColor={config.submitColor ?? config.accent}
        contacts={contacts}
        shareMembers={shareMembers}
      />

      <FormModal
        isOpen={showEditModal}
        title={`Edit ${noun}`}
        fields={formFields('edit')}
        onSubmit={handleSaveEdit}
        onClose={() => {
          setEditingTask(null);
          setShowEditModal(false);
        }}
        loading={loading}
        submitText={loading ? 'Updating...' : `Update ${noun}`}
        cancelText="Cancel"
        cardClassName={config.modalClassName ?? 'card'}
        submitButtonColor={config.submitColor ?? config.accent}
        contacts={contacts}
        shareMembers={shareMembers}
        initialValues={
          editingTask
            ? {
                title: editingTask.title,
                description: editingTask.description || '',
                priority: editingTask.priority,
                assigned_to: editingTask.assignedTo || '',
                category: editingTask.category || 'Tasks',
                dueDate: editingTask.dueDate
                  ? new Date(editingTask.dueDate).toISOString().split('T')[0]
                  : '',
                isCompleted: editingTask.isCompleted,
              }
            : undefined
        }
      />

      {taskToDelete && (
        <DeleteModal
          isOpen={true}
          onConfirm={handleConfirmDelete}
          onCancel={() => setTaskToDelete(null)}
          title={`Delete ${noun}`}
          message={`Are you sure you want to delete "${taskToDelete.title}"? This action cannot be undone.`}
          loading={deleteLoading}
        />
      )}

      <SortModal
        isOpen={showSortModal}
        onClose={() => setShowSortModal(false)}
        sortBy={sortBy}
        onSortChange={(sortOption: string) => setSortBy(sortOption as SortOption)}
        sortOptions={sortOptions}
        title={`Sort ${noun}s`}
      />

      <Toast
        message={toast?.message ?? ''}
        isVisible={!!toast}
        onClose={() => setToast(null)}
        type={toast?.type}
      />
    </div>
  );
}
