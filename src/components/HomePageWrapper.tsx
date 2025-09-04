"use client";

import { useAuth0 } from "@auth0/auth0-react";
import { useEffect, useState } from "react";
import { useAppDispatch } from "@/store/hooks";
import { setHomeData as setHomeDataAction } from "@/store/slices/homeSlice";
import HomeContent from "@/components/HomeContent";
import UserSetupHandler from "@/components/UserSetupHandler";
import { HomeData } from "@/types/home";

export default function HomePageWrapper() {
	const { user: auth0User, isAuthenticated, isLoading } = useAuth0();
	const dispatch = useAppDispatch();
	const [homeData, setHomeData] = useState<HomeData | null>(null);
	const [isLoadingData, setIsLoadingData] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		async function fetchHomeData() {
			if (!isAuthenticated || !auth0User) {
				setIsLoadingData(false);
				return;
			}

			try {
				setIsLoadingData(true);
				setError(null);

				// Call the API endpoint instead of the server function directly
				const response = await fetch("/api/home", {
					headers: {
						"Content-Type": "application/json",
						"x-test-user": JSON.stringify({
							sub: auth0User.sub,
							email: auth0User.email,
							name: auth0User.name,
							picture: auth0User.picture,
						}),
					},
				});

				if (!response.ok) {
					throw new Error("Failed to fetch home data");
				}

				const result = await response.json();
				const data = result.data;
				setHomeData(data);
				// Also dispatch to Redux store for access throughout the app
				dispatch(setHomeDataAction(data));
			} catch (err) {
				console.error("Error fetching home data:", err);
				setError("Failed to load page data");
			} finally {
				setIsLoadingData(false);
			}
		}

		fetchHomeData();
	}, [isAuthenticated, auth0User, dispatch]);

	// Show loading state while Auth0 is loading
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

	// Show loading state while fetching data
	if (isLoadingData) {
		return (
			<div className="min-h-screen christmas-gradient flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
					<p className="text-gray-600 dark:text-gray-300">
						Loading your holiday data...
					</p>
				</div>
			</div>
		);
	}

	// Show error state
	if (error) {
		return (
			<div className="min-h-screen christmas-gradient flex items-center justify-center">
				<div className="text-center">
					<div className="text-red-500 mb-4">
						<p className="text-lg font-semibold">Error Loading Page</p>
						<p className="text-sm">{error}</p>
					</div>
					<button
						onClick={() => window.location.reload()}
						className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
					>
						Refresh Page
					</button>
				</div>
			</div>
		);
	}

	// Show user setup handler if needed
	if (homeData?.needsUserSetup) {
		return (
			<UserSetupHandler
				needsUserSetup={homeData.needsUserSetup}
				onSetupComplete={() => {
					// Trigger a re-fetch of the data
					window.location.reload();
				}}
			/>
		);
	}

	// Show main content
	if (homeData) {
		return <HomeContent homeData={homeData} />;
	}

	// Fallback loading state
	return (
		<div className="min-h-screen christmas-gradient flex items-center justify-center">
			<div className="text-center">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
				<p className="text-gray-600 dark:text-gray-300">Loading...</p>
			</div>
		</div>
	);
}
