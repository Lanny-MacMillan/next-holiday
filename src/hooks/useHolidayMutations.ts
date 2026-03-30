import { useState } from 'react';
import {
  useCreateGiftMutation,
  useEditGiftMutation,
  useUpdateGiftMutation,
  useDeleteGiftMutation,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useToggleTaskCompletionMutation,
  useDeleteTaskMutation,
  useCreateCardMutation,
  useUpdateCardMutation,
  useEditCardMutation,
  useDeleteCardMutation,
  useCreateGuestMutation,
  useUpdateGuestMutation,
  useDeleteGuestMutation,
  useCreateEventMutation,
  useUpdateEventMutation,
  useEditEventMutation,
  useDeleteEventMutation,
} from '@/store/api';

interface UseHolidayMutationsProps {
  holidayId: string | null;
  auth0User: any;
}

export function useHolidayMutations({
  holidayId,
  auth0User,
}: UseHolidayMutationsProps) {
  const [createLoading, setCreateLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // RTK Query mutation hooks
  const [createGiftMutation] = useCreateGiftMutation();
  const [editGiftMutation] = useEditGiftMutation();
  const [updateGiftMutation] = useUpdateGiftMutation();
  const [deleteGiftMutation] = useDeleteGiftMutation();
  const [createTaskMutation] = useCreateTaskMutation();
  const [updateTaskMutation] = useUpdateTaskMutation();
  const [toggleTaskCompletionMutation] = useToggleTaskCompletionMutation();
  const [deleteTaskMutation] = useDeleteTaskMutation();
  const [createCardMutation] = useCreateCardMutation();
  const [updateCardMutation] = useUpdateCardMutation();
  const [editCardMutation] = useEditCardMutation();
  const [deleteCardMutation] = useDeleteCardMutation();
  const [createGuestMutation] = useCreateGuestMutation();
  const [updateGuestMutation] = useUpdateGuestMutation();
  const [deleteGuestMutation] = useDeleteGuestMutation();
  const [createEventMutation] = useCreateEventMutation();
  const [updateEventMutation] = useUpdateEventMutation();
  const [editEventMutation] = useEditEventMutation();
  const [deleteEventMutation] = useDeleteEventMutation();

  const createGift = async (payload: any) => {
    if (!holidayId || !auth0User) {
      throw new Error('Missing holiday ID or user');
    }

    setCreateLoading(true);
    try {
      const result = await createGiftMutation({
        holidayId,
        payload,
        auth0User,
      }).unwrap();
      return result;
    } finally {
      setCreateLoading(false);
    }
  };

  const editGift = async (giftId: string, payload: any) => {
    if (!holidayId || !auth0User) {
      throw new Error('Missing holiday ID or user');
    }

    setUpdateLoading(true);
    try {
      const result = await editGiftMutation({
        holidayId,
        giftId,
        payload,
        auth0User,
      }).unwrap();
      return result;
    } finally {
      setUpdateLoading(false);
    }
  };

  const updateGift = async (giftId: string, isCompleted: boolean) => {
    if (!holidayId || !auth0User) {
      throw new Error('Missing holiday ID or user');
    }

    setUpdateLoading(true);
    try {
      const result = await updateGiftMutation({
        holidayId,
        giftId,
        isCompleted,
        auth0User,
      }).unwrap();
      return result;
    } finally {
      setUpdateLoading(false);
    }
  };

  const deleteGift = async (giftId: string) => {
    if (!holidayId || !auth0User) {
      throw new Error('Missing holiday ID or user');
    }

    setDeleteLoading(true);
    try {
      const result = await deleteGiftMutation({
        holidayId,
        giftId,
        auth0User,
      }).unwrap();
      return result;
    } finally {
      setDeleteLoading(false);
    }
  };

  const createTask = async (payload: any) => {
    if (!holidayId || !auth0User) {
      throw new Error('Missing holiday ID or user');
    }

    setCreateLoading(true);
    try {
      const result = await createTaskMutation({
        holidayId,
        payload,
        auth0User,
      }).unwrap();
      return result;
    } finally {
      setCreateLoading(false);
    }
  };

  const updateTask = async (taskId: string, payload: any) => {
    if (!holidayId || !auth0User) {
      throw new Error('Missing holiday ID or user');
    }

    setUpdateLoading(true);
    try {
      const result = await updateTaskMutation({
        holidayId,
        taskId,
        updates: payload, // ✅ Fix: wrap payload in updates property
        auth0User,
      }).unwrap();
      return result;
    } finally {
      setUpdateLoading(false);
    }
  };

  const toggleTask = async (taskId: string, isCompleted: boolean) => {
    if (!holidayId || !auth0User) {
      throw new Error('Missing holiday ID or user');
    }

    setUpdateLoading(true);
    try {
      const result = await toggleTaskCompletionMutation({
        holidayId,
        taskId,
        isCompleted,
        auth0User,
      }).unwrap();
      return result;
    } finally {
      setUpdateLoading(false);
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!holidayId || !auth0User) {
      throw new Error('Missing holiday ID or user');
    }

    setDeleteLoading(true);
    try {
      const result = await deleteTaskMutation({
        holidayId,
        taskId,
        auth0User,
      }).unwrap();
      return result;
    } finally {
      setDeleteLoading(false);
    }
  };

  const createCard = async (payload: any) => {
    if (!holidayId || !auth0User) {
      throw new Error('Missing holiday ID or user');
    }

    setCreateLoading(true);
    try {
      const result = await createCardMutation({
        holidayId,
        payload,
        auth0User,
      }).unwrap();
      return result;
    } finally {
      setCreateLoading(false);
    }
  };

  const updateCard = async (cardId: string, isCompleted: boolean) => {
    if (!holidayId || !auth0User) {
      throw new Error('Missing holiday ID or user');
    }

    setUpdateLoading(true);
    try {
      const result = await updateCardMutation({
        holidayId,
        cardId,
        isCompleted,
        auth0User,
      }).unwrap();
      return result;
    } finally {
      setUpdateLoading(false);
    }
  };

  const editCard = async (cardId: string, payload: any) => {
    if (!holidayId || !auth0User) {
      throw new Error('Missing holiday ID or user');
    }

    setUpdateLoading(true);
    try {
      const result = await editCardMutation({
        holidayId,
        cardId,
        payload,
        auth0User,
      }).unwrap();
      return result;
    } finally {
      setUpdateLoading(false);
    }
  };

  const deleteCard = async (cardId: string) => {
    if (!holidayId || !auth0User) {
      throw new Error('Missing holiday ID or user');
    }

    setDeleteLoading(true);
    try {
      const result = await deleteCardMutation({
        holidayId,
        cardId,
        auth0User,
      }).unwrap();
      return result;
    } finally {
      setDeleteLoading(false);
    }
  };

  const createGuest = async (payload: any) => {
    if (!holidayId || !auth0User) {
      throw new Error('Missing holiday ID or user');
    }

    setCreateLoading(true);
    try {
      const result = await createGuestMutation({
        holidayId,
        payload,
        auth0User,
      }).unwrap();
      return result;
    } finally {
      setCreateLoading(false);
    }
  };

  const updateGuest = async (guestId: string, payload: any) => {
    if (!holidayId || !auth0User) {
      throw new Error('Missing holiday ID or user');
    }

    setUpdateLoading(true);
    try {
      const result = await updateGuestMutation({
        holidayId,
        guestId,
        ...payload,
        auth0User,
      }).unwrap();
      return result;
    } finally {
      setUpdateLoading(false);
    }
  };

  const deleteGuest = async (guestId: string) => {
    if (!holidayId || !auth0User) {
      throw new Error('Missing holiday ID or user');
    }

    setDeleteLoading(true);
    try {
      const result = await deleteGuestMutation({
        holidayId,
        guestId,
        auth0User,
      }).unwrap();
      return result;
    } finally {
      setDeleteLoading(false);
    }
  };

  const createEvent = async (payload: any) => {
    if (!holidayId || !auth0User) {
      throw new Error('Missing holiday ID or user');
    }

    setCreateLoading(true);
    try {
      const result = await createEventMutation({
        holidayId,
        payload,
        auth0User,
      }).unwrap();
      return result;
    } finally {
      setCreateLoading(false);
    }
  };

  const updateEvent = async (taskId: string, isCompleted: boolean) => {
    if (!holidayId || !auth0User) {
      throw new Error('Missing holiday ID or user');
    }

    setUpdateLoading(true);
    try {
      const result = await updateEventMutation({
        holidayId,
        taskId,
        isCompleted,
        auth0User,
      }).unwrap();
      return result;
    } finally {
      setUpdateLoading(false);
    }
  };

  const editEvent = async (taskId: string, payload: any) => {
    if (!holidayId || !auth0User) {
      throw new Error('Missing holiday ID or user');
    }

    setUpdateLoading(true);
    try {
      const result = await editEventMutation({
        holidayId,
        taskId,
        payload,
        auth0User,
      }).unwrap();
      return result;
    } finally {
      setUpdateLoading(false);
    }
  };

  const deleteEvent = async (taskId: string) => {
    if (!holidayId || !auth0User) {
      throw new Error('Missing holiday ID or user');
    }

    setDeleteLoading(true);
    try {
      const result = await deleteEventMutation({
        holidayId,
        taskId,
        auth0User,
      }).unwrap();
      return result;
    } finally {
      setDeleteLoading(false);
    }
  };

  // Return all the functions
  return {
    createGift,
    editGift,
    updateGift,
    deleteGift,
    createTask,
    updateTask,
    toggleTask,
    deleteTask,
    createCard,
    updateCard,
    editCard,
    deleteCard,
    createGuest,
    updateGuest,
    deleteGuest,
    createEvent,
    updateEvent,
    editEvent,
    deleteEvent,
    createLoading,
    updateLoading,
    deleteLoading,
  };
}
