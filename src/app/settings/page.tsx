'use client';

import { useAuth0 } from '@auth0/auth0-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  selectUser,
  selectUserSubscriptionPlan,
  selectIsUserPlusMember,
  selectUserSubscriptionData,
} from '@/store/slices/userSlice';
import { updateSettings } from '@/store/slices/themeSlice';
import { updateUserPreferences } from '@/store/slices/userPreferencesSlice';
import { saveHolidayPreferences } from '@/store/slices/holidayPreferencesSlice';
import { setHomeData, refreshHomeData } from '@/store/slices/homeSlice';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import HolidayDeleteConfirmationModal from '@/components/modals/HolidayDeleteConfirmationModal';
import CancelSubscriptionModal from '@/components/modals/CancelSubscriptionModal';
import UpgradeModal from '@/components/modals/UpgradeModal';

export default function SettingsPage() {
  const { user } = useAuth0();
  const dispatch = useAppDispatch();
  const { settings } = useAppSelector((state: any) => state.theme);
  const { preferences } = useAppSelector((state: any) => state.userPreferences);
  const { data: homeData } = useAppSelector((state: any) => state.home);

  const [localSettings, setLocalSettings] = useState(settings);
  const [localHolidayPreferences, setLocalHolidayPreferences] = useState<any[]>([]);
  const [imageError, setImageError] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [currentDisplayName, setCurrentDisplayName] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);
  const [notificationUpdating, setNotificationUpdating] = useState<Set<string>>(
    new Set(),
  );

  // Cascade delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [holidayToDelete, setHolidayToDelete] = useState<{
    name: string;
    id: string;
  } | null>(null);

  // Subscription cancellation modal state
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  // Upgrade modal state
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  // Get user subscription status from Redux using selectors
  const currentUser = useAppSelector(selectUser);
  const subscriptionPlan = useAppSelector(selectUserSubscriptionPlan);
  const isUserPlusMember = useAppSelector(selectIsUserPlusMember);
  const subscriptionData = useAppSelector(selectUserSubscriptionData);

  // Reset image error when user changes and sync name from homeData
  useEffect(() => {
    setImageError(false);
    // Use homeData user name if available (updated from DB), fallback to Auth0 user name
    const displayName = homeData?.user?.name || user?.name || '';
    setCurrentDisplayName(displayName);
  }, [user?.picture, user?.name, homeData?.user?.name]);

  // Update local settings when preferences are loaded
  useEffect(() => {
    if (preferences) {
      setLocalSettings({
        ...localSettings,
        theme: preferences.theme || settings.theme,
        displayMode: preferences.displayMode || settings.displayMode,
        notifications: {
          reminders:
            preferences.reminderNotifications ?? settings.notifications.reminders,
          assignmentNotifications: preferences.assignmentNotifications ?? true,
          completionNotifications: preferences.completionNotifications ?? true,
          inviteNotifications: preferences.inviteNotifications ?? true,
          emailNotifications: preferences.emailNotifications ?? false,
        },
      });
    }
  }, [preferences]);

  // Fetch home data if not already loaded
  useEffect(() => {
    async function fetchHomeData() {
      if (!user?.sub || homeData) return;

      try {
        const response = await fetch('/api/home', {
          headers: {
            'Content-Type': 'application/json',
            'x-test-user': JSON.stringify({
              sub: user.sub,
              email: user.email,
              name: user.name,
              picture: user.picture,
            }),
          },
        });

        if (response.ok) {
          const result = await response.json();
          const data = result.data;
          // Dispatch to Redux store
          dispatch(setHomeData(data));
        }
      } catch (error) {
        console.error('Failed to fetch home data:', error);
      }
    }

    fetchHomeData();
  }, [user, homeData, dispatch]);

  // Update local holiday preferences when home data is loaded
  useEffect(() => {
    if (homeData?.holidayPreferences) {
      setLocalHolidayPreferences(homeData.holidayPreferences);
    }
  }, [homeData?.holidayPreferences]);

  function getInitials(name: string): string {
    const words = name
      .trim()
      .split(' ')
      .filter(word => word.length > 0);
    if (words.length === 0) return '';
    if (words.length === 1) return words[0].charAt(0).toUpperCase();
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  }

  const handleEditName = () => {
    setEditedName(currentDisplayName || user?.name || '');
    setIsEditingName(true);
  };

  const handleSaveName = async () => {
    if (!user?.sub || editedName.trim() === (user?.name || '')) {
      setIsEditingName(false);
      return;
    }

    setIsSavingName(true);

    try {
      const response = await fetch('/api/users/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          auth0Sub: user.sub,
          name: editedName.trim(),
          picture: user.picture,
        }),
      });

      if (response.ok) {
        // Update local state immediately for UI feedback
        setCurrentDisplayName(editedName.trim());
        setIsEditingName(false);

        // Refresh home data to get updated user information
        if (homeData?.account?.id) {
          try {
            const homeResponse = await fetch('/api/home', {
              headers: {
                'Content-Type': 'application/json',
                'x-test-user': JSON.stringify({
                  sub: user.sub,
                  email: user.email,
                  name: editedName.trim(),
                  picture: user.picture,
                }),
              },
            });

            if (homeResponse.ok) {
              const result = await homeResponse.json();
              dispatch(setHomeData(result.data));
            }
          } catch (homeError) {
            console.error('Failed to refresh home data:', homeError);
          }
        }
      } else {
        console.error('Failed to update name');
        setIsEditingName(false);
      }
    } catch (error) {
      console.error('Error updating name:', error);
      setIsEditingName(false);
    }

    setIsSavingName(false);
  };

  const handleCancelEditName = () => {
    setEditedName('');
    setIsEditingName(false);
  };

  const handleSettingChange = async (key: string, value: any) => {
    const newSettings = { ...localSettings };

    if (key.includes('.')) {
      const [parent, child] = key.split('.');
      newSettings[parent] = { ...newSettings[parent], [child]: value };
    } else {
      newSettings[key] = value;
    }

    setLocalSettings(newSettings);
    dispatch(updateSettings(newSettings));

    // Handle notification preferences separately
    if (key.startsWith('notifications.')) {
      if (user?.sub && homeData?.notificationPreferences) {
        // Prevent multiple updates of the same notification type
        if (notificationUpdating.has(key)) {
          return;
        }

        // Set loading state for this specific notification type
        setNotificationUpdating(prev => new Set(prev).add(key));

        // Optimistically update the UI immediately
        const optimisticHomeData = {
          ...homeData,
          notificationPreferences: {
            ...homeData.notificationPreferences,
          },
        };

        if (key === 'notifications.assignmentNotifications') {
          optimisticHomeData.notificationPreferences.assignmentNotifications = value;
        } else if (key === 'notifications.completionNotifications') {
          optimisticHomeData.notificationPreferences.completionNotifications = value;
        } else if (key === 'notifications.inviteNotifications') {
          optimisticHomeData.notificationPreferences.inviteNotifications = value;
        } else if (key === 'notifications.emailNotifications') {
          optimisticHomeData.notificationPreferences.emailNotifications = value;
        }

        // Update UI immediately (optimistic update)
        dispatch(setHomeData(optimisticHomeData));

        try {
          let notificationData: any = {};

          if (key === 'notifications.assignmentNotifications') {
            notificationData.assignmentNotifications = value;
          } else if (key === 'notifications.completionNotifications') {
            notificationData.completionNotifications = value;
          } else if (key === 'notifications.inviteNotifications') {
            notificationData.inviteNotifications = value;
          } else if (key === 'notifications.emailNotifications') {
            notificationData.emailNotifications = value;
          }

          if (Object.keys(notificationData).length > 0) {
            const response = await fetch('/api/users/me/notification-preferences', {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'x-test-user': JSON.stringify({
                  sub: user.sub,
                  email: user.email,
                  name: user.name,
                  picture: user.picture,
                }),
              },
              body: JSON.stringify(notificationData),
            });

            if (!response.ok) {
              // Revert the optimistic update on error
              dispatch(setHomeData(homeData));
              const errorText = await response.text();
              console.error('❌ API Error response:', errorText);
              throw new Error(
                `Failed to update notification preferences: ${response.status} ${errorText}`,
              );
            }

            // Refresh home data to ensure we have the latest state
            try {
              const homeResponse = await fetch('/api/home', {
                headers: {
                  'Content-Type': 'application/json',
                  'x-test-user': JSON.stringify({
                    sub: user.sub,
                    email: user.email,
                    name: user.name,
                    picture: user.picture,
                  }),
                },
              });

              if (homeResponse.ok) {
                const result = await homeResponse.json();
                dispatch(setHomeData(result.data));
              }
            } catch (homeError) {
              console.error('Failed to refresh home data:', homeError);
            }
          }
        } catch (error) {
          // Revert the optimistic update on error
          dispatch(setHomeData(homeData));
          console.error('Failed to update notification preferences:', error);
        } finally {
          // Clear loading state for this notification type
          setNotificationUpdating(prev => {
            const newSet = new Set(prev);
            newSet.delete(key);
            return newSet;
          });
        }
      }
      return; // Exit early for notification settings
    }

    // Update other user preferences (theme, displayMode, etc.)
    if (user?.sub && preferences) {
      try {
        let preferencesData: any = {};

        if (key === 'theme') {
          preferencesData.theme = value;
        } else if (key === 'displayMode') {
          preferencesData.displayMode = value;
        } else if (key === 'notifications.reminders') {
          preferencesData.reminderNotifications = value;
        }

        if (Object.keys(preferencesData).length > 0) {
          await dispatch(
            updateUserPreferences({
              preferencesData,
              auth0Sub: user.sub,
            }),
          ).unwrap();

          // If theme or display mode changed, refresh home data for component updates
          if (key === 'theme' || key === 'displayMode') {
            try {
              await dispatch(refreshHomeData(user)).unwrap();
            } catch (refreshError) {
              console.error(
                'Failed to refresh home data after theme/display mode change:',
                refreshError,
              );
            }
          }
        }
      } catch (error) {
        console.error('Failed to update preferences in database:', error);
      }
    }
  };

  const handleHolidayPreferenceChange = async (
    holiday: string,
    isSelected: boolean,
    budget: number = 500,
  ) => {
    // If deselecting a holiday, show cascade delete confirmation
    if (!isSelected) {
      // Find the holiday ID from the existing preferences
      const existingPreference = localHolidayPreferences.find(
        p => p.holiday === holiday,
      );

      if (existingPreference?.holidayId) {
        // Show cascade delete confirmation modal
        setHolidayToDelete({
          name: holiday,
          id: existingPreference.holidayId,
        });
        setDeleteModalOpen(true);
        return; // Don't proceed with normal deselection
      }
    }

    let newPreferences = [...localHolidayPreferences];

    if (isSelected) {
      // Add or update holiday preference
      const existingIndex = newPreferences.findIndex(p => p.holiday === holiday);
      if (existingIndex >= 0) {
        newPreferences[existingIndex] = {
          ...newPreferences[existingIndex],
          budget,
        };
      } else {
        newPreferences.push({ holiday, budget });
      }
    } else {
      // Remove holiday preference (this should only happen for holidays without holidayId)
      newPreferences = newPreferences.filter(p => p.holiday !== holiday);
    }

    setLocalHolidayPreferences(newPreferences);

    // Save to database
    if (user?.sub && homeData?.account?.id) {
      try {
        // Send only essential data - holiday type and budget
        const cleanPreferences = newPreferences.map(pref => ({
          holiday: pref.holiday,
          budget: pref.budget || 500,
        }));

        await dispatch(
          saveHolidayPreferences({
            accountId: homeData.account.id,
            preferences: cleanPreferences,
            auth0User: user,
          }),
        ).unwrap();
      } catch (error) {
        console.error('Failed to save holiday preferences:', error);
      }
    }
  };

  const handleBudgetChange = async (holiday: string, newBudget: number) => {
    const newPreferences = localHolidayPreferences.map(pref =>
      pref.holiday === holiday ? { ...pref, budget: newBudget } : pref,
    );

    setLocalHolidayPreferences(newPreferences);

    // Save to database
    if (user?.sub && homeData?.account?.id) {
      try {
        // Send only essential data - holiday type and budget
        const cleanPreferences = newPreferences.map(pref => ({
          holiday: pref.holiday,
          budget: pref.budget || 500,
        }));

        await dispatch(
          saveHolidayPreferences({
            accountId: homeData.account.id,
            preferences: cleanPreferences,
            auth0User: user,
          }),
        ).unwrap();
      } catch (error) {
        console.error('Failed to save holiday preferences:', error);
      }
    }
  };

  const handleSave = () => {
    dispatch(updateSettings(localSettings));
  };

  // Cascade delete modal handlers
  const handleDeleteModalClose = () => {
    setDeleteModalOpen(false);
    setHolidayToDelete(null);
  };

  const handleDeleteConfirm = async () => {
    // This function is called ONLY after the user has successfully confirmed
    // the deletion by typing the holiday name and clicking "Delete Holiday"
    // in the modal. The cascade delete has completed successfully by this point.

    // Now remove the holiday from local preferences and save to database
    const newPreferences = localHolidayPreferences.filter(
      p => p.holiday !== holidayToDelete?.name,
    );
    setLocalHolidayPreferences(newPreferences);

    // Save to database
    if (user?.sub && homeData?.account?.id) {
      try {
        // Send only essential data - holiday type and budget
        const cleanPreferences = newPreferences.map(pref => ({
          holiday: pref.holiday,
          budget: pref.budget || 500,
        }));

        await dispatch(
          saveHolidayPreferences({
            accountId: homeData.account.id,
            preferences: cleanPreferences,
            auth0User: user,
          }),
        ).unwrap();
      } catch (error) {
        console.error('Failed to save holiday preferences after deletion:', error);
      }
    }

    // Close the modal
    handleDeleteModalClose();
  };

  // Use preferences from database if available, otherwise fall back to local settings
  const currentTheme = preferences?.theme || localSettings.theme;
  const currentDisplayMode = preferences?.displayMode || localSettings.displayMode;
  const currentReminders =
    preferences?.reminderNotifications ?? localSettings.notifications.reminders;
  const currentAssignmentNotifications =
    homeData?.notificationPreferences?.assignmentNotifications ??
    localSettings.notifications.assignmentNotifications;
  const currentCompletionNotifications =
    homeData?.notificationPreferences?.completionNotifications ??
    localSettings.notifications.completionNotifications;
  const currentInviteNotifications =
    homeData?.notificationPreferences?.inviteNotifications ??
    localSettings.notifications.inviteNotifications;
  const currentEmailNotifications =
    homeData?.notificationPreferences?.emailNotifications ??
    localSettings.notifications.emailNotifications;

  return (
    <div className="min-h-screen christmas-settings-gradient flex flex-col items-center p-4 sm:p-8 font-sans">
      <header className="w-full max-w-2xl py-6 flex flex-col items-center relative">
        <Link
          href="/"
          className="absolute left-0 top-10 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </Link>
        <h1 className="text-3xl font-bold mb-2 text-gray-800 dark:text-white">
          Settings
        </h1>
        <p className="text-center text-gray-800 dark:text-gray-400">
          Manage your account and preferences
        </p>
      </header>

      <main className="w-full max-w-2xl flex flex-col gap-8">
        {/* User Information */}
        <div className="card card-settings rounded-lg p-6">
          {/* <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
            👤 User Information
          </h2> */}
          {/* Profile Header */}
          <div className="flex items-center space-x-6 mb-6">
            {user?.picture && !imageError ? (
              <img
                src={user.picture}
                alt="Profile"
                className="w-20 h-20 rounded-full border-4 border-white shadow-lg dark:border-gray-700"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border-4 border-white shadow-lg dark:border-gray-700">
                <span className="text-white font-bold text-xl">
                  {getInitials(currentDisplayName || user?.name || 'User')}
                </span>
              </div>
            )}
            <div>
              <div className="flex items-center space-x-2 mb-2">
                {isEditingName ? (
                  <>
                    <input
                      type="text"
                      value={editedName}
                      onChange={e => setEditedName(e.target.value)}
                      disabled={isSavingName}
                      className={`text-2xl font-bold text-gray-800 dark:text-white bg-transparent border-b-2 border-blue-500 focus:border-blue-600 outline-none px-1 ${
                        isSavingName ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      placeholder="Enter your name"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveName}
                      disabled={isSavingName}
                      className={`p-2 rounded-full transition-colors ${
                        isSavingName
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-700'
                          : 'bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900 dark:text-green-300'
                      }`}
                      title="Save"
                    >
                      {isSavingName ? (
                        <svg
                          className="w-4 h-4 animate-spin"
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
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={handleCancelEditName}
                      className="p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900 dark:text-red-300"
                      title="Cancel"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </>
                ) : (
                  <>
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                      {currentDisplayName || 'Anonymous User'}
                    </h3>
                    <button
                      onClick={handleEditName}
                      className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600 transition-colors"
                      title="Edit name"
                    >
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                  </>
                )}
              </div>
              {homeData?.user?.createdAt && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Member since{' '}
                  {new Date(homeData.user.createdAt).toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              )}
            </div>
          </div>

          {/* Account Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <svg
                    className="w-5 h-5 text-blue-600 dark:text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Email Address
                  </p>
                  <p className="text-xs font-medium text-gray-800 dark:text-white truncate">
                    {user?.email || 'Not provided'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <svg
                    className="w-5 h-5 text-purple-600 dark:text-purple-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    User ID
                  </p>
                  <p className="text-xs font-mono text-gray-800 dark:text-gray-400">
                    {user?.sub ? user.sub.substring(0, 24) + '...' : 'Not available'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Theme Settings */}
        <div className="card card-settings rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white  border-b border-gray-200 dark:border-gray-700 pb-4">
            🎨 Appearance
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-800 dark:text-gray-300">
                  Dark Mode
                </label>
                <p className="text-xs text-gray-800 dark:text-gray-400">
                  Switch between light and dark themes
                </p>
              </div>
              <button
                onClick={() =>
                  handleSettingChange(
                    'theme',
                    currentTheme === 'light' ? 'dark' : 'light',
                  )
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  currentTheme === 'dark' ? 'bg-blue-600' : 'bg-gray-400'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    currentTheme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            {isUserPlusMember && (
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-800 dark:text-gray-300">
                    Display Mode
                  </label>
                  <p className="text-xs text-gray-800 dark:text-gray-400">
                    Choose between professional and gamified card styles
                  </p>
                </div>
                <button
                  onClick={() =>
                    handleSettingChange(
                      'displayMode',
                      currentDisplayMode === 'professional'
                        ? 'gamified'
                        : 'professional',
                    )
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    currentDisplayMode === 'gamified' ? 'bg-blue-600' : 'bg-gray-400'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      currentDisplayMode === 'gamified'
                        ? 'translate-x-6'
                        : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            )}{' '}
          </div>
        </div>

        {/* Holiday Settings */}
        <div className="card card-settings rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white  border-b border-gray-200 dark:border-gray-700 pb-4">
            🎄 Holidays
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-800 dark:text-gray-300">
                Holiday Choices & Budgets
              </label>
              <p className="text-xs text-gray-800 dark:text-gray-400 mb-2">
                Select holidays and set individual budget limits
              </p>
              <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto">
                {[
                  'Christmas',
                  'Hanukkah',
                  'Kwanzaa',
                  'New Year',
                  "Valentine's Day",
                  'Easter',
                  'Thanksgiving',
                  'Halloween',
                  "Mother's Day",
                  "Father's Day",
                  'Birthday',
                  'Anniversary',
                  'Fourth of July',
                  'Graduation',
                  'Baby Shower',
                ].map(holiday => {
                  const isSelected = localHolidayPreferences.some(
                    (choice: { holiday: string; budget: number }) =>
                      choice.holiday === holiday,
                  );
                  const selectedChoice = localHolidayPreferences.find(
                    (choice: { holiday: string; budget: number }) =>
                      choice.holiday === holiday,
                  );
                  const budget = selectedChoice?.budget || 500;

                  return (
                    <div
                      key={holiday}
                      className={`p-3 rounded border transition-colors ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={e => {
                              handleHolidayPreferenceChange(
                                holiday,
                                e.target.checked,
                                budget,
                              );
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm font-medium text-gray-800 dark:text-white">
                            {holiday}
                          </span>
                        </div>
                        {isUserPlusMember && isSelected && (
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              Budget:
                            </span>
                            <input
                              type="number"
                              value={budget}
                              onChange={e => {
                                const newBudget = parseInt(e.target.value) || 0;
                                handleBudgetChange(holiday, newBudget);
                              }}
                              className="w-20 text-xs rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white px-2 py-1"
                              min="0"
                              step="50"
                            />
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              $
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="card card-settings rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white  border-b border-gray-200 dark:border-gray-700 pb-4">
            🔔 Notifications
          </h2>
          <div className="space-y-4">
            {/* REMINDERS */}
            {/* <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-800 dark:text-gray-300">
                  Reminders
                </label>
                <p className="text-xs text-gray-800 dark:text-gray-400">
                  Get reminded about upcoming tasks and events
                </p>
              </div>
              <button
                onClick={() =>
                  handleSettingChange('notifications.reminders', !currentReminders)
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  currentReminders ? 'bg-blue-600' : 'bg-gray-400'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    currentReminders ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div> */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-800 dark:text-gray-300 pb-4">
                  Assignment Notifications
                </label>
                <p className="text-xs text-gray-800 dark:text-gray-400">
                  Get notified when you're assigned tasks or gifts
                </p>
              </div>
              <button
                onClick={() =>
                  handleSettingChange(
                    'notifications.assignmentNotifications',
                    !currentAssignmentNotifications,
                  )
                }
                disabled={notificationUpdating.has(
                  'notifications.assignmentNotifications',
                )}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notificationUpdating.has('notifications.assignmentNotifications')
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                } ${currentAssignmentNotifications ? 'bg-blue-600' : 'bg-gray-400'}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    currentAssignmentNotifications
                      ? 'translate-x-6'
                      : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-800 dark:text-gray-300">
                  Completion Notifications
                </label>
                <p className="text-xs text-gray-800 dark:text-gray-400">
                  Get notified when assignments are completed
                </p>
              </div>
              <button
                onClick={() =>
                  handleSettingChange(
                    'notifications.completionNotifications',
                    !currentCompletionNotifications,
                  )
                }
                disabled={notificationUpdating.has(
                  'notifications.completionNotifications',
                )}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notificationUpdating.has('notifications.completionNotifications')
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                } ${currentCompletionNotifications ? 'bg-blue-600' : 'bg-gray-400'}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    currentCompletionNotifications
                      ? 'translate-x-6'
                      : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-800 dark:text-gray-300">
                  Invite Notifications
                </label>
                <p className="text-xs text-gray-800 dark:text-gray-400">
                  Get notified when you're invited to join holidays
                </p>
              </div>
              <button
                onClick={() =>
                  handleSettingChange(
                    'notifications.inviteNotifications',
                    !currentInviteNotifications,
                  )
                }
                disabled={notificationUpdating.has(
                  'notifications.inviteNotifications',
                )}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notificationUpdating.has('notifications.inviteNotifications')
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                } ${currentInviteNotifications ? 'bg-blue-600' : 'bg-gray-400'}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    currentInviteNotifications ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            {/* EMAIL NOTIFICATIONS */}
            {/* <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-800 dark:text-gray-300">
                  Email Notifications
                </label>
                <p className="text-xs text-gray-800 dark:text-gray-400">
                  Receive notifications via email in addition to web
                </p>
              </div>
              <button
                onClick={() =>
                  handleSettingChange(
                    'notifications.emailNotifications',
                    !currentEmailNotifications,
                  )
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  currentEmailNotifications ? 'bg-blue-600' : 'bg-gray-400'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    currentEmailNotifications ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div> */}
          </div>
        </div>

        {/* Subscription Management */}
        <div className="card card-settings rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white  border-b border-gray-200 dark:border-gray-700 pb-4">
            💎 Subscription
          </h2>
          <div className="space-y-4">
            {isUserPlusMember ? (
              <>
                {/* Plus Member Status */}
                <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-purple-600 dark:text-purple-400 font-semibold">
                          ✨ Plus Member
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        $2.99/month • Active subscription
                      </div>
                      {subscriptionData.endDate && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Next billing:{' '}
                          {new Date(subscriptionData.endDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => setCancelModalOpen(true)}
                      className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium transition-colors duration-200"
                    >
                      Cancel Subscription
                    </button>
                  </div>
                </div>

                {/* Plus Benefits */}
                <div>
                  <div className="text-sm font-medium text-gray-800 dark:text-gray-300 mb-2">
                    Your Plus Benefits
                  </div>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      Unlimited holiday invites
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      Advanced sharing & collaboration
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      Premium holiday templates
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      Priority customer support
                    </li>
                  </ul>
                </div>
              </>
            ) : (
              <>
                {/* Free Member Status */}
                <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600 dark:text-gray-400 font-semibold">
                          Free Member
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Limited features available
                      </div>
                    </div>
                  </div>
                </div>

                {/* Upgrade Prompt */}
                <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/10 dark:to-blue-900/10 border border-purple-200 dark:border-purple-700 rounded-lg p-4">
                  <div className="text-center">
                    <div className="text-purple-600 dark:text-purple-400 font-semibold mb-1">
                      Upgrade to Plus
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      Get unlimited invites, premium templates, and more for just
                      $2.99/month
                    </div>
                    <button
                      onClick={() => setUpgradeModalOpen(true)}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 transition-opacity duration-200"
                    >
                      Upgrade Now
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Save Button */}
        {/* <div className="flex justify-center">
					<button
						onClick={handleSave}
						className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
					>
						Save Settings
					</button>
				</div> */}
      </main>

      {/* Cascade Delete Confirmation Modal */}
      {holidayToDelete && (
        <HolidayDeleteConfirmationModal
          isOpen={deleteModalOpen}
          onClose={handleDeleteModalClose}
          onConfirm={handleDeleteConfirm}
          holidayName={holidayToDelete.name}
          holidayId={holidayToDelete.id}
          accountId={homeData?.account?.id || ''}
        />
      )}

      {/* Cancel Subscription Modal */}
      <CancelSubscriptionModal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        onCancel={() => {
          // Refresh user data or show success message
        }}
      />

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        onUpgrade={() => {
          // Refresh user data or show success message
          console.log('Upgrade successful!');
          // Could dispatch a refresh of user state here
        }}
      />
    </div>
  );
}
