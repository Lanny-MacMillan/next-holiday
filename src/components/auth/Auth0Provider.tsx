'use client';

import { Auth0Provider, useAuth0 } from '@auth0/auth0-react';
import { ReactNode } from 'react';
import { installAuthFetch, setAuthTokenProvider } from '@/lib/authFetch';

installAuthFetch();

// Registers the current user's ID token so same-origin /api calls are
// authenticated. Runs during render so it is in place before child effects
// start fetching.
function AuthTokenBridge({ children }: { children: ReactNode }) {
  const { isAuthenticated, getAccessTokenSilently, getIdTokenClaims } = useAuth0();

  setAuthTokenProvider(
    isAuthenticated
      ? async () => {
          try {
            const result = await getAccessTokenSilently({ detailedResponse: true });
            return result.id_token;
          } catch {
            return (await getIdTokenClaims())?.__raw;
          }
        }
      : null,
  );

  return <>{children}</>;
}

interface Auth0ProviderWrapperProps {
  children: ReactNode;
}

export default function Auth0ProviderWrapper({
  children,
}: Auth0ProviderWrapperProps) {
  const domain = process.env.NEXT_PUBLIC_AUTH0_DOMAIN || 'your-domain.auth0.com';
  const clientId = process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID || 'your-client-id';
  const redirectUri =
    process.env.NEXT_PUBLIC_AUTH0_CALLBACK_URL || 'http://localhost:3000';

  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: redirectUri,
      }}
      cacheLocation="localstorage"
      useRefreshTokens={true}
      useRefreshTokensFallback={true}
    >
      <AuthTokenBridge>{children}</AuthTokenBridge>
    </Auth0Provider>
  );
}
