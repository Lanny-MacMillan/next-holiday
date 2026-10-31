import { logger } from '@/lib/logger';

const error = jest.spyOn(console, 'error').mockImplementation(() => {});
const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
const log = jest.spyOn(console, 'log').mockImplementation(() => {});
const env = { ...process.env };

const lineOf = (spy: jest.SpyInstance) => JSON.parse(spy.mock.calls.at(-1)![0]);

beforeEach(() => {
  [error, warn, log].forEach(spy => spy.mockClear());
  delete process.env.LOG_LEVEL;
});
afterEach(() => {
  process.env = { ...env };
});
afterAll(() => jest.restoreAllMocks());

describe('logger', () => {
  it('writes one JSON line with a level, a time and the message', () => {
    logger.info('Server started');

    expect(log).toHaveBeenCalledTimes(1);
    expect(lineOf(log)).toEqual({
      level: 'info',
      time: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
      message: 'Server started',
    });
  });

  it('sends warnings and errors to the matching console streams', () => {
    logger.warn('Slow');
    logger.error('Broke');

    expect(lineOf(warn).level).toBe('warn');
    expect(lineOf(error).level).toBe('error');
    expect(log).not.toHaveBeenCalled();
  });

  it('keeps debug messages quiet unless asked for', () => {
    logger.debug('Details');
    expect(log).not.toHaveBeenCalled();

    process.env.LOG_LEVEL = 'debug';
    logger.debug('Details');
    expect(lineOf(log)).toMatchObject({ level: 'debug', message: 'Details' });
  });

  it('can be limited to errors', () => {
    process.env.LOG_LEVEL = 'error';

    logger.info('a');
    logger.warn('b');
    logger.error('c');

    expect(log).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalledTimes(1);
  });

  it('ignores an unknown level and uses info', () => {
    process.env.LOG_LEVEL = 'loud';

    logger.debug('quiet');
    logger.info('shown');

    expect(log).toHaveBeenCalledTimes(1);
  });

  describe('errors', () => {
    it('describes an error by name, message, code and the top of its stack', () => {
      const failure = Object.assign(new Error('Record not found'), {
        code: 'P2025',
      });

      logger.error('Error updating gift:', failure);

      const { detail } = lineOf(error);
      expect(detail).toMatchObject({
        name: 'Error',
        message: 'Record not found',
        code: 'P2025',
      });
      expect(detail.stack.split('\n').length).toBeLessThanOrEqual(6);
    });

    it('takes an error passed on its own', () => {
      logger.error(new Error('Boom'));

      expect(lineOf(error)).toMatchObject({
        message: 'error',
        detail: { name: 'Error', message: 'Boom' },
      });
    });

    it('keeps several details as a list', () => {
      logger.warn('Unexpected', 'one', { two: 2 });

      expect(lineOf(warn).detail).toEqual(['one', { two: 2 }]);
    });

    it('omits the detail when there is none', () => {
      logger.warn('Plain');

      expect('detail' in lineOf(warn)).toBe(false);
    });
  });

  describe('keeping secrets out', () => {
    it.each([
      'authorization',
      'Authorization',
      'idToken',
      'access_token',
      'password',
      'clientSecret',
      'cookie',
      'apiKey',
      'api-key',
      'email',
      'toEmail',
      'phone',
      'streetAddress',
    ])('redacts a field called %s', key => {
      logger.info('Request', { [key]: 'private value', path: '/api/home' });

      const { detail } = lineOf(log);
      expect(detail[key]).toBe('[redacted]');
      expect(detail.path).toBe('/api/home');
    });

    it('redacts inside nested objects and lists', () => {
      logger.info('Request', {
        user: { name: 'Sam', email: 'sam@x.com' },
        items: [{ token: 't' }],
      });

      const { detail } = lineOf(log);
      expect(detail.user).toEqual({ name: 'Sam', email: '[redacted]' });
      expect(detail.items).toEqual([{ token: '[redacted]' }]);
    });
  });

  describe('hostile input', () => {
    it('cannot change a prototype through a key such as __proto__', () => {
      const hostile = JSON.parse(
        '{"__proto__": {"polluted": true}, "path": "/api/x"}',
      );

      logger.info('Request body', hostile);

      expect(({} as Record<string, unknown>).polluted).toBeUndefined();
      const { detail } = lineOf(log);
      expect(detail.path).toBe('/api/x');
      expect(Object.keys(detail)).toContain('__proto__');
      expect(detail.polluted).toBeUndefined();
    });

    it('redacts a sensitive field next to a hostile key', () => {
      const hostile = JSON.parse('{"__proto__": {"x": 1}, "token": "t"}');

      logger.info('Request body', hostile);

      expect(lineOf(log).detail.token).toBe('[redacted]');
    });
  });

  describe('keeping lines small and safe to write', () => {
    it('shortens long text', () => {
      logger.info('x'.repeat(2000));

      expect(lineOf(log).message.length).toBeLessThan(600);
    });

    it('limits how many list items it writes', () => {
      logger.info(
        'List',
        Array.from({ length: 100 }, (_, i) => i),
      );

      expect(lineOf(log).detail).toHaveLength(20);
    });

    it('stops at a sensible depth', () => {
      logger.info('Deep', { a: { b: { c: { d: { e: 'too far' } } } } });

      expect(lineOf(log).detail.a.b.c.d).toBe('[truncated]');
    });

    it('still writes something when the details cannot be turned into JSON', () => {
      const circular: Record<string, unknown> = {};
      circular.self = circular;
      const big = BigInt(1);

      logger.info('Odd', circular, big);

      expect(lineOf(log)).toMatchObject({ level: 'info', message: 'Odd' });
    });
  });
});
