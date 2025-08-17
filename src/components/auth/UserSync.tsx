"use client";

import { useAuth0 } from "@auth0/auth0-react";
import { useEffect, useState, useRef } from "react";

export default function UserSync() {
	const { user, isAuthenticated, isLoading } = useAuth0();
	const [syncStatus, setSyncStatus] = useState<
		"idle" | "syncing" | "success" | "error"
	>("idle");
	const [errorMessage, setErrorMessage] = useState<string>("");
	const hasSynced = useRef(false);

	useEffect(() => {
		async function syncUser() {
			if (!isAuthenticated || !user || hasSynced.current) {
				return;
			}

			setSyncStatus("syncing");
			setErrorMessage("");

			try {
				console.log("Syncing user with Auth0 sub:", user.sub);

				// Call our API to create/update the user
				const response = await fetch("/api/users", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						auth0Sub: user.sub,
						email: user.email,
						name: user.name,
						picture: user.picture,
					}),
				});

				if (response.ok) {
					const userData = await response.json();
					console.log("User synced successfully:", userData);
					setSyncStatus("success");
					hasSynced.current = true;
				} else {
					const errorData = await response.json();
					console.error("Failed to sync user:", errorData);
					
					// Handle unique constraint violation specifically
					if (errorData.details && errorData.details.includes("Unique constraint failed")) {
						console.log("User already exists, this is expected for existing users");
						setSyncStatus("success");
						hasSynced.current = true;
					} else {
						setErrorMessage(errorData.error || "Failed to sync user");
						setSyncStatus("error");
					}
				}
			} catch (error) {
				console.error("Error syncing user:", error);
				setErrorMessage("Network error while syncing user");
				setSyncStatus("error");
			}
		}

		// Only sync if user is authenticated and we haven't synced yet
		if (isAuthenticated && user && !hasSynced.current) {
			syncUser();
		}
	}, [isAuthenticated, user]);

	// Reset sync state when user changes
	useEffect(() => {
		if (user?.sub) {
			hasSynced.current = false;
			setSyncStatus("idle");
			setErrorMessage("");
		}
	}, [user?.sub]);

	// Don't render anything - this is just for side effects
	return null;
}
