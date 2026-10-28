import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from 'jose';

export interface VerifiedClaims {
  sub: string;
  email?: string;
  name?: string;
  picture?: string;
}

interface VerifyOptions {
  domain?: string;
  clientId?: string;
  /** Key resolver; defaults to the tenant's remote JWKS. Injectable for tests. */
  getKey?: JWTVerifyGetKey;
}

const jwksByDomain = new Map<string, JWTVerifyGetKey>();

function normalizeDomain(domain: string): string {
  return domain.replace(/^https?:\/\//, '').replace(/\/+$/, '');
}

function getRemoteJwks(domain: string): JWTVerifyGetKey {
  let jwks = jwksByDomain.get(domain);
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(`https://${domain}/.well-known/jwks.json`));
    jwksByDomain.set(domain, jwks);
  }
  return jwks;
}

/**
 * Verify an Auth0 ID token (signature, issuer, audience, expiry).
 * Throws if the token is invalid or the Auth0 env vars are not configured,
 * so callers fail closed.
 */
export async function verifyIdToken(
  token: string,
  options: VerifyOptions = {},
): Promise<VerifiedClaims> {
  const rawDomain = options.domain ?? process.env.NEXT_PUBLIC_AUTH0_DOMAIN;
  const clientId = options.clientId ?? process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID;

  if (!rawDomain || !clientId) {
    throw new Error('Auth0 domain/client id are not configured');
  }

  const domain = normalizeDomain(rawDomain);
  const { payload } = await jwtVerify(
    token,
    options.getKey ?? getRemoteJwks(domain),
    {
      issuer: `https://${domain}/`,
      audience: clientId,
      algorithms: ['RS256'],
    },
  );

  if (typeof payload.sub !== 'string' || !payload.sub) {
    throw new Error('Token has no subject');
  }

  return {
    sub: payload.sub,
    email: typeof payload.email === 'string' ? payload.email : undefined,
    name: typeof payload.name === 'string' ? payload.name : undefined,
    picture: typeof payload.picture === 'string' ? payload.picture : undefined,
  };
}
