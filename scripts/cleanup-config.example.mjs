/**
 * Configuration file for holiday data cleanup scripts
 *
 * Copy this file to cleanup-config.mjs and update with your actual values
 */

export const CONFIG = {
	// Your Auth0 user information
	TARGET_USERS: [
		{
			auth0Sub: "google-oauth2|123456",
			email: "@gmail.com",
		},
		{
			auth0Sub: "google-oauth2|123456",
			email: "@gmail.com",
		},
	],

	// API configuration
	BASE_URL: "http://localhost:3000",

	// Cleanup options
	DELETE_ACCOUNTS: true, // Set to false if you want to keep accounts but delete holiday data
	DELETE_USERS: false, // Set to true if you want to delete the users entirely
	DELETE_PREFERENCES: true, // Set to false if you want to keep user preferences

	// Safety settings
	CONFIRMATION_DELAY: 5000, // Milliseconds to wait before starting deletion
	DRY_RUN: false, // Set to true to see what would be deleted without actually deleting
};
