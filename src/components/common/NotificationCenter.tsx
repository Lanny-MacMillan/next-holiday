'use client';

import { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';

// Simple SVG icons to avoid external dependencies
const BellIcon = ({
  size = 24,
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

  // Initial fetch on mount
  useEffect(() => {
    fetchNotifications();
  }, [isAuthenticated, auth0User]);

  // SSE connection for real-time notifications
  useEffect(() => {
    // Only connect if authenticated and have user data
    if (!isAuthenticated || !auth0User) {
      return;
    }

    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;

    const connectSSE = () => {
      try {
        // Create URL with current user authentication for SSE
        const testUser = {
          sub: auth0User.sub || 'auth0|test-user-123',
          email: auth0User.email || 'test@example.com',
          name: auth0User.name || 'Test User',
          picture: auth0User.picture || null,
        };

        const sseUrl = new URL('/api/notifications/stream', window.location.origin);
        sseUrl.searchParams.set(
          'testUser',
          encodeURIComponent(JSON.stringify(testUser)),
        );

        eventSource = new EventSource(sseUrl.toString());

        eventSource.onopen = () => {
          console.log('🔔 Notification stream connected');
          setIsConnected(true);
          setError(null);
        };

        eventSource.onmessage = event => {
          try {
            const data = JSON.parse(event.data);

            // Handle system messages (heartbeat, connection status, etc.)
            if (data.type === 'heartbeat' || data.type === 'connection') {
              // These are system messages, not user notifications - ignore silently
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

            console.log('📬 New notification received:', notification.title);

            // Add to notifications list with better deduplication
            setNotifications(prev => {
              // Safety check: ensure notification has valid ID
              if (!notification.id || typeof notification.id !== 'string') {
                console.warn('Skipping notification with invalid ID:', notification);
                return prev;
              }

              // Check for duplicates by ID, but also by content for real-time notifications
              const existsById = prev.some(n => n.id === notification.id);

              // For real-time notifications (temp IDs), also check by content to avoid duplicates
              const existsByContent =
                notification.id.startsWith('temp-') &&
                prev.some(
                  n =>
                    n.entityId === notification.entityId &&
                    n.entityType === notification.entityType &&
                    n.type === notification.type &&
                    n.message === notification.message,
                );

              if (existsById || existsByContent) {
                return prev;
              }

              return [notification, ...prev];
            });

            // Update unread count
            if (!notification.isRead) {
              setUnreadCount(prev => prev + 1);
            }

            // Optional: Show browser notification if permission granted
            if (Notification.permission === 'granted') {
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
          console.log('SSE connection error, will attempt reconnect...');
          setIsConnected(false);
          eventSource?.close();

          // Auto-reconnect after 3 seconds
          reconnectTimeout = setTimeout(() => {
            connectSSE();
          }, 3000);
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
      setIsConnected(false);
    };
  }, [isAuthenticated, auth0User]);

  // Request browser notification permission on mount
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

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

  const handleAcceptInvite = async (inviteId: string) => {
    try {
      setLoading(true);

      const response = await fetch(`/api/invites/${inviteId}/accept`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to accept invite');
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
      console.error('Error accepting invite:', err);
      setError('Failed to accept invite');
    } finally {
      setLoading(false);
    }
  };

  const handleDeclineInvite = async (inviteId: string) => {
    try {
      setLoading(true);

      const response = await fetch(`/api/invites/${inviteId}/decline`, {
        method: 'POST',
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
        <BellIcon size={24} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-medium">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
        {/* Connection status indicator */}
        <div
          className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${
            isConnected ? 'bg-green-500' : 'bg-gray-400'
          }`}
          title={isConnected ? 'Connected to notifications' : 'Reconnecting...'}
        />
      </button>

      {/* Notifications Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          {/* Dropdown Panel */}
          <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 max-h-96 overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Notifications
                </h3>
                {unreadCount > 0 && (
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {unreadCount} unread
                  </span>
                )}
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
                    onAcceptInvite={handleAcceptInvite}
                    onDeclineInvite={handleDeclineInvite}
                    loading={loading}
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
    </div>
  );
}

interface NotificationItemProps {
  notification: Notification;
  onMarkRead: (notificationIds: string[]) => void;
  onAcceptInvite: (inviteId: string) => void;
  onDeclineInvite: (inviteId: string) => void;
  loading: boolean;
}

function NotificationItem({
  notification,
  onMarkRead,
  onAcceptInvite,
  onDeclineInvite,
  loading,
}: NotificationItemProps) {
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
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formatTimeAgo(notification.createdAt)}
              </span>
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
                onClick={() =>
                  notification.entityId && onAcceptInvite(notification.entityId)
                }
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
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formatTimeAgo(notification.createdAt)}
              </span>
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
