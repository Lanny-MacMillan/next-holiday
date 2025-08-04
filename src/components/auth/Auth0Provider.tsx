"use client";

import { Auth0Provider } from "@auth0/auth0-react";
import { ReactNode } from "react";

interface Auth0ProviderWrapperProps {
	children: ReactNode;
}

export default function Auth0ProviderWrapper({
	children,
}: Auth0ProviderWrapperProps) {
	const domain =
		process.env.NEXT_PUBLIC_AUTH0_DOMAIN || "your-domain.auth0.com";
	const clientId = process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID || "your-client-id";
	const redirectUri =
		process.env.NEXT_PUBLIC_AUTH0_CALLBACK_URL || "http://localhost:3000";

	return (
		<Auth0Provider
			domain={domain}
			clientId={clientId}
			authorizationParams={{
				redirect_uri: redirectUri,
			}}
		>
			{children}
		</Auth0Provider>
	);
}
