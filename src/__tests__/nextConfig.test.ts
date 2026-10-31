/** @jest-environment node */
const withSentryConfig = jest.fn((config: object, options: object) => ({
  ...config,
  sentryOptions: options,
}));
jest.mock('@sentry/nextjs/config', () => ({
  withSentryConfig: (...args: [object, object]) => withSentryConfig(...args),
}));

import nextConfig from '../../next.config';

const headerValues = async (phase: string) => {
  const config = nextConfig(phase);
  const rules = await config.headers!();
  return Object.fromEntries(rules[0].headers.map(h => [h.key, h.value]));
};

const env = process.env as Record<string, string | undefined>;
const original = env.NODE_ENV;
const sentryEnv = ['SENTRY_AUTH_TOKEN', 'SENTRY_ORG', 'SENTRY_PROJECT', 'CI'];
const savedSentryEnv = Object.fromEntries(sentryEnv.map(key => [key, env[key]]));
beforeEach(() => {
  withSentryConfig.mockClear();
  sentryEnv.forEach(key => delete env[key]);
});
afterEach(() => {
  env.NODE_ENV = original;
  sentryEnv.forEach(key => {
    if (savedSentryEnv[key] === undefined) delete env[key];
    else env[key] = savedSentryEnv[key];
  });
});

describe('next.config security headers', () => {
  it('are the production set for a build, even when NODE_ENV is not "production"', async () => {
    env.NODE_ENV = 'development';
    const headers = await headerValues('phase-production-build');
    expect(headers['Strict-Transport-Security']).toBe('max-age=31536000');
    expect(headers['Content-Security-Policy']).not.toContain('ws:');
    expect(headers['Content-Security-Policy']).not.toContain('unsafe-eval');
    expect(headers['Content-Security-Policy-Report-Only']).toBeUndefined();
  });

  it('allow what the dev server needs under `next dev`', async () => {
    env.NODE_ENV = 'production';
    const headers = await headerValues('phase-development-server');
    expect(headers['Strict-Transport-Security']).toBeUndefined();
    expect(headers['Content-Security-Policy-Report-Only']).toContain('ws:');
  });
});

describe('next.config Sentry source maps', () => {
  it('leaves the build exactly as it is without a token', () => {
    const config = nextConfig('phase-production-build');

    expect(withSentryConfig).not.toHaveBeenCalled();
    expect('sentryOptions' in config).toBe(false);
    expect(typeof config.headers).toBe('function');
  });

  it('uploads source maps for the app, quietly and without telemetry, once a token is set', async () => {
    env.SENTRY_AUTH_TOKEN = 'token';

    const config = nextConfig('phase-production-build') as Record<string, any>;

    expect(withSentryConfig).toHaveBeenCalledTimes(1);
    expect(config.sentryOptions).toMatchObject({
      org: 'next-holiday',
      project: 'javascript-nextjs',
      silent: true,
      telemetry: false,
      widenClientFileUpload: true,
    });
    expect(await config.headers()).toHaveLength(1);
  });

  it('takes the organisation and project from the environment when given', () => {
    env.SENTRY_AUTH_TOKEN = 'token';
    env.SENTRY_ORG = 'other-org';
    env.SENTRY_PROJECT = 'other-project';

    const config = nextConfig('phase-production-build') as Record<string, any>;

    expect(config.sentryOptions).toMatchObject({
      org: 'other-org',
      project: 'other-project',
    });
  });

  it('says what it is doing in CI', () => {
    env.SENTRY_AUTH_TOKEN = 'token';
    env.CI = 'true';

    const config = nextConfig('phase-production-build') as Record<string, any>;

    expect(config.sentryOptions.silent).toBe(false);
  });

  it('only warns when the upload fails, so a deploy is never stopped by it', () => {
    env.SENTRY_AUTH_TOKEN = 'token';
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const config = nextConfig('phase-production-build') as Record<string, any>;

    expect(() =>
      config.sentryOptions.errorHandler(new Error('bad token')),
    ).not.toThrow();
    expect(warn).toHaveBeenCalledWith(
      'Sentry source map upload failed:',
      'bad token',
    );
    warn.mockRestore();
  });
});
