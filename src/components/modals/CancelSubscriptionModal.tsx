import React, { useState } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { upgradeUser, updateSubscription, setUser } from '@/store/slices/userSlice';
import { fetchShares } from '@/store/slices/sharesSlice';
import { useAuth0 } from '@auth0/auth0-react';

export interface CancelSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCancel: () => void;
}

export default function CancelSubscriptionModal({
  isOpen,
  onClose,
  onCancel,
}: CancelSubscriptionModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Processing...');
  const dispatch = useAppDispatch();
  const { user: auth0User } = useAuth0();

  if (!isOpen) return null;

  const handleConfirmCancellation = async () => {
    setIsLoading(true);
    try {
      if (!auth0User?.sub) {
        throw new Error('User not authenticated');
      }

      // TODO: Implement charge stop with payment processor
      // This should cancel the recurring billing

      // 1. Clean up sharing relationships before downgrading
      setLoadingMessage('Cleaning up shared holidays...');
      const cleanupResponse = await fetch('/api/users/cancel-subscription-cleanup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          auth0Sub: auth0User.sub,
        }),
      });

      if (!cleanupResponse.ok) {
        const cleanupError = await cleanupResponse.json();

        // Don't throw here - we still want to proceed with cancellation
      } else {
        const cleanupResult = await cleanupResponse.json();
      }

      // 2. Downgrade user to free in database
      setLoadingMessage('Updating subscription...');
      const downgradeResult = await dispatch(
        upgradeUser({
          auth0Sub: auth0User.sub,
          plan: 'free',
        }),
      ).unwrap();

      // 3. Update Redux immediately to prevent race conditions with data refresh
      dispatch(
        updateSubscription({
          subscriptionPlan: 'free',
          subscriptionStartDate: undefined,
          subscriptionEndDate: undefined,
        }),
      );

      // Set lastUpdated to track recent change
      dispatch(
        setUser({
          sub: auth0User.sub!,
          email: auth0User.email,
          name: auth0User.name,
          picture: auth0User.picture,
          isInDb: true,
          subscriptionPlan: 'free',
          subscriptionStartDate: undefined,
          subscriptionEndDate: undefined,
          lastUpdated: new Date().toISOString(),
        }),
      );

      // 4. Refresh shares data to update the UI
      if (auth0User?.sub) {
        await dispatch(fetchShares(auth0User.sub));
      }

      onCancel();
      onClose();
    } catch (error) {
      console.error('Cancellation error:', error);
      alert(
        `Cancellation failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }. Please try again or contact support.`,
      );
    } finally {
      setIsLoading(false);
      setLoadingMessage('Processing...');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="card rounded-lg p-4 sm:p-6 max-w-md mx-auto w-full">
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <div
            className="text-lg sm:text-xl font-black text-gray-900 dark:text-white"
            style={{
              fontWeight: '900 !important',
              fontFamily:
                'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            }}
          >
            💔 Cancel Subscription
          </div>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 text-lg sm:text-xl hover:scale-110 transition-transform duration-200"
          >
            ×
          </button>
        </div>

        <div className="space-y-4 sm:space-y-6">
          {/* Cancellation Warning */}
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
            <div className="text-red-800 dark:text-red-200 font-medium mb-2">
              You'll lose access to Plus features
            </div>
            <ul className="text-sm text-red-600 dark:text-red-300 space-y-1">
              <li>• Unlimited holiday invites</li>
              <li>• Advanced sharing & collaboration</li>
              <li>• Premium holiday templates</li>
              <li>• Priority customer support</li>
            </ul>
          </div>

          {/* Sharing Impact Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
            <div className="text-blue-800 dark:text-blue-200 font-medium mb-2">
              📤 Sharing cleanup will occur
            </div>
            <ul className="text-sm text-blue-600 dark:text-blue-300 space-y-1">
              <li>• You'll be removed from shared holidays you don't own</li>
              <li>• Others will be removed from holidays you own</li>
              <li>• Your personal holiday data will be preserved</li>
              <li>• Pending invites will be cancelled</li>
            </ul>
          </div>

          {/* Current Subscription Info */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Current Plan
            </div>
            <div className="font-medium text-gray-900 dark:text-white">
              Plus - $2.99/month
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Your subscription will remain active until the end of your current
              billing period.
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm sm:text-base text-gray-700 dark:text-gray-300 transition-all duration-200 disabled:opacity-50"
              style={{
                backgroundColor: 'transparent',
              }}
              onMouseEnter={e => {
                if (!isLoading) {
                  e.currentTarget.style.backgroundColor = 'rgb(249, 250, 251)';
                  e.currentTarget.style.borderColor = 'rgb(156, 163, 175)';
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = 'rgb(209, 213, 219)';
              }}
            >
              Keep Plus
            </button>
            <button
              onClick={handleConfirmCancellation}
              disabled={isLoading}
              className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white px-3 sm:px-4 py-2 rounded hover:opacity-80 transition-all duration-200 font-medium text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? loadingMessage : 'Yes, Cancel Subscription'}
            </button>
          </div>

          {/* TODO Note */}
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center border-t pt-4">
            TODO: Implement automatic charge stop with payment processor
          </div>
        </div>
      </div>
    </div>
  );
}
