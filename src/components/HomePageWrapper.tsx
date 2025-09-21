"use client";

import { useAuth0 } from "@auth0/auth0-react";
import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setHomeData as setHomeDataAction } from "@/store/slices/homeSlice";
import { setMany as setBudgets } from "@/store/slices/budgetsSlice";
import HomeContent from "@/components/HomeContent";
import UserSetupHandler from "@/components/UserSetupHandler";
import { HomeData } from "@/types/home";

export default function HomePageWrapper() {
	const { user: auth0User, isAuthenticated, isLoading } = useAuth0();
	const dispatch = useAppDispatch();
	const [homeData, setHomeData] = useState<HomeData | null>(null);
	const [isLoadingData, setIsLoadingData] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Get home data from Redux store to sync with local state
	const reduxHomeData = useAppSelector((state: any) => state.home.data);

	// Function to refetch home data - can be called when holidays are updated
	const refetchHomeData = async () => {
		if (!isAuthenticated || !auth0User) {
			return;
		}

		try {
			setIsLoadingData(true);
			setError(null);

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
			dispatch(setHomeDataAction(data));

			// Also populate budgets slice with budget data from home data
			if (data?.holidayPreferences?.length) {
				const budgets = data.holidayPreferences
					.filter((pref: any) => pref.budget !== undefined)
					.map((pref: any) => ({
						holidayId: pref.holidayId,
						targetAmount: pref.budget,
						spentAmount: 0, // TODO: Calculate from gifts/tasks
						updatedAt: new Date().toISOString(),
					}));

				if (budgets.length > 0) {
					dispatch(setBudgets(budgets));
				}
			}

			// Update RTK Query cache with fresh data
			if (data?.holidayPreferences?.length) {
				const { api } = await import("@/store/api");
				const allGifts = data.holidayPreferences.flatMap(
					(pref: any) => pref.gifts || []
				);
				const allCards = data.holidayPreferences.flatMap(
					(pref: any) => pref.cards || []
				);
				const allTasks = data.holidayPreferences.flatMap(
					(pref: any) => pref.tasks || []
				);

				dispatch(
					api.util.upsertQueryData("getAllGifts", { auth0User }, allGifts)
				);
				dispatch(
					api.util.upsertQueryData("getAllCards", { auth0User }, allCards)
				);
				dispatch(
					api.util.upsertQueryData("getAllTasks", { auth0User }, allTasks)
				);

				// Also upsert per-holiday data to prevent individual holiday page fetches
				data.holidayPreferences.forEach((pref: any) => {
					if (pref.holidayId) {
						dispatch(
							api.util.upsertQueryData(
								"getGifts",
								{ holidayId: pref.holidayId, auth0User },
								pref.gifts || []
							)
						);
						dispatch(
							api.util.upsertQueryData(
								"getCards",
								{ holidayId: pref.holidayId, auth0User },
								pref.cards || []
							)
						);
						dispatch(
							api.util.upsertQueryData(
								"getTasks",
								{ holidayId: pref.holidayId, auth0User },
								pref.tasks || []
							)
						);

						// Cache filtered task categories
						if (pref.events) {
							dispatch(
								api.util.upsertQueryData(
									"getEvents",
									{ holidayId: pref.holidayId, auth0User },
									pref.events
								)
							);
						}
						if (pref.decorations) {
							dispatch(
								api.util.upsertQueryData(
									"getDecorations",
									{ holidayId: pref.holidayId, auth0User },
									pref.decorations
								)
							);
						}
						if (pref.kwanzaaPrinciples) {
							dispatch(
								api.util.upsertQueryData(
									"getKwanzaaPrinciples",
									{ holidayId: pref.holidayId, auth0User },
									pref.kwanzaaPrinciples
								)
							);
						}
					}
				});

				// Also invalidate the holidays query to force a refetch
				dispatch(api.util.invalidateTags([{ type: "Holidays", id: "LIST" }]));
			}
		} catch (err) {
			console.error("Error refetching home data:", err);
			setError("Failed to refresh data");
		} finally {
			setIsLoadingData(false);
		}
	};

	useEffect(() => {
		// Use the refetchHomeData function for initial load
		refetchHomeData();
	}, [isAuthenticated, auth0User, dispatch]);

	// Sync local state with Redux state when Redux state changes
	useEffect(() => {
		if (reduxHomeData && reduxHomeData !== homeData) {
			console.log("[HomePageWrapper] Syncing with Redux home data");
			setHomeData(reduxHomeData);
		}
	}, [reduxHomeData, homeData]);

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
		return <HomeContent homeData={homeData} onRefreshData={refetchHomeData} />;
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
