import { useCallback } from 'react';
import {
  useCreateCardMutation,
  useUpdateCardMutation,
  useDeleteCardMutation,
  useEditCardMutation,
  useGetCardsQuery,
} from '../store/api';

export const useCardManagement = (holidayId: string, auth0User: any) => {
  const {
    data: cards,
    isLoading,
    error,
  } = useGetCardsQuery({ holidayId, auth0User }, { skip: !holidayId || !auth0User });
  const [createCard] = useCreateCardMutation();
  const [updateCard] = useUpdateCardMutation();
  const [editCard] = useEditCardMutation();
  const [deleteCard] = useDeleteCardMutation();

  const handleCreate = useCallback(
    async (payload: any) => {
      try {
        await createCard({ holidayId, payload, auth0User }).unwrap();
      } catch (error) {
        console.error('Failed to create card:', error);
        throw error;
      }
    },
    [createCard, holidayId, auth0User],
  );

  const handleToggle = useCallback(
    async (cardId: string, isCompleted: boolean) => {
      try {
        await updateCard({ holidayId, cardId, isCompleted, auth0User }).unwrap();
      } catch (error) {
        console.error('Failed to update card:', error);
        throw error;
      }
    },
    [updateCard, holidayId, auth0User],
  );

  const handleEdit = useCallback(
    async (cardId: string, payload: any) => {
      try {
        await editCard({ holidayId, cardId, payload, auth0User }).unwrap();
      } catch (error) {
        console.error('Failed to edit card:', error);
        throw error;
      }
    },
    [editCard, holidayId, auth0User],
  );

  const handleDelete = useCallback(
    async (cardId: string) => {
      try {
        await deleteCard({ holidayId, cardId, auth0User }).unwrap();
      } catch (error) {
        console.error('Failed to delete card:', error);
        throw error;
      }
    },
    [deleteCard, holidayId, auth0User],
  );

  return {
    cards,
    isLoading,
    error,
    handleCreate,
    handleToggle,
    handleEdit,
    handleDelete,
  };
};
