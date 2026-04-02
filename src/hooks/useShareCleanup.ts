import { useAppDispatch } from '@/store/hooks';
import { refreshHomeData } from '@/store/slices/homeSlice';
import { fetchShares } from '@/store/slices/sharesSlice';

/**
 * Hook for cleaning up local state after share membership changes
 * This should be called after someone leaves or is removed from a share
 */
export function useShareCleanup() {
  const dispatch = useAppDispatch();

  const cleanupAfterLeaveShare = async (auth0User: any) => {
    if (!auth0User) return;

    try {
      // Refresh home data to get updated holiday preferences and data
      await dispatch(refreshHomeData(auth0User)).unwrap();

      // Refresh shares to get updated share list
      await dispatch(fetchShares(auth0User.sub)).unwrap();
    } catch (error) {
      console.error('❌ Error during local state cleanup:', error);
    }
  };

  const cleanupAfterRemoveMember = async (auth0User: any) => {
    if (!auth0User) return;

    try {
      // Refresh shares to get updated member list
      await dispatch(fetchShares(auth0User.sub)).unwrap();
    } catch (error) {
      console.error('❌ Error during member removal cleanup:', error);
    }
  };

  return {
    cleanupAfterLeaveShare,
    cleanupAfterRemoveMember,
  };
}
