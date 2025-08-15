"use client";

import { useAuth0 } from "@auth0/auth0-react";
import { useEffect, useState } from "react";

export default function UserSync() {
	const { user, isAuthenticated, isLoading } = useAuth0();
	const [syncStatus, setSyncStatus] = useState<
		"idle" | "syncing" | "success" | "error"
	>("idle");

	useEffect(() => {
		async function syncUser() {
			if (!isAuthenticated || !user) {
				return;
			}

			setSyncStatus("syncing");

			try {
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
				} else {
					console.error("Failed to sync user:", response.statusText);
					setSyncStatus("error");
				}
			} catch (error) {
				console.error("Error syncing user:", error);
				setSyncStatus("error");
			}
		}

		// Only sync if user is authenticated and we haven't synced yet
		if (isAuthenticated && user && syncStatus === "idle") {
			syncUser();
		}
	}, [isAuthenticated, user, syncStatus]);

	// Don't render anything - this is just for side effects
	return null;
}
