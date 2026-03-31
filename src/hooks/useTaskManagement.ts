import { useCallback } from 'react';
import {
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useToggleTaskCompletionMutation,
  useGetTasksQuery,
} from '../store/api';

export const useTaskManagement = (holidayId: string, auth0User: any) => {
  const {
    data: tasks,
    isLoading,
    error,
  } = useGetTasksQuery({ holidayId, auth0User }, { skip: !holidayId || !auth0User });
  const [createTask] = useCreateTaskMutation();
  const [updateTask] = useUpdateTaskMutation();
  const [deleteTask] = useDeleteTaskMutation();
  const [toggleTaskCompletion] = useToggleTaskCompletionMutation();

  const handleCreate = useCallback(
    async (payload: any) => {
      try {
        await createTask({ holidayId, payload, auth0User }).unwrap();
      } catch (error) {
        console.error('Failed to create task:', error);
        throw error;
      }
    },
    [createTask, holidayId, auth0User],
  );

  const handleToggle = useCallback(
    async (taskId: string, isCompleted: boolean) => {
      try {
        await toggleTaskCompletion({
          holidayId,
          taskId,
          isCompleted,
          auth0User,
        }).unwrap();
      } catch (error) {
        console.error('Failed to toggle task:', error);
        throw error;
      }
    },
    [toggleTaskCompletion, holidayId, auth0User],
  );

  const handleUpdate = useCallback(
    async (taskId: string, payload: any) => {
      try {
        await updateTask({
          holidayId,
          taskId,
          updates: payload,
          auth0User,
        }).unwrap();
      } catch (error) {
        console.error('Failed to update task:', error);
        throw error;
      }
    },
    [updateTask, holidayId, auth0User],
  );

  const handleDelete = useCallback(
    async (taskId: string) => {
      try {
        await deleteTask({ holidayId, taskId, auth0User }).unwrap();
      } catch (error) {
        console.error('Failed to delete task:', error);
        throw error;
      }
    },
    [deleteTask, holidayId, auth0User],
  );

  return {
    tasks,
    isLoading,
    error,
    handleCreate,
    handleToggle,
    handleUpdate,
    handleDelete,
  };
};
