import { usePathname } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import { useAuth0 } from '@auth0/auth0-react';
import {
  useGetTasksQuery,
  useCreateTaskMutation,
  useUpdateEventMutation,
  useEditEventMutation,
  useDeleteEventMutation,
} from '@/store/api';
import { getHolidayIdFromRoute } from '@/utils/holidayUtils';

export function useKwanzaaTasksMutations() {
  const pathname = usePathname();
  const { user: auth0User } = useAuth0();
  const holidayPreferences = useAppSelector(
    (state: any) => state.home.data?.holidayPreferences || [],
  );
  const homeInitialized = useAppSelector((state: any) => state.home.initialized);

  // Only resolve holidayId if home data is initialized
  const holidayId = homeInitialized
    ? getHolidayIdFromRoute(pathname, holidayPreferences)
    : null;

  // Get all task mutations
  const [createTask, createTaskState] = useCreateTaskMutation();
  const [updateTask, updateTaskState] = useUpdateEventMutation();
  const [editTask, editTaskState] = useEditEventMutation();
  const [deleteTask, deleteTaskState] = useDeleteEventMutation();

  // Get tasks query
  const {
    data: tasks = [],
    isLoading: loading,
    error,
    isSuccess: initialized,
  } = useGetTasksQuery(
    { holidayId: holidayId || '', auth0User },
    { skip: !holidayId || !auth0User },
  );

  // Filter tasks by category based on the current page
  const getTasksByCategory = (category: string) => {
    return tasks.filter((task: any) => task.category === category);
  };

  return {
    holidayId,
    auth0User,
    tasks,
    loading,
    error,
    initialized,
    createTask,
    updateTask,
    editTask,
    deleteTask,
    createTaskState,
    updateTaskState,
    editTaskState,
    deleteTaskState,
    getTasksByCategory,
  };
}
