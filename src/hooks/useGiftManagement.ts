import { useCallback } from 'react';
import {
  useCreateGiftMutation,
  useUpdateGiftMutation,
  useDeleteGiftMutation,
  useEditGiftMutation,
  useGetGiftsQuery,
} from '../store/api';

export const useGiftManagement = (holidayId: string, auth0User: any) => {
  const {
    data: gifts,
    isLoading,
    error,
  } = useGetGiftsQuery({ holidayId, auth0User }, { skip: !holidayId || !auth0User });
  const [createGift] = useCreateGiftMutation();
  const [updateGift] = useUpdateGiftMutation();
  const [editGift] = useEditGiftMutation();
  const [deleteGift] = useDeleteGiftMutation();

  const handleCreate = useCallback(
    async (payload: any) => {
      try {
        await createGift({ holidayId, payload, auth0User }).unwrap();
      } catch (error) {
        console.error('Failed to create gift:', error);
        throw error;
      }
    },
    [createGift, holidayId, auth0User],
  );

  const handleToggle = useCallback(
    async (giftId: string, isCompleted: boolean) => {
      try {
        await updateGift({ holidayId, giftId, isCompleted, auth0User }).unwrap();
      } catch (error) {
        console.error('Failed to update gift:', error);
        throw error;
      }
    },
    [updateGift, holidayId, auth0User],
  );

  const handleEdit = useCallback(
    async (giftId: string, payload: any) => {
      try {
        await editGift({ holidayId, giftId, payload, auth0User }).unwrap();
      } catch (error) {
        console.error('Failed to edit gift:', error);
        throw error;
      }
    },
    [editGift, holidayId, auth0User],
  );

  const handleDelete = useCallback(
    async (giftId: string) => {
      try {
        await deleteGift({ holidayId, giftId, auth0User }).unwrap();
      } catch (error) {
        console.error('Failed to delete gift:', error);
        throw error;
      }
    },
    [deleteGift, holidayId, auth0User],
  );

  return {
    gifts,
    isLoading,
    error,
    handleCreate,
    handleToggle,
    handleEdit,
    handleDelete,
  };
};
