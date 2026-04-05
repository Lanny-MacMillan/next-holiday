'use client';

import { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { acceptInvite, declineInvite } from '@/store/slices/invitesSlice';
import { useRefreshHomeData } from '@/hooks/useRefreshHomeData';
import { selectHolidayPreferences } from '@/store/selectors/home';
import { addShare, refreshShares } from '@/store/slices/sharesSlice';

// Simple SVG icons to avoid external dependencies
const BellIcon = ({
  size = 22,
  className = '',
}: {
  size?: number;
  className?: string;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <path
      d="M13.73 21a2 2 0 0 1-3.46 0"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

const CheckCircleIcon = ({
  size = 14,
  className = '',
}: {
  size?: number;
  className?: string;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M22 11.08V12a10 10 0 1 1-5.93-9.14"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <polyline
      points="22,4 12,14.01 9,11.01"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

const UserIcon = ({
  size = 16,
  className = '',
}: {
  size?: number;
  className?: string;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" fill="none" />
  </svg>
);

const XIcon = ({
  size = 14,
  className = '',
}: {
  size?: number;
  className?: string;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <line
      x1="18"
      y1="6"
      x2="6"
      y2="18"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <line
      x1="6"
      y1="6"
      x2="18"
      y2="18"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

interface Notification {
  id: string;
  type:
    | 'task_assigned'
    | 'gift_assigned'
    | 'card_assigned'
    | 'task_completed'
    | 'invite_received';
  title: string;
  message: string;
  entityType?: 'task' | 'gift' | 'card' | 'invite';
  entityId?: string;
  holidayId?: string;
  fromUserId?: string;
  isRead: boolean;
  createdAt: string;
  fromUser?: { name: string; picture?: string };
  holiday?: { name: string; holidayType: string };
  isInvite?: boolean; // Special flag for invites
}

// Shared utility function
const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

interface NotificationCenterProps {
  className?: string;
}

export default function NotificationCenter({
  className = '',
}: NotificationCenterProps) {
  const { user: auth0User, isAuthenticated } = useAuth0();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  // Confirmation modal state for invite acceptance warnings
  const [confirmInvite, setConfirmInvite] = useState<{
    invite: Notification;
    hasExistingHoliday: boolean;
  } | null>(null);
  const [acceptingInvite, setAcceptingInvite] = useState(false);
  const [deletingNotification, setDeletingNotification] = useState<string | null>(
    null,
  );

  // Get holiday preferences from Redux state
  const holidayPreferences = useAppSelector(selectHolidayPreferences);

  // Polling fallback state
  const [usePolling, setUsePolling] = useState(false);
  const [sseFailureCount, setSseFailureCount] = useState(0);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(
    null,
  );

  // Threshold for switching to polling (after 3 SSE failures)
  const SSE_FAILURE_THRESHOLD = 3;
  const POLLING_INTERVAL = 10000; // 10 seconds

  // Initial fetch on mount
  useEffect(() => {
    fetchNotifications();
  }, [isAuthenticated, auth0User]);

  // SSE connection with polling fallback
  useEffect(() => {
    // Only connect if authenticated and have user data
    if (!isAuthenticated || !auth0User) {
      return;
    }

    // If we've determined polling should be used, start polling instead
    if (usePolling) {
      startPolling();
      return;
    }

    // Try SSE first
    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;

    const connectSSE = () => {
      try {
        // Connect to external SSE service instead of internal API
        const sseServiceUrl =
          process.env.NEXT_PUBLIC_SSE_SERVICE_URL || 'http://localhost:4000';
        const sseUrl = new URL('/stream', sseServiceUrl);
        sseUrl.searchParams.set('auth0Sub', auth0User.sub || 'auth0|test-user-123');

        eventSource = new EventSource(sseUrl.toString());

        eventSource.onopen = () => {
          setIsConnected(true);
          setError(null);
          // Reset failure count on successful connection
          setSseFailureCount(0);
        };

        eventSource.onmessage = event => {
          try {
            const data = JSON.parse(event.data);

            // Handle debug logs - display them in browser console for easy debugging
            if (data.type === 'debug_logs') {
              // Ignore debug logs in production
              return;
            }

            // Handle system messages (heartbeat, connection status, etc.)
            if (data.type === 'heartbeat' || data.type === 'connection') {
              // These are system messages, not user notifications - ignore silently
              return;
            }

            // Handle error messages from server
            if (data.type === 'error') {
              console.error('🚨 SSE Server Error:', data);
              if (data.error) {
                console.error('Error details:', data.error);
              }
              return;
            }

            const notification: Notification = data;

            // Validate notification structure before processing
            if (!notification || typeof notification !== 'object') {
              console.warn('Invalid notification received:', event.data);
              return;
            }

            if (!notification.title || !notification.message) {
              console.warn('Notification missing required fields:', notification);
              return;
            }

            // Add to notifications list with enhanced deduplication
            setNotifications(prev => {
              // Safety check: ensure notification has valid ID
              if (!notification.id || typeof notification.id !== 'string') {
                return prev;
              }

              // Check for duplicates by ID first (most reliable)
              const existsById = prev.some(n => n.id === notification.id);
              if (existsById) {
                return prev;
              }

              // For all notifications, check for recent duplicates by content
              // This catches cases where the same notification is sent multiple times
              const recentTimeThreshold = Date.now() - 30 * 1000; // 30 seconds
              const existsByRecentContent = prev.some(n => {
                // Parse the creation time (handle both ISO strings and timestamps)
                const nTime = new Date(n.createdAt).getTime();
                const notificationTime = new Date(notification.createdAt).getTime();

                // Only check recent notifications to avoid false positives
                if (
                  nTime < recentTimeThreshold &&
                  notificationTime < recentTimeThreshold
                ) {
                  return false;
                }

                return (
                  n.entityId === notification.entityId &&
                  n.entityType === notification.entityType &&
                  n.type === notification.type &&
                  n.title === notification.title &&
                  n.message === notification.message
                );
              });

              if (existsByRecentContent) {
                return prev;
              }

              return [notification, ...prev];
            });

            // Update unread count
            if (!notification.isRead) {
              setUnreadCount(prev => prev + 1);
            }

            // Optional: Show browser notification if permission granted
            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
              new Notification(notification.title, {
                body: notification.message,
                icon: '/favicon.ico',
                tag: notification.id, // Prevents duplicate notifications
              });
            }
          } catch (err) {
            console.error(
              'Error parsing SSE message:',
              err,
              'Raw data:',
              event.data,
            );
          }
        };

        eventSource.onerror = event => {
          const readyState = eventSource?.readyState;
          const isConnecting = readyState === EventSource.CONNECTING;
          const isClosed = readyState === EventSource.CLOSED;

          // Increment failure count and potentially switch to polling
          setSseFailureCount(prev => {
            const newCount = prev + 1;
            console.warn(`🔥 SSE failure ${newCount}/${SSE_FAILURE_THRESHOLD}`);

            // Switch to polling after threshold failures
            if (newCount >= SSE_FAILURE_THRESHOLD) {
              console.warn(
                '📊 SSE failed repeatedly, switching to polling fallback',
              );
              setUsePolling(true);
              eventSource?.close();
              return newCount;
            }

            return newCount;
          });

          // Use console.warn instead of console.error for expected connection issues
          if (isConnecting) {
            console.warn(
              '🔌 SSE connection issue - server may be offline or restarting',
            );
          } else if (isClosed) {
            console.warn('📡 SSE connection closed by server');
          } else {
            console.group('🔥 SSE Connection Error Details');
            console.warn('SSE Event:', event);
            console.warn('EventSource readyState:', readyState);
            console.warn('EventSource url:', eventSource?.url);
            console.groupEnd();
          }

          setIsConnected(false);
          setError('Connection lost, attempting to reconnect...');
          eventSource?.close();

          // Only attempt reconnect if not switching to polling
          if (sseFailureCount + 1 < SSE_FAILURE_THRESHOLD) {
            // Auto-reconnect after 3 seconds
            reconnectTimeout = setTimeout(() => {
              connectSSE();
            }, 3000);
          }
        };
      } catch (err) {
        console.error('Failed to establish SSE connection:', err);
        setIsConnected(false);
      }
    };

    // Start connection
    connectSSE();

    // Cleanup function
    return () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (eventSource) {
        eventSource.close();
      }
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
      setIsConnected(false);
    };
  }, [isAuthenticated, auth0User, usePolling, sseFailureCount]);

  // Request browser notification permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Polling fallback functions
  const startPolling = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }

    setIsConnected(true); // Show as connected for UI purposes
    setError(null);

    // Initial poll
    fetchNotifications();

    // Set up polling interval
    const interval = setInterval(() => {
      fetchNotifications();
    }, POLLING_INTERVAL);

    setPollingInterval(interval);
  };

  const stopPolling = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
      setIsConnected(false);
    }
  };

  // Function to manually switch back to SSE (for testing)
  const retrySSE = () => {
    stopPolling();
    setUsePolling(false);
    setSseFailureCount(0);
  };

  const fetchNotifications = async () => {
    if (!isAuthenticated || !auth0User) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/notifications', {
        headers: {
          'x-test-user': JSON.stringify({
            sub: auth0User.sub,
            email: auth0User.email,
            name: auth0User.name,
            picture: auth0User.picture,
          }),
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const result = await response.json();
      const data = result.data || [];

      // Clean and validate notifications from database
      const validNotifications = data.filter((n: any) => {
        return n && n.id && typeof n.id === 'string' && n.title && n.message;
      });

      setNotifications(validNotifications);
      setUnreadCount(
        validNotifications.filter((n: Notification) => !n.isRead).length,
      );
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationIds: string[]) => {
    if (!isAuthenticated || !auth0User) {
      return;
    }

    try {
      setLoading(true);

      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-test-user': JSON.stringify({
            sub: auth0User.sub,
            email: auth0User.email,
            name: auth0User.name,
            picture: auth0User.picture,
          }),
        },
        body: JSON.stringify({ notificationIds, action: 'read' }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark notifications as read');
      }

      // Update local state
      setNotifications(prev =>
        prev.map(n => (notificationIds.includes(n.id) ? { ...n, isRead: true } : n)),
      );
      setUnreadCount(prev => Math.max(0, prev - notificationIds.length));
    } catch (err) {
      console.error('Error marking notifications as read:', err);
      setError('Failed to update notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    if (!isAuthenticated || !auth0User) {
      return;
    }

    try {
      setDeletingNotification(notificationId);

      // Check if this is an invite notification
      const notification = notifications.find(n => n.id === notificationId);
      const isInvite =
        notification?.isInvite || notification?.type === 'invite_received';

      if (isInvite && notification?.entityId) {
        // For invite notifications, decline the invite instead of just deleting
        // We need to call the decline endpoint directly to ensure the invite is properly handled
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };

        if (auth0User) {
          headers['x-test-user'] = JSON.stringify({
            sub: auth0User.sub,
            email: auth0User.email,
            name: auth0User.name,
          });
        }

        const response = await fetch(
          `/api/invites/${notification.entityId}/decline`,
          {
            method: 'POST',
            headers,
          },
        );

        if (!response.ok) {
          throw new Error('Failed to decline invite');
        }

        // Remove the notification from local state
        setNotifications(prev => {
          const filtered = prev.filter(n => n.id === notificationId);
          const removedNotification = prev.find(n => n.id === notificationId);
          if (removedNotification && !removedNotification.isRead) {
            setUnreadCount(curr => Math.max(0, curr - 1));
          }
          return filtered;
        });
      } else {
        // For regular notifications, use the delete action
        const response = await fetch('/api/notifications', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'x-test-user': JSON.stringify({
              sub: auth0User.sub,
              email: auth0User.email,
              name: auth0User.name,
              picture: auth0User.picture,
            }),
          },
          body: JSON.stringify({
            notificationIds: [notificationId],
            action: 'delete',
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to delete notification');
        }

        // Remove notification from local state
        setNotifications(prev => {
          const filtered = prev.filter(n => n.id !== notificationId);
          const deletedNotification = prev.find(n => n.id === notificationId);
          if (deletedNotification && !deletedNotification.isRead) {
            setUnreadCount(curr => Math.max(0, curr - 1));
          }
          return filtered;
        });
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
      setError('Failed to delete notification');
    } finally {
      setDeletingNotification(null);
    }
  };

  const dispatch = useAppDispatch();
  const { refreshHomeData } = useRefreshHomeData();

  // Utility function to get holiday display name from key
  const getHolidayDisplayName = (holidayKey: string): string => {
    const displayNames: Record<string, string> = {
      christmas: 'Christmas',
      thanksgiving: 'Thanksgiving',
      halloween: 'Halloween',
      easter: 'Easter',
      valentines: "Valentine's Day",
      'new-year': 'New Year',
      hanukkah: 'Hanukkah',
      kwanzaa: 'Kwanzaa',
      'mothers-day': "Mother's Day",
      'fathers-day': "Father's Day",
      'fourth-of-july': 'Fourth of July',
      birthday: 'Birthday',
      anniversary: 'Anniversary',
      graduation: 'Graduation',
      'baby-shower': 'Baby Shower',
    };
    return displayNames[holidayKey] || holidayKey;
  };

  // Helper to check if user already has this holiday
  const checkExistingHoliday = (holidayKey: string): boolean => {
    const holidayDisplayName = getHolidayDisplayName(holidayKey);
    return holidayPreferences.some(pref => pref.holiday === holidayDisplayName);
  };

  // Handle accept button click - check for existing holiday first
  const handleAcceptClick = (notification: Notification) => {
    if (!notification.holiday?.holidayType) {
      // If we don't have holiday info, proceed without warning
      handleConfirmAccept(notification.entityId!);
      return;
    }

    const hasExisting = checkExistingHoliday(notification.holiday.holidayType);
    setConfirmInvite({ invite: notification, hasExistingHoliday: hasExisting });
  };

  // Actually accept the invite after confirmation
  const handleConfirmAccept = async (inviteId: string) => {
    if (!inviteId) return;

    setAcceptingInvite(true);
    try {
      // Use Redux action instead of manual fetch
      const result = await dispatch(acceptInvite({ inviteId, auth0User }));

      if (acceptInvite.fulfilled.match(result)) {
        // Add the share to our state
        if (result.payload?.share) {
          dispatch(addShare(result.payload.share));
        }

        // Remove invite notification from local state
        setNotifications(prev => {
          const filtered = prev.filter(n => n.entityId !== inviteId);
          const removedNotification = prev.find(n => n.entityId === inviteId);
          if (removedNotification && !removedNotification.isRead) {
            setUnreadCount(curr => Math.max(0, curr - 1));
          }
          return filtered;
        });

        // Refresh home data to update shared holidays
        if (auth0User) {
          // 🔥 IMPROVED FIX: Proper state refresh sequence after invite acceptance
          // 1. Initial refresh to get the new holiday preference
          await refreshHomeData(auth0User, 'all');

          // 2. Refresh shares to ensure proper share data is loaded
          if (auth0User.sub) {
            await dispatch(refreshShares(auth0User.sub)).unwrap();
          }

          // 3. Force a second home data refresh to ensure shared data is properly linked
          await refreshHomeData(auth0User, 'all');
        }

        // Close confirmation modal
        setConfirmInvite(null);
      } else {
        throw new Error('Failed to accept invite');
      }
    } catch (err) {
      console.error('Error accepting invite:', err);
      setError('Failed to accept invite');
    } finally {
      setAcceptingInvite(false);
    }
  };

  const handleAcceptInvite = async (inviteId: string) => {
    // Find the notification for this invite to check for existing holiday
    const inviteNotification = notifications.find(n => n.entityId === inviteId);
    if (inviteNotification) {
      handleAcceptClick(inviteNotification);
    } else {
      // Fallback to direct acceptance if notification not found
      handleConfirmAccept(inviteId);
    }
  };

  const handleDeclineInvite = async (inviteId: string) => {
    try {
      setLoading(true);

      // Create headers with authentication if user is available
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (auth0User) {
        headers['x-test-user'] = JSON.stringify({
          sub: auth0User.sub,
          email: auth0User.email,
          name: auth0User.name,
        });
      }

      const response = await fetch(`/api/invites/${inviteId}/decline`, {
        method: 'POST',
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to decline invite');
      }

      // Remove invite notification from local state
      setNotifications(prev => {
        const filtered = prev.filter(n => n.entityId !== inviteId);
        const removedNotification = prev.find(n => n.entityId === inviteId);
        if (removedNotification && !removedNotification.isRead) {
          setUnreadCount(curr => Math.max(0, curr - 1));
        }
        return filtered;
      });
    } catch (err) {
      console.error('Error declining invite:', err);
      setError('Failed to decline invite');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Bell Icon with Badge */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
      >
        <BellIcon size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-medium">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
        {/* Connection status indicator */}
        <div
          className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${
            isConnected
              ? usePolling
                ? 'bg-blue-500'
                : 'bg-green-500'
              : 'bg-gray-400'
          }`}
          title={
            isConnected
              ? usePolling
                ? 'Connected via polling (10s intervals)'
                : 'Connected via real-time stream'
              : 'Reconnecting...'
          }
        />
      </button>

      {/* Notifications Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          {/* Dropdown Panel */}
          <div
            className="fixed sm:absolute left-4 right-4 sm:left-auto sm:right-0 top-16 sm:top-auto sm:mt-2 w-auto sm:w-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 max-h-96 overflow-hidden max-w-md sm:max-w-none mx-auto sm:mx-0"
            style={{
              maxWidth: 'calc(100vw - 1rem)',
              right: '0',
              minWidth: '20rem',
            }}
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Notifications
                </h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={() => {
                        // Mark all unread notifications as read
                        const unreadIds = notifications
                          .filter(n => !n.isRead)
                          .map(n => n.id);
                        if (unreadIds.length > 0) {
                          handleMarkAsRead(unreadIds);
                        }
                      }}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      disabled={loading}
                    >
                      Mark all read
                    </button>
                  )}
                  {/* Connection type indicator */}
                  <div className="text-xs font-medium">
                    {isConnected ? (
                      usePolling ? (
                        <span className="text-blue-600 dark:text-blue-400">
                          Polling
                        </span>
                      ) : (
                        <span className="text-green-600 dark:text-green-400">
                          Live
                        </span>
                      )
                    ) : (
                      <span className="text-gray-500 dark:text-gray-400">
                        Offline
                      </span>
                    )}
                  </div>
                  {/* Debug control for development */}
                  {process.env.NODE_ENV === 'development' && usePolling && (
                    <button
                      onClick={retrySSE}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                      title="Retry SSE connection"
                    >
                      Retry SSE
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Error State */}
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border-b border-gray-200 dark:border-gray-700">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                <button
                  onClick={() => {
                    setError(null);
                    fetchNotifications();
                  }}
                  className="text-sm text-red-700 dark:text-red-300 underline hover:no-underline mt-1"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Notifications List */}
            <div className="max-h-80 overflow-y-auto">
              {loading && notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-gray-500 dark:text-gray-400">
                    Loading notifications...
                  </p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <BellIcon size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No notifications yet</p>
                </div>
              ) : (
                notifications.map((notification, index) => (
                  <NotificationItem
                    key={`${notification.id}-${index}`}
                    notification={notification}
                    onMarkRead={handleMarkAsRead}
                    onAcceptInvite={handleAcceptClick}
                    onDeclineInvite={handleDeclineInvite}
                    onDelete={handleDeleteNotification}
                    loading={loading}
                    deletingNotification={deletingNotification}
                  />
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && !error && (
              <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    // Mark all as read - filter out temporary IDs and invalid IDs
                    const unreadIds = notifications
                      .filter(
                        n =>
                          !n.isRead &&
                          n.id &&
                          typeof n.id === 'string' &&
                          !n.id.startsWith('temp-'),
                      )
                      .map(n => n.id);
                    if (unreadIds.length > 0) {
                      handleMarkAsRead(unreadIds);
                    }
                  }}
                  disabled={loading || unreadCount === 0}
                  className="text-sm text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Mark all as read
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Holiday Data Warning Modal */}
      {confirmInvite && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Accept Holiday Invitation
              </h3>

              <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                {confirmInvite.hasExistingHoliday ? (
                  <>
                    You already have{' '}
                    <strong>
                      {confirmInvite.invite.holiday?.name ||
                        getHolidayDisplayName(
                          confirmInvite.invite.holiday?.holidayType ||
                            'this holiday',
                        )}
                    </strong>{' '}
                    with your own data (tasks, gifts, etc.).
                  </>
                ) : (
                  <>
                    Accept the invite to share{' '}
                    <strong>
                      {confirmInvite.invite.holiday?.name ||
                        getHolidayDisplayName(
                          confirmInvite.invite.holiday?.holidayType ||
                            'this holiday',
                        )}
                    </strong>{' '}
                    with{' '}
                    <strong>
                      {confirmInvite.invite.fromUser?.name || 'another user'}
                    </strong>
                    ?
                  </>
                )}
              </p>

              {confirmInvite.hasExistingHoliday && (
                <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-3">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200 font-semibold mb-2">
                    ⚠️ Important:
                  </p>
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    <strong>
                      Accepting this invite will replace your existing holiday data
                    </strong>{' '}
                    with the shared holiday data. This action cannot be undone.
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3 p-6 pt-0">
              <button
                onClick={() => setConfirmInvite(null)}
                disabled={acceptingInvite}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={() => handleConfirmAccept(confirmInvite.invite.entityId!)}
                disabled={acceptingInvite || !confirmInvite.invite.entityId}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors font-medium text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {acceptingInvite && (
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                )}
                {confirmInvite.hasExistingHoliday
                  ? 'Accept & Replace My Data'
                  : 'Accept Invitation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface NotificationItemProps {
  notification: Notification;
  onMarkRead: (notificationIds: string[]) => void;
  onAcceptInvite: (notification: Notification) => void;
  onDeclineInvite: (inviteId: string) => void;
  onDelete: (notificationId: string) => void;
  loading: boolean;
  deletingNotification: string | null;
}

function NotificationItem({
  notification,
  onMarkRead,
  onAcceptInvite,
  onDeclineInvite,
  onDelete,
  loading,
  deletingNotification,
}: NotificationItemProps) {
  const isDeleting = deletingNotification === notification.id;
  if (notification.isInvite) {
    return (
      <div className="p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
        <div className="flex items-start space-x-3">
          {/* Icon */}
          <div className="flex-shrink-0 mt-1">
            <BellIcon size={16} className="text-green-500" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                {notification.title}
              </h4>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatTimeAgo(notification.createdAt)}
                </span>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    onDelete(notification.id);
                  }}
                  className="text-red-500 hover:text-red-700 transition-colors p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                  title="Delete notification"
                  disabled={loading || isDeleting}
                >
                  {isDeleting ? (
                    <svg
                      className="animate-spin h-3 w-3"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  ) : (
                    <XIcon size={12} />
                  )}
                </button>
              </div>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {notification.message}
            </p>

            {notification.holiday && (
              <span className="inline-block mt-2 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                {notification.holiday.name}
              </span>
            )}

            {/* Action Buttons for Invites */}
            <div className="flex space-x-2 mt-3">
              <button
                onClick={() => onAcceptInvite(notification)}
                disabled={loading || !notification.entityId}
                className="flex-1 px-3 py-2 text-sm bg-green-500 hover:bg-green-600 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Accept
              </button>
              <button
                onClick={() =>
                  notification.entityId && onDeclineInvite(notification.entityId)
                }
                disabled={loading || !notification.entityId}
                className="flex-1 px-3 py-2 text-sm bg-gray-500 hover:bg-gray-600 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Decline
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer ${
        !notification.isRead ? 'bg-blue-50 dark:bg-blue-900/20' : ''
      }`}
      onClick={() => !notification.isRead && onMarkRead([notification.id])}
    >
      <div className="flex items-start space-x-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-1">
          <UserIcon size={16} className="text-blue-500" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4
              className={`text-sm font-medium ${
                notification.isRead
                  ? 'text-gray-700 dark:text-gray-300'
                  : 'text-gray-900 dark:text-white'
              }`}
            >
              {notification.title}
            </h4>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatTimeAgo(notification.createdAt)}
                </span>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    onDelete(notification.id);
                  }}
                  className="text-red-500 hover:text-red-700 transition-colors p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                  title="Delete notification"
                  disabled={loading || isDeleting}
                >
                  {isDeleting ? (
                    <svg
                      className="animate-spin h-3 w-3"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  ) : (
                    <XIcon size={12} />
                  )}
                </button>
                {!notification.isRead && (
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      onMarkRead([notification.id]);
                    }}
                    className="text-blue-500 hover:text-blue-700 transition-colors"
                    title="Mark as read"
                    disabled={loading}
                  >
                    <CheckCircleIcon size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {notification.message}
          </p>

          {notification.holiday && (
            <span className="inline-block mt-2 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
              {notification.holiday.name}
            </span>
          )}
        </div>

        {!notification.isRead && (
          <div className="flex-shrink-0 mt-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          </div>
        )}
      </div>
    </div>
  );
}
