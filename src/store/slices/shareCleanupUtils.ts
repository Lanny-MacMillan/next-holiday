// Utility actions for cleaning up shared data from Redux state
// These are called when a user leaves or is removed from a share

export interface ShareCleanupPayload {
  shareId: string;
  userId: string;
  holidayKey?: string;
}

// Action creator for share cleanup - this will be imported and used by individual slices
export const createShareCleanupAction = (actionType: string) => ({
  type: actionType,
  payload: null as ShareCleanupPayload | null,
});

// Common share cleanup actions that slices can listen to
export const SHARE_CLEANUP_ACTIONS = {
  USER_LEFT_SHARE: 'shares/cleanup/userLeft',
  USER_REMOVED_FROM_SHARE: 'shares/cleanup/userRemoved',
} as const;
