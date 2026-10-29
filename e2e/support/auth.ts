import type { BrowserContext } from '@playwright/test';

const required = (name: string) => {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
};

const domain = () => required('NEXT_PUBLIC_AUTH0_DOMAIN');
const clientId = () => required('NEXT_PUBLIC_AUTH0_CLIENT_ID');

// What auth0-react asks for by default with refresh tokens switched on.
const SCOPE = 'openid profile email offline_access';

export type TestUser = 'A' | 'B';

function credentials(user: TestUser) {
  return {
    email: required(`E2E_USER_${user}_EMAIL`),
    password: required(`E2E_USER_${user}_PASSWORD`),
  };
}

// Real tokens from the test tenant, so the server verifies them exactly as in production.
async function fetchTokens(user: TestUser) {
  const { email, password } = credentials(user);
  const response = await fetch(`https://${domain()}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'http://auth0.com/oauth/grant-type/password-realm',
      realm: process.env.E2E_AUTH0_CONNECTION ?? 'e2e-users',
      username: email,
      password,
      client_id: clientId(),
      scope: 'openid profile email',
    }),
  });
  const body = await response.json();
  if (!response.ok) {
    throw new Error(`Auth0 token request failed: ${JSON.stringify(body)}`);
  }
  return body as { id_token: string; access_token: string; expires_in: number };
}

function decode(idToken: string) {
  const payload = Buffer.from(idToken.split('.')[1], 'base64url').toString('utf8');
  const claims = JSON.parse(payload);
  return { claims: { ...claims, __raw: idToken }, user: claims };
}

// Writes the same localStorage entries auth0-spa-js writes after a login.
export async function signIn(context: BrowserContext, user: TestUser) {
  const tokens = await fetchTokens(user);
  const decodedToken = decode(tokens.id_token);
  const id = clientId();
  const prefix = '@@auth0spajs@@';

  const entries: Record<string, unknown> = {
    [`${prefix}::${id}::default::${SCOPE}`]: {
      body: {
        client_id: id,
        audience: 'default',
        scope: SCOPE,
        id_token: tokens.id_token,
        access_token: tokens.access_token,
        expires_in: tokens.expires_in,
        decodedToken,
      },
      expiresAt: Math.floor(Date.now() / 1000) + tokens.expires_in - 60,
    },
    [`${prefix}::${id}::@@user@@`]: { id_token: tokens.id_token, decodedToken },
  };

  await context.addInitScript(items => {
    for (const [key, value] of Object.entries(items)) {
      window.localStorage.setItem(key, JSON.stringify(value));
    }
  }, entries);

  await context.addCookies([
    {
      name: `auth0.${id}.is.authenticated`,
      value: 'true',
      url: 'http://localhost:3000',
    },
  ]);

  return {
    email: credentials(user).email,
    idToken: tokens.id_token,
    sub: decodedToken.claims.sub as string,
    name: (decodedToken.claims.name as string | undefined) ?? '',
  };
}
