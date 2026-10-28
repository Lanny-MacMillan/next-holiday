/** @jest-environment node */
import {
  badRequest,
  created,
  forbidden,
  notFound,
  ok,
  serverError,
  unauthorized,
} from '@/lib/http';

const read = async (res: { status: number; json: () => Promise<unknown> }) => ({
  status: res.status,
  body: await res.json(),
});

describe('response helpers', () => {
  it('ok wraps data in the success envelope with a 200', async () => {
    expect(await read(ok({ id: 1 }))).toEqual({
      status: 200,
      body: { success: true, data: { id: 1 } },
    });
  });

  it('created is a 201', async () => {
    expect((await read(created({ id: 1 }))).status).toBe(201);
  });

  it('badRequest carries the message or the validation issues', async () => {
    expect(await read(badRequest('nope'))).toEqual({
      status: 400,
      body: { success: false, error: 'nope' },
    });
    const issues = [{ code: 'custom', message: 'bad', path: ['x'] }] as never;
    expect((await read(badRequest(issues))).body).toEqual({
      success: false,
      error: issues,
    });
  });

  it.each([
    ['unauthorized', unauthorized, 401, 'Unauthorized'],
    ['forbidden', forbidden, 403, 'Forbidden'],
    ['notFound', notFound, 404, 'Not found'],
    ['serverError', serverError, 500, 'Internal server error'],
  ])('%s has a sensible default message', async (_, fn, status, message) => {
    expect(await read(fn())).toEqual({
      status,
      body: { success: false, error: message },
    });
  });

  it('lets the caller choose the message', async () => {
    expect((await read(notFound('No such holiday'))).body).toEqual({
      success: false,
      error: 'No such holiday',
    });
  });
});
