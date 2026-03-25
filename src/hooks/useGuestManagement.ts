import { useCallback } from 'react';
import {
  useCreateGuestMutation,
  useUpdateGuestMutation,
  useDeleteGuestMutation,
  useEditGuestMutation,
  useGetGuestListQuery,
} from '../store/api';

export const useGuestManagement = (holidayId: string, auth0User: any) => {
  const {
    data: guests,
    isLoading,
    error,
  } = useGetGuestListQuery(
    { holidayId, auth0User },
    { skip: !holidayId || !auth0User },
  );
  const [createGuest] = useCreateGuestMutation();
  const [updateGuest] = useUpdateGuestMutation();
  const [editGuest] = useEditGuestMutation();
  const [deleteGuest] = useDeleteGuestMutation();

  const handleCreate = useCallback(
    async (payload: any) => {
      try {
        await createGuest({ holidayId, payload, auth0User }).unwrap();
      } catch (error) {
        console.error('Failed to create guest:', error);
        throw error;
      }
    },
    [createGuest, holidayId, auth0User],
  );

  const handleToggle = useCallback(
    async (guestId: string, isCompleted: boolean) => {
      try {
        await updateGuest({ holidayId, guestId, isCompleted, auth0User }).unwrap();
      } catch (error) {
        console.error('Failed to update guest:', error);
        throw error;
      }
    },
    [updateGuest, holidayId, auth0User],
  );

  const handleEdit = useCallback(
    async (guestId: string, payload: any) => {
      try {
        await editGuest({ holidayId, guestId, payload, auth0User }).unwrap();
      } catch (error) {
        console.error('Failed to edit guest:', error);
        throw error;
      }
    },
    [editGuest, holidayId, auth0User],
  );

  const handleDelete = useCallback(
    async (guestId: string) => {
      try {
        await deleteGuest({ holidayId, guestId, auth0User }).unwrap();
      } catch (error) {
        console.error('Failed to delete guest:', error);
        throw error;
      }
    },
    [deleteGuest, holidayId, auth0User],
  );

  return {
    guests,
    isLoading,
    error,
    handleCreate,
    handleToggle,
    handleEdit,
    handleDelete,
  };
};
