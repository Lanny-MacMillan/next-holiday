/** @jest-environment node */
import { SignJWT, generateKeyPair, type KeyLike } from 'jose';
import { verifyIdToken } from '@/lib/verifyAuth0Token';

const DOMAIN = 'tenant.auth0.com';
const CLIENT_ID = 'client-123';

let privateKey: KeyLike;
let publicKey: KeyLike;
let otherPrivateKey: KeyLike;

beforeAll(async () => {
  ({ privateKey, publicKey } = await generateKeyPair('RS256'));
  ({ privateKey: otherPrivateKey } = await generateKeyPair('RS256'));
});

function sign(
  overrides: {
    iss?: string;
    aud?: string;
    exp?: string | number;
    key?: KeyLike;
    emailVerified?: boolean;
  } = {},
) {
  return new SignJWT({
    email: 'a@b.com',
    name: 'A B',
    ...(overrides.emailVerified === undefined
      ? {}
      : { email_verified: overrides.emailVerified }),
  })
    .setProtectedHeader({ alg: 'RS256' })
    .setSubject('google-oauth2|123')
    .setIssuer(overrides.iss ?? `https://${DOMAIN}/`)
    .setAudience(overrides.aud ?? CLIENT_ID)
    .setIssuedAt()
    .setExpirationTime(overrides.exp ?? '1h')
    .sign(overrides.key ?? privateKey);
}

const opts = () => ({
  domain: DOMAIN,
  clientId: CLIENT_ID,
  getKey: async () => publicKey,
});

describe('verifyIdToken', () => {
  it('returns claims for a valid token', async () => {
    const claims = await verifyIdToken(await sign(), opts());
    expect(claims).toMatchObject({
      sub: 'google-oauth2|123',
      email: 'a@b.com',
      name: 'A B',
    });
  });

  it.each([
    [true, true],
    [false, false],
    [undefined, false],
  ])('email_verified %s gives emailVerified %s', async (claim, expected) => {
    const claims = await verifyIdToken(await sign({ emailVerified: claim }), opts());
    expect(claims.emailVerified).toBe(expected);
  });

  it('accepts a domain given with a protocol and trailing slash', async () => {
    const claims = await verifyIdToken(await sign(), {
      ...opts(),
      domain: `https://${DOMAIN}/`,
    });
    expect(claims.sub).toBe('google-oauth2|123');
  });

  it('rejects a token for a different audience', async () => {
    await expect(
      verifyIdToken(await sign({ aud: 'someone-else' }), opts()),
    ).rejects.toThrow();
  });

  it('rejects a token from a different issuer', async () => {
    await expect(
      verifyIdToken(await sign({ iss: 'https://evil.example.com/' }), opts()),
    ).rejects.toThrow();
  });

  it('rejects an expired token', async () => {
    const past = Math.floor(Date.now() / 1000) - 3600;
    await expect(verifyIdToken(await sign({ exp: past }), opts())).rejects.toThrow();
  });

  it('rejects a token signed with a different key', async () => {
    await expect(
      verifyIdToken(await sign({ key: otherPrivateKey }), opts()),
    ).rejects.toThrow();
  });

  it('rejects garbage', async () => {
    await expect(verifyIdToken('not-a-jwt', opts())).rejects.toThrow();
  });

  it('fails closed when Auth0 is not configured', async () => {
    const saved = {
      d: process.env.NEXT_PUBLIC_AUTH0_DOMAIN,
      c: process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID,
    };
    delete process.env.NEXT_PUBLIC_AUTH0_DOMAIN;
    delete process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID;
    try {
      await expect(
        verifyIdToken(await sign(), { getKey: async () => publicKey }),
      ).rejects.toThrow('not configured');
    } finally {
      if (saved.d !== undefined) process.env.NEXT_PUBLIC_AUTH0_DOMAIN = saved.d;
      if (saved.c !== undefined) process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID = saved.c;
    }
  });
});
