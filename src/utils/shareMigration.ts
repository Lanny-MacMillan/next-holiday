import { useAppDispatch } from '@/store/hooks';
import { updateTask } from '@/store/slices/tasksSlice';
import { updateGift } from '@/store/slices/giftListSlice';
import { updateCard } from '@/store/slices/cardsSlice';

// Interface for entities that can be shared
export interface ShareableEntity {
  id: string;
  shareId?: string;
  [key: string]: any;
}

// Migration function to add shareId to existing entities
export const migrateHolidayDataToShare = async (
  holidayKey: string,
  shareId: string,
  dispatch: ReturnType<typeof useAppDispatch>,
) => {
  try {
    console.log(`Migrating holiday data for ${holidayKey} to share ${shareId}`);

    // In a real implementation, you would:
    // 1. Get all entities from the store that match the holidayKey
    // 2. Update each entity to include the shareId
    // 3. Save the updated entities back to the store

    // For now, this is a placeholder that logs the migration
    // The actual migration would depend on how you store holiday-specific data

    return true;
  } catch (error) {
    console.error('Error migrating holiday data to share:', error);
    return false;
  }
};

// Helper function to check if an entity should be included in shared data
export const shouldIncludeInShare = (
  entity: ShareableEntity,
  holidayKey: string,
  shareId?: string,
): boolean => {
  // If there's a shareId, only include entities that have that shareId
  if (shareId) {
    return entity.shareId === shareId;
  }

  // If no shareId, only include entities that don't have a shareId (private data)
  return !entity.shareId;
};

// Helper function to get the appropriate shareId for a holiday
export const getShareIdForHoliday = (
  holidayKey: string,
  userId: string,
  state: any,
): string | undefined => {
  // This would use the selector from sharesSlice
  const share = state.shares.shares.find(
    (s: any) =>
      s.holidayKey === holidayKey &&
      (s.ownerUserId === userId || s.memberUserIds.includes(userId)),
  );
  return share ? share.shareId : undefined;
};

// Helper function to migrate a specific entity type
export const migrateEntityToShare = async (
  entity: ShareableEntity,
  shareId: string,
  dispatch: ReturnType<typeof useAppDispatch>,
) => {
  try {
    const updatedEntity = { ...entity, shareId };

    // Determine entity type and update accordingly
    if ('title' in entity && 'priority' in entity) {
      // This is a task
      await dispatch(updateTask(updatedEntity as any)).unwrap();
    } else if ('name' in entity && 'price' in entity) {
      // This is a gift
      await dispatch(updateGift(updatedEntity as any)).unwrap();
    } else if ('recipient' in entity && 'message' in entity) {
      // This is a card
      await dispatch(updateCard(updatedEntity as any)).unwrap();
    }

    return true;
  } catch (error) {
    console.error('Error migrating entity to share:', error);
    return false;
  }
};
