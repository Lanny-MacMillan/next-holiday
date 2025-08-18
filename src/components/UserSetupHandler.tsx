"use client";

import { useAuth0 } from "@auth0/auth0-react";
import { useEffect, useState } from "react";

interface UserSetupHandlerProps {
	needsUserSetup: boolean;
	onSetupComplete: () => void;
}

export default function UserSetupHandler({
	needsUserSetup,
	onSetupComplete,
}: UserSetupHandlerProps) {
	const { user: auth0User, isAuthenticated } = useAuth0();
	const [isSettingUp, setIsSettingUp] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		async function setupUser() {
			if (!needsUserSetup || !isAuthenticated || !auth0User || isSettingUp) {
				return;
			}

			setIsSettingUp(true);
			setError(null);

			try {
				// Call the API endpoint instead of the server action directly
				const response = await fetch("/api/users/setup", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						auth0User: {
							sub: auth0User.sub,
							email: auth0User.email,
							name: auth0User.name,
							picture: auth0User.picture,
						},
					}),
				});

				if (!response.ok) {
					const errorData = await response.json();
					throw new Error(errorData.error || "Failed to set up user");
				}

				const result = await response.json();
				
				if (result.data.success) {
					// Call the callback to trigger a page refresh
					onSetupComplete();
				} else {
					setError(result.data.error || "Failed to set up user");
				}
			} catch (err) {
				console.error("Error setting up user:", err);
				setError("Failed to set up user");
			} finally {
				setIsSettingUp(false);
			}
		}

		setupUser();
	}, [
		needsUserSetup,
		isAuthenticated,
		auth0User,
		isSettingUp,
		onSetupComplete,
	]);

	if (!needsUserSetup) {
		return null;
	}

	return (
		<div className="min-h-screen christmas-gradient flex items-center justify-center">
			<div className="text-center">
				{isSettingUp ? (
					<>
						<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
						<p className="text-gray-600 dark:text-gray-300">
							Setting up your account...
						</p>
					</>
				) : error ? (
					<>
						<div className="text-red-500 mb-4">
							<p className="text-lg font-semibold">Setup Error</p>
							<p className="text-sm">{error}</p>
						</div>
						<button
							onClick={() => window.location.reload()}
							className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
						>
							Try Again
						</button>
					</>
				) : (
					<>
						<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
						<p className="text-gray-600 dark:text-gray-300">
							Preparing your account...
						</p>
					</>
				)}
			</div>
		</div>
	);
}
