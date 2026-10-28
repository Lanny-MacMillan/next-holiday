import { toPlain } from '../json';

describe('toPlain', () => {
  it('turns a bigint into a string', () => {
    expect(toPlain({ id: BigInt('9007199254740993') })).toEqual({
      id: '9007199254740993',
    });
  });

  it('turns a Prisma Decimal into a string', () => {
    class Decimal {
      toString() {
        return '19.99';
      }
    }
    expect(toPlain({ price: new Decimal() })).toEqual({ price: '19.99' });
  });

  it('turns a Date into its ISO string', () => {
    expect(toPlain({ at: new Date('2024-12-25T00:00:00.000Z') })).toEqual({
      at: '2024-12-25T00:00:00.000Z',
    });
  });

  it('works through nesting and leaves plain values alone', () => {
    const input = { a: [{ n: 1, s: 'x', b: true, z: null }] };
    expect(toPlain(input)).toEqual(input);
  });

  it('drops undefined fields like JSON does', () => {
    expect(toPlain({ a: 1, b: undefined })).toEqual({ a: 1 });
  });
});
