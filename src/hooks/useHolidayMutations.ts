import { useState } from 'react';

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

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'x-test-user': JSON.stringify({
      sub: auth0User?.sub,
      email: auth0User?.email,
      name: auth0User?.name,
      picture: auth0User?.picture,
    }),
  });

  const createGift = async (payload: any) => {
    if (!holidayId || !auth0User) {
      throw new Error('Missing holiday ID or user');
    }

    setCreateLoading(true);
    try {
      const response = await fetch(`/api/holidays/${holidayId}/gifts`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to create gift');
      }

      return await response.json();
    } finally {
      setCreateLoading(false);
    }
  };

  const updateGift = async (giftId: string, payload: any) => {
    if (!holidayId || !auth0User) {
      throw new Error('Missing holiday ID or user');
    }

    setUpdateLoading(true);
    try {
      const response = await fetch(`/api/holidays/${holidayId}/gifts/${giftId}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to update gift');
      }

      return await response.json();
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
      const response = await fetch(`/api/holidays/${holidayId}/gifts/${giftId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to delete gift');
      }

      return await response.json();
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
      const response = await fetch(`/api/holidays/${holidayId}/tasks`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to create task');
      }

      return await response.json();
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
      const response = await fetch(`/api/holidays/${holidayId}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to update task');
      }

      return await response.json();
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
      const response = await fetch(`/api/holidays/${holidayId}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to delete task');
      }

      return await response.json();
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
      const response = await fetch(`/api/holidays/${holidayId}/cards`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to create card');
      }

      return await response.json();
    } finally {
      setCreateLoading(false);
    }
  };

  const updateCard = async (cardId: string, payload: any) => {
    if (!holidayId || !auth0User) {
      throw new Error('Missing holiday ID or user');
    }

    setUpdateLoading(true);
    try {
      const response = await fetch(`/api/holidays/${holidayId}/cards`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          id: cardId,
          action: 'update',
          ...payload,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update card');
      }

      return await response.json();
    } finally {
      setUpdateLoading(false);
    }
  };

  const deleteCard = async (cardId: string, cardData: any) => {
    if (!holidayId || !auth0User) {
      throw new Error('Missing holiday ID or user');
    }

    setDeleteLoading(true);
    try {
      const response = await fetch(`/api/holidays/${holidayId}/cards`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          id: cardId,
          action: 'delete',
          recipient: cardData.recipient,
          message: cardData.message || '',
          address: cardData.address || '',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete card');
      }

      return await response.json();
    } finally {
      setDeleteLoading(false);
    }
  };

  return {
    // Gift operations
    createGift,
    updateGift,
    deleteGift,

    // Task operations
    createTask,
    updateTask,
    deleteTask,

    // Card operations
    createCard,
    updateCard,
    deleteCard,

    // Loading states
    createLoading,
    updateLoading,
    deleteLoading,
  };
}
