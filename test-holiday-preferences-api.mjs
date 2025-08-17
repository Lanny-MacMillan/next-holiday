#!/usr/bin/env node

/**
 * Test script for holiday preferences API
 * Tests both GET and POST endpoints
 */

const BASE_URL = "http://localhost:3000";

// Test user data
const testUser = {
	sub: "test-user-123",
	email: "test@example.com",
	name: "Test User",
};

// Test account ID (you'll need to replace this with a real account ID from your database)
const testAccountId = "test-account-123";

async function testHolidayPreferencesAPI() {
	console.log("🧪 Testing Holiday Preferences API...\n");

	try {
		// Test 1: Save holiday preferences
		console.log("1. Testing POST /api/holidays/preferences");

		const preferencesToSave = [
			{ holiday: "Christmas", budget: 500 },
			{ holiday: "Birthday", budget: 100 },
			{ holiday: "Valentine's Day", budget: 200 },
		];

		const saveResponse = await fetch(`${BASE_URL}/api/holidays/preferences`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"x-test-user": JSON.stringify(testUser),
			},
			body: JSON.stringify({
				accountId: testAccountId,
				preferences: preferencesToSave,
			}),
		});

		if (saveResponse.ok) {
			const saveResult = await saveResponse.json();
			console.log("✅ Save successful:", saveResult);
		} else {
			const error = await saveResponse.json();
			console.log("❌ Save failed:", error);
		}

		// Test 2: Fetch holiday preferences
		console.log("\n2. Testing GET /api/holidays/preferences");

		const fetchResponse = await fetch(
			`${BASE_URL}/api/holidays/preferences?accountId=${testAccountId}`,
			{
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					"x-test-user": JSON.stringify(testUser),
				},
			}
		);

		if (fetchResponse.ok) {
			const fetchResult = await fetchResponse.json();
			console.log("✅ Fetch successful:", fetchResult);
		} else {
			const error = await fetchResponse.json();
			console.log("❌ Fetch failed:", error);
		}

		// Test 3: Update preferences (remove one holiday)
		console.log(
			"\n3. Testing POST /api/holidays/preferences (update - remove Birthday)"
		);

		const updatedPreferences = [
			{ holiday: "Christmas", budget: 600 }, // Updated budget
			{ holiday: "Valentine's Day", budget: 200 }, // Birthday removed
		];

		const updateResponse = await fetch(`${BASE_URL}/api/holidays/preferences`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"x-test-user": JSON.stringify(testUser),
			},
			body: JSON.stringify({
				accountId: testAccountId,
				preferences: updatedPreferences,
			}),
		});

		if (updateResponse.ok) {
			const updateResult = await updateResponse.json();
			console.log("✅ Update successful:", updateResult);
		} else {
			const error = await updateResponse.json();
			console.log("❌ Update failed:", error);
		}

		// Test 4: Fetch again to verify changes
		console.log("\n4. Testing GET /api/holidays/preferences (verify changes)");

		const verifyResponse = await fetch(
			`${BASE_URL}/api/holidays/preferences?accountId=${testAccountId}`,
			{
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					"x-test-user": JSON.stringify(testUser),
				},
			}
		);

		if (verifyResponse.ok) {
			const verifyResult = await verifyResponse.json();
			console.log("✅ Verification successful:", verifyResult);
		} else {
			const error = await verifyResponse.json();
			console.log("❌ Verification failed:", error);
		}
	} catch (error) {
		console.error("❌ Test failed with error:", error);
	}
}

// Run the test
testHolidayPreferencesAPI();
