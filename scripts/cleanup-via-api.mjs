#!/usr/bin/env node

/**
 * Script to delete all holiday data for specific accounts using API endpoints
 *
 * Usage:
 *   node scripts/cleanup-via-api.mjs
 *
 * This script uses the existing API endpoints to safely delete holiday data
 * with proper authentication and RBAC checks.
 */

const BASE_URL = "http://localhost:3000";

// Configuration - Update these with your actual Auth0 subs and emails
const TARGET_USERS = [
	{
		auth0Sub: "google-oauth2|117968699199346868576", // lanny.macmillan.dev@gmail.com
		email: "lanny.macmillan.dev@gmail.com",
	},
	{
		auth0Sub: "google-oauth2|107737465214301461190", // lannymacmillan@gmail.com
		email: "lannymacmillan@gmail.com",
	},
];

async function makeRequest(url, options = {}) {
	try {
		const response = await fetch(url, {
			headers: {
				"Content-Type": "application/json",
				...options.headers,
			},
			...options,
		});

		const data = await response.json();

		if (!response.ok) {
			throw new Error(
				`HTTP ${response.status}: ${
					data.error || data.message || "Unknown error"
				}`
			);
		}

		return data;
	} catch (error) {
		console.error(`❌ Request failed: ${error.message}`);
		throw error;
	}
}

async function getHolidaysForUser(user) {
	console.log(`📋 Getting holidays for ${user.email}...`);

	const testUserHeader = JSON.stringify({
		sub: user.auth0Sub,
		email: user.email,
	});

	try {
		const holidays = await makeRequest(`${BASE_URL}/api/holidays?scope=all`, {
			headers: {
				"x-test-user": testUserHeader,
			},
		});

		console.log(`   ✅ Found ${holidays.length} holidays`);
		return holidays;
	} catch (error) {
		console.log(`   ⚠️  Could not fetch holidays: ${error.message}`);
		return [];
	}
}

async function deleteHoliday(holidayId, user) {
	console.log(`🗑️  Deleting holiday ${holidayId}...`);

	const testUserHeader = JSON.stringify({
		sub: user.auth0Sub,
		email: user.email,
	});

	try {
		await makeRequest(`${BASE_URL}/api/holidays/${holidayId}/delete-cascade`, {
			method: "POST",
			headers: {
				"x-test-user": testUserHeader,
			},
		});

		console.log(`   ✅ Successfully deleted holiday ${holidayId}`);
		return true;
	} catch (error) {
		console.log(
			`   ❌ Failed to delete holiday ${holidayId}: ${error.message}`
		);
		return false;
	}
}

async function deleteUserPreferences(user) {
	console.log(`🗑️  Deleting user preferences for ${user.email}...`);

	const testUserHeader = JSON.stringify({
		sub: user.auth0Sub,
		email: user.email,
	});

	try {
		// Get current user to get account ID
		const currentUser = await makeRequest(`${BASE_URL}/api/users/me`, {
			headers: {
				"x-test-user": testUserHeader,
			},
		});

		if (currentUser.accountId) {
			// Delete preferences
			await makeRequest(`${BASE_URL}/api/holidays/preferences`, {
				method: "DELETE",
				headers: {
					"x-test-user": testUserHeader,
				},
				body: JSON.stringify({
					accountId: currentUser.accountId,
				}),
			});

			console.log(`   ✅ Successfully deleted preferences for ${user.email}`);
		} else {
			console.log(`   ⚠️  No account found for ${user.email}`);
		}

		return true;
	} catch (error) {
		console.log(
			`   ❌ Failed to delete preferences for ${user.email}: ${error.message}`
		);
		return false;
	}
}

async function main() {
	console.log("🧹 Starting holiday data cleanup via API...\n");

	try {
		let totalDeleted = 0;
		let totalFailed = 0;

		for (const user of TARGET_USERS) {
			console.log(`\n👤 Processing user: ${user.email} (${user.auth0Sub})`);

			// Get all holidays for this user
			const holidays = await getHolidaysForUser(user);

			if (holidays.length === 0) {
				console.log(`   ℹ️  No holidays found for ${user.email}`);
				continue;
			}

			// Delete each holiday
			for (const holiday of holidays) {
				const success = await deleteHoliday(holiday.id, user);
				if (success) {
					totalDeleted++;
				} else {
					totalFailed++;
				}
			}

			// Delete user preferences
			await deleteUserPreferences(user);
		}

		console.log("\n📊 Cleanup Summary:");
		console.log(`   ✅ Successfully deleted: ${totalDeleted} holidays`);
		console.log(`   ❌ Failed to delete: ${totalFailed} holidays`);

		if (totalFailed === 0) {
			console.log("\n🎉 All holiday data cleaned up successfully!");
		} else {
			console.log(
				"\n⚠️  Some holidays could not be deleted. Check the logs above."
			);
		}

		console.log("\n📝 Next steps:");
		console.log(
			"   1. Update the TARGET_USERS array with your actual Auth0 subs and emails"
		);
		console.log("   2. Test creating fresh holiday data");
		console.log("   3. Test sharing functionality");
	} catch (error) {
		console.error("❌ Error during cleanup:", error);
		process.exit(1);
	}
}

// Helper function to show current data before deletion
async function showCurrentData() {
	console.log("\n📊 Current data overview:");

	for (const user of TARGET_USERS) {
		console.log(`\n👤 ${user.email} (${user.auth0Sub})`);

		const holidays = await getHolidaysForUser(user);

		if (holidays.length === 0) {
			console.log("   ℹ️  No holidays found");
			continue;
		}

		holidays.forEach((holiday) => {
			console.log(
				`   🎉 ${holiday.name} (${holiday.holidayType}) - ${
					holiday._visibility || "owned"
				}`
			);
			console.log(`      ID: ${holiday.id}`);
		});
	}
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
	// Show current data first
	await showCurrentData();

	// Ask for confirmation
	console.log(
		"\n⚠️  WARNING: This will permanently delete all holiday data for the specified users!"
	);
	console.log("Press Ctrl+C to cancel, or wait 5 seconds to continue...");

	await new Promise((resolve) => setTimeout(resolve, 5000));

	await main();
}
