const { PrismaClient } = require('./src/generated/prisma');

const prisma = new PrismaClient();

async function testAPIDebug() {
  console.log('🧪 Testing API Debug\n');

  try {
    // Test 1: Direct database creation (should work)
    console.log('1. Testing direct database creation...');
    const directUser = await prisma.user.upsert({
      where: { auth0Sub: 'auth0|debug-test' },
      update: {
        email: 'debug@example.com',
        name: 'Debug Test User',
        picture: 'https://example.com/debug.jpg',
        isInDb: true,
        updatedAt: new Date(),
      },
      create: {
        auth0Sub: 'auth0|debug-test',
        email: 'debug@example.com',
        name: 'Debug Test User',
        picture: 'https://example.com/debug.jpg',
        isInDb: true,
        isFirstLogin: true,
      },
    });

    console.log(
      `✅ Direct creation successful: ${directUser.name} (ID: ${directUser.id})`,
    );

    // Test 2: Test API call
    console.log('\n2. Testing API call...');
    const response = await fetch('http://localhost:3000/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        auth0Sub: 'auth0|api-debug-test',
        email: 'api-debug@example.com',
        name: 'API Debug Test User',
        picture: 'https://example.com/api-debug.jpg',
      }),
    });

    console.log(`Response status: ${response.status}`);
    console.log(`Response headers:`, Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log(`Response body: ${responseText}`);

    if (response.ok) {
      console.log('✅ API call successful');
    } else {
      console.log('❌ API call failed');
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testAPIDebug();
