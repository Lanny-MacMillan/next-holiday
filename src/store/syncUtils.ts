import {
  addGiftToHomeData,
  updateGiftInHomeData,
  removeGiftFromHomeData,
  addTaskToHomeData,
  updateTaskInHomeData,
  removeTaskFromHomeData,
  addCardToHomeData,
  updateCardInHomeData,
  removeCardFromHomeData,
  addGuestToHomeData,
  updateGuestInHomeData,
  removeGuestFromHomeData,
  addEventToHomeData,
  updateEventInHomeData,
  removeEventFromHomeData,
  addDecorationToHomeData,
  updateDecorationInHomeData,
  removeDecorationFromHomeData,
} from './slices/homeSlice';

/**
 * Automatic RTK Query ↔ Home Slice Sync Utilities
 *
 * These utilities eliminate the need for manual refreshHomeData calls
 * by automatically syncing RTK Query mutations with the Home Slice.
 */

// Entity type mapping for automatic sync
type EntityType = 'gift' | 'task' | 'card' | 'guest' | 'event' | 'decoration';

interface SyncOptions {
  entityType: EntityType;
  holidayId: string;
  optimisticData: any;
  dispatch: any;
}

interface UpdateSyncOptions extends Omit<SyncOptions, 'optimisticData'> {
  entityId: string;
  serverData: any;
}

interface RemoveSyncOptions extends Omit<SyncOptions, 'optimisticData'> {
  entityId: string;
}

/**
 * Add entity to Home Slice during optimistic update
 */
export const syncAddToHomeSlice = ({
  entityType,
  holidayId,
  optimisticData,
  dispatch,
}: SyncOptions) => {
  switch (entityType) {
    case 'gift':
      dispatch(addGiftToHomeData({ holidayId, gift: optimisticData }));
      break;
    case 'task':
      dispatch(addTaskToHomeData({ holidayId, task: optimisticData }));
      break;
    case 'card':
      dispatch(addCardToHomeData({ holidayId, card: optimisticData }));
      break;
    case 'guest':
      dispatch(addGuestToHomeData({ holidayId, guest: optimisticData }));
      break;
    case 'event':
      dispatch(addEventToHomeData({ holidayId, event: optimisticData }));
      break;
    case 'decoration':
      dispatch(addDecorationToHomeData({ holidayId, decoration: optimisticData }));
      break;
    default:
      console.warn(`Unknown entity type for add sync: ${entityType}`);
  }
};

/**
 * Update entity in Home Slice with server response
 */
export const syncUpdateInHomeSlice = ({
  entityType,
  holidayId,
  entityId,
  serverData,
  dispatch,
}: UpdateSyncOptions) => {
  switch (entityType) {
    case 'gift':
      dispatch(
        updateGiftInHomeData({ holidayId, giftId: entityId, updates: serverData }),
      );
      break;
    case 'task':
      dispatch(
        updateTaskInHomeData({ holidayId, taskId: entityId, updates: serverData }),
      );
      break;
    case 'card':
      dispatch(
        updateCardInHomeData({ holidayId, cardId: entityId, updates: serverData }),
      );
      break;
    case 'guest':
      dispatch(
        updateGuestInHomeData({ holidayId, guestId: entityId, updates: serverData }),
      );
      break;
    case 'event':
      dispatch(
        updateEventInHomeData({ holidayId, eventId: entityId, updates: serverData }),
      );
      break;
    case 'decoration':
      dispatch(
        updateDecorationInHomeData({
          holidayId,
          decorationId: entityId,
          updates: serverData,
        }),
      );
      break;
    default:
      console.warn(`Unknown entity type for update sync: ${entityType}`);
  }
};

/**
 * Remove entity from Home Slice (for delete operations or error rollback)
 */
export const syncRemoveFromHomeSlice = ({
  entityType,
  holidayId,
  entityId,
  dispatch,
}: RemoveSyncOptions) => {
  switch (entityType) {
    case 'gift':
      dispatch(removeGiftFromHomeData({ holidayId, giftId: entityId }));
      break;
    case 'task':
      dispatch(removeTaskFromHomeData({ holidayId, taskId: entityId }));
      break;
    case 'card':
      dispatch(removeCardFromHomeData({ holidayId, cardId: entityId }));
      break;
    case 'guest':
      dispatch(removeGuestFromHomeData({ holidayId, guestId: entityId }));
      break;
    case 'event':
      dispatch(removeEventFromHomeData({ holidayId, eventId: entityId }));
      break;
    case 'decoration':
      dispatch(removeDecorationFromHomeData({ holidayId, decorationId: entityId }));
      break;
    default:
      console.warn(`Unknown entity type for remove sync: ${entityType}`);
  }
};

// Remove the complex factory functions - keep just the simple sync utilities
