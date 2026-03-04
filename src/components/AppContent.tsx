'use client';

import { useAuth0 } from '@auth0/auth0-react';
import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { initializeTheme, clearCachedData } from '@/store/slices/themeSlice';
import {
  getCurrentUserPreferences,
  updateUserPreferences,
} from '@/store/slices/userPreferencesSlice';
import AuthWrapper from './auth/AuthWrapper';
import Header from './common/Header';
import Login from './auth/Login';
import DataInitializer from './DataInitializer';
import UserSync from './auth/UserSync';
import { ReactNode } from 'react';

interface AppContentProps {
  children: ReactNode;
}

export default function AppContent({ children }: AppContentProps) {
  const { isAuthenticated, isLoading, user: auth0User } = useAuth0();
  const dispatch = useAppDispatch();
  const { settings, initialized } = useAppSelector((state: any) => state.theme);
  const { preferences, initialized: preferencesInitialized } = useAppSelector(
    (state: any) => state.userPreferences,
  );

  // Initialize theme on mount
  useEffect(() => {
    if (!initialized) {
      dispatch(initializeTheme());
    }
  }, [initialized]);

  // Load user preferences when authenticated
  useEffect(() => {
    if (isAuthenticated && auth0User?.sub && !preferencesInitialized) {
      dispatch(getCurrentUserPreferences(auth0User.sub));
    }
  }, [isAuthenticated, auth0User?.sub, preferencesInitialized]);

  // Clear cached data when user logs in to prevent seeing stale holiday preferences
  useEffect(() => {
    if (isAuthenticated && auth0User) {
      // Clear any cached holiday preferences from localStorage
      dispatch(clearCachedData());
    }
  }, [isAuthenticated, auth0User]);

  // Apply theme to document
  useEffect(() => {
    if (initialized && preferencesInitialized) {
      const html = document.documentElement;

      // Use preferences from database if available, otherwise fall back to theme slice
      const currentTheme = preferences?.theme || settings.theme;
      const currentDisplayMode = preferences?.displayMode || settings.displayMode;

      // Apply dark/light theme
      if (currentTheme === 'dark') {
        html.classList.add('dark');
      } else {
        html.classList.remove('dark');
      }

      // Apply gamified/professional mode
      if (currentDisplayMode === 'gamified') {
        html.classList.add('gamified-mode');
      } else {
        html.classList.remove('gamified-mode');
      }
    }
  }, [
    settings.theme,
    settings.displayMode,
    initialized,
    preferences?.theme,
    preferences?.displayMode,
    preferencesInitialized,
  ]);

  if (isLoading) {
    return (
      <div className="min-h-screen christmas-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <>
      {/* UserSync disabled to prevent race condition with UserSetupHandler */}
      {/* <UserSync /> */}
      <DataInitializer />
      <Header />
      <AuthWrapper>{children}</AuthWrapper>
    </>
  );
}
