import { headers } from "next/headers";
import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toPlain } from "@/lib/json";

interface ChristmasLayoutProps {
	children: React.ReactNode;
}

export default async function ChristmasLayout({
	children,
}: ChristmasLayoutProps) {
	// Fetch holiday data at layout level to share across all child pages
	const headersList = await headers();
	const user = await getCurrentUser(
		new NextRequest("http://localhost", {
			headers: headersList,
		})
	);

	let holidayData = null;

	if (user) {
		// Find the Christmas holiday for this user's account
		const account = await prisma.account.findFirst({
			where: {
				members: {
					some: {
						userId: user.id,
					},
				},
			},
		});

		if (account) {
			holidayData = await prisma.holiday.findFirst({
				where: {
					accountId: account.id,
					holidayType: "Christmas",
				},
				include: {
					budgets: true,
				},
			});
		}
	}

	return (
		<div className="christmas-layout">
			{/* Pass holiday data to children via context or props */}
			{children}
		</div>
	);
}
