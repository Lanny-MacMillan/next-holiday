/** @jest-environment node */
import nextConfig from '../../next.config';

const headerValues = async (phase: string) => {
  const config = nextConfig(phase);
  const rules = await config.headers!();
  return Object.fromEntries(rules[0].headers.map(h => [h.key, h.value]));
};

const env = process.env as Record<string, string | undefined>;
const original = env.NODE_ENV;
afterEach(() => {
  env.NODE_ENV = original;
});

describe('next.config security headers', () => {
  it('are the production set for a build, even when NODE_ENV is not "production"', async () => {
    env.NODE_ENV = 'development';
    const headers = await headerValues('phase-production-build');
    expect(headers['Strict-Transport-Security']).toBe('max-age=31536000');
    expect(headers['Content-Security-Policy-Report-Only']).not.toContain('ws:');
    expect(headers['Content-Security-Policy-Report-Only']).not.toContain(
      'unsafe-eval',
    );
  });

  it('allow what the dev server needs under `next dev`', async () => {
    env.NODE_ENV = 'production';
    const headers = await headerValues('phase-development-server');
    expect(headers['Strict-Transport-Security']).toBeUndefined();
    expect(headers['Content-Security-Policy-Report-Only']).toContain('ws:');
  });
});
