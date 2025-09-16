#!/usr/bin/env node

/**
 * Test script to verify database connection and show current data
 */

import { PrismaClient } from "../src/generated/prisma/index.js";
import { config } from "dotenv";

// Load environment variables
config();

const prisma = new PrismaClient({
	datasources: {
		db: {
			url: process.env.DATABASE_URL,
		},
	},
});

async function testConnection() {
	console.log("🔌 Testing database connection...");
	console.log(
		`📡 DATABASE_URL: ${process.env.DATABASE_URL ? "Set" : "Not set"}`
	);

	try {
		// Test basic connection
		await prisma.$connect();
		console.log("✅ Database connection successful!");

		// Show current data counts
		const counts = await Promise.all([
			prisma.user.count(),
			prisma.account.count(),
			prisma.accountMember.count(),
			prisma.holiday.count(),
			prisma.share.count(),
			prisma.invite.count(),
		]);

		console.log("\n📊 Current data counts:");
		console.log(`   👥 Users: ${counts[0]}`);
		console.log(`   🏠 Accounts: ${counts[1]}`);
		console.log(`   🔗 Account Members: ${counts[2]}`);
		console.log(`   🎉 Holidays: ${counts[3]}`);
		console.log(`   🤝 Shares: ${counts[4]}`);
		console.log(`   📧 Invites: ${counts[5]}`);

		// Show users with your Auth0 subs
		const targetUsers = await prisma.user.findMany({
			where: {
				auth0Sub: {
					in: [
						"google-oauth2|117968699199346868576",
						"google-oauth2|107737465214301461190",
					],
				},
			},
			include: {
				ownedAccounts: {
					include: {
						holidays: {
							select: { id: true, name: true, holidayType: true },
						},
					},
				},
			},
		});

		console.log("\n👤 Target users found:");
		targetUsers.forEach((user) => {
			console.log(`   - ${user.email} (${user.auth0Sub})`);
			console.log(`     Accounts: ${user.ownedAccounts.length}`);
			user.ownedAccounts.forEach((account) => {
				console.log(
					`       - ${account.name} (${account.id}) - ${account.holidays.length} holidays`
				);
				account.holidays.forEach((holiday) => {
					console.log(`         🎉 ${holiday.name} (${holiday.holidayType})`);
				});
			});
		});
	} catch (error) {
		console.error("❌ Database connection failed:", error.message);
		process.exit(1);
	} finally {
		await prisma.$disconnect();
	}
}

// Run the test
testConnection();
