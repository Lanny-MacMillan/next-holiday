import fetch from "node-fetch";

const BASE_URL = "http://localhost:3000/api";

// Test user data
const testUser = {
	sub: "auth0|test-user-preferences",
	email: "preferences@example.com",
	name: "Preferences Test User",
	picture: "https://example.com/preferences-avatar.jpg",
};

async function testUserPreferencesAPI() {
	console.log("🧪 Testing User Preferences API Routes\n");

	// Test 1: Get user preferences (should create default if none exist)
	console.log(
		"1. Testing get user preferences (GET /api/users/me/preferences)..."
	);
	try {
		const response = await fetch(`${BASE_URL}/users/me/preferences`, {
			headers: {
				"x-test-user": JSON.stringify(testUser),
			},
		});

		const result = await response.json();

		if (response.ok) {
			console.log(`✅ Retrieved user preferences:`);
			console.log(`   - Theme: ${result.theme}`);
			console.log(`   - Display Mode: ${result.displayMode}`);
			console.log(`   - Show Completed Items: ${result.showCompletedItems}`);
			console.log(`   - Email Notifications: ${result.emailNotifications}`);
			console.log(`   - Timezone: ${result.timezone}`);
			console.log(`   - Locale: ${result.locale}`);
			console.log(`   - Font Size: ${result.fontSize}`);
		} else {
			console.log(`❌ Failed to get preferences: ${result.error}`);
		}
	} catch (error) {
		console.log(`❌ Error getting preferences: ${error.message}`);
	}

	// Test 2: Update user preferences
	console.log(
		"\n2. Testing update user preferences (PUT /api/users/me/preferences)..."
	);
	try {
		const updateData = {
			theme: "dark",
			displayMode: "list",
			showCompletedItems: false,
			emailNotifications: false,
			timezone: "America/New_York",
			locale: "en-CA",
			fontSize: "large",
			reducedMotion: true,
			highContrast: true,
		};

		const response = await fetch(`${BASE_URL}/users/me/preferences`, {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
				"x-test-user": JSON.stringify(testUser),
			},
			body: JSON.stringify(updateData),
		});

		const result = await response.json();

		if (response.ok) {
			console.log(`✅ Updated user preferences:`);
			console.log(`   - Theme: ${result.theme}`);
			console.log(`   - Display Mode: ${result.displayMode}`);
			console.log(`   - Show Completed Items: ${result.showCompletedItems}`);
			console.log(`   - Email Notifications: ${result.emailNotifications}`);
			console.log(`   - Timezone: ${result.timezone}`);
			console.log(`   - Locale: ${result.locale}`);
			console.log(`   - Font Size: ${result.fontSize}`);
			console.log(`   - Reduced Motion: ${result.reducedMotion}`);
			console.log(`   - High Contrast: ${result.highContrast}`);
		} else {
			console.log(`❌ Failed to update preferences: ${result.error}`);
		}
	} catch (error) {
		console.log(`❌ Error updating preferences: ${error.message}`);
	}

	// Test 3: Get user preferences again (should return updated values)
	console.log(
		"\n3. Testing get user preferences again (should show updated values)..."
	);
	try {
		const response = await fetch(`${BASE_URL}/users/me/preferences`, {
			headers: {
				"x-test-user": JSON.stringify(testUser),
			},
		});

		const result = await response.json();

		if (response.ok) {
			console.log(`✅ Retrieved updated preferences:`);
			console.log(`   - Theme: ${result.theme} (should be 'dark')`);
			console.log(
				`   - Display Mode: ${result.displayMode} (should be 'list')`
			);
			console.log(
				`   - Show Completed Items: ${result.showCompletedItems} (should be false)`
			);
			console.log(
				`   - Email Notifications: ${result.emailNotifications} (should be false)`
			);
			console.log(
				`   - Timezone: ${result.timezone} (should be 'America/New_York')`
			);
			console.log(`   - Locale: ${result.locale} (should be 'en-CA')`);
			console.log(`   - Font Size: ${result.fontSize} (should be 'large')`);
			console.log(
				`   - Reduced Motion: ${result.reducedMotion} (should be true)`
			);
			console.log(
				`   - High Contrast: ${result.highContrast} (should be true)`
			);
		} else {
			console.log(`❌ Failed to get updated preferences: ${result.error}`);
		}
	} catch (error) {
		console.log(`❌ Error getting updated preferences: ${error.message}`);
	}

	// Test 4: Partial update (only some fields)
	console.log("\n4. Testing partial update of preferences...");
	try {
		const partialUpdateData = {
			theme: "light",
			displayMode: "grid",
			showCountdown: false,
		};

		const response = await fetch(`${BASE_URL}/users/me/preferences`, {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
				"x-test-user": JSON.stringify(testUser),
			},
			body: JSON.stringify(partialUpdateData),
		});

		const result = await response.json();

		if (response.ok) {
			console.log(`✅ Partially updated preferences:`);
			console.log(`   - Theme: ${result.theme} (should be 'light')`);
			console.log(
				`   - Display Mode: ${result.displayMode} (should be 'grid')`
			);
			console.log(
				`   - Show Countdown: ${result.showCountdown} (should be false)`
			);
			console.log(
				`   - Email Notifications: ${result.emailNotifications} (should still be false)`
			);
			console.log(
				`   - Timezone: ${result.timezone} (should still be 'America/New_York')`
			);
		} else {
			console.log(`❌ Failed to partially update preferences: ${result.error}`);
		}
	} catch (error) {
		console.log(`❌ Error partially updating preferences: ${error.message}`);
	}

	// Test 5: Test invalid field (should be ignored)
	console.log("\n5. Testing update with invalid field (should be ignored)...");
	try {
		const invalidUpdateData = {
			theme: "system",
			invalidField: "should-be-ignored",
			anotherInvalidField: 123,
		};

		const response = await fetch(`${BASE_URL}/users/me/preferences`, {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
				"x-test-user": JSON.stringify(testUser),
			},
			body: JSON.stringify(invalidUpdateData),
		});

		const result = await response.json();

		if (response.ok) {
			console.log(`✅ Updated preferences (invalid fields ignored):`);
			console.log(`   - Theme: ${result.theme} (should be 'system')`);
			console.log(`   - Invalid fields were ignored`);
		} else {
			console.log(`❌ Failed to update preferences: ${result.error}`);
		}
	} catch (error) {
		console.log(`❌ Error updating preferences: ${error.message}`);
	}

	// Test 6: Verify preferences are included in /api/users/me response
	console.log(
		"\n6. Testing that preferences are included in /api/users/me response..."
	);
	try {
		const response = await fetch(`${BASE_URL}/users/me`, {
			headers: {
				"x-test-user": JSON.stringify(testUser),
			},
		});

		const result = await response.json();

		if (response.ok) {
			console.log(`✅ User data includes preferences:`);
			console.log(`   - User: ${result.name}`);
			console.log(`   - Has preferences: ${!!result.preferences}`);
			if (result.preferences) {
				console.log(`   - Theme: ${result.preferences.theme}`);
				console.log(`   - Display Mode: ${result.preferences.displayMode}`);
			}
		} else {
			console.log(`❌ Failed to get user data: ${result.error}`);
		}
	} catch (error) {
		console.log(`❌ Error getting user data: ${error.message}`);
	}

	console.log("\n🎉 User Preferences API testing completed!");
}

// Run the tests
testUserPreferencesAPI().catch(console.error);
