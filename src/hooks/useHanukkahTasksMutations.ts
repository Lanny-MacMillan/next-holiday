import { usePathname } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useAuth0 } from '@auth0/auth0-react';
import {
  fetchHanukkahTasks,
  addHanukkahTask,
  updateHanukkahTask,
  deleteHanukkahTask,
  toggleHanukkahTaskCompletion,
} from '@/store/slices/hanukkah/hanukkahTasksSlice';
import { getHolidayIdFromRoute } from '@/utils/holidayUtils';

export function useHanukkahTasksMutations() {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { user: auth0User } = useAuth0();
  const holidayPreferences = useAppSelector(
    (state: any) => state.home.data?.holidayPreferences || [],
  );
  const homeInitialized = useAppSelector((state: any) => state.home.initialized);
  const {
    tasks: hanukkahTasks,
    loading,
    error,
    initialized,
  } = useAppSelector((state: any) => state.hanukkahTasks);

  // Only resolve holidayId if home data is initialized
  const holidayId = homeInitialized
    ? getHolidayIdFromRoute(pathname, holidayPreferences)
    : null;

  // Create task
  const createHanukkahTask = ({ holidayId, payload, auth0User }: any) => {
    if (!holidayId || !auth0User) return;
    dispatch(addHanukkahTask(payload));
  };

  // Update task completion
  const updateHanukkahTaskCompletion = ({
    holidayId,
    taskId,
    isCompleted,
    auth0User,
  }: any) => {
    if (!holidayId || !auth0User) return;
    dispatch(toggleHanukkahTaskCompletion(taskId));
  };

  // Edit task
  const editHanukkahTask = ({ holidayId, taskId, payload, auth0User }: any) => {
    if (!holidayId || !auth0User) return;
    const task = hanukkahTasks.find((t: any) => t.id === taskId);
    if (task) {
      dispatch(updateHanukkahTask({ ...task, ...payload }));
    }
  };

  // Delete task
  const deleteHanukkahTaskMutation = ({ holidayId, taskId, auth0User }: any) => {
    if (!holidayId || !auth0User) return;
    dispatch(deleteHanukkahTask(taskId));
  };

  return {
    holidayId,
    auth0User,
    hanukkahTasks,
    loading,
    error,
    initialized,
    createHanukkahTask,
    updateHanukkahTask: updateHanukkahTaskCompletion,
    editHanukkahTask,
    deleteHanukkahTask: deleteHanukkahTaskMutation,
    createHanukkahTaskState: { isLoading: loading },
    updateHanukkahTaskState: { isLoading: loading },
    editHanukkahTaskState: { isLoading: loading },
    deleteHanukkahTaskState: { isLoading: loading },
  };
}
