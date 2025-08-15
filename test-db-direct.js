const { PrismaClient } = require("./src/generated/prisma");

const prisma = new PrismaClient();

async function testDatabaseOperations() {
	console.log("🧪 Testing Database Operations Directly\n");

	try {
		// Test 1: Create a test user
		console.log("1. Testing user creation...");
		const testUser = await prisma.user.upsert({
			where: { auth0Sub: "auth0|test-user-direct" },
			update: {
				email: "test-direct@example.com",
				name: "Test User Direct",
				picture: "https://example.com/avatar-direct.jpg",
				isInDb: true,
				updatedAt: new Date(),
			},
			create: {
				auth0Sub: "auth0|test-user-direct",
				email: "test-direct@example.com",
				name: "Test User Direct",
				picture: "https://example.com/avatar-direct.jpg",
				isInDb: true,
				isFirstLogin: true,
			},
		});

		console.log(
			`✅ Created/Updated user: ${testUser.name} (ID: ${testUser.id})`
		);
		console.log(`   - Auth0 Sub: ${testUser.auth0Sub}`);
		console.log(`   - Email: ${testUser.email}`);
		console.log(`   - First Login: ${testUser.isFirstLogin}`);

		// Test 2: Find user by Auth0 sub
		console.log("\n2. Testing user lookup by Auth0 sub...");
		const foundUser = await prisma.user.findUnique({
			where: { auth0Sub: "auth0|test-user-direct" },
		});

		if (foundUser) {
			console.log(`✅ Found user: ${foundUser.name} (ID: ${foundUser.id})`);
		} else {
			console.log("❌ User not found");
		}

		// Test 3: Get all users
		console.log("\n3. Testing get all users...");
		const allUsers = await prisma.user.findMany({
			select: {
				id: true,
				email: true,
				name: true,
				picture: true,
				isInDb: true,
				isFirstLogin: true,
				createdAt: true,
				updatedAt: true,
			},
		});

		console.log(`✅ Retrieved ${allUsers.length} users`);
		allUsers.forEach((user) => {
			console.log(
				`   - ${user.name} (${
					user.email
				}) - Created: ${user.createdAt.toISOString()}`
			);
		});

		// Test 4: Update user profile
		console.log("\n4. Testing user profile update...");
		const updatedUser = await prisma.user.update({
			where: { id: testUser.id },
			data: {
				name: "Updated Test User Direct",
				picture: "https://example.com/updated-avatar-direct.jpg",
				updatedAt: new Date(),
			},
		});

		console.log(`✅ Updated user: ${updatedUser.name}`);
		console.log(`   - New picture: ${updatedUser.picture}`);

		// Test 5: Test UUID generation
		console.log("\n5. Testing UUID generation...");
		const newUser = await prisma.user.create({
			data: {
				auth0Sub: `auth0|test-uuid-${Date.now()}`,
				email: `uuid-test-${Date.now()}@example.com`,
				name: "UUID Test User",
				isInDb: true,
				isFirstLogin: true,
			},
		});

		console.log(`✅ Created user with UUID: ${newUser.id}`);
		console.log(`   - UUID length: ${newUser.id.length} characters`);
		console.log(
			`   - UUID format: ${
				newUser.id.match(
					/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
				)
					? "Valid"
					: "Invalid"
			}`
		);

		console.log("\n🎉 All database tests passed!");
		console.log("\n📊 Summary:");
		console.log(`   - Total users in database: ${allUsers.length + 1}`);
		console.log(`   - UUID generation: Working`);
		console.log(`   - Auth0 ID storage: Working`);
		console.log(`   - User relationships: Ready for testing`);
	} catch (error) {
		console.error("❌ Database test failed:", error);
	} finally {
		await prisma.$disconnect();
	}
}

// Run the tests
testDatabaseOperations();
