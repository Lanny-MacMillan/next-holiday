"use client";

import { useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
	setUser,
	clearUser,
	checkUserInDb,
	addUserToDb,
} from "@/store/slices/userSlice";
import { clearHomeData } from "@/store/slices/homeSlice";
import { clearCachedData } from "@/store/slices/themeSlice";
import { clearPreferences } from "@/store/slices/userPreferencesSlice";
import { api } from "@/store/api";
import { ReactNode } from "react";

interface AuthWrapperProps {
	children: ReactNode;
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
	const { user, isAuthenticated, isLoading } = useAuth0();
	const dispatch = useAppDispatch();
	const { user: reduxUser, loading } = useAppSelector(
		(state: any) => state.user
	);

	useEffect(() => {
		if (isAuthenticated && user && !reduxUser) {
			// User is authenticated but not in Redux yet
			const userData = {
				id: "", // Will be set by the database
				sub: user.sub!,
				email: user.email,
				name: user.name,
				picture: user.picture,
				isInDb: false, // Will be updated after DB check
				isFirstLogin: false, // Will be updated after DB check
				lastUpdated: new Date().toISOString(),
			};

			// Add user to Redux
			dispatch(setUser(userData));

			// Always try to add/update user in DB (the backend will handle if user exists or not)
			console.log("Syncing user with database:", {
				sub: userData.sub,
				email: userData.email,
				name: userData.name,
				picture: userData.picture,
			});
			dispatch(
				addUserToDb({
					sub: userData.sub,
					email: userData.email,
					name: userData.name,
					picture: userData.picture,
				})
			);
		} else if (!isAuthenticated && reduxUser) {
			// User logged out - clear all user data and caches for multi-tenant safety
			dispatch(clearUser());
			dispatch(clearHomeData());
			dispatch(clearCachedData());
			dispatch(clearPreferences());
			// Clear RTK Query cache to prevent cross-tenant data leakage
			dispatch(api.util.resetApiState());
		}
	}, [isAuthenticated, user, reduxUser, dispatch]);

	// Handle user switching (different user logs in)
	useEffect(() => {
		if (isAuthenticated && user && reduxUser && user.sub !== reduxUser.sub) {
			// Different user logged in - clear all data and caches
			console.log("User switched, clearing all data:", {
				oldSub: reduxUser.sub,
				newSub: user.sub,
			});
			dispatch(clearUser());
			dispatch(clearHomeData());
			dispatch(clearCachedData());
			dispatch(clearPreferences());
			dispatch(api.util.resetApiState());
		}
	}, [user?.sub, reduxUser?.sub, isAuthenticated, dispatch]);

	if (isLoading) {
		return (
			<div className="min-h-screen bg-gradient-to-b from-green-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
					<p className="text-gray-600 dark:text-gray-300">Loading...</p>
				</div>
			</div>
		);
	}

	return <>{children}</>;
}
