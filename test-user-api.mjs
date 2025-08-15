import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000/api';

// Test user data
const testUsers = [
	{
		sub: 'auth0|test-user-1',
		email: 'test1@example.com',
		name: 'Test User 1',
		picture: 'https://example.com/avatar1.jpg'
	},
	{
		sub: 'auth0|test-user-2',
		email: 'test2@example.com',
		name: 'Test User 2',
		picture: 'https://example.com/avatar2.jpg'
	}
];

async function testUserAPI() {
	console.log('🧪 Testing User API Routes\n');

	// Test 1: Create/Update users
	console.log('1. Testing user creation/update...');
	for (const userData of testUsers) {
		try {
			const response = await fetch(`${BASE_URL}/users`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(userData),
			});

			const result = await response.json();
			
			if (response.ok) {
				console.log(`✅ Created/Updated user: ${result.name} (ID: ${result.id})`);
			} else {
				console.log(`❌ Failed to create user: ${result.error}`);
			}
		} catch (error) {
			console.log(`❌ Error creating user: ${error.message}`);
		}
	}

	// Test 2: Get all users (requires authentication)
	console.log('\n2. Testing get all users (with auth)...');
	try {
		const response = await fetch(`${BASE_URL}/users`, {
			headers: {
				'x-test-user': JSON.stringify(testUsers[0]),
			},
		});

		const result = await response.json();
		
		if (response.ok) {
			console.log(`✅ Retrieved ${result.length} users`);
			result.forEach(user => {
				console.log(`   - ${user.name} (${user.email})`);
			});
		} else {
			console.log(`❌ Failed to get users: ${result.error}`);
		}
	} catch (error) {
		console.log(`❌ Error getting users: ${error.message}`);
	}

	// Test 3: Get current user (me)
	console.log('\n3. Testing get current user (me)...');
	try {
		const response = await fetch(`${BASE_URL}/users/me`, {
			headers: {
				'x-test-user': JSON.stringify(testUsers[0]),
			},
		});

		const result = await response.json();
		
		if (response.ok) {
			console.log(`✅ Retrieved current user: ${result.name}`);
			console.log(`   - Email: ${result.email}`);
			console.log(`   - First login: ${result.isFirstLogin}`);
			console.log(`   - Owned accounts: ${result.ownedAccounts?.length || 0}`);
			console.log(`   - Member accounts: ${result.accountMembers?.length || 0}`);
		} else {
			console.log(`❌ Failed to get current user: ${result.error}`);
		}
	} catch (error) {
		console.log(`❌ Error getting current user: ${error.message}`);
	}

	// Test 4: Update user profile
	console.log('\n4. Testing update user profile...');
	try {
		const updatedData = {
			name: 'Updated Test User',
			picture: 'https://example.com/updated-avatar.jpg'
		};

		const response = await fetch(`${BASE_URL}/users/me`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				'x-test-user': JSON.stringify(testUsers[0]),
			},
			body: JSON.stringify(updatedData),
		});

		const result = await response.json();
		
		if (response.ok) {
			console.log(`✅ Updated user profile: ${result.name}`);
			console.log(`   - New picture: ${result.picture}`);
		} else {
			console.log(`❌ Failed to update profile: ${result.error}`);
		}
	} catch (error) {
		console.log(`❌ Error updating profile: ${error.message}`);
	}

	console.log('\n🎉 User API testing complete!');
}

// Run the tests
testUserAPI().catch(console.error);
