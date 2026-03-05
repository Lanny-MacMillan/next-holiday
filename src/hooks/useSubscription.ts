import { useAppSelector } from '@/store/hooks';
import {
  selectUser,
  selectUserSubscriptionPlan,
  selectIsUserPlusMember,
  selectUserSubscriptionData,
} from '@/store/slices/userSlice';

/**
 * Custom hook to access user subscription information from Redux
 * Provides convenient access to subscription status throughout the app
 */
export function useSubscription() {
  const user = useAppSelector(selectUser);
  const subscriptionPlan = useAppSelector(selectUserSubscriptionPlan);
  const isUserPlusMember = useAppSelector(selectIsUserPlusMember);
  const subscriptionData = useAppSelector(selectUserSubscriptionData);

  return {
    user,
    subscriptionPlan,
    isUserPlusMember,
    subscriptionData,
    isFreeMember: subscriptionPlan === 'free',
    hasSubscription: !!user?.subscriptionPlan,
  };
}
