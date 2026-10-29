import { register } from '@/instrumentation';

const env = { ...process.env };
beforeEach(() => jest.clearAllMocks());
afterEach(() => {
  for (const key of Object.keys(process.env)) delete process.env[key];
  Object.assign(process.env, env);
  jest.restoreAllMocks();
});

describe('register', () => {
  it('logs what is missing', () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});
    delete process.env.DATABASE_URL;
    register();
    expect(error).toHaveBeenCalledWith(expect.stringContaining('DATABASE_URL'));
  });

  it('stays quiet when nothing is missing', () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});
    Object.assign(process.env, {
      DATABASE_URL: 'x',
      NEXT_PUBLIC_AUTH0_DOMAIN: 'd',
      NEXT_PUBLIC_AUTH0_CLIENT_ID: 'i',
    });
    register();
    expect(error).not.toHaveBeenCalled();
  });
});
