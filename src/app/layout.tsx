import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ReduxProvider } from "@/store/provider";
import Auth0ProviderWrapper from "@/components/auth/Auth0Provider";
import AppContent from "@/components/AppContent";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: "Holiday Planner",
	description: "Plan your holidays with ease",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en">
			<body className={inter.className}>
				<Auth0ProviderWrapper>
					<ReduxProvider>
						<AppContent>{children}</AppContent>
					</ReduxProvider>
				</Auth0ProviderWrapper>
			</body>
		</html>
	);
}
