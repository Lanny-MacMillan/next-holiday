/** @jest-environment node */
import {
  apiRequest,
  prismaMock,
  readJson,
  resetPrismaMock,
  routeParams,
} from './api';

beforeEach(resetPrismaMock);

describe('api test support', () => {
  it('makes any model method a jest.fn that remembers its calls', async () => {
    prismaMock.holiday.findFirst.mockResolvedValue({ id: 'h1' });
    expect(await prismaMock.holiday.findFirst({ where: {} })).toEqual({ id: 'h1' });
    expect(prismaMock.holiday.findFirst).toHaveBeenCalledTimes(1);
    expect(prismaMock.holiday).toBe(prismaMock.holiday);
  });

  it('resets every mock between tests', () => {
    prismaMock.task.count.mockResolvedValue(3);
    resetPrismaMock();
    expect(prismaMock.task.count()).toBeUndefined();
  });

  it('runs an interactive transaction against the same mock', async () => {
    prismaMock.gift.deleteMany.mockResolvedValue({ count: 2 });
    const result = await prismaMock.$transaction(async (tx: typeof prismaMock) =>
      tx.gift.deleteMany({}),
    );
    expect(result).toEqual({ count: 2 });
  });

  it('runs a batch transaction', async () => {
    expect(
      await prismaMock.$transaction([Promise.resolve(1), Promise.resolve(2)]),
    ).toEqual([1, 2]);
  });

  it('builds requests, params and reads responses', async () => {
    const req = apiRequest('/api/x?y=1', 'POST', { a: 1 });
    expect(req.method).toBe('POST');
    expect(await req.json()).toEqual({ a: 1 });
    expect(await routeParams({ id: '7' }).params).toEqual({ id: '7' });
    expect(await readJson(Response.json({ ok: true }, { status: 201 }))).toEqual({
      status: 201,
      body: { ok: true },
    });
  });
});
