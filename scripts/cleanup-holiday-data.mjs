#!/usr/bin/env node

/**
 * Script to delete all holiday data for specific accounts
 *
 * Usage:
 *   node scripts/cleanup-holiday-data.mjs
 *
 * This script will:
 * 1. Find all accounts owned by the specified users
 * 2. Delete all holiday-related data in the correct order
 * 3. Optionally delete the accounts and users themselves
 */

import { PrismaClient } from "../src/generated/prisma/index.js";
import { config } from "dotenv";

// Load environment variables from .env file
config();

const prisma = new PrismaClient({
	datasources: {
		db: {
			url: process.env.DATABASE_URL,
		},
	},
});

// Configuration - Update these with your actual Auth0 subs
const TARGET_AUTH0_SUBS = [
	"google-oauth2|117968699199346868576", // lanny.macmillan.dev@gmail.com
	"google-oauth2|107737465214301461190", // lannymacmillan@gmail.com
];

const DELETE_ACCOUNTS = true; // Set to false if you want to keep accounts but delete holiday data
const DELETE_USERS = false; // Set to true if you want to delete the users entirely

async function main() {
	console.log("🧹 Starting holiday data cleanup...\n");

	try {
		// Step 1: Find users and their accounts
		console.log("📋 Finding users and accounts...");
		const users = await prisma.user.findMany({
			where: {
				auth0Sub: {
					in: TARGET_AUTH0_SUBS,
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

		if (users.length === 0) {
			console.log("❌ No users found with the specified Auth0 subs");
			return;
		}

		console.log(`✅ Found ${users.length} users:`);
		users.forEach((user) => {
			console.log(`   - ${user.email} (${user.auth0Sub})`);
			console.log(`     Accounts: ${user.ownedAccounts.length}`);
			user.ownedAccounts.forEach((account) => {
				console.log(
					`       - ${account.name} (${account.id}) - ${account.holidays.length} holidays`
				);
			});
		});

		// Step 2: Collect all account IDs
		const accountIds = users.flatMap((user) =>
			user.ownedAccounts.map((account) => account.id)
		);
		const holidayIds = users.flatMap((user) =>
			user.ownedAccounts.flatMap((account) =>
				account.holidays.map((holiday) => holiday.id)
			)
		);

		console.log(`\n📊 Summary:`);
		console.log(`   - ${accountIds.length} accounts to process`);
		console.log(`   - ${holidayIds.length} holidays to delete`);

		if (holidayIds.length === 0) {
			console.log("✅ No holiday data found to delete");
			return;
		}

		// Step 3: Delete holiday data in correct order (respecting foreign keys)
		console.log("\n🗑️  Deleting holiday data...");

		// Delete in order: child tables first, then parent tables
		const deleteOperations = [
			{
				name: "Budget Transactions",
				query: () =>
					prisma.budgetTransaction.deleteMany({
						where: { budget: { holidayId: { in: holidayIds } } },
					}),
			},
			{
				name: "Budgets",
				query: () =>
					prisma.budget.deleteMany({
						where: { holidayId: { in: holidayIds } },
					}),
			},
			{
				name: "Guest Lists",
				query: () =>
					prisma.guestList.deleteMany({
						where: { holidayId: { in: holidayIds } },
					}),
			},
			{
				name: "Kwanzaa Principles",
				query: () =>
					prisma.kwanzaaPrinciple.deleteMany({
						where: { holidayId: { in: holidayIds } },
					}),
			},
			{
				name: "Task Assignees",
				query: () =>
					prisma.taskAssignee.deleteMany({
						where: { task: { holidayId: { in: holidayIds } } },
					}),
			},
			{
				name: "Tasks",
				query: () =>
					prisma.task.deleteMany({
						where: { holidayId: { in: holidayIds } },
					}),
			},
			{
				name: "Gifts",
				query: () =>
					prisma.gift.deleteMany({
						where: { holidayId: { in: holidayIds } },
					}),
			},
			{
				name: "Cards",
				query: () =>
					prisma.card.deleteMany({
						where: { holidayId: { in: holidayIds } },
					}),
			},
			{
				name: "Share Members",
				query: () =>
					prisma.shareMember.deleteMany({
						where: { share: { holidayId: { in: holidayIds } } },
					}),
			},
			{
				name: "Invites",
				query: () =>
					prisma.invite.deleteMany({
						where: { share: { holidayId: { in: holidayIds } } },
					}),
			},
			{
				name: "Shares",
				query: () =>
					prisma.share.deleteMany({
						where: { holidayId: { in: holidayIds } },
					}),
			},
			{
				name: "Holidays",
				query: () =>
					prisma.holiday.deleteMany({
						where: { id: { in: holidayIds } },
					}),
			},
		];

		for (const operation of deleteOperations) {
			try {
				const result = await operation.query();
				console.log(`   ✅ Deleted ${result.count} ${operation.name}`);
			} catch (error) {
				console.log(`   ⚠️  ${operation.name}: ${error.message}`);
			}
		}

		// Step 4: Delete contacts (optional - they might be shared across holidays)
		console.log("\n🗑️  Deleting contacts...");
		try {
			const contactResult = await prisma.contact.deleteMany({
				where: { accountId: { in: accountIds } },
			});
			console.log(`   ✅ Deleted ${contactResult.count} contacts`);
		} catch (error) {
			console.log(`   ⚠️  Contacts: ${error.message}`);
		}

		// Step 5: Delete account members if deleting accounts
		if (DELETE_ACCOUNTS) {
			console.log("\n🗑️  Deleting account members...");
			try {
				const accountMemberResult = await prisma.accountMember.deleteMany({
					where: { accountId: { in: accountIds } },
				});
				console.log(
					`   ✅ Deleted ${accountMemberResult.count} account members`
				);
			} catch (error) {
				console.log(`   ⚠️  Account Members: ${error.message}`);
			}
		}

		// Step 6: Delete accounts if requested
		if (DELETE_ACCOUNTS) {
			console.log("\n🗑️  Deleting accounts...");
			try {
				const accountResult = await prisma.account.deleteMany({
					where: { id: { in: accountIds } },
				});
				console.log(`   ✅ Deleted ${accountResult.count} accounts`);
			} catch (error) {
				console.log(`   ⚠️  Accounts: ${error.message}`);
			}
		}

		// Step 7: Delete users if requested
		if (DELETE_USERS) {
			console.log("\n🗑️  Deleting users...");
			try {
				const userResult = await prisma.user.deleteMany({
					where: { auth0Sub: { in: TARGET_AUTH0_SUBS } },
				});
				console.log(`   ✅ Deleted ${userResult.count} users`);
			} catch (error) {
				console.log(`   ⚠️  Users: ${error.message}`);
			}
		}

		// Step 8: Clean up user preferences (optional)
		console.log("\n🗑️  Cleaning up user preferences...");
		try {
			const userIds = users.map((user) => user.id);
			const preferencesResult = await prisma.userPreferences.deleteMany({
				where: { userId: { in: userIds } },
			});
			console.log(`   ✅ Deleted ${preferencesResult.count} user preferences`);
		} catch (error) {
			console.log(`   ⚠️  User Preferences: ${error.message}`);
		}

		console.log("\n🎉 Cleanup completed successfully!");
		console.log("\n📝 Next steps:");
		console.log(
			"   1. Update the TARGET_AUTH0_SUBS array with your actual Auth0 subs"
		);
		console.log("   2. Run the script again if needed");
		console.log("   3. Test creating fresh holiday data");
	} catch (error) {
		console.error("❌ Error during cleanup:", error);
		process.exit(1);
	} finally {
		await prisma.$disconnect();
	}
}

// Helper function to show current data before deletion
async function showCurrentData() {
	console.log("\n📊 Current data overview:");

	const users = await prisma.user.findMany({
		where: {
			auth0Sub: {
				in: TARGET_AUTH0_SUBS,
			},
		},
		include: {
			ownedAccounts: {
				include: {
					holidays: {
						include: {
							_count: {
								select: {
									tasks: true,
									gifts: true,
									cards: true,
									budgets: true,
									guestLists: true,
									shares: true,
								},
							},
						},
					},
				},
			},
		},
	});

	users.forEach((user) => {
		console.log(`\n👤 ${user.email} (${user.auth0Sub})`);
		user.ownedAccounts.forEach((account) => {
			console.log(`   🏠 ${account.name} (${account.id})`);
			account.holidays.forEach((holiday) => {
				console.log(`      🎉 ${holiday.name} (${holiday.holidayType})`);
				console.log(`         - Tasks: ${holiday._count.tasks}`);
				console.log(`         - Gifts: ${holiday._count.gifts}`);
				console.log(`         - Cards: ${holiday._count.cards}`);
				console.log(`         - Budgets: ${holiday._count.budgets}`);
				console.log(`         - Guest Lists: ${holiday._count.guestLists}`);
				console.log(`         - Shares: ${holiday._count.shares}`);
			});
		});
	});
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
	// Show current data first
	await showCurrentData();

	// Ask for confirmation
	console.log(
		"\n⚠️  WARNING: This will permanently delete all holiday data for the specified accounts!"
	);
	console.log("Press Ctrl+C to cancel, or wait 5 seconds to continue...");

	await new Promise((resolve) => setTimeout(resolve, 5000));

	await main();
}
