import { missingEnv } from '@/lib/env';

const complete = {
  DATABASE_URL: 'mysql://x',
  NEXT_PUBLIC_AUTH0_DOMAIN: 'd.auth0.com',
  NEXT_PUBLIC_AUTH0_CLIENT_ID: 'id',
};

describe('missingEnv', () => {
  it('is empty when everything required is set', () => {
    expect(missingEnv(complete)).toEqual([]);
  });

  it('names what is missing, treating blank values as missing', () => {
    expect(
      missingEnv({
        ...complete,
        DATABASE_URL: '  ',
        NEXT_PUBLIC_AUTH0_DOMAIN: undefined,
      }),
    ).toEqual(['DATABASE_URL', 'NEXT_PUBLIC_AUTH0_DOMAIN']);
  });
});
