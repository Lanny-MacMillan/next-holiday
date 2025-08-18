"use server";

import { v4 as uuidv4 } from "uuid";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

/**
 * Server action to add a user to the database and create their account
 * This replaces the client-side UserSync functionality for the home page
 */
export async function addUserToDb(auth0User: {
	sub: string;
	email?: string;
	name?: string;
	picture?: string;
}) {
	try {
		// Check if user already exists
		const existingUser = await prisma.user.findUnique({
			where: { auth0Sub: auth0User.sub },
		});

		if (existingUser) {
			// User already exists, check if they have an account
			const account = await prisma.account.findFirst({
				where: {
					members: {
						some: {
							userId: existingUser.id,
						},
					},
				},
			});

			if (account) {
				// User and account exist, no action needed
				return { success: true, message: "User already exists" };
			}
		}

		// Create user and account in a transaction
		const result = await prisma.$transaction(async (tx) => {
			// Create or update user
			const user = await tx.user.upsert({
				where: { auth0Sub: auth0User.sub },
				update: {
					email: auth0User.email,
					name: auth0User.name,
					picture: auth0User.picture,
					updatedAt: new Date(),
				},
				create: {
					id: uuidv4(),
					auth0Sub: auth0User.sub,
					email: auth0User.email,
					name: auth0User.name,
					picture: auth0User.picture,
				},
			});

			// Check if user already has an account
			const existingAccount = await tx.account.findFirst({
				where: {
					members: {
						some: {
							userId: user.id,
						},
					},
				},
			});

			if (!existingAccount) {
				// Create account and add user as member
				const account = await tx.account.create({
					data: {
						id: uuidv4(),
						name: `${user.name || user.email || "My Family"}'s Account`,
						ownerUserId: user.id,
					},
				});

				await tx.accountMember.create({
					data: {
						accountId: account.id,
						userId: user.id,
						role: "owner",
					},
				});

				return { user, account };
			}

			return { user, account: existingAccount };
		});

		// Revalidate the home page to show updated data
		revalidatePath("/");

		return { success: true, data: result };
	} catch (error) {
		console.error("Error adding user to database:", error);
		return { success: false, error: "Failed to add user to database" };
	}
}
